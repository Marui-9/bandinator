import { useEffect, useState } from 'react';
import { FileText, Upload, Search, Trash2, Tag, X } from 'lucide-react';
import { uploadDocument, getDocuments, deleteDocument } from '../utils/api';

interface Document {
  id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  attributes?: string; // JSON string of attributes
  created_at: string;
  source_type?: 'upload' | 'file_server';
  source_host?: string;
  file_path?: string;
  last_modified?: string;
}

interface DocumentAttributes {
  category?: string;
  domain?: string;
  tags?: string[];
  project?: string;
  version?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attributes, setAttributes] = useState<DocumentAttributes>({
    category: '',
    domain: '',
    tags: [],
    project: '',
    version: '',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await getDocuments();
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowUploadForm(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Add attributes as JSON string
      const cleanAttributes = {
        ...attributes,
        category: attributes.category || undefined,
        domain: attributes.domain || undefined,
        tags: attributes.tags && attributes.tags.length > 0 ? attributes.tags : undefined,
        project: attributes.project || undefined,
        version: attributes.version || undefined,
      };

      // Only add attributes if at least one field is filled
      if (Object.values(cleanAttributes).some(v => v !== undefined)) {
        formData.append('attributes', JSON.stringify(cleanAttributes));
      }

      await uploadDocument(selectedFile);
      await fetchDocuments();
      alert('Document uploaded successfully!');

      // Reset form
      setSelectedFile(null);
      setShowUploadForm(false);
      setAttributes({
        category: '',
        domain: '',
        tags: [],
        project: '',
        version: '',
      });
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !attributes.tags?.includes(tagInput.trim())) {
      setAttributes({
        ...attributes,
        tags: [...(attributes.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setAttributes({
      ...attributes,
      tags: attributes.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(id);
      await fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Upload size={20} />
          Upload Document
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.docx,.txt"
          />
        </label>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && selectedFile && (
        <div className="bg-white shadow rounded-lg p-6 border-2 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upload: {selectedFile.name}</h2>
            <button
              onClick={() => {
                setShowUploadForm(false);
                setSelectedFile(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={attributes.category}
                  onChange={e => setAttributes({ ...attributes, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category...</option>
                  <option value="technical">Technical Documentation</option>
                  <option value="compliance">Compliance</option>
                  <option value="financial">Financial</option>
                  <option value="legal">Legal</option>
                  <option value="proposal">Proposal</option>
                  <option value="reference">Reference Material</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={attributes.domain}
                  onChange={e => setAttributes({ ...attributes, domain: e.target.value })}
                  placeholder="e.g., Healthcare, IT, Construction"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <input
                  type="text"
                  value={attributes.project}
                  onChange={e => setAttributes({ ...attributes, project: e.target.value })}
                  placeholder="Project name or ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input
                  type="text"
                  value={attributes.version}
                  onChange={e => setAttributes({ ...attributes, version: e.target.value })}
                  placeholder="e.g., v1.0, Draft 3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  <Tag size={20} />
                </button>
              </div>
              {attributes.tags && attributes.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attributes.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-blue-900">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {uploading ? 'Uploading...' : 'Upload with Attributes'}
              </button>
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => {
              const attrs: DocumentAttributes = doc.attributes ? JSON.parse(doc.attributes) : {};
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText size={24} className="text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{doc.original_name}</p>
                        {doc.source_type === 'file_server' && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                            File Server
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {(doc.file_size / 1024).toFixed(2)} KB •{' '}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {doc.source_type === 'file_server' && (doc.source_host || doc.file_path) && (
                        <div className="mt-1 text-xs text-gray-600">
                          {doc.source_host && <span>📡 {doc.source_host}</span>}
                          {doc.source_host && doc.file_path && <span className="mx-1">•</span>}
                          {doc.file_path && <span>📄 {doc.file_path}</span>}
                        </div>
                      )}
                      {(attrs.category || attrs.domain || attrs.project || attrs.tags) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {attrs.category && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              {attrs.category}
                            </span>
                          )}
                          {attrs.domain && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {attrs.domain}
                            </span>
                          )}
                          {attrs.project && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                              📁 {attrs.project}
                            </span>
                          )}
                          {attrs.tags &&
                            attrs.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:text-red-800 p-2 flex-shrink-0"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
