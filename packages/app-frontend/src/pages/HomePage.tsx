import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FileText,
  BarChart3,
  Upload,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { getDocuments, getTenders, getAnalysisByTender } from '../utils/api';

interface RecentDocument {
  id: number;
  original_name: string;
  created_at: string;
  file_size: number;
}

interface RecentEvaluation {
  id: number;
  tender_id: number;
  tender_title: string;
  feasibility_score: number;
  created_at: string;
  status: 'pending' | 'in-progress' | 'complete';
}

export default function HomePage() {
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [recentEvals, setRecentEvals] = useState<RecentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load recent documents
      const docsRes = await getDocuments();
      setRecentDocs(docsRes.data.slice(0, 5));

      // Load recent tenders and their evaluations
      const tendersRes = await getTenders();
      const tenders = tendersRes.data.slice(0, 5);

      const evalsPromises = tenders.map(async (tender: any) => {
        try {
          const analysisRes = await getAnalysisByTender(tender.id);
          const latestAnalysis = analysisRes.data[0];

          return {
            id: latestAnalysis?.id || 0,
            tender_id: tender.id,
            tender_title: tender.title,
            feasibility_score: latestAnalysis?.feasibility_score || 0,
            created_at: latestAnalysis?.created_at || tender.created_at,
            status: latestAnalysis ? 'complete' : 'pending',
          };
        } catch {
          return {
            id: 0,
            tender_id: tender.id,
            tender_title: tender.title,
            feasibility_score: 0,
            created_at: tender.created_at,
            status: 'pending' as const,
          };
        }
      });

      const evals = await Promise.all(evalsPromises);
      setRecentEvals(evals);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome to Bandinator</h1>
        <p className="text-lg text-blue-100">
          Intelligent tender analysis with automated feasibility scoring
        </p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Tender Evaluations */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Tender Evaluations</h2>
              <Link
                to="/analysis"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
              >
                <BarChart3 size={20} />
                Evaluate Tender
              </Link>
            </div>
            <p className="text-gray-600 mb-6">Run analysis and view feasibility scores</p>

            {/* Evaluation Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Complete</p>
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {recentEvals.filter(e => e.status === 'complete').length}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <AlertCircle size={20} className="text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {recentEvals.filter(e => e.status === 'pending').length}
                </p>
              </div>
            </div>

            {/* Average Score Card */}
            {recentEvals.filter(e => e.status === 'complete').length > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 mb-6 text-white">
                <p className="text-sm font-medium mb-2 text-green-100">Average Feasibility Score</p>
                <p className="text-5xl font-bold">
                  {(
                    recentEvals
                      .filter(e => e.status === 'complete')
                      .reduce((sum, e) => sum + e.feasibility_score, 0) /
                    recentEvals.filter(e => e.status === 'complete').length
                  ).toFixed(0)}
                  %
                </p>
              </div>
            )}

            {/* Recent Evaluations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Evaluations</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : recentEvals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 size={48} className="mx-auto mb-2 text-gray-400" />
                  <p>No evaluations yet</p>
                  <Link
                    to="/analysis"
                    className="text-green-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Evaluate your first tender
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEvals.slice(0, 5).map(evaluation => (
                    <Link
                      key={evaluation.tender_id}
                      to={`/analysis?tender=${evaluation.tender_id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <EvaluationStatusIcon status={evaluation.status} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {evaluation.tender_title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {evaluation.status === 'complete' ? (
                              <>Score: {evaluation.feasibility_score.toFixed(1)}%</>
                            ) : (
                              <span className="capitalize">{evaluation.status}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {evaluation.status === 'complete' && (
                        <div
                          className={`px-4 py-2 rounded-full text-lg font-bold ${
                            evaluation.feasibility_score >= 70
                              ? 'bg-green-100 text-green-800'
                              : evaluation.feasibility_score >= 40
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {evaluation.feasibility_score.toFixed(0)}%
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions for Tenders */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/tenders"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-2 border-blue-200 rounded-lg p-6 transition"
            >
              <FileText size={24} className="mb-3" />
              <h3 className="font-semibold mb-1">Manage Tenders</h3>
              <p className="text-sm opacity-75">View and create tenders</p>
            </Link>
            <Link
              to="/rules"
              className="bg-purple-50 text-purple-600 hover:bg-purple-100 border-2 border-purple-200 rounded-lg p-6 transition"
            >
              <BarChart3 size={24} className="mb-3" />
              <h3 className="font-semibold mb-1">Configure Rules</h3>
              <p className="text-sm opacity-75">Set evaluation criteria</p>
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Knowledge Base */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
              <Link
                to="/documents"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
              >
                <Upload size={20} />
                Upload Document
              </Link>
            </div>
            <p className="text-gray-600 mb-6">Manage and search your document library</p>

            {/* KB Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <FileText size={20} className="text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {recentDocs.length > 0 ? `${recentDocs.length}+` : '0'}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Search & Chat</p>
                  <MessageSquare size={20} className="text-purple-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">Ready</p>
              </div>
            </div>

            {/* Recent Documents */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Documents</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : recentDocs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-2 text-gray-400" />
                  <p>No documents yet</p>
                  <Link
                    to="/documents"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Upload your first document
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDocs.slice(0, 5).map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText size={20} className="text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{doc.original_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(doc.created_at).toLocaleDateString()} •{' '}
                            {(doc.file_size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* KB Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/kb-search"
              className="bg-purple-50 text-purple-600 hover:bg-purple-100 border-2 border-purple-200 rounded-lg p-6 transition"
            >
              <Search size={24} className="mb-3" />
              <h3 className="font-semibold mb-1">Search KB</h3>
              <p className="text-sm opacity-75">Find information</p>
            </Link>
            <Link
              to="/chat"
              className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-2 border-orange-200 rounded-lg p-6 transition"
            >
              <MessageSquare size={24} className="mb-3" />
              <h3 className="font-semibold mb-1">Chat with KB</h3>
              <p className="text-sm opacity-75">Ask questions</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvaluationStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'complete':
      return <CheckCircle size={20} className="text-green-600" />;
    case 'in-progress':
      return <Clock size={20} className="text-yellow-600 animate-pulse" />;
    case 'pending':
      return <AlertCircle size={20} className="text-gray-400" />;
    default:
      return <AlertCircle size={20} className="text-gray-400" />;
  }
}
