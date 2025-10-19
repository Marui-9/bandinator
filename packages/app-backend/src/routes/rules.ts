import { Router, Request, Response } from 'express';
import db from '../services/database';

const router = Router();

// Create rule
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, ruleType, condition, weight, enabled } = req.body;

    if (!name || !ruleType || !condition) {
      return res.status(400).json({ error: 'Name, ruleType, and condition are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO rules (name, description, rule_type, condition, weight, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      description,
      ruleType,
      condition,
      weight || 1.0,
      enabled !== false ? 1 : 0
    );

    // Reset all tender statuses to pending when new rule is added
    db.prepare(
      "UPDATE tenders SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE status = 'complete'"
    ).run();

    res.json({
      id: result.lastInsertRowid,
      message: 'Rule created successfully',
    });
  } catch (error) {
    console.error('Create rule error:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// Get all rules
router.get('/', (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM rules
      ORDER BY created_at DESC
    `);
    const rules = stmt.all();
    res.json(rules);
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({ error: 'Failed to retrieve rules' });
  }
});

// Get rule by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM rules WHERE id = ?');
    const rule = stmt.get(id);

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json(rule);
  } catch (error) {
    console.error('Get rule error:', error);
    res.status(500).json({ error: 'Failed to retrieve rule' });
  }
});

// Update rule
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, ruleType, condition, weight, enabled } = req.body;

    const stmt = db.prepare(`
      UPDATE rules
      SET name = ?, description = ?, rule_type = ?, condition = ?, weight = ?, enabled = ?
      WHERE id = ?
    `);

    const result = stmt.run(name, description, ruleType, condition, weight, enabled ? 1 : 0, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Reset all tender statuses to pending when rules change
    db.prepare(
      "UPDATE tenders SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE status = 'complete'"
    ).run();

    res.json({ message: 'Rule updated successfully' });
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// Delete rule
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM rules WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

export default router;
