import { useState, useEffect } from 'react';
import type { Bucket, Credit, SplitConfig } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  bucket: Bucket;
  credit?: Credit | null;
  onClose: () => void;
  onSave: (credit: Omit<Credit, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
}

export default function CreditForm({ bucket, credit, onClose, onSave }: Props) {
  const { currentUser } = useAuth();
  const participants = Object.values(bucket.participants);

  const [title, setTitle] = useState(credit?.title || '');
  const [amount, setAmount] = useState(credit?.amount.toString() || '');
  const [receivedBy, setReceivedBy] = useState(credit?.receivedBy || currentUser?.uid || '');
  const [splitType, setSplitType] = useState<'even' | 'percentage'>(
    credit?.split.type || 'even'
  );
  const [percentages, setPercentages] = useState<Record<string, number>>(
    credit?.split.percentages || {}
  );
  const [notes, setNotes] = useState(credit?.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize percentages for all participants if not set
    if (splitType === 'percentage' && Object.keys(percentages).length === 0) {
      const evenPercentage = Math.floor(100 / participants.length);
      const newPercentages: Record<string, number> = {};
      participants.forEach((p, index) => {
        newPercentages[p.uid] =
          index === 0 ? 100 - evenPercentage * (participants.length - 1) : evenPercentage;
      });
      setPercentages(newPercentages);
    }
  }, [splitType, participants]);

  function getParticipantName(uid: string): string {
    const participant = bucket.participants[uid];
    if (!participant) return 'Unknown';
    return participant.displayName || participant.email.split('@')[0];
  }

  function handlePercentageChange(uid: string, value: string) {
    const num = parseInt(value) || 0;
    setPercentages({ ...percentages, [uid]: Math.max(0, Math.min(100, num)) });
  }

  async function handleSubmit() {
    if (!title.trim() || !amount || parseFloat(amount) <= 0 || !receivedBy) {
      alert('Please fill in all required fields');
      return;
    }

    if (splitType === 'percentage') {
      const total = Object.values(percentages).reduce((sum, val) => sum + val, 0);
      if (Math.abs(total - 100) > 0.1) {
        alert('Percentages must add up to 100%');
        return;
      }
    }

    setSaving(true);
    try {
      const split: SplitConfig =
        splitType === 'even'
          ? { type: 'even' }
          : { type: 'percentage', percentages };

      await onSave({
        bucketId: bucket.id,
        title: title.trim(),
        amount: parseFloat(amount),
        receivedBy,
        split,
        notes: notes.trim(),
      });
    } catch (err) {
      console.error('Failed to save credit:', err);
      alert('Failed to save credit');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-dark-surface w-full sm:max-w-md sm:rounded-lg p-6 max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {credit ? 'Edit Credit' : 'Add Credit'}
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g., Refund from hotel"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2">
              Amount ({bucket.currency}) *
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="receivedBy" className="block text-sm font-medium mb-2">
              Received by *
            </label>
            <select
              id="receivedBy"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="input-field"
            >
              <option value="">Select who received</option>
              {participants.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {getParticipantName(p.uid)}
                  {p.uid === currentUser?.uid ? ' (you)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Split Type *</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSplitType('even')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${splitType === 'even'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-dark-bg border-dark-border text-dark-text'
                  }`}
              >
                Split Evenly
              </button>
              <button
                onClick={() => setSplitType('percentage')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${splitType === 'percentage'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-dark-bg border-dark-border text-dark-text'
                  }`}
              >
                Custom %
              </button>
            </div>
          </div>

          {splitType === 'percentage' && (
            <div className="bg-dark-bg rounded-lg p-4">
              <div className="text-sm font-medium mb-3">Split Percentages</div>
              <div className="space-y-3">
                {participants.map((p) => (
                  <div key={p.uid} className="flex items-center gap-3">
                    <label className="flex-1 text-sm">
                      {getParticipantName(p.uid)}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={percentages[p.uid] || 0}
                        onChange={(e) => handlePercentageChange(p.uid, e.target.value)}
                        className="w-20 bg-dark-surface border border-dark-border rounded px-2 py-1 text-sm"
                      />
                      <span className="text-sm text-dark-muted">%</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-dark-border text-sm">
                  Total:{' '}
                  <span
                    className={
                      Math.abs(
                        Object.values(percentages).reduce((sum, val) => sum + val, 0) - 100
                      ) < 0.1
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {Object.values(percentages).reduce((sum, val) => sum + val, 0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : credit ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
