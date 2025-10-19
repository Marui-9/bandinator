import { useState } from 'react';
import { Search, FileText, Calendar, ExternalLink } from 'lucide-react';
import { searchKB } from '../utils/api';

interface SearchResult {
  id: number;
  type: 'document' | 'tender';
  title: string;
  excerpt: string;
  score: number;
  created_at: string;
  metadata?: {
    file_type?: string;
    file_size?: number;
    reference?: string;
    deadline?: string;
  };
}

export default function KBSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await searchKB(query.trim());
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Search className="text-purple-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Base Search</h1>
            <p className="text-sm text-gray-600">
              Search through documents, tenders, and analysis results
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for keywords, requirements, or specific content..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching knowledge base...</p>
        </div>
      )}

      {!loading && searched && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try different keywords or check your spelling</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2">
                <p className="text-sm text-gray-600">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
              </div>

              {results.map(result => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${result.type === 'document' ? 'bg-blue-100' : 'bg-green-100'}`}
                    >
                      <FileText
                        size={24}
                        className={result.type === 'document' ? 'text-blue-600' : 'text-green-600'}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {result.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                result.type === 'document'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {result.type.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(result.created_at).toLocaleDateString()}
                            </span>
                            {result.metadata?.file_type && (
                              <span>{result.metadata.file_type.toUpperCase()}</span>
                            )}
                            {result.metadata?.reference && (
                              <span>Ref: {result.metadata.reference}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">
                            {Math.round(result.score * 100)}% match
                          </span>
                          <button
                            onClick={() => {
                              if (result.type === 'document') {
                                window.location.href = '/documents';
                              } else {
                                window.location.href = '/tenders';
                              }
                            }}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <ExternalLink size={20} />
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-700 leading-relaxed">{result.excerpt}</p>

                      {result.metadata?.deadline && (
                        <div className="mt-3 text-sm">
                          <span className="text-gray-600">Deadline: </span>
                          <span className="font-medium text-gray-900">
                            {new Date(result.metadata.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {!searched && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Search the Knowledge Base</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter keywords or phrases to find relevant documents, tenders, and analysis results
          </p>
        </div>
      )}
    </div>
  );
}
