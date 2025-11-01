import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { hashFile } from './encryption';
import db from './database';

export interface FileServerConfig {
  id: number;
  name: string;
  protocol: 'local' | 'smb' | 'nfs';
  host?: string;
  port?: number;
  base_path: string;
  username?: string;
  password?: string;
  include_patterns?: string[];
  exclude_patterns?: string[];
  scan_mode: 'manual' | 'scheduled' | 'watch';
  scan_interval?: number;
  enabled: boolean;
}

export interface FileEvent {
  type: 'add' | 'change' | 'unlink';
  filePath: string;
  fullPath: string;
  stats?: {
    size: number;
    mtime: Date;
  };
}

export class FileServerConnector extends EventEmitter {
  private config: FileServerConfig;
  private isRunning = false;
  private scanTimer?: NodeJS.Timeout;
  private watchTimer?: NodeJS.Timeout;
  private fileHashes = new Map<string, string>();

  constructor(config: FileServerConfig) {
    super();
    this.config = config;
  }

  /**
   * Test connection to file server
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      switch (this.config.protocol) {
        case 'local':
        case 'nfs': {
          await fs.access(this.config.base_path);
          const files = await fs.readdir(this.config.base_path);
          return { success: true, message: `Connected, found ${files.length} items` };
        }

        case 'smb':
          return { success: false, message: 'SMB support requires additional configuration' };

        default:
          return { success: false, message: 'Unsupported protocol' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Connection failed' };
    }
  }

  /**
   * Start monitoring file server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Connector already running');
    }

    this.isRunning = true;

    switch (this.config.scan_mode) {
      case 'watch':
        await this.startPolling();
        break;

      case 'scheduled':
        await this.startScheduledScan();
        break;

      case 'manual':
        // No automatic scanning
        break;
    }

    this.emit('started', { connectorId: this.config.id });
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = undefined;
    }

    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = undefined;
    }

    this.emit('stopped', { connectorId: this.config.id });
  }

  /**
   * Perform one-time scan of file server
   */
  async scan(): Promise<{
    scanned: number;
    added: number;
    updated: number;
    errors: string[];
  }> {
    const startTime = new Date();
    const logId = this.createSyncLog('running');

    const stats = {
      scanned: 0,
      added: 0,
      updated: 0,
      errors: [] as string[],
    };

    try {
      if (this.config.protocol === 'local' || this.config.protocol === 'nfs') {
        await this.scanLocalPath(this.config.base_path, stats);
      } else {
        throw new Error('Unsupported protocol for scanning');
      }

      this.updateSyncLog(logId, 'completed', stats, new Date());
      this.emit('scan-complete', { connectorId: this.config.id, stats });

      return stats;
    } catch (error: any) {
      stats.errors.push(error.message);
      this.updateSyncLog(logId, 'failed', stats, new Date());
      this.emit('scan-error', { connectorId: this.config.id, error: error.message });
      throw error;
    }
  }

