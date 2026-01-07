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
  // Get the invitation
  const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));

  if (!invitationDoc.exists()) {
    throw new Error('Invitation not found');
  }

  const invitation = invitationDoc.data();

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

  // Check if user is already a participant
  if (bucket.participantIds && bucket.participantIds.includes(userUid)) {
    // User is already a participant, just mark invitation as accepted
    await updateDoc(doc(db, 'invitations', invitationId), {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      acceptedByUid: userUid
    });
    return;
  }

  // Add user to bucket
  const newParticipant = {
    uid: userUid,
    email: userEmail,
    displayName: displayName || undefined,
    addedAt: serverTimestamp()
  };

  // Update bucket with new participant
  const updates: any = {
    [`participants.${userUid}`]: newParticipant,
    participantIds: [...(bucket.participantIds || []), userUid],
    updatedAt: serverTimestamp()
  };

  await updateDoc(bucketRef, updates);

  // Mark invitation as accepted
  await updateDoc(doc(db, 'invitations', invitationId), {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
    acceptedByUid: userUid
  });
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
  const subject = encodeURIComponent(`You've been invited to join "${bucketName}" on SplitThis`);
  const body = encodeURIComponent(
    `Hi!\n\n${inviterName} has invited you to join the expense bucket "${bucketName}" on SplitThis.\n\n` +
    `Click the link below to accept the invitation:\n${invitationLink}\n\n` +
    `SplitThis makes it easy to split expenses and track who owes what.\n\n` +
    `If you don't have an account yet, you'll be able to create one when you accept the invitation.\n\n` +
    `Best regards,\nThe SplitThis Team`
  );

  return `mailto:${email}?subject=${subject}&body=${body}`;
}
