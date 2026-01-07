import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Bucket, Participant } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useBuckets() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setBuckets([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'buckets'),
      where('participantIds', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bucketsData: Bucket[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            participants: Object.entries(data.participants || {}).reduce(
              (acc, [uid, participant]: [string, any]) => {
                acc[uid] = {
                  ...participant,
                  addedAt: participant.addedAt?.toDate() || new Date(),
                };
                return acc;
              },
              {} as Record<string, Participant>
            ),
          } as Bucket;
        });
        setBuckets(bucketsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching buckets:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  async function createBucket(name: string, currency: string) {
    if (!currentUser) throw new Error('Not authenticated');

    try {
      const participantData: any = {
        uid: currentUser.uid,
        email: currentUser.email!,
        addedAt: serverTimestamp(),
      };

      // Only include displayName if it exists (Firestore doesn't accept undefined)
      if (currentUser.displayName) {
        participantData.displayName = currentUser.displayName;
      }

      await addDoc(collection(db, 'buckets'), {
        name,
        currency,
        participantIds: [currentUser.uid],
        participants: {
          [currentUser.uid]: participantData,
        },
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating bucket:', error);
      throw error;
    }
  }

  async function updateBucket(bucketId: string, updates: Partial<Bucket>) {
    await updateDoc(doc(db, 'buckets', bucketId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteBucket(bucketId: string) {
    await deleteDoc(doc(db, 'buckets', bucketId));
  }

  return { buckets, loading, createBucket, updateBucket, deleteBucket };
}
