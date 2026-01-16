import React, { useState } from 'react';
import { X, Sun, Moon, LogOut, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleTheme,
  onLogout
}) => {
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!isOpen) return null;

  const modalBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const buttonBase = isDarkMode
    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>

      <div className={`relative w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2rem] border shadow-2xl ${modalBg}`}>
        <div className="p-6 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-lg font-bold ${textMain}`}>Pengaturan</h2>
              <p className={`text-xs ${textSub}`}>Sesuaikan preferensi akun</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1 transition-colors ${textSub} hover:text-slate-300`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={onToggleTheme}
              className={`w-full rounded-2xl px-4 py-4 flex items-center justify-between transition-all ${buttonBase}`}
            >
              <div className="flex items-center gap-3">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                <div className="text-left">
                  <p className="text-sm font-semibold">
                    {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
                  </p>
                  <p className={`text-xs ${textSub}`}>Ganti tampilan aplikasi</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'}`}>
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </button>

            {!confirmLogout ? (
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className={`w-full rounded-2xl px-4 py-4 flex items-center justify-between transition-all ${
                  isDarkMode
                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} />
                  <div className="text-left">
                    <p className="text-sm font-semibold">Keluar</p>
                    <p className={`text-xs ${textSub}`}>Akhiri sesi akun ini</p>
                  </div>
                </div>
              </button>
            ) : (
              <div className={`rounded-2xl p-4 border ${isDarkMode ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`mt-0.5 p-2 rounded-full ${isDarkMode ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-600'}`}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${textMain}`}>Konfirmasi Keluar</p>
                    <p className={`text-xs ${textSub}`}>Yakin ingin keluar dari akun ini?</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmLogout(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${buttonBase}`}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600"
                  >
                    Ya, Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
