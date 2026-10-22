import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { smsOtpService } from '../services/smsOtpService';
import { ShieldCheck, Phone, CheckCircle2, AlertCircle, RefreshCw, X, Sparkles, Copy, Check } from 'lucide-react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  phone: string;
  purpose?: 'donor_registration' | 'emergency_request' | 'phone_verification';
  onVerified: (verifiedPhone: string) => void;
  onClose: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  phone,
  purpose = 'phone_verification',
  onVerified,
  onClose
}) => {
  const { lang } = useLanguage();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(180);
  const [resendCooldown, setResendCooldown] = useState<number>(30);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastSentCode, setLastSentCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send OTP when modal opens
  useEffect(() => {
    if (isOpen && phone) {
      sendNewOtp();
    }
  }, [isOpen, phone]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const sendNewOtp = () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setDigits(['', '', '', '', '', '']);
      const res = smsOtpService.sendOtp(phone, purpose);
      setLastSentCode(res.code);
      setCountdown(180);
      setResendCooldown(30);
      
      // Auto-focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ওটিপি পাঠাতে সমস্যা হয়েছে।';
      setErrorMsg(msg);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto move to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits entered, auto verify
    if (char && index === 5 && newDigits.every(d => d !== '')) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerify = (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setErrorMsg('অনুগ্রহ করে সম্পূর্ণ ৬ ডিজিটের কোডটি লিখুন।');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    setTimeout(() => {
      const res = smsOtpService.verifyOtp(phone, code);
      setIsVerifying(false);

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onVerified(phone);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  const handleAutoFillTest = () => {
    if (lastSentCode) {
      const chars = lastSentCode.split('');
      setDigits(chars);
      handleVerify(lastSentCode);
    }
  };

  const handleCopyCode = () => {
    if (lastSentCode) {
      navigator.clipboard.writeText(lastSentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">মোবাইল নম্বর যাচাইকরণ (OTP)</h3>
              <p className="text-xs text-red-100">LifeDrop নিরাপদ ও তাৎক্ষণিক SMS ভেরিফিকেশন</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold">
              <Phone className="w-3.5 h-3.5" />
              <span>+88 {phone}</span>
            </div>
            <p className="text-sm text-slate-600">
              মোবাইল নম্বর যাচাইয়ের জন্য ৬-সংখ্যার ওটিপি কোড নিচে প্রবেশ করান।
            </p>
          </div>

          {/* Honest Simulation Disclaimer (Requirement 6 & 9) */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>সিমুলেশন মোড (টেস্ট প্রিভিউ)</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              বর্তমানে বাস্তব SMS গেটওয়ে বা Supabase Phone Auth সংযুক্ত না থাকায় স্ক্রিনে টেস্ট কোড প্রদান করা হচ্ছে। বাস্তব গেটওয়ে কনফিগার হলে সরাসরি আপনার ফোনে SMS পৌঁছাবে।
            </p>
          </div>

          {/* Quick Demo Code Banner for instant testing convenience */}
          {lastSentCode && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  টেস্ট ওটিপি: <strong className="font-mono text-sm tracking-wider text-amber-950 font-bold">{lastSentCode}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2 py-1 bg-white border border-amber-200 hover:bg-amber-100 rounded-md text-amber-800 font-medium transition-colors cursor-pointer flex items-center gap-1"
                  title="কোড কপি করুন"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoFillTest}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors cursor-pointer shadow-xs"
                >
                  অটো-ফিল
                </button>
              </div>
            </div>
          )}

          {/* 6 Digit Input Boxes */}
          <div className="flex justify-center gap-2.5 sm:gap-3 py-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-bold font-mono rounded-xl border-2 transition-all outline-hidden ${
                  digit 
                    ? 'border-red-600 bg-red-50/30 text-slate-900' 
                    : 'border-slate-200 bg-slate-50 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100'
                }`}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={isVerifying || digits.some(d => !d)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md shadow-red-200 cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>নম্বর নিশ্চিত ও যাচাই করুন</span>
                </>
              )}
            </button>

            {/* Countdown & Resend */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                মেয়াদ: <strong className={countdown < 30 ? 'text-red-600 font-bold' : 'text-slate-700'}>{formattedTime}</strong>
              </span>
              <button
                type="button"
                onClick={sendNewOtp}
                disabled={resendCooldown > 0}
                className="font-medium text-red-600 hover:text-red-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {resendCooldown > 0 ? `পুনরায় কোড (${resendCooldown} সে.)` : 'পুনরায় কোড পাঠান'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
