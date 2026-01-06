export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface Participant {
  uid: string;
  email: string;
  displayName?: string;
  addedAt: Date;
}

export interface SplitConfig {
  type: 'even' | 'percentage';
  percentages?: Record<string, number>; // uid -> percentage (0-100)
}

export interface Expense {
  id: string;
  bucketId: string;
  title: string;
  amount: number;
  paidBy: string; // uid of the person who paid
  split: SplitConfig;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Credit {
  id: string;
  bucketId: string;
  title: string;
  amount: number;
  receivedBy: string; // uid of the person who received
  split: SplitConfig;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Bucket {
  id: string;
  name: string;
  currency: string;
  participants: Record<string, Participant>; // uid -> Participant
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settlement {
  from: string; // uid
  to: string; // uid
  amount: number;
}

export interface BucketSummary {
  balances: Record<string, number>; // uid -> balance (positive = owed to them, negative = they owe)
  settlements: Settlement[];
  totalExpenses: number;
  totalCredits: number;
}
