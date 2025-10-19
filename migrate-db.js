#!/usr/bin/env node

/**
 * Database Migration Script
 * Adds new columns for UX enhancements
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'bandinator.db');

try {
  console.log('🔄 Starting database migration...');
  console.log(`📁 Database: ${dbPath}`);

  const db = new Database(dbPath);

  // Check if migration is needed
  const documentsInfo = db.pragma('table_info(documents)');
  const tendersInfo = db.pragma('table_info(tenders)');

  const hasAttributesColumn = documentsInfo.some(col => col.name === 'attributes');
  const hasStatusColumn = tendersInfo.some(col => col.name === 'status');
  const hasUpdatedAtColumn = tendersInfo.some(col => col.name === 'updated_at');

  // Migrate documents table
  if (!hasAttributesColumn) {
    console.log('➕ Adding attributes column to documents table...');
    db.exec('ALTER TABLE documents ADD COLUMN attributes TEXT');
    console.log('✅ Documents table updated');
  } else {
    console.log('✓ Documents table already has attributes column');
  }

  // Migrate tenders table
  if (!hasStatusColumn) {
    console.log('➕ Adding status column to tenders table...');
    db.exec("ALTER TABLE tenders ADD COLUMN status TEXT DEFAULT 'pending'");
    console.log('✅ Tenders table updated with status column');
  } else {
    console.log('✓ Tenders table already has status column');
  }

  if (!hasUpdatedAtColumn) {
    console.log('➕ Adding updated_at column to tenders table...');
    db.exec('ALTER TABLE tenders ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    console.log('✅ Tenders table updated with updated_at column');
  } else {
    console.log('✓ Tenders table already has updated_at column');
  }

  // Set default status for existing tenders
  const updateResult = db
    .prepare("UPDATE tenders SET status = 'pending' WHERE status IS NULL")
    .run();
  if (updateResult.changes > 0) {
    console.log(`✅ Updated ${updateResult.changes} tender(s) to pending status`);
  }

  db.close();
  console.log('✨ Migration completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: pnpm install');
  console.log('2. Run: pnpm dev');
  console.log('3. Visit: http://localhost:3000');
} catch (error) {
  if (error.code === 'SQLITE_CANTOPEN') {
    console.log('ℹ️  No existing database found - will be created on first run');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: pnpm install');
    console.log('2. Run: pnpm dev');
    console.log('3. Visit: http://localhost:3000');
  } else {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}
