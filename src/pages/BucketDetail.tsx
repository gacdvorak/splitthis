import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  const { buckets } = useBuckets();
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

  const bucket = buckets.find((b) => b.id === bucketId);

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

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link to="/" className="text-blue-500 text-sm mb-2 inline-block">
            ← Back to Buckets
          </Link>
          <h1 className="text-2xl font-bold">{bucket.name}</h1>
          <p className="text-sm text-dark-muted mt-1">
            {currencySymbol} {bucket.currency}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-dark-border">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-dark-muted'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'settlement'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-dark-muted'
            }`}
          >
            Settlement
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'participants'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-dark-muted'
            }`}
          >
            People
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-dark-muted mb-4">No transactions yet</p>
                <div className="space-x-3">
                  <button onClick={() => setShowExpenseForm(true)} className="btn-primary">
                    Add Expense
                  </button>
                  <button onClick={() => setShowCreditForm(true)} className="btn-secondary">
                    Add Credit
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const isExpense = transaction.type === 'expense';
                  const payer = isExpense
                    ? getParticipantName(transaction.paidBy)
                    : getParticipantName((transaction as any).receivedBy);

                  return (
                    <div key={transaction.id} className="card">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{transaction.title}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                isExpense
                                  ? 'bg-red-900/50 text-red-300'
                                  : 'bg-green-900/50 text-green-300'
                              }`}
                            >
                              {isExpense ? 'Expense' : 'Credit'}
                            </span>
                          </div>
                          <p className="text-sm text-dark-muted mt-1">
                            {isExpense ? 'Paid by' : 'Received by'} {payer}
                          </p>
                          {transaction.notes && (
                            <p className="text-sm text-dark-muted mt-1">{transaction.notes}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div
                            className={`text-lg font-semibold ${
                              isExpense ? 'text-red-400' : 'text-green-400'
                            }`}
                          >
                            {isExpense ? '-' : '+'}
                            {currencySymbol}
                            {transaction.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-dark-muted mt-1">
                            {transaction.split.type === 'even' ? 'Split evenly' : 'Custom split'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-dark-border">
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
                          className="text-sm text-blue-500 hover:text-blue-400"
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
                          className="text-sm text-red-500 hover:text-red-400"
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
              <h3 className="font-semibold mb-4">Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-dark-muted">Total Expenses</div>
                  <div className="text-lg font-semibold text-red-400">
                    {currencySymbol}
                    {summary.totalExpenses.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-dark-muted">Total Credits</div>
                  <div className="text-lg font-semibold text-green-400">
                    {currencySymbol}
                    {summary.totalCredits.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <h3 className="font-semibold mb-4">Balances</h3>
              <div className="space-y-3">
                {participants.map((participant) => {
                  const balance = summary.balances[participant.uid] || 0;
                  const name = getParticipantName(participant.uid);
                  const isCurrentUser = participant.uid === currentUser?.uid;

                  return (
                    <div
                      key={participant.uid}
                      className="flex justify-between items-center pb-3 border-b border-dark-border last:border-0"
                    >
                      <span className="text-sm">
                        {name}
                        {isCurrentUser && (
                          <span className="text-xs text-dark-muted ml-2">(you)</span>
                        )}
                      </span>
                      <span
                        className={`font-medium ${
                          balance > 0.01
                            ? 'text-green-400'
                            : balance < -0.01
                            ? 'text-red-400'
                            : 'text-dark-muted'
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
                <h3 className="font-semibold mb-4">Suggested Settlements</h3>
                <div className="space-y-3">
                  {summary.settlements.map((settlement, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-dark-bg rounded-lg"
                    >
                      <div className="text-sm">
                        <span className="font-medium">
                          {getParticipantName(settlement.from)}
                        </span>
                        <span className="text-dark-muted mx-2">pays</span>
                        <span className="font-medium">
                          {getParticipantName(settlement.to)}
                        </span>
                      </div>
                      <div className="font-semibold text-blue-500">
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

      {/* Floating Action Buttons */}
      {activeTab === 'transactions' && transactions.length > 0 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <button
            onClick={() => setShowCreditForm(true)}
            className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
            aria-label="Add credit"
          >
            +
          </button>
          <button
            onClick={() => setShowExpenseForm(true)}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
            aria-label="Add expense"
          >
            +
          </button>
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
            }
            setShowCreditForm(false);
            setEditingCredit(null);
          }}
        />
      )}
    </div>
  );
}
