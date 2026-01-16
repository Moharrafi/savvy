export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL'
}

export interface Transaction {
  id: string;
  userId?: string;
  contributorName: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO String
  note?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
}

export interface SavingsSummary {
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
}
