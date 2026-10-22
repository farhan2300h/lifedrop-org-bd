import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { LifeDropNotification } from '../types';
import { AlertCircle, PhoneCall, X, Siren, ArrowRight, BellRing } from 'lucide-react';

interface EmergencyAlertBannerProps {
  onViewRequest?: (requestId?: string) => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({ onViewRequest }) => {
  const [activeAlert, setActiveAlert] = useState<LifeDropNotification | null>(null);

  useEffect(() => {
    const unsub = notificationService.onUrgentAlert((notif) => {
      setActiveAlert(notif);
      // Auto dismiss after 20 seconds if user doesn't dismiss
      const timer = setTimeout(() => {
        setActiveAlert(curr => (curr?.id === notif.id ? null : curr));
      }, 20000);
      return () => clearTimeout(timer);
    });
    return unsub;
  }, []);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 py-2 animate-in slide-in-from-top duration-300 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-4 shadow-2xl border-2 border-white/30 backdrop-blur-md pointer-events-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Left info */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center font-black shadow-lg">
                <Siren className="w-6 h-6 animate-bounce text-red-600" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-400"></span>
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-red-950 text-xs font-black uppercase tracking-wider">
                  🚨 জরুরি রক্তের অ্যালার্ট
                </span>
                {activeAlert.bloodGroup && (
                  <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white text-xs font-bold">
                    রক্তের গ্রুপ: {activeAlert.bloodGroup}
                  </span>
                )}
                {activeAlert.urgency === 'immediate' && (
                  <span className="text-[11px] bg-red-900/60 text-red-200 px-2 py-0.5 rounded-md font-medium">
                    তাত্ক্ষণিক প্রয়োজন
                  </span>
                )}
              </div>
              
              <h4 className="font-bold text-sm sm:text-base text-white">
                {activeAlert.patientName ? `রোগী: ${activeAlert.patientName}` : activeAlert.title}
              </h4>
              <p className="text-xs text-red-100 line-clamp-1">
                {activeAlert.hospital ? `${activeAlert.hospital}, ${activeAlert.district || ''}` : activeAlert.message}
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0">
            {activeAlert.contactPhone && (
              <a
                href={`tel:${activeAlert.contactPhone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-red-700 hover:bg-red-50 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 fill-red-600 text-red-600" />
                <span>সরাসরি কল (+88 {activeAlert.contactPhone})</span>
              </a>
            )}

            {onViewRequest && (
              <button
                onClick={() => {
                  onViewRequest(activeAlert.requestId);
                  setActiveAlert(null);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 bg-red-900/40 hover:bg-red-900/60 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-white/20"
              >
                <span>অনুরোধ দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setActiveAlert(null)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
