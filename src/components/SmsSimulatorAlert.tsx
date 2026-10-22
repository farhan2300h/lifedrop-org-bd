import React, { useState, useEffect } from 'react';
import { smsOtpService, SmsDeliveryAlert } from '../services/smsOtpService';
import { Smartphone, Check, Copy, X } from 'lucide-react';

export const SmsSimulatorAlert: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<SmsDeliveryAlert | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = smsOtpService.onSmsReceived((alert) => {
      setActiveAlert(alert);
      // Auto-hide after 12 seconds
      const timer = setTimeout(() => {
        setActiveAlert(current => (current?.id === alert.id ? null : current));
      }, 12000);
      return () => clearTimeout(timer);
    });
    return unsub;
  }, []);

  const handleCopy = () => {
    if (activeAlert?.code) {
      navigator.clipboard.writeText(activeAlert.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!activeAlert) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-700/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/90 text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block">
                সরাসরি মোবাইল এসএমএস (LifeDrop SMS)
              </span>
              <span className="text-xs text-slate-300 font-mono">
                +88 {activeAlert.phone}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2.5 text-xs text-slate-200 leading-relaxed font-sans bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
          {activeAlert.message}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
          <div className="text-xs">
            <span className="text-slate-400">কোড: </span>
            <strong className="text-sm font-mono tracking-widest text-emerald-400 font-bold">
              {activeAlert.code}
            </strong>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'কপি হয়েছে' : 'কোড কপি'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
