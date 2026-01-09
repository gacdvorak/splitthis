import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBuckets } from '../hooks/useBuckets';
import { useExpenses } from '../hooks/useExpenses';
import { useCredits } from '../hooks/useCredits';
import { useAuth } from '../contexts/AuthContext';
import { calculateBucketSummary } from '../utils/settlements';
import { getInvitationByEmail, acceptInvitation } from '../utils/invitations';
import ExpenseForm from '../components/ExpenseForm';
import CreditForm from '../components/CreditForm';
import ParticipantManager from '../components/ParticipantManager';

type Tab = 'transactions' | 'settlement' | 'participants';

export default function BucketDetail() {
  const { bucketId } = useParams<{ bucketId: string }>();
  const { buckets, updateBucket, deleteBucket } = useBuckets();
  const { expenses, createExpense, updateExpense, deleteExpense } = useExpenses(bucketId);
  const { credits, createCredit, updateCredit, deleteCredit } = useCredits(bucketId);
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('transactions');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingCredit, setEditingCredit] = useState<any>(null);
  const [checkingInvitation, setCheckingInvitation] = useState(true);
  const [invitationError, setInvitationError] = useState<string>('');
  const [showEditBucketModal, setShowEditBucketModal] = useState(false);
  const [editBucketName, setEditBucketName] = useState('');
  const [editBucketCurrency, setEditBucketCurrency] = useState('');
  const [savingBucket, setSavingBucket] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const bucket = buckets.find((b) => b.id === bucketId);

  // Scroll to top when bucket is first opened
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [bucketId]);

  // Check for pending invitation and auto-accept when bucket is accessed
  useEffect(() => {
    async function checkAndAcceptInvitation() {
      if (!bucketId || !currentUser?.email) {
        setCheckingInvitation(false);
        return;
      }

      // If user is already a participant, no need to check
      if (bucket) {
        setCheckingInvitation(false);
        return;
      }

      try {
        // Check if there's a pending invitation for this user's email
        const invitation = await getInvitationByEmail(bucketId, currentUser.email);

        if (invitation) {
          // Auto-accept the invitation
          await acceptInvitation(
            invitation.id,
            currentUser.uid,
            currentUser.email,
            currentUser.displayName || undefined
          );
          // The bucket should now appear in the user's list via useBuckets hook
        }
      } catch (err: any) {
        console.error('Error checking/accepting invitation:', err);
        setInvitationError(err.message || 'Failed to access bucket');
      } finally {
        setCheckingInvitation(false);
      }
    }

    checkAndAcceptInvitation();
  }, [bucketId, currentUser, bucket]);

  if (checkingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-dark-muted">Loading bucket...</div>
      </div>
    );
  }

  if (!bucket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-muted mb-2">
            {invitationError || 'Bucket not found'}
          </div>
          <Link to="/" className="text-blue-500 text-sm">
            ← Back to Buckets
          </Link>
        </div>
      </div>
    );
  }

  const summary = calculateBucketSummary(bucket, expenses, credits);
  const participants = Object.values(bucket.participants);

  // Combine expenses and credits for transaction view
  const transactions = [
    ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
    ...credits.map((c) => ({ ...c, type: 'credit' as const })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  function getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: '$',
      AUD: '$',
      INR: '₹',
    };
    return symbols[currency] || currency;
  }

  const currencySymbol = getCurrencySymbol(bucket.currency);

  function getParticipantName(uid: string): string {
    const participant = bucket!.participants[uid];
    if (!participant) return 'Unknown';
    return participant.displayName || participant.email.split('@')[0];
  }

  function handleEditBucket() {
    if (!bucket) return;
    setEditBucketName(bucket.name);
    setEditBucketCurrency(bucket.currency);
    setShowEditBucketModal(true);
  }

  async function handleSaveBucket() {
    if (!bucket || !editBucketName.trim()) return;

    setSavingBucket(true);
    try {
      await updateBucket(bucket.id, {
        name: editBucketName.trim(),
        currency: editBucketCurrency,
      });
      setShowEditBucketModal(false);
    } catch (error) {
      console.error('Failed to update bucket:', error);
      alert('Failed to update bucket');
    } finally {
      setSavingBucket(false);
    }
  }

  async function handleDeleteBucket() {
    if (!bucket) return;

    if (!confirm('Are you sure you want to delete this bucket? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBucket(bucket.id);
      // Navigate back to buckets list after deletion
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete bucket:', error);
      alert('Failed to delete bucket');
    }
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="bg-dark-bg sticky top-0 z-10 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="text-dark-text hover:text-brand-primary text-body transition-colors flex items-center gap-2">
              <span>←</span>
              <span>Back</span>
            </Link>
            {bucket.createdBy === currentUser?.uid && (
              <div className="flex gap-4">
                <button
                  onClick={handleEditBucket}
                  className="text-dark-text hover:text-brand-primary text-body transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteBucket}
                  className="text-destructive hover:text-destructive/80 text-body transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <h1 className="text-display mb-2">{bucket.name}</h1>
          <p className="text-body text-dark-text">
            {currencySymbol} {bucket.currency}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-border mt-6 max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 text-body font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-dark-secondary'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex-1 py-3 text-body font-medium transition-colors ${
              activeTab === 'settlement'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-dark-secondary'
            }`}
          >
            Settlement
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-3 text-body font-medium transition-colors ${
              activeTab === 'participants'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-dark-secondary'
            }`}
          >
            People
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-dark-secondary mb-4">No transactions yet</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setShowExpenseForm(true)} className="btn-primary">
                    Add Expense
                  </button>
                  <button onClick={() => setShowCreditForm(true)} className="btn-secondary">
                    Add Credit
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const isExpense = transaction.type === 'expense';
                  const payer = isExpense
                    ? getParticipantName(transaction.paidBy)
                    : getParticipantName((transaction as any).receivedBy);

                  return (
                    <div key={transaction.id} className="card">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="text-strong">{transaction.title}</h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-md font-bold ${
                                isExpense
                                  ? 'bg-destructive/20 text-destructive'
                                  : 'bg-brand-primary/20 text-brand-primary'
                              }`}
                            >
                              {isExpense ? 'Expense' : 'Credit'}
                            </span>
                          </div>
                          <p className="text-small text-dark-secondary">
                            {isExpense ? 'Paid by' : 'Received by'} {payer}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div
                            className={`text-display ${
                              isExpense ? 'text-destructive' : 'text-brand-primary'
                            }`}
                          >
                            {isExpense ? '-' : '+'}
                            {currencySymbol}
                            {transaction.amount.toFixed(2)}
                          </div>
                          <div className="text-caption mt-1">
                            {transaction.split.type === 'even' ? 'Split evenly' : 'Custom split'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={() => {
                            if (isExpense) {
                              setEditingExpense(transaction);
                              setShowExpenseForm(true);
                            } else {
                              setEditingCredit(transaction);
                              setShowCreditForm(true);
                            }
                          }}
                          className="text-body text-dark-text hover:text-brand-primary transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Delete this ${isExpense ? 'expense' : 'credit'}?`
                              )
                            ) {
                              if (isExpense) {
                                deleteExpense(transaction.id);
                              } else {
                                deleteCredit(transaction.id);
                              }
                            }
                          }}
                          className="text-body text-destructive hover:text-destructive/80 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Settlement Tab */}
        {activeTab === 'settlement' && (
          <div>
            <div className="card mb-6">
              <h3 className="text-strong mb-4">Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-small text-dark-secondary mb-2">Total Expenses</div>
                  <div className="text-title text-destructive">
                    {currencySymbol}
                    {summary.totalExpenses.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-small text-dark-secondary mb-2">Total Credits</div>
                  <div className="text-title text-brand-primary">
                    {currencySymbol}
                    {summary.totalCredits.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <h3 className="text-strong mb-4">Balances</h3>
              <div className="space-y-3">
                {participants.map((participant) => {
                  const balance = summary.balances[participant.uid] || 0;
                  const name = getParticipantName(participant.uid);
                  const isCurrentUser = participant.uid === currentUser?.uid;

                  return (
                    <div
                      key={participant.uid}
                      className="flex justify-between items-center py-3 border-b border-dark-border last:border-0"
                    >
                      <span className="text-body">
                        {name}
                        {isCurrentUser && (
                          <span className="text-caption ml-2">(you)</span>
                        )}
                      </span>
                      <span
                        className={`text-body font-bold ${
                          balance > 0.01
                            ? 'text-brand-primary'
                            : balance < -0.01
                            ? 'text-destructive'
                            : 'text-dark-secondary'
                        }`}
                      >
                        {balance > 0.01
                          ? `Gets ${currencySymbol}${balance.toFixed(2)}`
                          : balance < -0.01
                          ? `Owes ${currencySymbol}${Math.abs(balance).toFixed(2)}`
                          : 'Settled'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {summary.settlements.length > 0 && (
              <div className="card">
                <h3 className="text-strong mb-4">Suggested Settlements</h3>
                <div className="space-y-3">
                  {summary.settlements.map((settlement, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-dark-bg rounded-xl"
                    >
                      <div className="text-body">
                        <span className="text-strong">
                          {getParticipantName(settlement.from)}
                        </span>
                        <span className="text-dark-secondary mx-2">pays</span>
                        <span className="text-strong">
                          {getParticipantName(settlement.to)}
                        </span>
                      </div>
                      <div className="text-strong text-brand-primary">
                        {currencySymbol}
                        {settlement.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <ParticipantManager bucket={bucket} />
        )}
      </div>

      {/* Action Buttons */}
      {activeTab === 'transactions' && transactions.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-6">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={() => setShowExpenseForm(true)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              aria-label="Add expense"
            >
              <span className="text-2xl leading-none">+</span>
              <span>Add expense</span>
            </button>
            <button
              onClick={() => setShowCreditForm(true)}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
              aria-label="Add credit"
            >
              <span className="text-2xl leading-none">+</span>
              <span>Add credit</span>
            </button>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <ExpenseForm
          bucket={bucket}
          expense={editingExpense}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
          onSave={async (expense) => {
            if (editingExpense) {
              await updateExpense(editingExpense.id, expense);
            } else {
              await createExpense({ ...expense, bucketId: bucket.id });
              // Scroll to top when adding new expense
              window.scrollTo(0, 0);
            }
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
        />
      )}

      {/* Credit Form Modal */}
      {showCreditForm && (
        <CreditForm
          bucket={bucket}
          credit={editingCredit}
          onClose={() => {
            setShowCreditForm(false);
            setEditingCredit(null);
          }}
          onSave={async (credit) => {
            if (editingCredit) {
              await updateCredit(editingCredit.id, credit);
            } else {
              await createCredit({ ...credit, bucketId: bucket.id });
              // Scroll to top when adding new credit
              window.scrollTo(0, 0);
            }
            setShowCreditForm(false);
            setEditingCredit(null);
          }}
        />
      )}

      {/* Edit Bucket Modal */}
      {showEditBucketModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50">
          <div className="bg-dark-card w-full sm:max-w-md sm:rounded-2xl p-6 animate-slide-up">
            <h2 className="text-title mb-6">Edit Bucket</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-bucket-name" className="block text-small mb-2 text-dark-secondary">
                  Bucket Name
                </label>
                <input
                  id="edit-bucket-name"
                  type="text"
                  value={editBucketName}
                  onChange={(e) => setEditBucketName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Weekend Trip"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="edit-currency" className="block text-small mb-2 text-dark-secondary">
                  Currency
                </label>
                <select
                  id="edit-currency"
                  value={editBucketCurrency}
                  onChange={(e) => setEditBucketCurrency(e.target.value)}
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
                    setShowEditBucketModal(false);
                    setEditBucketName('');
                    setEditBucketCurrency('');
                  }}
                  className="btn-secondary flex-1"
                  disabled={savingBucket}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBucket}
                  className="btn-primary flex-1"
                  disabled={savingBucket || !editBucketName.trim()}
                >
                  {savingBucket ? 'Saving...' : 'Save'}
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
