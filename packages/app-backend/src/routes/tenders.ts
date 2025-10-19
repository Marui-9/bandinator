import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import db from '../services/database';

const router: ExpressRouter = Router();

// Create tender
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, reference, deadline, budget, description, requirements } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO tenders (title, reference, deadline, budget, description, requirements)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title, reference, deadline, budget, description, requirements);

    res.json({
      id: result.lastInsertRowid,
      message: 'Tender created successfully',
    });
  } catch (error) {
    console.error('Create tender error:', error);
    res.status(500).json({ error: 'Failed to create tender' });
  }
});

// Get all tenders
router.get('/', (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM tenders
      ORDER BY created_at DESC
    `);
    const tenders = stmt.all();
    res.json(tenders);
  } catch (error) {
    console.error('Get tenders error:', error);
    res.status(500).json({ error: 'Failed to retrieve tenders' });
  }
});

// Get tender by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM tenders WHERE id = ?');
    const tender = stmt.get(id);

    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    res.json(tender);
  } catch (error) {
    console.error('Get tender error:', error);
    res.status(500).json({ error: 'Failed to retrieve tender' });
  }
});

// Update tender
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, reference, deadline, budget, description, requirements } = req.body;

    const stmt = db.prepare(`
      UPDATE tenders
      SET title = ?, reference = ?, deadline = ?, budget = ?, description = ?, requirements = ?
      WHERE id = ?
    `);

    const result = stmt.run(title, reference, deadline, budget, description, requirements, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    res.json({ message: 'Tender updated successfully' });
  } catch (error) {
    console.error('Update tender error:', error);
    res.status(500).json({ error: 'Failed to update tender' });
  }
});

// Delete tender
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM tenders WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    res.json({ message: 'Tender deleted successfully' });
  } catch (error) {
    console.error('Delete tender error:', error);
    res.status(500).json({ error: 'Failed to delete tender' });
  }
});

export default router;
