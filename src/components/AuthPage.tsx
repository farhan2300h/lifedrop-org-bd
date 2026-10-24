import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { 
  X, Heart, Lock, Mail, Phone, User, MapPin, 
  ShieldCheck, ArrowRight, UserPlus, LogIn, KeyRound
} from 'lucide-react';

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
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup' | 'admin'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [district, setDistrict] = useState('ঢাকা (Dhaka)');
  const [upazila, setUpazila] = useState('Dhanmondi');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (mode === 'signup') {
      const res = await authService.signIn(email, password);
      setLoading(false);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        onClose();
        openDashboard();
      } else {
        setErrorMsg('রেজিস্ট্রেশন সম্পন্ন করা যায়নি। পুনরায় চেষ্টা করুন।');
      }
    } else {
      const res = await authService.signIn(email, password);
      setLoading(false);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        onClose();
        openDashboard();
      } else {
        setErrorMsg('ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs overflow-y-auto">
      
      {/* ----------------- ১. রেজিস্ট্রেশন (SIGNUP) ----------------- */}
      {mode === 'signup' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700">
            <X className="w-5 h-5" />
          </button>

          {/* Left Banner */}
          <div className="w-full md:w-5/12 bg-linear-to-br from-red-700 via-red-800 to-rose-900 p-8 text-white flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white text-red-600 flex items-center justify-center font-bold">
                  <Heart className="w-5 h-5 fill-red-600" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-none">LifeDrop</h3>
                  <p className="text-[10px] text-red-200">রক্তদান নেটওয়ার্ক বাংলাদেশ</p>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                <h2 className="text-xl font-bold leading-tight">"রক্তের বন্ধনে যুক্ত হোক প্রতিটি নিঃশ্বাস"</h2>
                <p className="text-xs text-red-100 leading-relaxed">
                  একটি অ্যাকাউন্ট তৈরি করে খুব সহজেই জীবনরক্ষাকারী রক্তদান নেটওয়ার্কে যুক্ত হোন।
                </p>
              </div>
            </div>

            <div className="text-[11px] text-red-200 border-t border-red-600/50 pt-4">
              🔒 Supabase ক্লাউড সেকিউরিটি দ্বারা সুরক্ষিত
            </div>
          </div>

          {/* Right Clean Signup Form */}
          <div className="w-full md:w-7/12 p-6 sm:p-8 space-y-5">
            <div className="border-b pb-3">
              <h3 className="text-lg font-bold text-red-600">নতুন রেজিস্ট্রেশন (Sign Up)</h3>
            </div>

            {errorMsg && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">পুরো নাম (Full Name) *</label>
                <input type="text" required placeholder="যেমন: তানভীর আহমেদ" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ইমেইল ঠিকানা *</label>
                  <input type="email" required placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input type="text" required placeholder="017XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *</label>
                <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer">
                {loading ? 'প্রসেসিং...' : 'অ্যাকাউন্ট তৈরি করুন (Complete Registration)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- ২. ইউজার লগইন (USER LOGIN) ----------------- */}
      {mode === 'login' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <User className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">ইউজার লগইন পোর্টাল</h3>
            <p className="text-xs text-slate-500">পূর্বের নিবন্ধিত ব্যবহারকারীদের জন্য সংরক্ষিত পোর্টাল</p>
          </div>

          {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ইউজার ইমেইল / মোবাইল *</label>
              <input type="text" required placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-medium" />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">পাসওয়ার্ড *</label>
              <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-medium" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-xs">
              {loading ? 'প্রসেসিং...' : 'ইউজার হিসেবে লগইন করুন'}
            </button>
          </form>
        </div>
      )}

      {/* ----------------- ৩. অ্যাডমিন লগইন (ADMIN LOGIN) ----------------- */}
      {mode === 'admin' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900">অ্যাডমিন লগইন পোর্টাল</h3>
            <p className="text-xs text-slate-500">শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত। সার্ভার-সাইড রোল যাচাইয়ের মাধ্যমে প্রবেশাধিকার নিশ্চিত করা হয়।</p>
          </div>

          {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">অ্যাডমিন ইমেইল (Admin Email) *</label>
              <input type="email" required placeholder="admin@lifedrop.org.bd" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-medium" />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">পাসওয়ার্ড (Password) *</label>
              <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-medium" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-xs flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              <span>{loading ? 'প্রসেসিং...' : 'অ্যাডমিন হিসেবে লগইন করুন'}</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
