import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Bucket, Participant } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  bucket: Bucket;
}

export default function ParticipantManager({ bucket }: Props) {
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const participants = Object.values(bucket.participants);

  async function handleAddParticipant() {
    if (!email.trim()) return;

    setError('');
    setAdding(true);

    try {
      // Simple email validation
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Check if already added
      const exists = participants.some((p) => p.email === email.trim());
      if (exists) {
        throw new Error('This person is already in the bucket');
      }

      // Create a temporary UID based on email (in real app, would look up actual user)
      const tempUid = `temp_${email.trim().replace(/[^a-zA-Z0-9]/g, '_')}`;

      const newParticipant: Participant = {
        uid: tempUid,
        email: email.trim(),
        addedAt: new Date(),
      };

      await updateDoc(doc(db, 'buckets', bucket.id), {
        [`participants.${tempUid}`]: newParticipant,
      });

      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveParticipant(uid: string) {
    if (uid === currentUser?.uid) {
      alert("You can't remove yourself from the bucket");
      return;
    }

    if (!confirm('Remove this person from the bucket?')) {
      return;
    }

    try {
      const updates: any = {};
      updates[`participants.${uid}`] = null;

      await updateDoc(doc(db, 'buckets', bucket.id), updates);
    } catch (err) {
      console.error('Failed to remove participant:', err);
      alert('Failed to remove participant');
    }
  }

  function getParticipantName(participant: Participant): string {
    return participant.displayName || participant.email.split('@')[0];
  }

  return (
    <div>
      <div className="card mb-6">
        <h3 className="font-semibold mb-4">Add Person</h3>
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
            className="input-field"
            placeholder="Enter email address"
          />
          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}
          <button
            onClick={handleAddParticipant}
            disabled={adding || !email.trim()}
            className="btn-primary w-full"
          >
            {adding ? 'Adding...' : 'Add Person'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">
          Participants ({participants.length})
        </h3>
        <div className="space-y-3">
          {participants.map((participant) => {
            const isCurrentUser = participant.uid === currentUser?.uid;
            const isCreator = participant.uid === bucket.createdBy;

            return (
              <div
                key={participant.uid}
                className="flex justify-between items-center pb-3 border-b border-dark-border last:border-0"
              >
                <div>
                  <div className="font-medium">
                    {getParticipantName(participant)}
                    {isCurrentUser && (
                      <span className="text-xs text-dark-muted ml-2">(you)</span>
                    )}
                    {isCreator && (
                      <span className="text-xs text-blue-500 ml-2">(creator)</span>
                    )}
                  </div>
                  <div className="text-sm text-dark-muted">{participant.email}</div>
                </div>
                {!isCurrentUser && (
                  <button
                    onClick={() => handleRemoveParticipant(participant.uid)}
                    className="text-sm text-red-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
