import { useEffect, useState } from 'react';
import { Play, FileText, Download } from 'lucide-react';
import { getTenders, runAnalysis, getAnalysisByTender, exportPDF, exportCSV } from '../utils/api';

interface Tender {
  id: number;
  title: string;
  reference: string;
}

interface AnalysisResult {
  id: number;
  tender_id: number;
  feasibility_score: number;
  confidence: number;
  summary: string;
  rule_results: string;
  created_at: string;
}

export default function AnalysisPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedTender, setSelectedTender] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const response = await getTenders();
      setTenders(response.data);
    } catch (error) {
      console.error('Failed to fetch tenders:', error);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedTender) return;

    try {
      setAnalyzing(true);
      const response = await runAnalysis(selectedTender);
      setAnalysis(response.data);
      alert('Analysis completed successfully!');
    } catch (error) {
      console.error('Failed to run analysis:', error);
      alert('Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadAnalysis = async () => {
    if (!selectedTender) return;

    try {
      setLoading(true);
      const response = await getAnalysisByTender(selectedTender);
      if (response.data.length > 0) {
        setAnalysis(response.data[0]);
      } else {
        setAnalysis(null);
      }
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!analysis) return;

    try {
      const response = await exportPDF(analysis.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analysis-${analysis.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const handleExportCSV = async () => {
    if (!analysis) return;

    try {
      const response = await exportCSV(analysis.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analysis-${analysis.id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV');
    }
  };

  useEffect(() => {
    if (selectedTender) {
      handleLoadAnalysis();
    }
  }, [selectedTender]);

  const ruleResults = analysis?.rule_results ? JSON.parse(analysis.rule_results) : [];
  const score = analysis?.feasibility_score || 0;
  const scoreColor = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = score >= 70 ? 'bg-green-100' : score >= 40 ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tender Analysis</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Select Tender</h2>
        <div className="flex gap-4">
          <select
            value={selectedTender || ''}
            onChange={e => setSelectedTender(parseInt(e.target.value))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a tender...</option>
            {tenders.map(tender => (
              <option key={tender.id} value={tender.id}>
                {tender.title} {tender.reference ? `(${tender.reference})` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleRunAnalysis}
            disabled={!selectedTender || analyzing}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            <Play size={20} />
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white shadow rounded-lg p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      ) : analysis ? (
        <>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Feasibility Score</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Analyzed on {new Date(analysis.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPDF}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <FileText size={20} />
                  Export PDF
                </button>
                <button
                  onClick={handleExportCSV}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download size={20} />
                  Export CSV
                </button>
              </div>
            </div>

            <div className={`${scoreBg} rounded-lg p-8 text-center mb-6`}>
              <div className={`text-6xl font-bold ${scoreColor}`}>{score.toFixed(1)}%</div>
              <div className="text-sm text-gray-600 mt-2">
                Confidence: {analysis.confidence}%
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p className="text-gray-700">{analysis.summary}</p>
            </div>

            {analysis.evidence && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Evidence</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{analysis.evidence}</pre>
                </div>
              </div>
            )}
          </div>

          {ruleResults.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Rule Results</h2>
              <div className="space-y-3">
                {ruleResults.map((result: any) => (
                  <div
                    key={result.id}
                    className={`border rounded-lg p-4 ${result.matched ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl ${result.matched ? 'text-green-600' : 'text-red-600'}`}>
                            {result.matched ? '✓' : '✗'}
                          </span>
                          <h3 className="text-lg font-semibold">{result.rule_name}</h3>
                          <span className="text-sm text-gray-500">
                            Score: {result.score.toFixed(1)}
                          </span>
                        </div>
                        {result.evidence && (
                          <p className="text-sm text-gray-600 mt-2 ml-8">{result.evidence}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : selectedTender ? (
        <div className="bg-white shadow rounded-lg p-12">
          <div className="text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No analysis found for this tender</p>
            <p className="text-sm mt-2">Click "Run Analysis" to start</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
