import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBuckets } from '../hooks/useBuckets';
import { useAuth } from '../contexts/AuthContext';

export default function Buckets() {
  const { buckets, loading, createBucket } = useBuckets();
  const { logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bucketName, setBucketName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!bucketName.trim()) return;

    setCreating(true);
    try {
      await createBucket(bucketName.trim(), currency);
      setBucketName('');
      setCurrency('USD');
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('Failed to create bucket:', error);
      const errorMessage = error?.message || 'Unknown error';
      alert(`Failed to create bucket: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-dark-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Buckets</h1>
          <button onClick={logout} className="text-dark-muted hover:text-dark-text text-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {buckets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-muted mb-4">No expense buckets yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Bucket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {buckets.map((bucket) => (
              <Link
                key={bucket.id}
                to={`/bucket/${bucket.id}`}
                className="card block hover:bg-dark-border transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{bucket.name}</h3>
                    <p className="text-sm text-dark-muted mt-1">
                      {Object.keys(bucket.participants).length} participant
                      {Object.keys(bucket.participants).length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-blue-500">
                      {bucket.currency}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {buckets.length > 0 && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
          aria-label="Create new bucket"
        >
          +
        </button>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50">
          <div className="bg-dark-surface w-full sm:max-w-md sm:rounded-lg p-6 animate-slide-up">
            <h2 className="text-xl font-bold mb-4">Create Expense Bucket</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="bucket-name" className="block text-sm font-medium mb-2">
                  Bucket Name
                </label>
                <input
                  id="bucket-name"
                  type="text"
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Weekend Trip"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input-field"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setBucketName('');
                    setCurrency('USD');
                  }}
                  className="btn-secondary flex-1"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="btn-primary flex-1"
                  disabled={creating || !bucketName.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
