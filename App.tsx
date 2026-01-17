import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType, User } from './types';
import { BalanceCard } from './components/BalanceCard';
import { TransactionHistory } from './components/TransactionHistory';
import { TransactionModal } from './components/TransactionModal';
import { AuthScreen } from './components/AuthScreen';
import { SettingsModal } from './components/SettingsModal';
import { NotificationCenter, NotificationItem } from './components/NotificationCenter';
import { authService } from './services/authService';
import { transactionService } from './services/transactionService';
import { Plus, Minus, Bell, Home, History, User as UserIcon, LayoutGrid } from 'lucide-react';
import { sendNotification, requestNotificationPermission } from './services/notificationService';
import { pushService } from './services/pushService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>(TransactionType.DEPOSIT);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tappedTab, setTappedTab] = useState<'home' | 'history' | 'profile' | 'settings' | null>(null);
  const tabTimeoutRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile' | 'settings'>('home');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileLogoutConfirm, setShowProfileLogoutConfirm] = useState(false);
  const [showSettingsLogoutConfirm, setShowSettingsLogoutConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [enableSounds, setEnableSounds] = useState(true);
  const [pushStatus, setPushStatus] = useState<'unknown' | 'enabled' | 'disabled' | 'unsupported'>('unknown');
  const seenIdsRef = useRef<Set<string>>(new Set());
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);
  

  // Initialize Session & Theme
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    const savedTheme = localStorage.getItem('savvy_theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('savvy_theme', newMode ? 'dark' : 'light');
  };

  const handleTabClick = (tab: 'home' | 'history' | 'profile' | 'settings') => {
    setActiveTab(tab);
    setTappedTab(tab);
    if (tabTimeoutRef.current) {
      window.clearTimeout(tabTimeoutRef.current);
    }
    tabTimeoutRef.current = window.setTimeout(() => {
      setTappedTab(null);
    }, 300);
  };

  const pushNotification = (title: string, body: string) => {
    if (!isMuted) {
      sendNotification(title, body);
    }
    setNotificationHistory((prev) => {
      const next = [
        { id: crypto.randomUUID(), title, body, date: new Date().toISOString() },
        ...prev
      ];
      return next.slice(0, 50);
    });
    setUnreadCount((prev) => prev + 1);
  };

  const refreshPushStatus = async () => {
    if (!pushService.isSupported()) {
      setPushStatus('unsupported');
      return;
    }
    const subscription = await pushService.getSubscription().catch(() => null);
    setPushStatus(subscription ? 'enabled' : 'disabled');
  };

  const ensureNotificationPermission = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      setPushStatus('disabled');
    }
    return granted;
  };

  const handleEnablePush = async () => {
    if (!user) return;
    if (!pushService.isSupported()) {
      setPushStatus('unsupported');
      return;
    }
    if (!pushService.isConfigured()) {
      console.warn('VITE_VAPID_PUBLIC_KEY missing. Set it in Vercel.');
      setPushStatus('disabled');
      return;
    }
    const granted = await ensureNotificationPermission();
    if (!granted) return;
    const ok = await pushService.subscribe(user.id).catch((error) => {
      console.error('Push subscribe error', error);
      return false;
    });
    setPushStatus(ok ? 'enabled' : 'disabled');
  };

  useEffect(() => {
    if (!user) return;
    refreshPushStatus().catch((error) => {
      console.error('Push status error', error);
    });
  }, [user]);

  useEffect(() => {
    const savedMuted = localStorage.getItem('savvy_mute_notifications');
    const savedAnimations = localStorage.getItem('savvy_enable_animations');
    const savedSounds = localStorage.getItem('savvy_enable_sounds');
    if (savedMuted !== null) {
      setIsMuted(savedMuted === 'true');
    }
    if (savedAnimations !== null) {
      setEnableAnimations(savedAnimations === 'true');
    }
    if (savedSounds !== null) {
      setEnableSounds(savedSounds === 'true');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (tabTimeoutRef.current) {
        window.clearTimeout(tabTimeoutRef.current);
      }
    };
  }, []);

  // Load Transactions when User changes
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      seenIdsRef.current = new Set();
      return;
    }

    let isMounted = true;
    transactionService
      .listGlobal()
      .then((items) => {
        if (!isMounted) return;
        setTransactions(items);
        seenIdsRef.current = new Set(items.map((t) => t.id));
      })
      .catch((error) => {
        console.error('Failed to load transactions', error);
        if (isMounted) {
          setTransactions([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    let wsBase = import.meta.env.VITE_WS_URL || apiBase.replace(/^http/, 'ws');
    if (window.location.protocol === 'https:' && wsBase.startsWith('ws://')) {
      wsBase = wsBase.replace('ws://', 'wss://');
    }

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsBase);
    } catch (error) {
      console.error('WebSocket init error', error);
      return;
    }

    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message?.type !== 'transaction') return;

        const incoming: Transaction = message.data;
        if (!incoming?.id) return;
        if (seenIdsRef.current.has(incoming.id)) return;

        seenIdsRef.current.add(incoming.id);
        setTransactions((prev) => [incoming, ...prev]);

        if (incoming.userId && incoming.userId === user.id) return;

        const title = incoming.type === TransactionType.DEPOSIT ? 'Tabungan Masuk' : 'Penarikan Dana';
        const amountText = incoming.amount.toLocaleString('id-ID');
        const actor = incoming.contributorName || 'Seseorang';
        const body = incoming.type === TransactionType.DEPOSIT
          ? `${actor} menabung Rp ${amountText}`
          : `${actor} menarik Rp ${amountText}`;
        pushNotification(title, body);
      } catch (error) {
        console.error('WS message error', error);
      }
    });

    socket.addEventListener('error', (error) => {
      console.error('WebSocket error', error);
    });

    return () => {
      socket?.close();
    };
  }, [user]);

  const totalBalance = transactions.reduce((acc, t) => {
    return t.type === TransactionType.DEPOSIT ? acc + t.amount : acc - t.amount;
  }, 0);
  const totalDeposits = transactions.reduce((acc, t) => {
    return t.type === TransactionType.DEPOSIT ? acc + t.amount : acc;
  }, 0);
  const totalWithdrawals = transactions.reduce((acc, t) => {
    return t.type === TransactionType.WITHDRAWAL ? acc + t.amount : acc;
  }, 0);
  const userTransactions = transactions.filter((t) => t.userId === user?.id);
  const userDeposits = userTransactions.reduce((acc, t) => {
    return t.type === TransactionType.DEPOSIT ? acc + t.amount : acc;
  }, 0);
  const userWithdrawals = userTransactions.reduce((acc, t) => {
    return t.type === TransactionType.WITHDRAWAL ? acc + t.amount : acc;
  }, 0);
  const userNet = userDeposits - userWithdrawals;

  const handleAddTransaction = async (name: string, amount: number, type: TransactionType, note: string) => {
    if (!user) return;

    try {
      const newTransaction = await transactionService.create({
        userId: user.id,
        contributorName: name,
        amount,
        type,
        note
      });
      if (!seenIdsRef.current.has(newTransaction.id)) {
        seenIdsRef.current.add(newTransaction.id);
        setTransactions((prev) => [newTransaction, ...prev]);
      }
    } catch (error) {
      console.error('Failed to save transaction', error);
    }
  };

  const confirmLogout = () => {
    authService.logout();
    setUser(null);
    setTransactions([]);
    setIsSettingsOpen(false);
    setIsNotificationsOpen(false);
    setNotificationHistory([]);
    setUnreadCount(0);
    setShowProfileLogoutConfirm(false);
    setShowSettingsLogoutConfirm(false);
  };

  const openModal = (type: TransactionType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  if (!user) {
    return <AuthScreen onSuccess={setUser} />;
  }

  // Dynamic Styles based on Theme
  const bgClass = isDarkMode ? 'bg-slate-950' : 'bg-slate-50';
  const textClass = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const containerClass = isDarkMode ? 'bg-slate-950' : 'bg-slate-50';
  const headerBg = isDarkMode ? 'bg-slate-950' : 'bg-slate-50/90 backdrop-blur-md';
  const iconBtnClass = isDarkMode 
    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400' 
    : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 shadow-sm';
  const bottomGradient = isDarkMode 
    ? 'from-slate-950 via-slate-950' 
    : 'from-slate-50 via-slate-50';

  return (
    <div className={`min-h-screen flex justify-center overflow-hidden transition-colors duration-300 ${bgClass} ${textClass}`}>
      <div className={`w-full max-w-md min-h-screen shadow-2xl relative overflow-y-auto transition-colors duration-300 ${containerClass}`}>
        
        {/* Header */}
        <header className={`p-6 pb-2 pt-8 flex justify-between items-center sticky top-0 z-20 transition-colors duration-300 ${headerBg}`}>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500">
              Savvy.
            </h1>
            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Halo, {user.name.split(' ')[0]}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className={`relative w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90 ${iconBtnClass}`}
              title="Notifikasi"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 pb-32">
          <div
            key={activeTab}
            className={enableAnimations ? 'animate-in fade-in duration-500 ease-out' : ''}
          >
          {activeTab === 'home' && (
            <div className="space-y-6">
              <BalanceCard transactions={transactions} totalBalance={totalBalance} />
              <div className="flex gap-3">
                <button 
                  onClick={() => openModal(TransactionType.WITHDRAWAL)}
                  className={`flex-1 font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                    isDarkMode 
                    ? 'bg-slate-900 text-rose-300 border-slate-800 hover:bg-slate-800' 
                    : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50'
                  }`}
                >
                  <Minus size={16} />
                  Tarik
                </button>
                <button 
                  onClick={() => openModal(TransactionType.DEPOSIT)}
                  className={`flex-[2] font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                    isDarkMode
                    ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500'
                    : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  <Plus size={16} />
                  Nabung
                </button>
              </div>
              <TransactionHistory
                transactions={transactions.slice(0, 5)}
                isDarkMode={isDarkMode}
                title="Aktivitas Terkini"
                showControls={false}
              />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Riwayat Transaksi
              </h2>
              <TransactionHistory transactions={transactions} isDarkMode={isDarkMode} />
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <p className={`text-xs uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Profil</p>
                <h2 className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user.name}</h2>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>@{user.username}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-2xl p-4 border ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Saldo</p>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Rp {totalBalance.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className={`rounded-2xl p-4 border ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Total Transaksi</p>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {transactions.length}
                  </p>
                </div>
                <div className={`rounded-2xl p-4 border ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Pemasukan</p>
                  <p className={`text-lg font-semibold text-emerald-400`}>
                    Rp {totalDeposits.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className={`rounded-2xl p-4 border ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Pengeluaran</p>
                  <p className={`text-lg font-semibold text-rose-400`}>
                    Rp {totalWithdrawals.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Kontribusi Saya</h3>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className={`rounded-2xl p-3 border text-center ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                    <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Masuk</p>
                    <p className="text-sm font-semibold text-emerald-400">
                      Rp {userDeposits.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-3 border text-center ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                    <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Keluar</p>
                    <p className="text-sm font-semibold text-rose-400">
                      Rp {userWithdrawals.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-3 border text-center ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                    <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Net</p>
                    <p className={`text-sm font-semibold ${userNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Rp {Math.abs(userNet).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
          {activeTab === 'settings' && (
            <div className={enableAnimations ? 'space-y-5 animate-in fade-in duration-500 ease-out' : 'space-y-5'}>
              <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Pengaturan</h2>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Kelola tema, notifikasi, keamanan, dan preferensi aplikasi.
                </p>
              </div>

              <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Tampilan</h3>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between text-sm font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'}`}>
                      {isDarkMode ? 'Dark' : 'Light'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !enableAnimations;
                      setEnableAnimations(next);
                      localStorage.setItem('savvy_enable_animations', String(next));
                    }}
                    className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between text-sm font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>Animasi</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${enableAnimations ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900/40 text-slate-400'}`}>
                      {enableAnimations ? 'On' : 'Off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Notifikasi</h3>
                <div className="mt-4 space-y-3">
                  <div className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between text-sm font-semibold ${
                    isDarkMode ? 'bg-slate-950/50 text-slate-300' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <span>Status Push</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      pushStatus === 'enabled'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : pushStatus === 'unsupported'
                          ? 'bg-slate-900/40 text-slate-400'
                          : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {pushStatus === 'enabled'
                        ? 'Aktif'
                        : pushStatus === 'unsupported'
                          ? 'Tidak didukung'
                          : 'Nonaktif'}
                    </span>
                  </div>
                  {pushStatus === 'enabled' && (
                    <div className={`w-full rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isDarkMode ? 'bg-indigo-500/10 text-indigo-200 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}>
                      Agar notifikasi muncul melayang di atas layar, aktifkan izin <span className="font-semibold">Pop‑up/Heads‑up</span> di pengaturan notifikasi aplikasi.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      const granted = await ensureNotificationPermission();
                      if (!granted) {
                        setIsMuted(true);
                        localStorage.setItem('savvy_mute_notifications', 'true');
                      } else {
                        await refreshPushStatus();
                      }
                    }}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Minta Izin Notifikasi
                  </button>
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Aktifkan Push
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isMuted;
                      setIsMuted(next);
                      localStorage.setItem('savvy_mute_notifications', String(next));
                      if (next) {
                        setPushStatus('disabled');
                      }
                    }}
                    className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between text-sm font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>Mute Notifikasi</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${isMuted ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {isMuted ? 'On' : 'Off'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(true)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Lihat Riwayat Notifikasi
                  </button>
                </div>
              </div>

              <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Keamanan</h3>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Ganti Password
                  </button>
                </div>
              </div>

              <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Suara</h3>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !enableSounds;
                      setEnableSounds(next);
                      localStorage.setItem('savvy_enable_sounds', String(next));
                    }}
                    className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between text-sm font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>Suara Notifikasi</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${enableSounds ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900/40 text-slate-400'}`}>
                      {enableSounds ? 'On' : 'Off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Bahasa</h3>
                <div className="mt-4">
                  <button
                    type="button"
                    className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between text-sm font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>Bahasa Indonesia</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'}`}>
                      ID
                    </span>
                  </button>
                </div>
              </div>

              <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Tentang Aplikasi</h3>
                <div className="mt-4 text-xs text-slate-500 space-y-2">
                  <p>Versi: 1.0.0</p>
                  <p>Build: Savvy Tabungan Premium</p>
                  <p>© 2026 Savvy</p>
                </div>
              </div>

              <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Keluar</h3>
                <div className="mt-4 space-y-3">
                  {!showSettingsLogoutConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowSettingsLogoutConfirm(true)}
                      className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                          : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      }`}
                    >
                      Keluar dari Akun
                    </button>
                  ) : (
                    <div className={`rounded-2xl p-4 border ${isDarkMode ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50'}`}>
                      <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Yakin ingin keluar dari akun ini?
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowSettingsLogoutConfirm(false)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                            isDarkMode
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={confirmLogout}
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
          )}
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className={`fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto border-t ${isDarkMode ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-200'} backdrop-blur-md`}>
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={() => handleTabClick('home')}
              className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
                enableAnimations
                  ? 'transition-[transform,color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95'
                  : ''
              } ${
                activeTab === 'home' ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')
              } ${enableAnimations && tappedTab === 'home' ? 'scale-110' : ''}`}
            >
              <Home size={18} />
              Utama
              <span className={`h-1 w-5 rounded-full transition-all ${activeTab === 'home' ? (isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600') : 'bg-transparent'}`}></span>
            </button>
            <button
              onClick={() => handleTabClick('history')}
              className={`flex flex-col items-center gap-1 text-[11px] ${
                enableAnimations
                  ? 'transition-[transform,color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95'
                  : ''
              } ${
                activeTab === 'history' ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')
              } ${enableAnimations && tappedTab === 'history' ? 'scale-110' : ''}`}
            >
              <History size={18} />
              Riwayat
              <span className={`h-1 w-5 rounded-full transition-all ${activeTab === 'history' ? (isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600') : 'bg-transparent'}`}></span>
            </button>
            <button
              onClick={() => handleTabClick('profile')}
              className={`flex flex-col items-center gap-1 text-[11px] ${
                enableAnimations
                  ? 'transition-[transform,color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95'
                  : ''
              } ${
                activeTab === 'profile' ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')
              } ${enableAnimations && tappedTab === 'profile' ? 'scale-110' : ''}`}
            >
              <UserIcon size={18} />
              Saya
              <span className={`h-1 w-5 rounded-full transition-all ${activeTab === 'profile' ? (isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600') : 'bg-transparent'}`}></span>
            </button>
            <button
              onClick={() => handleTabClick('settings')}
              className={`flex flex-col items-center gap-1 text-[11px] ${
                enableAnimations
                  ? 'transition-[transform,color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95'
                  : ''
              } ${
                activeTab === 'settings' ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')
              } ${enableAnimations && tappedTab === 'settings' ? 'scale-110' : ''}`}
            >
              <LayoutGrid size={18} />
              Pengaturan
              <span className={`h-1 w-5 rounded-full transition-all ${activeTab === 'settings' ? (isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600') : 'bg-transparent'}`}></span>
            </button>
          </div>
        </nav>

        {/* Transaction Modal */}
        <TransactionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAddTransaction}
          type={modalType}
          isDarkMode={isDarkMode}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onLogout={confirmLogout}
        />
        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          isDarkMode={isDarkMode}
          notifications={notificationHistory}
          onClearUnread={() => setUnreadCount(0)}
        />

      </div>
    </div>
  );
};

export default App;
