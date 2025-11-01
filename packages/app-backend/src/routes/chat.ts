import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ragService } from '../services/rag';
import db from '../services/database';

const router: Router = Router();

// Validation schema for chat query
const chatQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().positive().max(50).optional().default(10),
});

/**
 * POST /api/chat/query
 * Ask a question with RAG
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { query, limit } = chatQuerySchema.parse(req.body);

    // 1. Search for relevant chunks
    const searchResults = await ragService.search(query, limit);

    // 2. Generate answer with citations
    const { answer, citations } = await ragService.generateAnswer(query, searchResults);

    res.json({
      query,
      answer,
      citations: citations.map(c => ({
        documentId: c.documentId,
        chunkId: c.chunkId,
        filePath: c.filePath,
        title: c.title,
        page: c.pageNumber,
        paragraph: c.paragraphNumber,
        excerpt: c.excerpt,
        score: Math.round(c.relevanceScore * 100) / 100, // Round to 2 decimals
      })),
      resultsCount: searchResults.length,
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
 * POST /api/chat/reindex
 * Re-index all documents (admin function)
 */
router.post('/reindex', async (req: Request, res: Response) => {
  try {
    const result = await ragService.reindexAll();

    res.json({
      message: 'Reindexing completed',
      processed: result.processed,
      errors: result.errors,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/stats
 * Get RAG statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const documentCount = db.prepare('SELECT COUNT(*) as count FROM documents').get() as {
      count: number;
    };
    const chunkCount = db.prepare('SELECT COUNT(*) as count FROM document_chunks').get() as {
      count: number;
    };
    const avgChunksPerDoc = db
      .prepare(
        `
      SELECT AVG(chunk_count) as avg
      FROM (
        SELECT document_id, COUNT(*) as chunk_count
        FROM document_chunks
        GROUP BY document_id
      )
    `
      )
      .get() as any;

    res.json({
      totalDocuments: documentCount.count,
      totalChunks: chunkCount.count,
      averageChunksPerDocument: Math.round(avgChunksPerDoc.avg || 0),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
