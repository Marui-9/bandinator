import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';

const dbPath = process.env.DATABASE_URL || './data/team-wiki.db';
const db: BetterSqlite3.Database = new Database(dbPath);

export function initDatabase() {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Documents table - extended for file server connector
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      content TEXT,
      attributes TEXT,
      source_type TEXT DEFAULT 'upload',
      source_host TEXT,
      file_hash TEXT,
      last_modified DATETIME,
      connector_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // File server connectors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      protocol TEXT NOT NULL,
      host TEXT,
      port INTEGER,
      base_path TEXT NOT NULL,
      username TEXT,
      encrypted_password TEXT,
      include_patterns TEXT,
      exclude_patterns TEXT,
      scan_mode TEXT DEFAULT 'manual',
      scan_interval INTEGER,
      enabled BOOLEAN DEFAULT 1,
      last_sync DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Document chunks table for RAG
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      page_number INTEGER,
      paragraph_number INTEGER,
      start_char INTEGER,
      end_char INTEGER,
      embedding BLOB,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  // Sync logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connector_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      files_scanned INTEGER DEFAULT 0,
      files_added INTEGER DEFAULT 0,
      files_updated INTEGER DEFAULT 0,
      files_deleted INTEGER DEFAULT 0,
      errors TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (connector_id) REFERENCES file_servers(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(file_hash);
    CREATE INDEX IF NOT EXISTS idx_documents_connector ON documents(connector_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_connector ON sync_logs(connector_id);
  `);

  // Tenders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      reference TEXT,
      deadline DATETIME,
      budget REAL,
      description TEXT,
      requirements TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Rules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      rule_type TEXT NOT NULL,
      condition TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Analysis results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tender_id INTEGER NOT NULL,
      feasibility_score REAL NOT NULL,
      confidence REAL,
      summary TEXT,
      evidence TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
    )
  `);

  // Rule results table (evidence per rule)
  db.exec(`
    CREATE TABLE IF NOT EXISTS rule_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      rule_id INTEGER NOT NULL,
      matched BOOLEAN NOT NULL,
      score REAL NOT NULL,
      evidence TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE,
      FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database initialized successfully');
}

export default db;
