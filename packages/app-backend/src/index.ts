import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

// Import routes
import documentRoutes from './routes/documents';
import tenderRoutes from './routes/tenders';
import rulesRoutes from './routes/rules';
import analysisRoutes from './routes/analysis';
import exportRoutes from './routes/export';
import kbRoutes from './routes/kb';
import fileServerRoutes from './routes/fileServers';
import chatRoutes from './routes/chat';

// Import database initialization
import { initDatabase } from './services/database';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create necessary directories
const uploadsDir = process.env.UPLOAD_DIR || './uploads';
const dataDir = './data';

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
initDatabase();

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/documents', documentRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/file-servers', fileServerRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`💾 Database directory: ${dataDir}`);
});

export default app;
