import React, { useState, useEffect, useRef } from 'react';
import { TransactionType } from '../types';
import { X, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, amount: number, type: TransactionType, note: string) => void;
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
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state
      setName(defaultName || '');
      setDisplayAmount('');
      setAmount(0);
      setNote('');
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
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
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
    if (!name || amount <= 0) return;
    onSubmit(name, amount, type, note);
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Lightweight Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Sheet */}
      <div
        className={`relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2rem] border-t shadow-2xl transform transition-all animate-in slide-in-from-bottom duration-300 ${modalBg}`}
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
    </div>
  );
};
