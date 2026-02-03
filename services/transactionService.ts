import { Transaction, TransactionType } from '../types';

const envUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
const API_BASE = envUrl.endsWith('/') ? envUrl.slice(0, envUrl.length - 1) : envUrl;
console.log('Transaction API_BASE:', API_BASE);

type CreateTransactionInput = {
  userId: string;
  contributorName: string;
  amount: number;
  type: TransactionType;
  note?: string;
  date?: string;
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  return response.json() as Promise<T>;
};

export const transactionService = {
  list: async (userId: string): Promise<Transaction[]> => {
    return request<Transaction[]>(`/api/transactions?userId=${encodeURIComponent(userId)}`);
  },
  listGlobal: async (): Promise<Transaction[]> => {
    return request<Transaction[]>('/api/transactions/all');
  },
  create: async (input: CreateTransactionInput): Promise<Transaction> => {
    return request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }
};
