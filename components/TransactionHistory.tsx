import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowDownLeft, ArrowUpRight, Search, Calendar, Filter, X, Trash2, ArrowUpDown } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  isDarkMode: boolean;
  title?: string;
  showControls?: boolean;
}

type SortOrder = 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC';

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isDarkMode,
  title = 'Riwayat Transaksi',
  showControls = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DATE_DESC');

  // Styles based on theme
  const cardBg = isDarkMode ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200';
  const textMain = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const textSub = isDarkMode ? 'text-slate-500' : 'text-slate-500';
  const inputBg = isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const filterPanelBg = isDarkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-200';

  const filteredAndSortedTransactions = useMemo(() => {
    // 1. Filter
    const filtered = transactions.filter((t) => {
      // Search Logic
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        t.contributorName.toLowerCase().includes(query) ||
        (t.note && t.note.toLowerCase().includes(query));

      // Type Logic
      const matchesType = filterType === 'ALL' || t.type === filterType;

      // Date Logic
      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && new Date(t.date) >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(t.date) <= end;
      }

      return matchesSearch && matchesType && matchesDate;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'DATE_ASC':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'DATE_DESC':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'AMOUNT_ASC':
          return a.amount - b.amount;
        case 'AMOUNT_DESC':
          return b.amount - a.amount;
        default:
          return 0;
      }
    });
  }, [transactions, searchQuery, filterType, startDate, endDate, sortOrder]);

  const activeFiltersCount = (filterType !== 'ALL' ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);
  const isSortActive = sortOrder !== 'DATE_DESC';

  const resetFilters = () => {
    setFilterType('ALL');
    setStartDate('');
    setEndDate('');
    setSortOrder('DATE_DESC');
  };

  const SortButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
        active
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
          : isDarkMode 
            ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200' 
            : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between px-1">
        <h2 className={`text-lg font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{title}</h2>
        <span className="text-xs text-slate-500">{filteredAndSortedTransactions.length} Transaksi</span>
      </div>

      {showControls && (
        <>
          {/* Search and Filter Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari nama atau catatan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition-colors ${inputBg}`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 rounded-xl border flex items-center justify-center transition-all ${
                showFilters || activeFiltersCount > 0 || isSortActive
                  ? 'bg-indigo-600 border-indigo-500 text-white' 
                  : isDarkMode 
                    ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300'
              }`}
            >
              <Filter size={18} />
              {(activeFiltersCount > 0) && (
                <span className="ml-1 text-xs font-bold bg-white text-indigo-600 rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filter & Sort Section */}
          {showFilters && (
            <div className={`rounded-xl p-4 space-y-5 animate-in slide-in-from-top-2 fade-in duration-200 border ${filterPanelBg}`}>
          
          {/* Sort Section */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <ArrowUpDown size={12} />
              <label className="text-xs font-medium uppercase tracking-wider">Urutkan</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SortButton 
                active={sortOrder === 'DATE_DESC'} 
                label="Terbaru" 
                onClick={() => setSortOrder('DATE_DESC')} 
              />
              <SortButton 
                active={sortOrder === 'DATE_ASC'} 
                label="Terlama" 
                onClick={() => setSortOrder('DATE_ASC')} 
              />
              <SortButton 
                active={sortOrder === 'AMOUNT_DESC'} 
                label="Nominal Tertinggi" 
                onClick={() => setSortOrder('AMOUNT_DESC')} 
              />
              <SortButton 
                active={sortOrder === 'AMOUNT_ASC'} 
                label="Nominal Terendah" 
                onClick={() => setSortOrder('AMOUNT_ASC')} 
              />
            </div>
          </div>

          <div className={`h-px ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}></div>

          {/* Filter Section */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block uppercase tracking-wider">Tipe Transaksi</label>
            <div className={`flex p-1 rounded-lg ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
              {(['ALL', TransactionType.DEPOSIT, TransactionType.WITHDRAWAL] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                    filterType === type 
                      ? isDarkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {type === 'ALL' ? 'Semua' : type === TransactionType.DEPOSIT ? 'Masuk' : 'Keluar'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block uppercase tracking-wider">Rentang Tanggal</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 ml-1">Dari</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 border ${
                    isDarkMode 
                      ? 'bg-slate-900/50 border-slate-700 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 ml-1">Sampai</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 border ${
                    isDarkMode 
                      ? 'bg-slate-900/50 border-slate-700 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className={`flex justify-end pt-2 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
             <button 
              onClick={resetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center"
            >
              <Trash2 size={12} className="mr-1" /> Reset Filter & Sort
            </button>
          </div>
            </div>
          )}
        </>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredAndSortedTransactions.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
              <Search size={24} className={isDarkMode ? 'text-slate-400' : 'text-slate-400'} />
            </div>
            <p className={`text-sm ${textSub}`}>Tidak ada transaksi yang cocok.</p>
          </div>
        ) : (
          filteredAndSortedTransactions.map((t) => (
            <div 
              key={t.id} 
              className={`backdrop-blur-sm border rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.99] ${cardBg}`}
            >
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${
                  t.type === TransactionType.DEPOSIT 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {t.type === TransactionType.DEPOSIT ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className={`font-semibold truncate ${textMain}`}>{t.contributorName}</p>
                    {t.note && <span className="text-xs text-slate-500 truncate max-w-[90px] sm:max-w-[140px]">({t.note})</span>}
                  </div>
                  <div className="flex items-center text-xs text-slate-400 mt-1">
                    <Calendar size={10} className="mr-1" />
                    {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className={`font-bold text-sm sm:text-base whitespace-nowrap text-right shrink-0 ${
                 t.type === TransactionType.DEPOSIT ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {t.type === TransactionType.DEPOSIT ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
