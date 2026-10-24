import React, { useState } from 'react';
import { authService, convertFileToBase64 } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { X, ShieldCheck, User, UserPlus, Lock, Upload } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      
      {/* স্ক্রিনশটের হুবহু ক্লিন কার্ড ডিজাইন */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-sm p-6 sm:p-8 relative my-auto animate-in zoom-in-95">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{errorMsg}</div>}

        {/* ১. USER লগইন পোর্টাল (হুবহু স্ক্রিনশটের থিম) */}
        {initialMode === 'login' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900">User লগইন পোর্টাল</h3>
              <p className="text-xs text-slate-400">পূর্বের নিবন্ধিত ব্যবহারকারীদের জন্য লগইন পোর্টাল</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">ইউজার ইমেইল / মোবাইল *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="user@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full p-3.5 bg-slate-50/50 border border-slate-300 rounded-2xl font-medium focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">পাসওয়ার্ড *</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full p-3.5 bg-slate-50/50 border border-slate-300 rounded-2xl font-medium focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/30 transition-all cursor-pointer text-xs mt-2"
              >
                {loading ? 'প্রসেসিং...' : 'User হিসেবে লগইন করুন'}
              </button>
            </form>
          </div>
        )}

        {/* ২. ADMIN লগইন পোর্টাল */}
        {initialMode === 'admin' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Admin লগইন পোর্টাল</h3>
              <p className="text-xs text-slate-400">শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত পোর্টাল</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">অ্যাডমিন ইমেইল (Admin Email) *</label>
                <input 
                  type="email" 
                  required 
                  placeholder="admin@lifedrop.org.bd" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full p-3.5 bg-slate-50/50 border border-slate-300 rounded-2xl font-medium focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">পাসওয়ার্ড (Password) *</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full p-3.5 bg-slate-50/50 border border-slate-300 rounded-2xl font-medium focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/30 transition-all cursor-pointer text-xs mt-2 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'প্রসেসিং...' : 'Admin হিসেবে লগইন করুন'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ৩. রক্তদাতা রেজিস্ট্রেশন */}
        {initialMode === 'signup' && (
          <div className="space-y-4">
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <UserPlus className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">রক্তদাতা রেজিস্ট্রেশন</h3>
              <p className="text-xs text-slate-400">গ্যালারির ছবি ও তথ্য দিয়ে যুক্ত হোন</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">পুরো নাম *</label>
                <input type="text" required placeholder="হাবিবুর রহমান" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-3 bg-slate-50/50 border border-slate-300 rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">ইমেইল *</label>
                  <input type="email" required placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-slate-50/50 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">মোবাইল *</label>
                  <input type="text" required placeholder="017XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-slate-50/50 border border-slate-300 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">রক্তের গ্রুপ *</label>
                  <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full p-3 bg-slate-50/50 border border-slate-300 rounded-xl font-bold text-red-600">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">জেলা *</label>
                  <input type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full p-3 bg-slate-50/50 border border-slate-300 rounded-xl" />
                </div>
              </div>

              {/* গ্যালারি ফাইল নির্বাচন */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-slate-700">গ্যালারি ছবি:</span>
                <label className="cursor-pointer px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatarUrl ? 'ছবি নেওয়া হয়েছে ✓' : 'ছবি বেছে নিন'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">পাসওয়ার্ড *</label>
                <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-slate-50/50 border border-slate-300 rounded-xl" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/30 transition-all cursor-pointer">
                {loading ? 'প্রসেসিং...' : 'রেজিস্ট্রেশন সম্পূর্ণ করুন'}
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
};
