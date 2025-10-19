import { Router, Request, Response } from 'express';
import db from '../services/database';
import { runAnalysis } from '../services/analysis';

const router = Router();

// Run analysis for a tender
router.post('/run/:tenderId', async (req: Request, res: Response) => {
  try {
    const { tenderId } = req.params;

    // Get tender
    const tenderStmt = db.prepare('SELECT * FROM tenders WHERE id = ?');
    const tender = tenderStmt.get(tenderId);

    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }

    // Set status to in-progress
    db.prepare('UPDATE tenders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      'in-progress',
      tenderId
    );

    // Run analysis
    const result = await runAnalysis(tender);

    // Set status to complete
    db.prepare('UPDATE tenders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      'complete',
      tenderId
    );

    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);

    // Set status back to pending on error
    try {
      db.prepare('UPDATE tenders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        'pending',
        req.params.tenderId
      );
    } catch (updateError) {
      console.error('Failed to update tender status:', updateError);
    }

    res.status(500).json({ error: 'Failed to run analysis' });
  }
});

// Get analysis results for a tender
router.get('/tender/:tenderId', (req: Request, res: Response) => {
  try {
    const { tenderId } = req.params;

    const stmt = db.prepare(`
      SELECT ar.*, 
             (SELECT json_group_array(
                json_object(
                  'id', rr.id,
                  'rule_id', rr.rule_id,
                  'rule_name', r.name,
                  'matched', rr.matched,
                  'score', rr.score,
                  'evidence', rr.evidence
                )
              )
              FROM rule_results rr
              JOIN rules r ON rr.rule_id = r.id
              WHERE rr.analysis_id = ar.id
             ) as rule_results
      FROM analysis_results ar
      WHERE ar.tender_id = ?
      ORDER BY ar.created_at DESC
    `);

    const results = stmt.all(tenderId);
    res.json(results);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis results' });
  }
});

// Get analysis by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare(`
      SELECT ar.*,
             (SELECT json_group_array(
                json_object(
                  'id', rr.id,
                  'rule_id', rr.rule_id,
                  'rule_name', r.name,
                  'matched', rr.matched,
                  'score', rr.score,
                  'evidence', rr.evidence
                )
              )
              FROM rule_results rr
              JOIN rules r ON rr.rule_id = r.id
              WHERE rr.analysis_id = ar.id
             ) as rule_results
      FROM analysis_results ar
      WHERE ar.id = ?
    `);

    const result = stmt.get(id);

    if (!result) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis' });
  }
});

export default router;
