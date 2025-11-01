import { useState, useEffect } from 'react';
import {
  Server,
  Plus,
  Play,
  TestTube,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import * as api from '../utils/api';

interface FileServer {
  id: number;
  name: string;
  protocol: 'local' | 'nfs' | 'smb';
  host?: string;
  port?: number;
  base_path: string;
  username?: string;
  hasCredentials: boolean;
  include_patterns: string[];
  exclude_patterns: string[];
  scan_mode: 'manual' | 'scheduled' | 'watch';
  scan_interval?: number;
  enabled: boolean;
  last_sync?: string;
  created_at: string;
}

interface SyncLog {
  id: number;
  connector_id: number;
  status: string;
  files_scanned: number;
  files_added: number;
  files_updated: number;
  files_deleted: number;
  errors: string[];
  started_at: string;
  completed_at?: string;
}

export default function FileServersPage() {
  const [servers, setServers] = useState<FileServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState<FileServer | null>(null);
  const [selectedServerLogs, setSelectedServerLogs] = useState<number | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await api.getFileServers();
      setServers(response.data);
    } catch (error) {
      console.error('Failed to load file servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = () => {
    setEditingServer(null);
    setShowForm(true);
  };

  // Reserved for future edit functionality
  // const handleEditServer = (server: FileServer) => {
  //   setEditingServer(server);
  //   setShowForm(true);
  // };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingServer(null);
  };

  const handleSaveServer = async () => {
    await loadServers();
    handleCloseForm();
  };

  const handleDeleteServer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file server connector?')) {
      return;
    }

    try {
      await api.deleteFileServer(id);
      await loadServers();
    } catch (error) {
      console.error('Failed to delete file server:', error);
      alert('Failed to delete file server');
    }
  };

  const handleTestConnection = async (id: number) => {
    try {
      const response = await api.testFileServerConnection(id);
      alert(response.data.success ? `✓ ${response.data.message}` : `✗ ${response.data.message}`);
    } catch (error: any) {
      alert(`✗ Connection failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleScan = async (id: number) => {
    try {
      const response = await api.scanFileServer(id);
      alert(
        `Scan completed!\n\nScanned: ${response.data.stats.scanned}\nAdded: ${response.data.stats.added}\nUpdated: ${response.data.stats.updated}\nErrors: ${response.data.stats.errors.length}`
      );
      await loadServers();
    } catch (error: any) {
      alert(`Scan failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleViewLogs = (id: number) => {
    setSelectedServerLogs(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Server Connectors</h1>
          <p className="text-gray-600 mt-1">
            Configure automatic document ingestion from file servers
          </p>
        </div>
        <button
          onClick={handleCreateServer}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Add Connector</span>
        </button>
      </div>

      {/* File Servers List */}
      {servers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Server size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No file servers configured</h3>
          <p className="text-gray-600 mb-4">
            Get started by adding a file server connector to automatically ingest documents.
          </p>
          <button
            onClick={handleCreateServer}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Your First Connector
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {servers.map(server => (
            <div key={server.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Server size={24} className="text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">{server.name}</h3>
                    {server.enabled ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        Disabled
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Protocol:</span>
                      <span className="ml-2 font-medium">{server.protocol.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Path:</span>
                      <span className="ml-2 font-medium">{server.base_path}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Scan Mode:</span>
                      <span className="ml-2 font-medium capitalize">{server.scan_mode}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Sync:</span>
                      <span className="ml-2 font-medium">
                        {server.last_sync ? new Date(server.last_sync).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  {server.include_patterns.length > 0 && (
                    <div className="mt-3 text-sm">
                      <span className="text-gray-600">Include:</span>
                      <span className="ml-2 text-gray-800">
                        {server.include_patterns.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleTestConnection(server.id)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    title="Test Connection"
                  >
                    <TestTube size={16} />
                    <span>Test</span>
                  </button>
                  <button
                    onClick={() => handleScan(server.id)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    title="Scan Now"
                  >
                    <Play size={16} />
                    <span>Scan</span>
                  </button>
                  <button
                    onClick={() => handleViewLogs(server.id)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    title="View Logs"
                  >
                    <Eye size={16} />
                    <span>Logs</span>
                  </button>
                  <button
                    onClick={() => handleDeleteServer(server.id)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <FileServerForm
          server={editingServer}
          onClose={handleCloseForm}
          onSave={handleSaveServer}
        />
      )}

      {/* Logs Modal */}
      {selectedServerLogs && (
        <SyncLogsModal serverId={selectedServerLogs} onClose={() => setSelectedServerLogs(null)} />
      )}
    </div>
  );
}

// File Server Form Component
function FileServerForm({
  server,
  onClose,
  onSave,
}: {
  server: FileServer | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: server?.name || '',
    protocol: server?.protocol || 'local',
    host: server?.host || '',
    port: server?.port || 445,
    base_path: server?.base_path || '',
    username: server?.username || '',
    password: '',
    include_patterns: server?.include_patterns.join('\n') || '**/*.pdf\n**/*.docx\n**/*.txt',
    exclude_patterns: server?.exclude_patterns.join('\n') || '**/node_modules/**\n**/.git/**',
    scan_mode: server?.scan_mode || 'manual',
    scan_interval: server?.scan_interval || 3600,
    enabled: server?.enabled ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        port: formData.port || undefined,
        include_patterns: formData.include_patterns
          .split('\n')
          .map(p => p.trim())
          .filter(p => p),
        exclude_patterns: formData.exclude_patterns
          .split('\n')
          .map(p => p.trim())
          .filter(p => p),
      };

      if (server) {
        await api.updateFileServer(server.id, payload);
      } else {
        await api.createFileServer(payload);
      }

      onSave();
    } catch (error: any) {
      alert(`Failed to save: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {server ? 'Edit' : 'Create'} File Server Connector
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protocol</label>
              <select
                value={formData.protocol}
                onChange={e => setFormData({ ...formData, protocol: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="local">Local Filesystem</option>
                <option value="nfs">NFS Mount</option>
                <option value="smb">SMB/CIFS (Coming Soon)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Path</label>
              <input
                type="text"
                value={formData.base_path}
                onChange={e => setFormData({ ...formData, base_path: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="/path/to/documents"
                required
              />
            </div>

            {formData.protocol === 'smb' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                    <input
                      type="text"
                      value={formData.host}
                      onChange={e => setFormData({ ...formData, host: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="server.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={server ? '(unchanged)' : ''}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Include Patterns (one per line)
              </label>
              <textarea
                value={formData.include_patterns}
                onChange={e => setFormData({ ...formData, include_patterns: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exclude Patterns (one per line)
              </label>
              <textarea
                value={formData.exclude_patterns}
                onChange={e => setFormData({ ...formData, exclude_patterns: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scan Mode</label>
              <select
                value={formData.scan_mode}
                onChange={e => setFormData({ ...formData, scan_mode: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">Manual - Scan on demand</option>
                <option value="scheduled">Scheduled - Periodic scans</option>
                <option value="watch">Watch - Real-time monitoring</option>
              </select>
            </div>

            {formData.scan_mode === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scan Interval (seconds)
                </label>
                <input
                  type="number"
                  value={formData.scan_interval}
                  onChange={e =>
                    setFormData({ ...formData, scan_interval: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={60}
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Enabled</label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Sync Logs Modal Component
function SyncLogsModal({ serverId, onClose }: { serverId: number; onClose: () => void }) {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [serverId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getFileServerLogs(serverId);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Sync Logs</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ×
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No sync logs yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {log.status === 'completed' && (
                        <CheckCircle size={20} className="text-green-600" />
                      )}
                      {log.status === 'failed' && <XCircle size={20} className="text-red-600" />}
                      {log.status === 'running' && <Clock size={20} className="text-blue-600" />}
                      <span className="font-medium capitalize">{log.status}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {new Date(log.started_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                    <div>
                      <span className="text-gray-600">Scanned:</span>
                      <span className="ml-2 font-medium">{log.files_scanned}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Added:</span>
                      <span className="ml-2 font-medium text-green-600">{log.files_added}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Updated:</span>
                      <span className="ml-2 font-medium text-blue-600">{log.files_updated}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Errors:</span>
                      <span className="ml-2 font-medium text-red-600">{log.errors.length}</span>
                    </div>
                  </div>

                  {log.errors.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                      <p className="font-medium text-red-900 mb-1">Errors:</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1">
                        {log.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {log.errors.length > 5 && (
                          <li className="text-red-600">... and {log.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