  /**
   * Start polling for file changes (simpler than full watch)
   */
  private async startPolling(): Promise<void> {
    if (this.config.protocol !== 'local' && this.config.protocol !== 'nfs') {
      throw new Error('Polling only supported for local and NFS paths');
    }

    // Initial scan to build hash map
    await this.buildFileHashMap();

    // Poll every 30 seconds
    this.watchTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.checkForChanges();
      }
    }, 30000);
  }

  /**
   * Build initial hash map of files
   */
  private async buildFileHashMap(): Promise<void> {
    await this.scanForHashes(this.config.base_path);
  }

  /**
   * Scan directory and build hash map
   */
  private async scanForHashes(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.config.base_path, fullPath);

        if (!this.shouldIncludeFile(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.scanForHashes(fullPath);
        } else if (entry.isFile()) {
          try {
            const buffer = await fs.readFile(fullPath);
            const hash = hashFile(buffer);
            this.fileHashes.set(fullPath, hash);
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be accessed
    }
  }

  /**
   * Check for file changes
   */
  private async checkForChanges(): Promise<void> {
    const currentFiles = new Set<string>();
    await this.detectChanges(this.config.base_path, currentFiles);

    // Detect deleted files
    for (const [filePath] of this.fileHashes) {
      if (!currentFiles.has(filePath)) {
        this.fileHashes.delete(filePath);
        const relativePath = path.relative(this.config.base_path, filePath);
        this.emit('file', {
          type: 'unlink',
          filePath: relativePath,
          fullPath: filePath,
        });
      }
    }
  }

  /**
   * Detect file changes recursively
   */
  private async detectChanges(dirPath: string, currentFiles: Set<string>): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.config.base_path, fullPath);

        if (!this.shouldIncludeFile(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.detectChanges(fullPath, currentFiles);
        } else if (entry.isFile()) {
          currentFiles.add(fullPath);

          try {
            const buffer = await fs.readFile(fullPath);
            const hash = hashFile(buffer);
            const oldHash = this.fileHashes.get(fullPath);

            if (!oldHash) {
              // New file
              this.fileHashes.set(fullPath, hash);
              const fileStats = await fs.stat(fullPath);
              this.emit('file', {
                event: {
                  type: 'add',
                  filePath: relativePath,
                  fullPath,
                  stats: {
                    size: fileStats.size,
                    mtime: fileStats.mtime,
                  },
                },
                hash,
                buffer,
              });
            } else if (oldHash !== hash) {
              // Changed file
              this.fileHashes.set(fullPath, hash);
              const fileStats = await fs.stat(fullPath);
              this.emit('file', {
                event: {
                  type: 'change',
                  filePath: relativePath,
                  fullPath,
                  stats: {
                    size: fileStats.size,
                    mtime: fileStats.mtime,
                  },
                },
                hash,
                buffer,
              });
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be accessed
    }
  }

  /**
   * Start scheduled scanning
   */
  private async startScheduledScan(): Promise<void> {
    const interval = (this.config.scan_interval || 3600) * 1000; // Convert to ms

    // Initial scan
    await this.scan();

    // Schedule periodic scans
    this.scanTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.scan();
      }
    }, interval);
  }

  /**
   * Scan local/NFS path recursively
   */
  private async scanLocalPath(
    dirPath: string,
    stats: { scanned: number; added: number; updated: number; errors: string[] }
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.config.base_path, fullPath);

        // Check include/exclude patterns
        if (!this.shouldIncludeFile(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.scanLocalPath(fullPath, stats);
        } else if (entry.isFile()) {
          await this.processFile(fullPath, relativePath, stats);
        }
      }
    } catch (error: any) {
      stats.errors.push(`Error scanning ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Process individual file
   */
  private async processFile(
    fullPath: string,
    relativePath: string,
    stats: { scanned: number; added: number; updated: number; errors: string[] }
  ): Promise<void> {
    try {
      stats.scanned++;

      const fileStats = await fs.stat(fullPath);
      const buffer = await fs.readFile(fullPath);
      const hash = hashFile(buffer);

      // Emit file event for ingestion pipeline
      const event: FileEvent = {
        type: 'add',
        filePath: relativePath,
        fullPath,
        stats: {
          size: fileStats.size,
          mtime: fileStats.mtime,
        },
      };

      this.emit('file', { event, hash, buffer });
      stats.added++;
    } catch (error: any) {
      stats.errors.push(`Error processing ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Check if file should be included based on patterns
   */
  private shouldIncludeFile(filePath: string): boolean {
    const include = this.config.include_patterns || ['**/*'];
    const exclude = this.config.exclude_patterns || [];

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];

    if (!allowedExtensions.includes(ext)) {
      return false;
    }

    // Simple pattern matching
    const isIncluded = include.some(pattern => {
      if (pattern === '**/*') return true;
      return pattern.includes(ext) || filePath.includes(pattern);
    });

    const isExcluded = exclude.some(pattern => {
      return filePath.includes(pattern);
    });

    return isIncluded && !isExcluded;
  }

  /**
   * Create sync log entry
   */
  private createSyncLog(status: string): number {
    const stmt = db.prepare(`
      INSERT INTO sync_logs (connector_id, status, started_at)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(this.config.id, status, new Date().toISOString());
    return result.lastInsertRowid as number;
  }

  /**
   * Update sync log entry
   */
  private updateSyncLog(
    logId: number,
    status: string,
    stats: { scanned: number; added: number; updated: number; errors: string[] },
    completedAt: Date
  ): void {
    const stmt = db.prepare(`
      UPDATE sync_logs 
      SET status = ?, 
          files_scanned = ?, 
          files_added = ?, 
          files_updated = ?,
          errors = ?,
          completed_at = ?
      WHERE id = ?
    `);
    stmt.run(
      status,
      stats.scanned,
      stats.added,
      stats.updated,
      JSON.stringify(stats.errors),
      completedAt.toISOString(),
      logId
    );
  }
}

/**
 * Connector manager to handle multiple connectors
 */
export class ConnectorManager extends EventEmitter {
  private connectors = new Map<number, FileServerConnector>();

  /**
   * Load and start all enabled connectors
   */
  async startAll(): Promise<void> {
    const stmt = db.prepare('SELECT * FROM file_servers WHERE enabled = 1');
    const configs = stmt.all() as FileServerConfig[];

    for (const config of configs) {
      await this.startConnector(config);
    }
  }

  /**
   * Start a specific connector
   */
  async startConnector(config: FileServerConfig): Promise<void> {
    const connector = new FileServerConnector(config);
    this.connectors.set(config.id, connector);

    // Forward file events to ingestion pipeline
    connector.on('file', data => {
      this.emit('file', { connectorId: config.id, ...data });
    });

    await connector.start();
  }

  /**
   * Stop a connector
   */
  async stopConnector(id: number): Promise<void> {
    const connector = this.connectors.get(id);
    if (connector) {
      await connector.stop();
      this.connectors.delete(id);
    }
  }

  /**
   * Stop all connectors
   */
  async stopAll(): Promise<void> {
    for (const [id, connector] of this.connectors) {
      await connector.stop();
    }
    this.connectors.clear();
  }

  /**
   * Get connector instance
   */
  getConnector(id: number): FileServerConnector | undefined {
    return this.connectors.get(id);
  }
}
