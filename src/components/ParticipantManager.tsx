import { useState } from 'react';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Bucket, Participant } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  createInvitation,
  generateInvitationLink,
  generateInvitationEmailLink
} from '../utils/invitations';

interface Props {
  bucket: Bucket;
}

export default function ParticipantManager({ bucket }: Props) {
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const { currentUser } = useAuth();

  const participants = Object.values(bucket.participants);

  async function handleAddParticipant() {
    if (!email.trim() || !currentUser) return;

    setError('');
    setAdding(true);
    setShowInviteOptions(false);
    setCopiedToClipboard(false);

    try {
      // Simple email validation
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const emailLower = email.trim().toLowerCase();

      // Check if already added
      const exists = participants.some((p) => p.email.toLowerCase() === emailLower);
      if (exists) {
        throw new Error('This person is already in the bucket');
      }

      // Create invitation
      const { token } = await createInvitation(
        bucket.id,
        bucket.name,
        emailLower,
        currentUser.uid,
        currentUser.email || ''
      );

      const link = generateInvitationLink(token);
      setInvitationLink(link);
      setShowInviteOptions(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  function getBucketLink(): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/bucket/${bucket.id}`;
  }

  async function handleShareBucket() {
    const bucketLink = getBucketLink();
    const inviterName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Someone';
    const shareText = `You've been added to the expenses bucket "${bucket.name}". Access the bucket at ${bucketLink}`;

    // Check if native share is available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join "${bucket.name}" on SplitThis`,
          text: shareText,
          url: bucketLink
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback to mailto for desktop
      const subject = encodeURIComponent(`You've been added to the expenses bucket "${bucket.name}"`);
      const body = encodeURIComponent(
        `You've been added to the expenses bucket "${bucket.name}". Access the bucket at ${bucketLink}\n\n` +
        `${inviterName} added you to this bucket on SplitThis.\n\n` +
        `Click the link above to view the bucket and start tracking expenses together.\n\n` +
        `If you don't have an account yet, you'll be able to create one when you access the bucket.\n\n` +
        `Best regards,\nThe SplitThis Team`
      );

      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  }

  async function handleCopyBucketLink() {
    try {
      const bucketLink = getBucketLink();
      await navigator.clipboard.writeText(bucketLink);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 3000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 3000);
    } catch (err) {
      alert('Failed to copy to clipboard. Please copy manually:\n' + invitationLink);
    }
  }

  function handleSendEmail() {
    if (!currentUser) return;

    const inviterName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Someone';
    const mailtoLink = generateInvitationEmailLink(
      email.trim(),
      inviterName,
      bucket.name,
      invitationLink
    );

    window.location.href = mailtoLink;
  }

  function handleDone() {
    setEmail('');
    setInvitationLink('');
    setShowInviteOptions(false);
    setCopiedToClipboard(false);
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
      const participantIds = bucket.participantIds || [];
      const updates: any = {
        [`participants.${uid}`]: deleteField(),
        participantIds: participantIds.filter(id => id !== uid)
      };

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
        <h3 className="font-semibold mb-4">Invite Person</h3>

        {!showInviteOptions ? (
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
              {adding ? 'Creating Invitation...' : 'Send Invitation'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-dark-surface p-4 rounded-md border border-dark-border">
              <p className="text-sm text-dark-muted mb-2">
                Invitation created for: <span className="text-white font-medium">{email}</span>
              </p>
              <div className="mt-3 flex items-center space-x-2">
                <input
                  type="text"
                  value={invitationLink}
                  readOnly
                  className="input-field flex-1 text-sm font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopyLink}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                {copiedToClipboard ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSendEmail}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Send Email</span>
              </button>
            </div>

            <button
              onClick={handleDone}
              className="w-full text-sm text-dark-muted hover:text-white transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>

      <div className="card mt-6" style={{ backgroundColor: '#ff0000', padding: '20px', border: '5px solid yellow' }}>
        <h3 className="font-semibold mb-4" style={{ color: 'white', fontSize: '24px' }}>⭐ SHARE BUCKET ⭐</h3>
        <p className="text-sm text-dark-muted mb-4" style={{ color: 'white' }}>
          Share this bucket link with others to invite them to join
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopyBucketLink}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            {copiedToClipboard ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareBucket}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share Link</span>
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
