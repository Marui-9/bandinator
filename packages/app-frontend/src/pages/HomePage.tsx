import { Link } from 'react-router-dom';
import { FileText, FileDown, GitBranch, BarChart3, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-blue-600">Bandinator</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Intelligent tender analysis with automated feasibility scoring. Upload documents, configure
          rules, analyze tenders, and generate comprehensive reports.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FeatureCard
          icon={<FileText size={32} className="text-blue-600" />}
          title="Knowledge Base"
          description="Upload and manage documents (PDF, DOCX, TXT) to build your searchable knowledge base."
          link="/documents"
        />
        <FeatureCard
          icon={<FileDown size={32} className="text-green-600" />}
          title="Tenders"
          description="Create and manage tender opportunities with detailed requirements and specifications."
          link="/tenders"
        />
        <FeatureCard
          icon={<GitBranch size={32} className="text-purple-600" />}
          title="Rules Engine"
          description="Configure intelligent rules for automated analysis based on keywords, budget, and document checks."
          link="/rules"
        />
        <FeatureCard
          icon={<BarChart3 size={32} className="text-orange-600" />}
          title="Analysis"
          description="Run automated analysis, view feasibility scores, and export results as PDF or CSV."
          link="/analysis"
        />
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">Quick Start Guide</h2>
        <ol className="space-y-3 text-lg">
          <li className="flex items-start gap-3">
            <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              1
            </span>
            <span>Upload documents to build your knowledge base</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              2
            </span>
            <span>Configure analysis rules based on your requirements</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              3
            </span>
            <span>Create tender entries with details and requirements</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              4
            </span>
            <span>Run analysis and get feasibility scores with evidence links</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              5
            </span>
            <span>Export results as one-page PDF or CSV for reporting</span>
          </li>
        </ol>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">📄 Document Parsing</h3>
            <p className="text-gray-600 text-sm">
              Automatic text extraction from PDF, DOCX, and TXT files for intelligent indexing.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">🔍 Smart Search</h3>
            <p className="text-gray-600 text-sm">
              Full-text search across your entire document knowledge base.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">⚙️ Rule Engine</h3>
            <p className="text-gray-600 text-sm">
              Flexible rules with keyword matching, budget ranges, and custom conditions.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">📊 Scoring</h3>
            <p className="text-gray-600 text-sm">
              Weighted feasibility scores with confidence metrics and evidence tracking.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">📋 PDF Reports</h3>
            <p className="text-gray-600 text-sm">
              Professional one-page PDF reports with scores, evidence, and rule breakdowns.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">💾 CSV Export</h3>
            <p className="text-gray-600 text-sm">
              Detailed CSV exports for further analysis in spreadsheet applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <Link
      to={link}
      className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border border-gray-200 hover:border-blue-400"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-3">{description}</p>
          <div className="flex items-center text-blue-600 font-medium text-sm">
            Get started <ArrowRight size={16} className="ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
