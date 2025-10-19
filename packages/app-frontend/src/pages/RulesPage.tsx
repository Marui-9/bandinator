import { useEffect, useState } from 'react';
import { Plus, GitBranch, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getRules, createRule, deleteRule, updateRule } from '../utils/api';

interface Rule {
  id: number;
  name: string;
  description: string;
  rule_type: string;
  condition: string;
  weight: number;
  enabled: boolean;
  created_at: string;
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleType: 'keyword',
    condition: '',
    weight: '1.0',
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await getRules();
      setRules(response.data);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRule({
        ...formData,
        weight: parseFloat(formData.weight),
      });
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        ruleType: 'keyword',
        condition: '',
        weight: '1.0',
      });
      await fetchRules();
    } catch (error) {
      console.error('Failed to create rule:', error);
      alert('Failed to create rule');
    }
  };

  const handleToggle = async (rule: Rule) => {
    try {
      await updateRule(rule.id, { ...rule, enabled: !rule.enabled });
      await fetchRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await deleteRule(id);
      await fetchRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert('Failed to delete rule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Rules Engine</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          New Rule
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Rule</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formData.ruleType}
                  onChange={e => setFormData({ ...formData, ruleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="keyword">Keyword Match</option>
                  <option value="budget">Budget Range</option>
                  <option value="document">Document Check</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={e => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
              <textarea
                required
                rows={2}
                value={formData.condition}
                onChange={e => setFormData({ ...formData, condition: e.target.value })}
                placeholder="e.g., software,development,agile (for keyword) or 10000-50000 (for budget)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Rule
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No rules configured yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 ${rule.enabled ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {rule.rule_type}
                      </span>
                      <span className="text-xs text-gray-500">Weight: {rule.weight}</span>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      <span className="font-medium">Condition:</span> {rule.condition}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(rule)}
                      className={`p-2 ${rule.enabled ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {rule.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
