import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../services/database';
import { encrypt, decrypt } from '../services/encryption';
import { FileServerConnector, FileServerConfig } from '../services/connector';

const router = Router();

// Validation schema for file server config
const fileServerSchema = z.object({
  name: z.string().min(1).max(255),
  protocol: z.enum(['local', 'smb', 'nfs']),
  host: z.string().optional(),
  port: z.number().int().positive().optional(),
  base_path: z.string().min(1),
  username: z.string().optional(),
  password: z.string().optional(),
  include_patterns: z.array(z.string()).optional(),
  exclude_patterns: z.array(z.string()).optional(),
  scan_mode: z.enum(['manual', 'scheduled', 'watch']).default('manual'),
  scan_interval: z.number().int().positive().optional(),
  enabled: z.boolean().default(true),
});

/**
 * GET /api/file-servers
 * List all file server connectors
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        id, name, protocol, host, port, base_path,
        username, scan_mode, scan_interval, enabled,
        include_patterns, exclude_patterns, last_sync, created_at
      FROM file_servers
      ORDER BY created_at DESC
    `);

    const servers = stmt.all() as any[];

    // Parse JSON fields
    const formatted = servers.map(server => ({
      ...server,
      include_patterns: server.include_patterns ? JSON.parse(server.include_patterns) : [],
      exclude_patterns: server.exclude_patterns ? JSON.parse(server.exclude_patterns) : [],
      hasCredentials: !!server.username,
      enabled: Boolean(server.enabled),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/file-servers
 * Create a new file server connector
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const data = fileServerSchema.parse(req.body);

    // Encrypt password if provided
    const encryptedPassword = data.password ? encrypt(data.password) : null;

    const stmt = db.prepare(`
      INSERT INTO file_servers (
        name, protocol, host, port, base_path, username, encrypted_password,
        include_patterns, exclude_patterns, scan_mode, scan_interval, enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.protocol,
      data.host || null,
      data.port || null,
      data.base_path,
      data.username || null,
      encryptedPassword,
      JSON.stringify(data.include_patterns || []),
      JSON.stringify(data.exclude_patterns || []),
      data.scan_mode,
      data.scan_interval || null,
      data.enabled ? 1 : 0
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'File server connector created successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/file-servers/:id
 * Get file server details
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare(`
      SELECT * FROM file_servers WHERE id = ?
    `);

    const server = stmt.get(id) as any;

    if (!server) {
      res.status(404).json({ error: 'File server not found' });
      return;
    }

    // Decrypt password for editing (mask it in response)
    const response = {
      ...server,
      password: server.encrypted_password ? '********' : '',
      encrypted_password: undefined,
      include_patterns: server.include_patterns ? JSON.parse(server.include_patterns) : [],
      exclude_patterns: server.exclude_patterns ? JSON.parse(server.exclude_patterns) : [],
      enabled: Boolean(server.enabled),
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/file-servers/:id
 * Update file server configuration
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = fileServerSchema.partial().parse(req.body);

    // Check if server exists
    const existing = db.prepare('SELECT * FROM file_servers WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'File server not found' });
      return;
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.protocol !== undefined) {
      updates.push('protocol = ?');
      values.push(data.protocol);
    }
    if (data.base_path !== undefined) {
      updates.push('base_path = ?');
      values.push(data.base_path);
    }
    if (data.password !== undefined && data.password !== '********') {
      updates.push('encrypted_password = ?');
      values.push(encrypt(data.password));
    }
    if (data.scan_mode !== undefined) {
      updates.push('scan_mode = ?');
      values.push(data.scan_mode);
    }
    if (data.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(data.enabled ? 1 : 0);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const stmt = db.prepare(`
      UPDATE file_servers 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    res.json({ message: 'File server updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * DELETE /api/file-servers/:id
 * Delete file server connector
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM file_servers WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'File server not found' });
      return;
    }

    res.json({ message: 'File server deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/file-servers/:id/test
 * Test connection to file server
 */
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('SELECT * FROM file_servers WHERE id = ?');
    const server = stmt.get(id) as any;

    if (!server) {
      res.status(404).json({ error: 'File server not found' });
      return;
    }

    // Build config
    const config: FileServerConfig = {
      id: server.id,
      name: server.name,
      protocol: server.protocol,
      host: server.host,
      port: server.port,
      base_path: server.base_path,
      username: server.username,
      password: server.encrypted_password ? decrypt(server.encrypted_password) : undefined,
      include_patterns: server.include_patterns ? JSON.parse(server.include_patterns) : [],
      exclude_patterns: server.exclude_patterns ? JSON.parse(server.exclude_patterns) : [],
      scan_mode: server.scan_mode,
      scan_interval: server.scan_interval,
      enabled: Boolean(server.enabled),
    };

    // Test connection
    const connector = new FileServerConnector(config);
    const result = await connector.testConnection();

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/file-servers/:id/scan
 * Trigger manual scan
 */
router.post('/:id/scan', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('SELECT * FROM file_servers WHERE id = ?');
    const server = stmt.get(id) as any;

    if (!server) {
      res.status(404).json({ error: 'File server not found' });
      return;
    }

    // Build config
    const config: FileServerConfig = {
      id: server.id,
      name: server.name,
      protocol: server.protocol,
      host: server.host,
      port: server.port,
      base_path: server.base_path,
      username: server.username,
      password: server.encrypted_password ? decrypt(server.encrypted_password) : undefined,
      include_patterns: server.include_patterns ? JSON.parse(server.include_patterns) : [],
      exclude_patterns: server.exclude_patterns ? JSON.parse(server.exclude_patterns) : [],
      scan_mode: server.scan_mode,
      scan_interval: server.scan_interval,
      enabled: Boolean(server.enabled),
    };

    // Perform scan
    const connector = new FileServerConnector(config);

    // Listen for file events and process them
    connector.on('file', async data => {
      // TODO: Integrate with ingestion pipeline
      console.log('File detected:', data.event?.filePath || data.filePath);
    });

    const stats = await connector.scan();

    // Update last_sync timestamp
    db.prepare('UPDATE file_servers SET last_sync = ? WHERE id = ?').run(
      new Date().toISOString(),
      id
    );

    res.json({
      message: 'Scan completed',
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/file-servers/:id/logs
 * Get sync logs for a connector
 */
router.get('/:id/logs', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const stmt = db.prepare(`
      SELECT * FROM sync_logs 
      WHERE connector_id = ? 
      ORDER BY started_at DESC 
      LIMIT ?
    `);

    const logs = stmt.all(id, limit) as any[];

    // Parse error JSON
    const formatted = logs.map(log => ({
      ...log,
      errors: log.errors ? JSON.parse(log.errors) : [],
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
