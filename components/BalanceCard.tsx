import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface BalanceCardProps {
  transactions: Transaction[];
  totalBalance: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ transactions, totalBalance }) => {
  
  // Calculate chart data
  const chartData = useMemo(() => {
    // Reverse to process chronologically for the graph
    const reversed = [...transactions].reverse();
    let current = 0;
    const data = reversed.map(t => {
      if (t.type === TransactionType.DEPOSIT) current += t.amount;
      else current -= t.amount;
      return {
        date: new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        amount: current
      };
    });
    // Add initial zero point if empty or just to look better
    if (data.length === 0) return [{ date: 'Start', amount: 0 }];
    return data;
  }, [transactions]);

  const totalIn = transactions
    .filter(t => t.type === TransactionType.DEPOSIT)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOut = transactions
    .filter(t => t.type === TransactionType.WITHDRAWAL)
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-500/20 mb-6">
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-400 opacity-10 blur-2xl pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2 opacity-80">
            <Wallet size={18} />
            <span className="text-sm font-medium tracking-wide">Total Tabungan</span>
          </div>
          <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm">
            IDR
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-6">
          Rp {totalBalance.toLocaleString('id-ID')}
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3">
            <div className="flex items-center space-x-1 text-emerald-300 mb-1">
              <TrendingUp size={14} />
              <span className="text-xs font-medium">Pemasukan</span>
            </div>
            <p className="font-semibold text-lg">Rp {totalIn.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3">
            <div className="flex items-center space-x-1 text-rose-300 mb-1">
              <TrendingDown size={14} />
              <span className="text-xs font-medium">Pengeluaran</span>
            </div>
            <p className="font-semibold text-lg">Rp {totalOut.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="h-24 w-full -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip cursor={false} content={<></>} />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#ffffff" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};