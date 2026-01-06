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
import type { Credit } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useCredits(bucketId: string | undefined) {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!bucketId || !currentUser) {
      setCredits([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'credits'),
      where('bucketId', '==', bucketId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const creditsData: Credit[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Credit;
      });
      setCredits(creditsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [bucketId, currentUser]);

  async function createCredit(credit: Omit<Credit, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
    if (!currentUser) throw new Error('Not authenticated');

    await addDoc(collection(db, 'credits'), {
      ...credit,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function updateCredit(creditId: string, updates: Partial<Credit>) {
    await updateDoc(doc(db, 'credits', creditId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteCredit(creditId: string) {
    await deleteDoc(doc(db, 'credits', creditId));
  }

  return { credits, loading, createCredit, updateCredit, deleteCredit };
}
