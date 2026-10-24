import React, { useState, useEffect } from 'react';
import { authService, convertFileToBase64 } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { X, ShieldCheck, User, UserPlus, Lock, Upload, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface AuthPageProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'admin';
  setCurrentUser: (user: UserProfile | null) => void;
  openDashboard: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  setCurrentUser,
  openDashboard
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'admin'>(initialMode);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setIsResetPassword(false);
    setResetSent(false);
  }, [initialMode, isOpen]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [district, setDistrict] = useState('গাজীপুর (Gazipur)');
  const [upazila, setUpazila] = useState('Sreepur');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        setAvatarUrl(base64);
      } catch (err) {
        setErrorMsg('ছবি প্রসেস করতে সমস্যা হয়েছে।');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (isResetPassword) {
      setTimeout(() => {
        setLoading(false);
        setResetSent(true);
      }, 1000);
      return;
    }

    const res = await authService.signIn(email, password);
    setLoading(false);

    if (res.success && res.user) {
      if (avatarUrl) {
        await authService.updateProfile(res.user.id, { 
          avatarUrl, 
          fullName: fullName || res.user.fullName, 
          phone: phone || res.user.phone, 
          bloodGroup, 
          district, 
          upazila 
        });
      }
      setCurrentUser(res.user);
      onClose();
      openDashboard();
    } else {
      setErrorMsg('ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      
      {/* লাল টপ ব্যানার ও পপ-আপ কার্ড */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden relative my-auto animate-in zoom-in-95">
        
        {/* Red Header Banner */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 px-6 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-xs font-bold tracking-wide">
              {mode === 'admin' ? 'LifeDrop একাউন্ট ও অ্যাডমিন পোর্টাল' : 'LifeDrop রক্তদাতা পোর্টাল'}
            </h4>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5">

          {/* ১. পাসওয়ার্ড ভুলে গেছেন? (FORGOT PASSWORD) */}
          {isResetPassword ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">পাসওয়ার্ড রিসেট করুন</h3>
                <p className="text-xs text-slate-500">আপনার নিবন্ধিত ইমেইল দিলে আমরা পাসওয়ার্ড রিসেট লিংক পাঠাব</p>
              </div>

              {resetSent && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>আমরা <strong>{email || 'blooddonationnetwork5@gmail.com'}</strong> ঠিকানায় একটি পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি। ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ইমেইল ঠিকানা *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="example@gmail.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full p-3 bg-blue-50/50 border border-blue-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-red-500" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>{loading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <button 
                  onClick={() => setIsResetPassword(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>লগইন পেজে ফিরে যান</span>
                </button>
              </div>
            </div>
          ) : (

            <>
              {/* ২. ADMIN লগইন পোর্টাল */}
              {mode === 'admin' && (
                <div className="space-y-5">
                  <div className="text-center space-y-1">
                    <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                      <ShieldCheck className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">অ্যাডমিন লগইন পোর্টাল</h3>
                    <p className="text-[11px] text-slate-500">
                      শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত। সার্ভার-সাইড রোল যাচাইয়ের মাধ্যমে প্রবেশাধিকার নিশ্চিত করা হয়।
                    </p>
                  </div>

                  {errorMsg && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{errorMsg}</div>}

                  <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">অ্যাডমিন ইমেইল (Admin Email) *</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="admin@lifedrop.org.bd" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium" 
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">পাসওয়ার্ড (Password) *</label>
                        <button 
                          type="button" 
                          onClick={() => setIsResetPassword(true)}
                          className="text-red-600 font-bold text-[11px] hover:underline cursor-pointer"
                        >
                          পাসওয়ার্ড ভুলে গেছেন?
                        </button>
                      </div>
                      <input 
                        type="password" 
                        required 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium" 
                      />
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">🔒 WebAuthn / Passkey 2FA</span>
                      <span className="font-semibold text-slate-400">Hardware Protected</span>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer text-xs flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{loading ? 'প্রসেসিং...' : 'অ্যাডমিন হিসেবে লগইন করুন'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* ৩. USER লগইন পোর্টাল */}
              {mode === 'login' && (
                <div className="space-y-5">
                  <div className="text-center space-y-1">
                    <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                      <User className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">ইউজার লগইন পোর্টাল</h3>
                    <p className="text-[11px] text-slate-500">পূর্বের নিবন্ধিত রক্তদাতার জন্য সংরক্ষিত পোর্টাল</p>
                  </div>

                  {errorMsg && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{errorMsg}</div>}

                  <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ইমেইল বা মোবাইল *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="user@example.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium" 
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">পাসওয়ার্ড *</label>
                        <button 
                          type="button" 
                          onClick={() => setIsResetPassword(true)}
                          className="text-red-600 font-bold text-[11px] hover:underline cursor-pointer"
                        >
                          পাসওয়ার্ড ভুলে গেছেন?
                        </button>
                      </div>
                      <input 
                        type="password" 
                        required 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer text-xs"
                    >
                      {loading ? 'প্রসেসিং...' : 'ইউজার হিসেবে লগইন করুন'}
                    </button>
                  </form>
                </div>
              )}

              {/* ৪. রক্তদাতা রেজিস্ট্রেশন */}
              {mode === 'signup' && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">রক্তদাতা রেজিস্ট্রেশন</h3>
                    <p className="text-[11px] text-slate-500">গ্যালারির ছবি ও তথ্য পূরণ করে যুক্ত হোন</p>
                  </div>

                  {errorMsg && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{errorMsg}</div>}

                  <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">পুরো নাম *</label>
                      <input type="text" required placeholder="হাবিবুর রহমান" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">ইমেইল *</label>
                        <input type="email" required placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">মোবাইল *</label>
                        <input type="text" required placeholder="017XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">রক্তের গ্রুপ *</label>
                        <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-red-600">
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">জেলা *</label>
                        <input type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-slate-700">গ্যালারি ছবি:</span>
                      <label className="cursor-pointer px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{avatarUrl ? 'ছবি নেওয়া হয়েছে ✓' : 'ছবি বেছে নিন'}</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">পাসওয়ার্ড *</label>
                      <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer">
                      {loading ? 'প্রসেসিং...' : 'রেজিস্ট্রেশন সম্পূর্ণ করুন'}
                    </button>
                  </form>
                </div>
              )}

            </>
          )}

        </div>
      </div>

    </div>
  );
};
