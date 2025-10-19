import db from './database';

interface Tender {
  id: number;
  title: string;
  reference: string;
  deadline: string;
  budget: number;
  description: string;
  requirements: string;
}

interface Rule {
  id: number;
  name: string;
  description: string;
  rule_type: string;
  condition: string;
  weight: number;
  enabled: boolean;
}

interface RuleResult {
  ruleId: number;
  ruleName: string;
  matched: boolean;
  score: number;
  evidence: string;
}

interface AnalysisResult {
  analysisId: number;
  tenderId: number;
  feasibilityScore: number;
  confidence: number;
  summary: string;
  evidence: string;
  ruleResults: RuleResult[];
}

export async function runAnalysis(tender: Tender): Promise<AnalysisResult> {
  // Get all enabled rules
  const rulesStmt = db.prepare('SELECT * FROM rules WHERE enabled = 1');
  const rules = rulesStmt.all() as Rule[];

  // Get all documents
  const docsStmt = db.prepare('SELECT * FROM documents');
  const documents = docsStmt.all() as Array<{ id: number; content: string }>;

  const ruleResults: RuleResult[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Evaluate each rule
  for (const rule of rules) {
    const result = evaluateRule(rule, tender, documents);
    ruleResults.push(result);

    if (result.matched) {
      totalScore += result.score * rule.weight;
    }
    totalWeight += rule.weight;
  }

  // Calculate feasibility score (0-100)
  const feasibilityScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  
  // Calculate confidence based on number of rules evaluated
  const confidence = Math.min(rules.length * 10, 100);

  // Generate summary
  const matchedCount = ruleResults.filter(r => r.matched).length;
  const summary = `Analysis completed: ${matchedCount} of ${rules.length} rules matched. Feasibility score: ${feasibilityScore.toFixed(1)}%`;

  // Collect evidence
  const evidence = ruleResults
    .filter(r => r.matched && r.evidence)
    .map(r => `${r.ruleName}: ${r.evidence}`)
    .join('\n');

  // Save analysis result
  const insertStmt = db.prepare(`
    INSERT INTO analysis_results (tender_id, feasibility_score, confidence, summary, evidence)
    VALUES (?, ?, ?, ?, ?)
  `);

  const analysisResult = insertStmt.run(
    tender.id,
    feasibilityScore,
    confidence,
    summary,
    evidence
  );

  const analysisId = analysisResult.lastInsertRowid as number;

  // Save rule results
  const ruleResultStmt = db.prepare(`
    INSERT INTO rule_results (analysis_id, rule_id, matched, score, evidence)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const result of ruleResults) {
    ruleResultStmt.run(
      analysisId,
      result.ruleId,
      result.matched ? 1 : 0,
      result.score,
      result.evidence
    );
  }

  return {
    analysisId,
    tenderId: tender.id,
    feasibilityScore,
    confidence,
    summary,
    evidence,
    ruleResults,
  };
}

function evaluateRule(
  rule: Rule,
  tender: Tender,
  documents: Array<{ id: number; content: string }>
): RuleResult {
  let matched = false;
  let score = 0;
  let evidence = '';

  try {
    // Simple keyword matching for demo
    const condition = rule.condition.toLowerCase();
    const tenderText = `${tender.title} ${tender.description} ${tender.requirements}`.toLowerCase();

    // Check if condition keywords are in tender
    if (rule.rule_type === 'keyword') {
      const keywords = condition.split(',').map(k => k.trim());
      const matchedKeywords = keywords.filter(kw => tenderText.includes(kw));

      if (matchedKeywords.length > 0) {
        matched = true;
        score = (matchedKeywords.length / keywords.length) * 100;
        evidence = `Found keywords: ${matchedKeywords.join(', ')}`;
      }
    } else if (rule.rule_type === 'budget') {
      // Budget range check
      const match = condition.match(/(\d+)-(\d+)/);
      if (match && tender.budget) {
        const [, min, max] = match;
        const budget = tender.budget;
        if (budget >= parseInt(min) && budget <= parseInt(max)) {
          matched = true;
          score = 100;
          evidence = `Budget ${budget} is within range ${min}-${max}`;
        }
      }
    } else if (rule.rule_type === 'document') {
      // Check if documents contain required keywords
      const keywords = condition.split(',').map(k => k.trim());
      const foundDocs: string[] = [];

      for (const doc of documents) {
        const docText = (doc.content || '').toLowerCase();
        if (keywords.some(kw => docText.includes(kw))) {
          foundDocs.push(`Document ${doc.id}`);
        }
      }

      if (foundDocs.length > 0) {
        matched = true;
        score = Math.min((foundDocs.length / keywords.length) * 100, 100);
        evidence = `Found in: ${foundDocs.join(', ')}`;
      }
    } else {
      // Default: simple text match
      if (tenderText.includes(condition)) {
        matched = true;
        score = 100;
        evidence = `Condition "${condition}" found in tender`;
      }
    }
  } catch (error) {
    console.error(`Error evaluating rule ${rule.id}:`, error);
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    matched,
    score,
    evidence,
  };
}
