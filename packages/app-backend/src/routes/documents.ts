import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../services/database';
import { parseDocument } from '../services/parser';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT are allowed.'));
    }
  },
});

// Upload document
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { filename, originalname, path: filePath, mimetype, size } = req.file;

    // Parse document content
    const content = await parseDocument(filePath, mimetype);

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO documents (filename, original_name, file_path, file_type, file_size, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(filename, originalname, filePath, mimetype, size, content);

    res.json({
      id: result.lastInsertRowid,
      filename,
      originalName: originalname,
      fileType: mimetype,
      fileSize: size,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get all documents
router.get('/', (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT id, filename, original_name, file_type, file_size, created_at
      FROM documents
      ORDER BY created_at DESC
    `);
    const documents = stmt.all();
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

// Get document by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const document = stmt.get(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
});

// Delete document
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT file_path FROM documents WHERE id = ?');
    const document = stmt.get(id) as { file_path: string } | undefined;

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Delete from database
    const deleteStmt = db.prepare('DELETE FROM documents WHERE id = ?');
    deleteStmt.run(id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Search documents
router.get('/search', (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const stmt = db.prepare(`
      SELECT id, filename, original_name, file_type, created_at,
             substr(content, 1, 200) as snippet
      FROM documents
      WHERE content LIKE ?
      ORDER BY created_at DESC
    `);

    const documents = stmt.all(`%${q}%`);
    res.json(documents);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
