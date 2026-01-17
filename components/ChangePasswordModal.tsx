import React, { useState } from 'react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  isDarkMode: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDarkMode
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const modalBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword) {
      setError('Lengkapi semua field.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengganti password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl border ${modalBg}`}>
        <div className="mb-4">
          <h3 className={`text-lg font-semibold ${textMain}`}>Ganti Password</h3>
          <p className={`text-xs ${textSub}`}>Gunakan password yang kuat dan aman.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="Password sekarang"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-indigo-500 ${inputBg}`}
            required
            autoComplete="current-password"
          />
          <input
            type="password"
            placeholder="Password baru"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-indigo-500 ${inputBg}`}
            required
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Konfirmasi password baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-indigo-500 ${inputBg}`}
            required
            autoComplete="new-password"
          />
          {error && (
            <div className={`rounded-xl px-3 py-2 text-xs ${isDarkMode ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-600'}`}>
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
                isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-70"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
