import React from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';

interface AiInsightProps {
  insight: string;
  loading: boolean;
  onRefresh: () => void;
}

export const AiInsight: React.FC<AiInsightProps> = ({ insight, loading, onRefresh }) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-4 mb-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2 text-indigo-300">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">AI Financial Insight</span>
          </div>
          <button 
            onClick={onRefresh} 
            disabled={loading}
            className={`text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCcw size={14} />
          </button>
        </div>
        
        <p className="text-slate-300 text-sm leading-relaxed">
          {loading ? "Sedang menganalisis transaksi kamu..." : insight}
        </p>
      </div>
    </div>
  );
};