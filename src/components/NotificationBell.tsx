import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { LifeDropNotification } from '../types';
import { 
  Bell, 
  CheckCheck, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ChevronRight, 
  AlertCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface NotificationBellProps {
  onSelectRequest?: (requestId?: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onSelectRequest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<LifeDropNotification[]>(() => notificationService.getNotifications());
  const [unreadCount, setUnreadCount] = useState<number>(() => notificationService.getUnreadCount());
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(() => notificationService.isPushEnabled());

  const dropdownRef = useRef<HTMLDivElement>(null);

  const refresh = () => {
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
  };

  useEffect(() => {
    refresh();
    const unsub = notificationService.subscribe(refresh);
    return unsub;
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Don't mark all as read instantly, give user chance to see, or provide button
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    refresh();
  };

  const handleEnablePush = async () => {
    const granted = await notificationService.requestPushPermission();
    setIsPushEnabled(granted);
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={`relative p-2 rounded-xl transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-600 ${
          isOpen ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="জরুরি নোটিফিকেশন কেন্দ্র"
        aria-label="জরুরি নোটিফিকেশন"
      >
        <Bell className="w-5 h-5" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-black shadow-xs ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              <h3 className="font-bold text-sm">জরুরি রক্তদান নোটিফিকেশন</h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>সব পড়া হয়েছে</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                কোনো নতুন নোটিফিকেশন নেই।
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    notificationService.markAsRead(item.id);
                    if (item.requestId && onSelectRequest) {
                      onSelectRequest(item.requestId);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                    !item.isRead ? 'bg-red-50/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        item.type === 'emergency_blood' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.type === 'emergency_blood' ? (
                          <span className="font-black text-xs">{item.bloodGroup || '🚨'}</span>
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                          {!item.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                        
                        {item.contactPhone && (
                          <div className="pt-1.5 flex items-center gap-2">
                            <a
                              href={`tel:${item.contactPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 border border-emerald-200"
                            >
                              <PhoneCall className="w-3 h-3 text-emerald-600" />
                              <span>কল করুন (+88 {item.contactPhone})</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - Push Notification Option */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">ব্রাউজার পুশ নোটিফিকেশন:</span>
            {!isPushEnabled ? (
              <button
                onClick={handleEnablePush}
                className="text-red-600 font-bold hover:underline cursor-pointer"
              >
                অনুমতি দিন
              </button>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                ✓ সক্রিয় আছে
              </span>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
