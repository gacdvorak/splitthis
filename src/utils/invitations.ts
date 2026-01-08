import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Invitation, Bucket } from '../types';

/**
 * Generate a random invitation token
 */
export function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create an invitation for a user to join a bucket
 */
export async function createInvitation(
  bucketId: string,
  bucketName: string,
  email: string,
  invitedByUid: string,
  invitedByEmail: string
): Promise<{ invitationId: string; token: string }> {
  // Check if there's already a pending invitation for this email and bucket
  const existingInvitationsQuery = query(
    collection(db, 'invitations'),
    where('bucketId', '==', bucketId),
    where('email', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  );

  const existingInvitations = await getDocs(existingInvitationsQuery);

  if (!existingInvitations.empty) {
    // Return the existing invitation
    const existingInvitation = existingInvitations.docs[0];
    const data = existingInvitation.data();
    return {
      invitationId: existingInvitation.id,
      token: data.token
    };
  }

  // Create expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const token = generateInvitationToken();

  const invitationData = {
    bucketId,
    bucketName,
    email: email.toLowerCase(),
    invitedBy: invitedByUid,
    invitedByEmail,
    token,
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt: expiresAt
  };

  const docRef = await addDoc(collection(db, 'invitations'), invitationData);

  return {
    invitationId: docRef.id,
    token
  };
}

/**
 * Get invitation by email for a specific bucket
 */
export async function getInvitationByEmail(bucketId: string, email: string): Promise<{ id: string; data: Invitation } | null> {
  const invitationsQuery = query(
    collection(db, 'invitations'),
    where('bucketId', '==', bucketId),
    where('email', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  );

  const querySnapshot = await getDocs(invitationsQuery);

  if (querySnapshot.empty) {
    return null;
  }

  const invitationDoc = querySnapshot.docs[0];
  const data = invitationDoc.data();

  // Check if invitation has expired
  const expiresAt = data.expiresAt?.toDate();
  if (expiresAt && expiresAt < new Date()) {
    // Mark as expired
    await updateDoc(doc(db, 'invitations', invitationDoc.id), {
      status: 'expired'
    });
    return null;
  }

  return {
    id: invitationDoc.id,
    data: {
      id: invitationDoc.id,
      bucketId: data.bucketId,
      bucketName: data.bucketName,
      email: data.email,
      invitedBy: data.invitedBy,
      invitedByEmail: data.invitedByEmail,
      token: data.token,
      status: data.status,
      createdAt: data.createdAt?.toDate(),
      expiresAt: data.expiresAt?.toDate(),
      acceptedAt: data.acceptedAt?.toDate(),
      acceptedByUid: data.acceptedByUid
    }
  };
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string): Promise<{ id: string; data: Invitation } | null> {
  const invitationsQuery = query(
    collection(db, 'invitations'),
    where('token', '==', token),
    where('status', '==', 'pending')
  );

  const querySnapshot = await getDocs(invitationsQuery);

  if (querySnapshot.empty) {
    return null;
  }

  const invitationDoc = querySnapshot.docs[0];
  const data = invitationDoc.data();

  // Check if invitation has expired
  const expiresAt = data.expiresAt?.toDate();
  if (expiresAt && expiresAt < new Date()) {
    // Mark as expired
    await updateDoc(doc(db, 'invitations', invitationDoc.id), {
      status: 'expired'
    });
    return null;
  }

  return {
    id: invitationDoc.id,
    data: {
      id: invitationDoc.id,
      bucketId: data.bucketId,
      bucketName: data.bucketName,
      email: data.email,
      invitedBy: data.invitedBy,
      invitedByEmail: data.invitedByEmail,
      token: data.token,
      status: data.status,
      createdAt: data.createdAt?.toDate(),
      expiresAt: data.expiresAt?.toDate(),
      acceptedAt: data.acceptedAt?.toDate(),
      acceptedByUid: data.acceptedByUid
    }
  };
}

/**
 * Accept an invitation and add the user to the bucket
 */
export async function acceptInvitation(
  invitationId: string,
  userUid: string,
  userEmail: string,
  displayName?: string
): Promise<void> {
  console.log('[acceptInvitation] Starting:', { invitationId, userUid, userEmail });

  // Get the invitation
  const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));

  if (!invitationDoc.exists()) {
    throw new Error('Invitation not found');
  }

  const invitation = invitationDoc.data();
  console.log('[acceptInvitation] Invitation data:', invitation);

  if (invitation.status !== 'pending') {
    throw new Error('Invitation is no longer valid');
  }

  // Check if invitation has expired
  const expiresAt = invitation.expiresAt?.toDate();
  if (expiresAt && expiresAt < new Date()) {
    await updateDoc(doc(db, 'invitations', invitationId), {
      status: 'expired'
    });
    throw new Error('Invitation has expired');
  }

  // Get the bucket
  const bucketRef = doc(db, 'buckets', invitation.bucketId);
  const bucketDoc = await getDoc(bucketRef);

  if (!bucketDoc.exists()) {
    throw new Error('Bucket not found');
  }

  const bucket = bucketDoc.data() as Bucket;
  console.log('[acceptInvitation] Bucket data:', {
    id: invitation.bucketId,
    participantIds: bucket.participantIds,
    participants: Object.keys(bucket.participants || {})
  });

  // Check if user is already a participant
  if (bucket.participantIds && bucket.participantIds.includes(userUid)) {
    console.log('[acceptInvitation] User already a participant, marking invitation as accepted');
    // User is already a participant, just mark invitation as accepted
    await updateDoc(doc(db, 'invitations', invitationId), {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      acceptedByUid: userUid
    });
    return;
  }

  // Add user to bucket
  const newParticipant: any = {
    uid: userUid,
    email: userEmail,
    addedAt: serverTimestamp()
  };

  // Only add displayName if it exists (Firestore doesn't allow undefined values)
  if (displayName) {
    newParticipant.displayName = displayName;
  }

  // Update bucket with new participant
  const updates: any = {
    [`participants.${userUid}`]: newParticipant,
    participantIds: [...(bucket.participantIds || []), userUid],
    updatedAt: serverTimestamp()
  };

  console.log('[acceptInvitation] Updating bucket with:', updates);

  try {
    await updateDoc(bucketRef, updates);
    console.log('[acceptInvitation] Bucket updated successfully');
  } catch (err) {
    console.error('[acceptInvitation] Failed to update bucket:', err);
    throw err;
  }

  // Mark invitation as accepted
  console.log('[acceptInvitation] Marking invitation as accepted');
  try {
    await updateDoc(doc(db, 'invitations', invitationId), {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      acceptedByUid: userUid
    });
    console.log('[acceptInvitation] Invitation marked as accepted');
  } catch (err) {
    console.error('[acceptInvitation] Failed to update invitation:', err);
    throw err;
  }
}

/**
 * Generate invitation link
 */
export function generateInvitationLink(token: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/invite/${token}`;
}

/**
 * Generate mailto link for sending invitation email
 */
export function generateInvitationEmailLink(
  email: string,
  inviterName: string,
  bucketName: string,
  invitationLink: string
): string {
  const subject = encodeURIComponent(`You've been added to the expenses bucket "${bucketName}"`);
  const body = encodeURIComponent(
    `You've been added to the expenses bucket "${bucketName}". Access the bucket at ${invitationLink}\n\n` +
    `${inviterName} added you to this bucket on SplitThis.\n\n` +
    `Click the link above to view the bucket and start tracking expenses together.\n\n` +
    `If you don't have an account yet, you'll be able to create one when you access the bucket.\n\n` +
    `Best regards,\nThe SplitThis Team`
  );

  return `mailto:${email}?subject=${subject}&body=${body}`;
}
