import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { ArrowRight, Lock, User as UserIcon, Loader2, Sparkles, AtSign } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await authService.login(username, password);
      } else {
        if (!name) throw new Error('Nama harus diisi');
        user = await authService.register(name, username, password);
      }
      onSuccess(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center px-6 py-10 relative overflow-y-auto">
      {/* Ambient Background - Adjusted for mobile */}
      <div className="fixed top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full mx-auto relative z-10 flex flex-col h-full justify-center max-w-sm">
        {/* Header - More vertical space */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Savvy.</h1>
          <p className="text-slate-400 text-sm">Kelola keuanganmu dalam genggaman.</p>
        </div>

        {/* Mobile Form Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl ring-1 ring-white/5">
          {/* Toggle Switch */}
          <div className="flex bg-slate-950/50 p-1.5 rounded-2xl mb-8 border border-slate-800/50 relative">
             <div 
               className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-indigo-600 rounded-xl shadow-lg transition-all duration-300 ease-spring ${isLogin ? 'left-1.5' : 'left-[calc(50%+4.5px)]'}`}
             ></div>
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-colors relative z-10 ${
                isLogin ? 'text-white' : 'text-slate-400'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-colors relative z-10 ${
                !isLogin ? 'text-white' : 'text-slate-400'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400">
                    <UserIcon size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/60 rounded-2xl py-4 pl-14 pr-5 text-base text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-slate-600"
                  required={!isLogin}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="relative group">
               <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400">
                    <AtSign size={20} />
                </div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800/60 rounded-2xl py-4 pl-14 pr-5 text-base text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-slate-600"
                required
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>

            <div className="relative group">
               <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400">
                    <Lock size={20} />
                </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800/60 rounded-2xl py-4 pl-14 pr-5 text-base text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-slate-600"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6 disabled:opacity-70 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Masuk' : 'Buat Akun'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer Area */}
        <div className="mt-8 text-center space-y-4">
             <p className="text-slate-500 text-xs">
              Dengan masuk, kamu menyetujui Syarat & Ketentuan Savvy.
            </p>
        </div>
      </div>
    </div>
  );
};
