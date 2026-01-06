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
import type { Expense } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useExpenses(bucketId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!bucketId || !currentUser) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'expenses'),
      where('bucketId', '==', bucketId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData: Expense[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Expense;
      });
      setExpenses(expensesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [bucketId, currentUser]);

  async function createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
    if (!currentUser) throw new Error('Not authenticated');

    await addDoc(collection(db, 'expenses'), {
      ...expense,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function updateExpense(expenseId: string, updates: Partial<Expense>) {
    await updateDoc(doc(db, 'expenses', expenseId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteExpense(expenseId: string) {
    await deleteDoc(doc(db, 'expenses', expenseId));
  }

  return { expenses, loading, createExpense, updateExpense, deleteExpense };
}
