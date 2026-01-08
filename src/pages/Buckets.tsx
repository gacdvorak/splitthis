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
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-dark-bg sticky top-0 z-10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/splitthis-avatar.svg" alt="SplitThis" className="w-10 h-10" />
            <span className="text-title">splitthis</span>
          </div>
          <button onClick={logout} className="text-dark-text hover:text-brand-primary text-body transition-colors">
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6">
        {buckets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-secondary mb-4">No expense buckets yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Bucket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {buckets.map((bucket) => {
              const currencySymbol = bucket.currency === 'USD' ? '$' :
                                   bucket.currency === 'EUR' ? '€' :
                                   bucket.currency === 'GBP' ? '£' :
                                   bucket.currency === 'JPY' ? '¥' :
                                   bucket.currency === 'INR' ? '₹' :
                                   '$';

              return (
                <Link
                  key={bucket.id}
                  to={`/bucket/${bucket.id}`}
                  className="card block hover:bg-dark-card/80 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-title mb-2">{bucket.name}</h3>
                      <p className="text-small text-dark-secondary">
                        {Object.keys(bucket.participants).length} participant
                        {Object.keys(bucket.participants).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-title text-brand-primary">
                        {currencySymbol} {bucket.currency}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* New Bucket Button */}
      {buckets.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-6">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary w-full flex items-center justify-center gap-2"
              aria-label="Create new bucket"
            >
              <span className="text-2xl leading-none">+</span>
              <span>New bucket</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50">
          <div className="bg-dark-card w-full sm:max-w-md sm:rounded-2xl p-6 animate-slide-up">
            <h2 className="text-title mb-6">Create Expense Bucket</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="bucket-name" className="block text-small mb-2 text-dark-secondary">
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
                <label htmlFor="currency" className="block text-small mb-2 text-dark-secondary">
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

              <div className="flex gap-3 pt-4">
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
