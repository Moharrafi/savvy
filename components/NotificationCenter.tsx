import React, { useEffect } from 'react';
import { X, Bell } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  notifications: NotificationItem[];
  onClearUnread: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  notifications,
  onClearUnread
}) => {
  useEffect(() => {
    if (isOpen) {
      onClearUnread();
    }
  }, [isOpen, onClearUnread]);

  if (!isOpen) return null;

  const modalBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSub = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>

      <div className={`relative w-full max-w-md rounded-[2rem] border shadow-2xl ${modalBg}`}>
        <div className="p-6 pt-8">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <h2 className={`text-xl font-bold tracking-tight ${textMain}`}>Notifikasi</h2>
              <p className={`text-xs ${textSub}`}>Aktivitas tabungan bersama</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1 transition-colors ${textSub} hover:text-slate-300`}
            >
              <X size={20} />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className={`rounded-2xl border p-6 text-center ${cardBg}`}>
              <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500'}`}>
                <Bell size={18} />
              </div>
              <p className={`text-sm font-semibold ${textMain}`}>Belum ada notifikasi</p>
              <p className={`text-xs ${textSub}`}>Aktivitas baru akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {notifications.map((item) => (
                <div key={item.id} className={`rounded-2xl border p-4 ${cardBg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-9 w-1.5 rounded-full ${isDarkMode ? 'bg-indigo-500/70' : 'bg-indigo-500/80'}`}></div>
                      <div>
                        <p className={`text-sm font-semibold ${textMain}`}>{item.title}</p>
                        <p className={`text-xs mt-1 ${textSub}`}>{item.body}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] whitespace-nowrap ${textSub}`}>
                      {new Date(item.date).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
