import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import path from 'path';

const router: Router = Router();
const dbPath = path.join(process.cwd(), 'data', 'bandinator.db');

// Search across documents and tenders
router.get('/search', (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const db = new Database(dbPath);
    const searchTerm = `%${query.toLowerCase()}%`;

    // Search documents
    const documents = db
      .prepare(
        `SELECT id, original_name as title, content as excerpt, file_type, file_size, created_at,
         (LENGTH(content) - LENGTH(REPLACE(LOWER(content), LOWER(?), ''))) / LENGTH(?) as relevance
         FROM documents
         WHERE LOWER(content) LIKE ? OR LOWER(original_name) LIKE ?
         ORDER BY relevance DESC
         LIMIT 10`
      )
      .all(query, query, searchTerm, searchTerm);

    // Search tenders
    const tenders = db
      .prepare(
        `SELECT id, title, description as excerpt, reference, deadline, created_at,
         (LENGTH(description) - LENGTH(REPLACE(LOWER(description), LOWER(?), ''))) / LENGTH(?) as relevance
         FROM tenders
         WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(requirements) LIKE ?
         ORDER BY relevance DESC
         LIMIT 10`
      )
      .all(query, query, searchTerm, searchTerm, searchTerm);

    db.close();

    // Format results
    const docResults = documents.map((doc: any) => ({
      id: doc.id,
      type: 'document',
      title: doc.title,
      excerpt: doc.excerpt ? doc.excerpt.substring(0, 200) + '...' : '',
      score: Math.min(doc.relevance / 10, 1), // Normalize to 0-1
      created_at: doc.created_at,
      metadata: {
        file_type: doc.file_type,
        file_size: doc.file_size,
      },
    }));

    const tenderResults = tenders.map((tender: any) => ({
      id: tender.id,
      type: 'tender',
      title: tender.title,
      excerpt: tender.excerpt ? tender.excerpt.substring(0, 200) + '...' : '',
      score: Math.min(tender.relevance / 10, 1),
      created_at: tender.created_at,
      metadata: {
        reference: tender.reference,
        deadline: tender.deadline,
      },
    }));

    // Combine and sort by relevance
    const results = [...docResults, ...tenderResults].sort((a, b) => b.score - a.score);

    res.json({ results, count: results.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search knowledge base' });
  }
});

// Chat endpoint (mock for now, ready for LLM integration)
router.post('/chat', (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const db = new Database(dbPath);
    const searchTerm = `%${message.toLowerCase()}%`;

    // Simple keyword-based retrieval
    const documents = db
      .prepare(
        `SELECT content FROM documents
         WHERE LOWER(content) LIKE ?
         LIMIT 3`
      )
      .all(searchTerm);

    const tenders = db
      .prepare(
        `SELECT title, description, requirements FROM tenders
         WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ?
         LIMIT 3`
      )
      .all(searchTerm, searchTerm);

    const rules = db
      .prepare(
        `SELECT name, description FROM rules
         WHERE enabled = 1
         LIMIT 5`
      )
      .all();

    db.close();

    // Mock response with context-aware information
    let response = '';

    if (documents.length > 0) {
      response += `I found ${documents.length} relevant document(s). `;
      const doc = documents[0] as any;
      const snippet = doc.content.substring(0, 150);
      response += `Here's what I found: "${snippet}..." `;
    }

    if (tenders.length > 0) {
      response += `\n\nI also found ${tenders.length} related tender(s): `;
      tenders.forEach((tender: any, i: number) => {
        response += `\n${i + 1}. ${tender.title}`;
      });
    }

    if (response === '') {
      response = `I couldn't find specific information about "${message}" in the knowledge base. `;
      if (rules.length > 0) {
        response += `However, we have ${rules.length} active evaluation rules configured. `;
      }
      response += `Try uploading more documents or refining your question.`;
    }

    // TODO: Replace with actual LLM call
    // const llmResponse = await callOpenAI(message, context);

    res.json({
      response,
      sources: {
        documents: documents.length,
        tenders: tenders.length,
      },
      // Ready for future enhancement:
      // model: 'gpt-4',
      // tokens: { prompt: 0, completion: 0 }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

export default router;
