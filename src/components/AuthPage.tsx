import React, { useState, useEffect } from 'react';
import { authService, convertFileToBase64, supabase } from '../services/supabaseClient';
import { BloodGroup, UserProfile } from '../types';
import {
  X, ShieldCheck, User, Lock, Upload, ArrowLeft,
  Mail, CheckCircle, HeartPulse
} from 'lucide-react';

interface AuthPageProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'admin';
  setCurrentUser: (user: UserProfile | null) => void;
  openDashboard: () => void;
}
const inputClass = 'w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500';
const groups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const AuthPage: React.FC<AuthPageProps> = ({
  isOpen, onClose, initialMode = 'login', setCurrentUser, openDashboard
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'admin'>(initialMode);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [currentArea, setCurrentArea] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [donorListConsent, setDonorListConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setIsResetPassword(false);
    setResetSent(false);
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('শুধু ছবি নির্বাচন করুন।');
      return;
    }
    if (file.size > 1024 * 1024) {
      setErrorMsg('ছবির সাইজ ১ MB-এর কম রাখুন।');
      return;
    }
    try {
      setAvatarUrl(await convertFileToBase64(file));
      setErrorMsg('');
    } catch {
      setErrorMsg('ছবি প্রসেস করতে সমস্যা হয়েছে।');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (isResetPassword) {
      if (!supabase) {
        setErrorMsg('Supabase কনফিগার করা নেই।');
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) setErrorMsg(error.message);
        else setResetSent(true);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'রিসেট লিংক পাঠানো যায়নি।');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন।');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('দুটি পাসওয়ার্ড মিলছে না।');
        return;
      }
      if (!donorListConsent || !privacyConsent) {
        setErrorMsg('রেজিস্ট্রেশনের জন্য দুটি সম্মতি দিন।');
        return;
      }
      if (lastDonationDate && lastDonationDate > new Date().toISOString().slice(0, 10)) {
        setErrorMsg('ভবিষ্যতের তারিখ দেওয়া যাবে না।');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Supabase Email Auth দিয়ে অ্যাকাউন্ট তৈরির জন্য ইমেইল প্রয়োজন।');
        return;
      }
      setLoading(true);
      try {
        const res = await authService.signUp({
          email, password, fullName, phone, bloodGroup,
          division, district, upazila, currentArea, lastDonationDate,
          isAvailable, avatarUrl, donorListConsent, privacyConsent
        });
        if (!res.success) {
          setErrorMsg(res.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
        } else if (res.user) {
          setCurrentUser(res.user);
          onClose();
          openDashboard();
        } else {
          setSuccessMsg(res.message || 'ইমেইল যাচাই করে লগইন করুন।');
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await authService.signIn(email, password);
      if (res.success && res.user) {
        if (mode === 'admin' && res.user.role !== 'admin') {
          await authService.signOut();
          setErrorMsg('এই অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই।');
          return;
        }
        setCurrentUser(res.user);
        onClose();
        openDashboard();
      } else {
        setErrorMsg(res.message || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string, value: string, setValue: (value: string) => void,
    type = 'text', required = false, placeholder = ''
  ) => (
    <label className="block">
      <span className="block font-bold text-slate-700 mb-1">{label}{required ? ' *' : ''}</span>
      <input type={type} required={required} value={value}
        placeholder={placeholder} onChange={e => setValue(e.target.value)}
        className={inputClass} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className={`bg-white rounded-3xl border border-slate-100 shadow-2xl w-full ${mode === 'signup' && !isResetPassword ? 'max-w-xl' : 'max-w-md'} overflow-hidden relative my-auto animate-in zoom-in-95`}>
        {mode === 'signup' && !isResetPassword ? (
          <div className="relative bg-gradient-to-r from-red-700 via-red-600 to-rose-700 px-6 py-7 text-white text-center">
            <button type="button" onClick={onClose} aria-label="বন্ধ করুন"
              className="absolute right-4 top-4 text-white/90 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-3">
              <HeartPulse className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-xl font-black">রক্তদাতা হিসেবে যুক্ত হোন</h2>
            <p className="text-xs mt-1 text-white/90">LifeDrop Blood Donation Network</p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 px-6 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-bold tracking-wide">
                {mode === 'admin' ? 'LifeDrop একাউন্ট ও অ্যাডমিন পোর্টাল' : 'LifeDrop রক্তদাতা পোর্টাল'}
              </h4>
            </div>
            <button type="button" onClick={onClose} aria-label="বন্ধ করুন" className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="p-5 sm:p-8 space-y-5">
          {errorMsg && <div role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{errorMsg}</div>}
          {successMsg && <div role="status" className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold">{successMsg}</div>}

          {isResetPassword ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">পাসওয়ার্ড রিসেট করুন</h3>
                <p className="text-xs text-slate-500">নিবন্ধিত ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হবে</p>
              </div>
              {resetSent && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> ইমেইল পাঠানোর অনুরোধ সম্পন্ন হয়েছে। ইনবক্স বা স্প্যাম দেখুন।
              </div>}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {field('ইমেইল ঠিকানা', email, setEmail, 'email', true, 'example@gmail.com')}
                <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl disabled:opacity-50">
                  {loading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
                </button>
              </form>
              <button type="button" onClick={() => { setIsResetPassword(false); setResetSent(false); setErrorMsg(''); }}
                className="mx-auto flex items-center gap-1 text-xs font-bold text-slate-600">
                <ArrowLeft className="w-4 h-4" /> লগইন পেজে ফিরে যান
              </button>
            </div>
          ) : mode === 'signup' ? (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <section className="space-y-3">
                <h3 className="text-sm font-black text-red-700 border-b pb-2">👤 ১. ব্যক্তিগত তথ্য</h3>
                {field('পুরো নাম', fullName, setFullName, 'text', true, 'আপনার পুরো নাম')}
                {field('মোবাইল নম্বর', phone, setPhone, 'tel', true, '01XXXXXXXXX')}
                {field('ইমেইল', email, setEmail, 'email', true, 'name@example.com')}
                <p className="text-[11px] text-amber-700">বর্তমান Supabase Email Auth-এ অ্যাকাউন্ট তৈরি করতে ইমেইল প্রয়োজন। তাই আপাতত এটি বাধ্যতামূলক।</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {field('পাসওয়ার্ড', password, setPassword, 'password', true, 'কমপক্ষে ৬ অক্ষর')}
                  {field('পাসওয়ার্ড নিশ্চিতকরণ', confirmPassword, setConfirmPassword, 'password', true, 'আবার লিখুন')}
                </div>
              </section>
              <section className="space-y-3">
                <h3 className="text-sm font-black text-red-700 border-b pb-2">🩸 ২. রক্তের তথ্য</h3>
                <label className="block">
                  <span className="block font-bold text-slate-700 mb-1">রক্তের গ্রুপ *</span>
                  <select required value={bloodGroup} onChange={e => setBloodGroup(e.target.value as BloodGroup)} className={inputClass}>
                    {groups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </label>
                {field('সর্বশেষ রক্তদানের তারিখ (ঐচ্ছিক)', lastDonationDate, setLastDonationDate, 'date')}
                <label className="block">
                  <span className="block font-bold text-slate-700 mb-1">বর্তমানে রক্তদানে আগ্রহী?</span>
                  <select value={isAvailable ? 'yes' : 'no'} onChange={e => setIsAvailable(e.target.value === 'yes')} className={inputClass}>
                    <option value="yes">হ্যাঁ, আগ্রহী</option>
                    <option value="no">না, আপাতত নই</option>
                  </select>
                </label>
              </section>
              <section className="space-y-3">
                <h3 className="text-sm font-black text-red-700 border-b pb-2">📍 ৩. ঠিকানা</h3>
                <label className="block">
                  <span className="block font-bold text-slate-700 mb-1">বিভাগ *</span>
                  <select required value={division} onChange={e => { setDivision(e.target.value); setDistrict(''); setUpazila(''); }} className={inputClass}>
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {['ঢাকা','চট্টগ্রাম','রাজশাহী','খুলনা','বরিশাল','সিলেট','রংপুর','ময়মনসিংহ'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                {field('জেলা', district, setDistrict, 'text', true, 'জেলার নাম')}
                {field('উপজেলা / থানা', upazila, setUpazila, 'text', true, 'উপজেলা বা থানার নাম')}
                {field('বর্তমান এলাকা (ঐচ্ছিক)', currentArea, setCurrentArea, 'text', false, 'গ্রাম / মহল্লা')}
              </section>
              <section className="space-y-3">
                <h3 className="text-sm font-black text-red-700 border-b pb-2">📸 ৪. প্রোফাইল ও সম্মতি</h3>
                <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-700">প্রোফাইল ছবি (ঐচ্ছিক)</span>
                  <label className="cursor-pointer px-3 py-2 bg-red-600 text-white font-bold rounded-lg flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                    {avatarUrl ? 'ছবি নেওয়া হয়েছে ✓' : 'ছবি বেছে নিন'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <label className="flex items-start gap-2 text-slate-700">
                  <input type="checkbox" required checked={donorListConsent} onChange={e => setDonorListConsent(e.target.checked)} className="mt-0.5 accent-red-600" />
                  <span>ডোনার তালিকায় তথ্য প্রকাশের সম্মতি * (মোবাইল নম্বরসহ কোন তথ্য প্রকাশ হবে তা আগে গোপনীয়তা নীতিতে স্পষ্ট করুন)</span>
                </label>
                <label className="flex items-start gap-2 text-slate-700">
                  <input type="checkbox" required checked={privacyConsent} onChange={e => setPrivacyConsent(e.target.checked)} className="mt-0.5 accent-red-600" />
                  <span>গোপনীয়তা নীতি ও শর্তাবলিতে সম্মতি *</span>
                </label>
              </section>
              <button type="submit" disabled={loading || Boolean(successMsg)}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md disabled:opacity-50">
                {loading ? 'রেজিস্ট্রেশন হচ্ছে...' : '🩸 রেজিস্ট্রেশন সম্পন্ন করুন'}
              </button>
              <div className="text-center text-slate-600">
                আগে অ্যাকাউন্ট আছে?{' '}
                <button type="button" onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-red-600 font-bold underline">লগইন করুন</button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className={`w-14 h-14 ${mode === 'admin' ? 'bg-slate-950 text-white' : 'bg-red-100 text-red-600'} rounded-2xl flex items-center justify-center mx-auto shadow-md`}>
                  {mode === 'admin' ? <ShieldCheck className="w-7 h-7 text-red-500" /> : <User className="w-7 h-7" />}
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {mode === 'admin' ? 'অ্যাডমিন লগইন পোর্টাল' : 'ইউজার লগইন পোর্টাল'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {mode === 'admin' ? 'শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত।' : 'পূর্বের নিবন্ধিত রক্তদাতার জন্য সংরক্ষিত পোর্টাল'}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {field(mode === 'admin' ? 'অ্যাডমিন ইমেইল' : 'ইমেইল', email, setEmail, 'email', true, 'name@example.com')}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="font-bold text-slate-700">পাসওয়ার্ড *</label>
                    <button type="button" onClick={() => { setIsResetPassword(true); setErrorMsg(''); }}
                      className="text-red-600 font-bold text-[11px]">পাসওয়ার্ড ভুলে গেছেন?</button>
                  </div>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className={inputClass} />
                </div>
                {mode === 'admin' && (
                  <div className="p-2.5 bg-slate-50 border rounded-xl flex justify-between text-[11px] text-slate-500">
                    <span>🔒 WebAuthn / Passkey 2FA</span>
                    <span>Hardware Protected</span>
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {mode === 'admin' && <Lock className="w-4 h-4" />}
                  {loading ? 'প্রসেসিং...' : mode === 'admin' ? 'অ্যাডমিন হিসেবে লগইন করুন' : 'ইউজার হিসেবে লগইন করুন'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
