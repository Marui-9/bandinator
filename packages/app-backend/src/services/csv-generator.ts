import { createObjectCsvStringifier } from 'csv-writer';

interface RuleResult {
  id: number;
  rule_name: string;
  rule_description: string;
  matched: boolean;
  score: number;
  evidence: string;
  weight: number;
}

export async function generateCSV(ruleResults: RuleResult[]): Promise<string> {
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'rule_name', title: 'Rule Name' },
      { id: 'rule_description', title: 'Description' },
      { id: 'matched', title: 'Matched' },
      { id: 'score', title: 'Score' },
      { id: 'weight', title: 'Weight' },
      { id: 'evidence', title: 'Evidence' },
    ],
  });

  const records = ruleResults.map(result => ({
    rule_name: result.rule_name,
    rule_description: result.rule_description || '',
    matched: result.matched ? 'Yes' : 'No',
    score: result.score.toFixed(2),
    weight: result.weight,
    evidence: result.evidence || '',
  }));

  return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
}
