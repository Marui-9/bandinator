import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { generatePDF } from '../services/pdf-generator';
import { generateCSV } from '../services/csv-generator';
import db from '../services/database';

const router: ExpressRouter = Router();

// Export analysis as PDF
router.get('/pdf/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;

    // Get analysis data
    const stmt = db.prepare(`
      SELECT ar.*, t.title as tender_title, t.reference as tender_reference
      FROM analysis_results ar
      JOIN tenders t ON ar.tender_id = t.id
      WHERE ar.id = ?
    `);
    const analysis = stmt.get(analysisId) as any;

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Get rule results
    const ruleStmt = db.prepare(`
      SELECT rr.*, r.name as rule_name, r.description as rule_description
      FROM rule_results rr
      JOIN rules r ON rr.rule_id = r.id
      WHERE rr.analysis_id = ?
      ORDER BY rr.score DESC
    `);
    const ruleResults = ruleStmt.all(analysisId) as any[];

    const pdfBuffer = await generatePDF(analysis, ruleResults);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="analysis-${analysisId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Export analysis as CSV
router.get('/csv/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;

    // Get rule results
    const ruleStmt = db.prepare(`
      SELECT rr.*, r.name as rule_name, r.description as rule_description, r.weight
      FROM rule_results rr
      JOIN rules r ON rr.rule_id = r.id
      WHERE rr.analysis_id = ?
      ORDER BY rr.score DESC
    `);
    const ruleResults = ruleStmt.all(analysisId) as any[];

    if (ruleResults.length === 0) {
      return res.status(404).json({ error: 'No results found for this analysis' });
    }

    const csvData = await generateCSV(ruleResults);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analysis-${analysisId}.csv"`);
    res.send(csvData);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
});

export default router;
