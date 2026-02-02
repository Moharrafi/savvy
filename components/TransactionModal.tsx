import React, { useState, useEffect, useRef } from 'react';
import { TransactionType } from '../types';
import { X, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, amount: number, type: TransactionType, note: string, date: string) => void;
  type: TransactionType;
  isDarkMode: boolean;
  defaultName?: string;
}

const PRESET_AMOUNTS = [10000, 20000, 50000, 100000];

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSubmit, type, isDarkMode, defaultName }) => {
  const [name, setName] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const getTodayInput = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen) {
      // Reset state
      setName(defaultName || '');
      setDisplayAmount('');
      setAmount(0);
      setNote('');
      setDate(getTodayInput());
      setShowConfirm(false);
      // Focus delay for mobile keyboard animation smoothness
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const updateHeight = () => {
      if (window.visualViewport) {
        const vv = window.visualViewport;
        setViewportHeight(vv.height);
        const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        setKeyboardOffset(offset);
      } else {
        setViewportHeight(window.innerHeight);
        setKeyboardOffset(0);
      }
    };

    updateHeight();
    window.visualViewport?.addEventListener('resize', updateHeight);
    window.addEventListener('resize', updateHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setAmount(0);
      setDisplayAmount('');
      return;
    }
    const numValue = parseInt(value, 10);
    setAmount(numValue);
    setDisplayAmount(numValue.toLocaleString('id-ID'));
  };

  const handlePresetClick = (val: number) => {
    const newAmount = amount + val;
    setAmount(newAmount);
    setDisplayAmount(newAmount.toLocaleString('id-ID'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || amount <= 0 || !date) return;
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    onSubmit(name, amount, type, note, selectedDate.toISOString());
    onClose();
  };

  const isDeposit = type === TransactionType.DEPOSIT;
  const accentColor = isDeposit ? 'text-emerald-500' : 'text-rose-500';
  const buttonClass = isDeposit 
    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' 
    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20';

  // Theme styles
  const modalBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDarkMode ? 'text-white' : 'text-slate-900';
  const iconBg = isDarkMode ? 'bg-slate-800' : 'bg-slate-100';
  const inputBg = isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200';
  const placeholderColor = isDarkMode ? 'placeholder-slate-600' : 'placeholder-slate-400';
  const presetClass = isDarkMode 
    ? 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white' 
    : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 bg-white';
  const confirmBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const confirmText = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const confirmSub = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const confirmAccent = isDeposit ? (isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-500')
    : (isDarkMode ? 'bg-rose-600 hover:bg-rose-500' : 'bg-rose-600 hover:bg-rose-500');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={keyboardOffset > 0 ? { paddingBottom: keyboardOffset } : undefined}
    >
      {/* Lightweight Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Sheet */}
      <div
        className={`relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2rem] border-t shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200 ease-out ${modalBg}`}
        style={viewportHeight ? { maxHeight: Math.max(320, viewportHeight - 24) } : undefined}
      >
        
        {/* Handle Bar for Mobile feel */}
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full opacity-50 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
        
        <div className="p-6 pt-10 pb-10">
          {/* Header Minimalist */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-full ${iconBg} ${accentColor}`}>
                {isDeposit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              </span>
              <span className={`font-medium text-sm tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isDeposit ? 'Uang Masuk' : 'Uang Keluar'}
              </span>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className={`p-1 transition-colors ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Super Clean Hero Input */}
            <div className="text-center space-y-2">
              <div className="relative inline-block w-full">
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold ${amount ? accentColor : (isDarkMode ? 'text-slate-700' : 'text-slate-300')}`}>
                  Rp
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className={`w-full bg-transparent text-center text-5xl font-bold focus:outline-none py-2 px-8 ${textMain} ${isDarkMode ? 'placeholder-slate-800' : 'placeholder-slate-200'}`}
                  required
                />
              </div>
            </div>

            {/* Lightweight Chips */}
            <div className="flex justify-center gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePresetClick(val)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all active:scale-95 ${presetClass}`}
                >
                  +{val / 1000}k
                </button>
              ))}
            </div>

            {/* Compact Form Group */}
            <div className={`rounded-2xl p-1 border ${inputBg}`}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama (Wajib)"
                className={`w-full bg-transparent px-4 py-3.5 focus:outline-none border-b ${textMain} ${placeholderColor} ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-500'
                }`}
                readOnly
                required
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full bg-transparent px-4 py-3.5 focus:outline-none border-b ${textMain} ${placeholderColor} ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-500'
                }`}
                required
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan (Opsional)"
                className={`w-full bg-transparent px-4 py-3.5 focus:outline-none ${textMain} ${placeholderColor}`}
              />
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className={`w-full py-4 rounded-xl flex items-center justify-center font-bold text-white shadow-lg transition-all active:scale-[0.98] ${buttonClass}`}
            >
              <Check size={20} className="mr-2" />
              {isDeposit ? 'Simpan Tabungan' : 'Tarik Dana'}
            </button>
          </form>
        </div>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          ></div>
          <div className={`relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${confirmBg}`}>
            <div className="flex items-center gap-2">
              <span className={`p-2 rounded-full ${iconBg} ${accentColor}`}>
                {isDeposit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              </span>
              <div>
                <h3 className={`text-base font-semibold ${confirmText}`}>Konfirmasi Transaksi</h3>
                <p className={`text-xs ${confirmSub}`}>
                  {isDeposit ? 'Simpan tabungan ini?' : 'Tarik dana ini?'}
                </p>
              </div>
            </div>
            <div className={`mt-4 rounded-xl border p-4 ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${confirmSub}`}>Nama</span>
                <span className={`text-sm font-semibold ${confirmText}`}>{name}</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs ${confirmSub}`}>Tanggal</span>
                <span className={`text-sm ${confirmText}`}>
                  {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs ${confirmSub}`}>Nominal</span>
                <span className={`text-sm font-semibold ${accentColor}`}>
                  {isDeposit ? '+' : '-'} Rp {amount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="mt-3">
                <span className={`text-xs ${confirmSub}`}>Catatan</span>
                <p className={`text-sm mt-1 ${confirmText}`}>{note ? note : '-'}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all ${confirmAccent}`}
              >
                {isDeposit ? 'Ya, Simpan' : 'Ya, Tarik'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
