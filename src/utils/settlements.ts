import type { Expense, Credit, Settlement, BucketSummary, Bucket } from '../types';

/**
 * Calculate how much each person should pay for an expense based on split config
 */
function calculateExpenseSplits(expense: Expense, participantIds: string[]): Record<string, number> {
  const splits: Record<string, number> = {};

  if (expense.split.type === 'even') {
    const amountPerPerson = expense.amount / participantIds.length;
    participantIds.forEach(uid => {
      splits[uid] = amountPerPerson;
    });
  } else if (expense.split.type === 'percentage' && expense.split.percentages) {
    participantIds.forEach(uid => {
      const percentage = expense.split.percentages![uid] || 0;
      splits[uid] = (expense.amount * percentage) / 100;
    });
  }

  return splits;
}

/**
 * Calculate how much each person should receive from a credit based on split config
 */
function calculateCreditSplits(credit: Credit, participantIds: string[]): Record<string, number> {
  const splits: Record<string, number> = {};

  if (credit.split.type === 'even') {
    const amountPerPerson = credit.amount / participantIds.length;
    participantIds.forEach(uid => {
      splits[uid] = amountPerPerson;
    });
  } else if (credit.split.type === 'percentage' && credit.split.percentages) {
    participantIds.forEach(uid => {
      const percentage = credit.split.percentages![uid] || 0;
      splits[uid] = (credit.amount * percentage) / 100;
    });
  }

  return splits;
}

/**
 * Calculate bucket summary with balances and optimal settlements
 */
export function calculateBucketSummary(
  bucket: Bucket,
  expenses: Expense[],
  credits: Credit[]
): BucketSummary {
  const participantIds = Object.keys(bucket.participants);
  const balances: Record<string, number> = {};

  // Initialize balances to 0
  participantIds.forEach(uid => {
    balances[uid] = 0;
  });

  let totalExpenses = 0;
  let totalCredits = 0;

  // Process expenses
  expenses.forEach(expense => {
    totalExpenses += expense.amount;
    const splits = calculateExpenseSplits(expense, participantIds);

    // The person who paid should receive back their payment
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;

    // Everyone who shares the expense should owe their portion
    Object.entries(splits).forEach(([uid, amount]) => {
      balances[uid] = (balances[uid] || 0) - amount;
    });
  });

  // Process credits (opposite of expenses)
  credits.forEach(credit => {
    totalCredits += credit.amount;
    const splits = calculateCreditSplits(credit, participantIds);

    // The person who received should give back the credit
    balances[credit.receivedBy] = (balances[credit.receivedBy] || 0) - credit.amount;

    // Everyone who shares the credit should receive their portion
    Object.entries(splits).forEach(([uid, amount]) => {
      balances[uid] = (balances[uid] || 0) + amount;
    });
  });

  // Calculate optimal settlements using greedy algorithm
  const settlements = calculateOptimalSettlements(balances);

  return {
    balances,
    settlements,
    totalExpenses,
    totalCredits,
  };
}

/**
 * Calculate optimal settlements to minimize number of transactions
 * Uses greedy algorithm: repeatedly settle largest debtor with largest creditor
 */
function calculateOptimalSettlements(balances: Record<string, number>): Settlement[] {
  const settlements: Settlement[] = [];

  // Create working copy of balances
  const workingBalances = { ...balances };

  // Continue until all balances are settled (within rounding error)
  while (true) {
    // Find person who owes the most (most negative balance)
    let maxDebtor: string | null = null;
    let maxDebt = 0;

    // Find person who is owed the most (most positive balance)
    let maxCreditor: string | null = null;
    let maxCredit = 0;

    Object.entries(workingBalances).forEach(([uid, balance]) => {
      if (balance < -0.01 && Math.abs(balance) > maxDebt) {
        maxDebt = Math.abs(balance);
        maxDebtor = uid;
      }
      if (balance > 0.01 && balance > maxCredit) {
        maxCredit = balance;
        maxCreditor = uid;
      }
    });

    // If no debts remain, we're done
    if (!maxDebtor || !maxCreditor) {
      break;
    }

    // Settle the smaller of the debt or credit
    const settlementAmount = Math.min(maxDebt, maxCredit);

    settlements.push({
      from: maxDebtor,
      to: maxCreditor,
      amount: Math.round(settlementAmount * 100) / 100, // Round to 2 decimals
    });

    // Update working balances
    workingBalances[maxDebtor] = (workingBalances[maxDebtor] || 0) + settlementAmount;
    workingBalances[maxCreditor] = (workingBalances[maxCreditor] || 0) - settlementAmount;
  }

  return settlements;
}
