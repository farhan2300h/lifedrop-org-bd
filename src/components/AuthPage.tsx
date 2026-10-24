import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { X, Heart, Lock, User, ShieldCheck, UserPlus } from 'lucide-react';

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

    const res = await authService.signIn(email, password);
    setLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      onClose();
      openDashboard();
    } else {
      setErrorMsg('ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs overflow-y-auto">
      
      {/* ১) রক্তদাতা রেজিস্ট্রেশন ফর্ম */}
      {initialMode === 'signup' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl p-6 sm:p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2 mb-6 border-b pb-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">রক্তদাতা রেজিস্ট্রেশন (Sign Up)</h3>
            <p className="text-xs text-slate-500">আপনার তথ্য দিয়ে রক্তদাতা হিসেবে যুক্ত হোন</p>
          </div>

          {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">পুরো নাম *</label>
              <input type="text" required placeholder="তানভীর আহমেদ" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
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
              <label className="block font-bold text-slate-700 mb-1">পাসওয়ার্ড *</label>
              <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer">
              {loading ? 'প্রসেসিং...' : 'অ্যাকাউন্ট তৈরি করুন'}
            </button>
          </form>
        </div>
      )}

      {/* ২) USER লগইন পোর্টাল */}
      {initialMode === 'login' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <User className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">User লগইন পোর্টাল</h3>
            <p className="text-xs text-slate-500">পূর্বের নিবন্ধিত ব্যবহারকারীদের জন্য লগইন পোর্টাল</p>
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
              {loading ? 'প্রসেসিং...' : 'User হিসেবে লগইন করুন'}
            </button>
          </form>
        </div>
      )}

      {/* ৩) ADMIN লগইন পোর্টাল */}
      {initialMode === 'admin' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Admin লগইন পোর্টাল</h3>
            <p className="text-xs text-slate-500">শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত পোর্টাল</p>
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
              <span>{loading ? 'প্রসেসিং...' : 'Admin হিসেবে লগইন করুন'}</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
