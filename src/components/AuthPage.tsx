import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ActivePage, BloodGroup, Gender, UserProfile } from '../types';
import { authService, getSupabaseConfig } from '../services/supabaseClient';
import { bloodService } from '../services/bloodService';
import { BANGLADESH_DIVISIONS } from '../data/bangladeshGeo';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Droplet, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  HeartHandshake, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  Shield, 
  Database,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup' | 'forgot';
  setActivePage: (page: ActivePage) => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signup',
  setActivePage,
  onAuthSuccess
}) => {
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);
  
  // Login State
  const [loginRoleTab, setLoginRoleTab] = useState<'admin' | 'user'>('user');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Dhanmondi');
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<number>(24);
  const [registerAsDonor, setRegisterAsDonor] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Forgot Password & Reset State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Status & Loaders
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const supabaseConfig = getSupabaseConfig();

  // Geographic Cascade for Sign Up
  const availableDistricts = useMemo(() => {
    const divObj = BANGLADESH_DIVISIONS.find(d => d.nameEn === division);
    return divObj ? divObj.districts : [];
  }, [division]);

  const availableUpazilas = useMemo(() => {
    const distObj = availableDistricts.find(d => d.nameEn === district);
    return distObj ? distObj.upazilas : [];
  }, [availableDistricts, district]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const res = await authService.signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (res.success && res.user) {
      if (loginRoleTab === 'admin' && res.user.role !== 'admin') {
        setErrorMessage('এই অ্যাকাউন্টটি সাধারণ ব্যবহারকারীর। অ্যাডমিন সুবিধার জন্য অ্যাডমিন ক্রেডেনশিয়াল ব্যবহার করুন অথবা "সাধারণ ব্যবহারকারী লগইন" ট্যাবে যান।');
        return;
      }
      onAuthSuccess(res.user);
      if (res.user.role === 'admin' && loginRoleTab === 'admin') {
        setActivePage('home');
      } else {
        setActivePage('dashboard');
      }
    } else {
      setErrorMessage(res.message || 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  // Handle Sign Up (Requirement 1 & 5)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('উভয় পাসওয়ার্ড একই হতে হবে।');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('নিরাপত্তা নীতি: পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone)) {
      setErrorMessage('অনুগ্রহ করে সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678 বা +8801712345678)।');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('অনুগ্রহ করে রক্তদান নেটওয়ার্কের সেবা ও সুরক্ষার শর্তাবলী গ্রহণ করুন।');
      return;
    }

    setIsLoading(true);
    const res = await authService.signUp({
      fullName,
      email,
      password,
      phone: cleanPhone,
      bloodGroup,
      division,
      district,
      upazila,
      gender,
      age
    });
    setIsLoading(false);

    if (res.success) {
      if (res.requiresEmailVerification) {
        setSuccessMessage(res.message || 'আপনার নিবন্ধন সফল হয়েছে! অনুগ্রহ করে আপনার ইমেইল ইনবক্স চেক করে ভেরিফিকেশন লিংক যাচাই করুন।');
        return;
      }

      if (res.user) {
        if (registerAsDonor) {
          bloodService.activateUserAsDonor(res.user, {
            bloodGroup,
            division,
            district,
            upazila,
            gender,
            age
          });
        }

        setSuccessMessage('অভিনন্দন! আপনার সদস্য অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
        setTimeout(() => {
          onAuthSuccess(res.user!);
          setActivePage('dashboard');
        }, 1200);
      }
    } else {
      setErrorMessage(res.message || 'নিবন্ধন সম্পন্ন করতে সমস্যা হয়েছে।');
    }
  };

  // Handle Forgot Password Email Send
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);
    setIsLoading(true);

    const res = await authService.sendPasswordResetEmail(recoveryEmail);
    setIsLoading(false);

    if (res.success) {
      setRecoveryMessage({ text: res.message, isError: false });
    } else {
      setRecoveryMessage({ text: res.message, isError: true });
    }
  };

  // Handle Password Reset Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);

    if (newPassword !== confirmNewPassword) {
      setRecoveryMessage({ text: 'উভয় পাসওয়ার্ড একই হতে হবে।', isError: true });
      return;
    }

    if (newPassword.length < 6) {
      setRecoveryMessage({ text: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', isError: true });
      return;
    }

    setIsLoading(true);
    const res = await authService.updatePassword(newPassword);
    setIsLoading(false);

    if (res.success) {
      setResetSuccessMessage(res.message);
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setResetSuccessMessage('');
        setMode('login');
      }, 2500);
    } else {
      setRecoveryMessage({ text: res.message, isError: true });
    }
  };


  return (
    <div className="min-h-[85vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-linear-to-b from-red-50/40 via-white to-slate-50">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Information & Brand Hero Panel */}
        <div className="md:col-span-5 bg-linear-to-br from-red-700 via-red-800 to-rose-950 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <Droplet className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white text-red-700 flex items-center justify-center shadow-md">
                <Droplet className="w-6 h-6 fill-red-700 text-red-700" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white block font-display">LifeDrop</span>
                <span className="text-[11px] text-red-200 block">রক্তদান নেটওয়ার্ক বাংলাদেশ</span>
              </div>
            </div>

            {/* Motivational message */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-red-100 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>নিরাপদ ইউজার অ্যাকাউন্ট সিস্টেম</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display leading-snug">
                “রক্তের বন্ধনে যুক্ত হোক প্রতিটি নিঃশ্বাস”
              </h2>
              <p className="text-xs text-red-100/90 leading-relaxed">
                আপনার একটি অ্যাকাউন্ট দিয়ে সহজেই রক্তদানে প্রস্তুত থাকতে পারেন, নিজের প্রোফাইল পরিচালনা করতে পারেন এবং স্বজনদের বিপদে দ্রুত জরুরি রক্তের আবেদন জানাতে পারেন।
              </p>
            </div>

            {/* Features check list */}
            <div className="space-y-2.5 text-xs text-red-100 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>নিজের প্রোফাইল ও রক্তদাতা স্ট্যাটাস নিয়ন্ত্রণ</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ডিজিটাল ভলান্টিয়ার ডোনার আইডি কার্ড</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>জরুরি রক্তের আবেদন প্রচার ও রিয়েল-টাইম ট্র্যাকিং</span>
              </div>
            </div>
          </div>

          {/* Database & Cloud Connection Status (Requirement 8) */}
          <div className="mt-6 pt-4 border-t border-white/15 text-[11px] text-red-200/90 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-red-300" />
              <span>{supabaseConfig.isConfigured ? 'Supabase ক্লাউড যুক্ত' : 'লোকাল প্রিভিউ মোড (সক্রিয়)'}</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Right Authentication Forms Panel */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white">
          
          {/* Form Switcher Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`text-sm font-bold pb-1 transition-colors relative cursor-pointer ${
                  mode === 'signup'
                    ? 'text-red-600 after:absolute after:bottom-[-17px] after:left-0 after:right-0 after:h-0.5 after:bg-red-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                নতুন রেজিস্ট্রেশন (Sign Up)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`text-sm font-bold pb-1 transition-colors relative cursor-pointer ${
                  mode === 'login'
                    ? 'text-red-600 after:absolute after:bottom-[-17px] after:left-0 after:right-0 after:h-0.5 after:bg-red-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ইউজার লগইন (Login)
              </button>
            </div>

            <button
              onClick={() => setActivePage('home')}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">হোমে ফিরে যান</span>
            </button>
          </div>

          {/* Notifications */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* 1. REGISTRATION FORM (নতুন রেজিস্ট্রেশন পেজ - Requirement 1) */}
          {/* ============================================================ */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পুরো নাম (Full Name) <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="যেমন: তানভীর আহমেদ"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ইমেইল ঠিকানা <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-colors font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    রক্তের গ্রুপ (Blood Group) <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-red-700 focus:bg-white focus:ring-2 focus:ring-red-600"
                  >
                    {(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as BloodGroup[]).map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Division */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বিভাগ (Division)</label>
                  <select
                    value={division}
                    onChange={(e) => {
                      setDivision(e.target.value);
                      const divObj = BANGLADESH_DIVISIONS.find(d => d.nameEn === e.target.value);
                      if (divObj && divObj.districts[0]) {
                        setDistrict(divObj.districts[0].nameEn);
                        setUpazila(divObj.districts[0].upazilas[0] || '');
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                  >
                    {BANGLADESH_DIVISIONS.map(d => (
                      <option key={d.id} value={d.nameEn}>{d.nameBn} ({d.nameEn})</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">জেলা (District)</label>
                  <select
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      const distObj = availableDistricts.find(d => d.nameEn === e.target.value);
                      if (distObj && distObj.upazilas[0]) {
                        setUpazila(distObj.upazilas[0]);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                  >
                    {availableDistricts.map(d => (
                      <option key={d.id} value={d.nameEn}>{d.nameBn} ({d.nameEn})</option>
                    ))}
                  </select>
                </div>

                {/* Upazila */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">উপজেলা / থানা</label>
                  <select
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                  >
                    {availableUpazilas.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                    required
                  />
                </div>
              </div>

              {/* Donor Auto Registration Option */}
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registerAsDonor}
                    onChange={(e) => setRegisterAsDonor(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-600 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">
                      আমাকে সরাসরি লাইফড্রপ রক্তদাতা নেটওয়ার্কে অন্তর্ভুক্ত করুন
                    </span>
                    <span className="text-slate-600 text-[11px] block">
                      প্রয়োজনে আশেপাশের রোগীরা আপনার সাথে যোগাযোগ করতে পারবেন।
                    </span>
                  </div>
                </label>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <span>
                  আমি ঘোষণা করছি যে প্রদত্ত সকল তথ্য সঠিক এবং আমি স্বেচ্ছায় LifeDrop এর নীতিমালা ও সুরক্ষার শর্তাবলী গ্রহণ করছি।
                </span>
              </label>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>অ্যাকাউন্ট তৈরি করুন (Complete Registration)</span>
              </button>

              <p className="text-center text-xs text-slate-500">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-red-600 hover:underline cursor-pointer"
                >
                  সরাসরি লগইন করুন
                </button>
              </p>
            </form>
          )}

          {/* ============================================================ */}
          {/* 2. LOGIN FORM WITH DUAL TABS (Requirement 1 & 2)             */}
          {/*    - অ্যাডমিন লগইন                                           */}
          {/*    - সাধারণ ব্যবহারকারী লগইন                                 */}
          {/* ============================================================ */}
          {mode === 'login' && (
            <div className="space-y-4">
              {/* Dual Tab Switcher (Requirement 1) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setLoginRoleTab('user');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    loginRoleTab === 'user'
                      ? 'bg-white text-red-600 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>সাধারণ ব্যবহারকারী লগইন</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginRoleTab('admin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    loginRoleTab === 'admin'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>অ্যাডমিন লগইন</span>
                </button>
              </div>

              {/* Login Description Banner */}
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                loginRoleTab === 'admin'
                  ? 'bg-red-50/70 border-red-200 text-red-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  {loginRoleTab === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>
                    {loginRoleTab === 'admin'
                      ? 'অ্যাডমিন ড্যাশবোর্ড: সার্ভার-সাইড রোল যাচাইয়ের মাধ্যমে সংরক্ষিত'
                      : 'ব্যবহারকারী ড্যাশবোর্ড: সাধারণ সদস্যদের প্রোফাইল ও রক্তদানের তথ্য'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {loginRoleTab === 'admin' ? 'অ্যাডমিন ইমেইল' : 'মোবাইল নম্বর'} <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    {loginRoleTab === 'admin' ? (
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    ) : (
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    )}
                    <input
                      type={loginRoleTab === 'admin' ? 'email' : 'tel'}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={loginRoleTab === 'admin' ? 'admin@lifedrop.org.bd' : '01XXXXXXXXX'}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                      required
                    />
                  </div>
                  {loginRoleTab === 'user' && (
                    <span className="text-[10px] text-slate-500 block mt-1">
                      নিবন্ধিত ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 01812345678)
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      পাসওয়ার্ড (Password) <span className="text-red-600">*</span>
                    </label>
                    {/* Requirement 2: Forgot Password Option with email reset link */}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setRecoveryEmail(loginEmail);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : loginRoleTab === 'admin' ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>
                    {loginRoleTab === 'admin' ? 'অ্যাডমিন হিসেবে লগইন করুন' : 'ব্যবহারকারী হিসেবে লগইন করুন'}
                  </span>
                </button>

                <div className="text-center pt-2 text-xs text-slate-500">
                  নতুন সাধারণ ব্যবহারকারী?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage('');
                    }}
                    className="font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    একটি নতুন অ্যাকাউন্ট তৈরি করুন
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. FORGOT PASSWORD (পাসওয়ার্ড ভুলে গেছেন - Requirement 3)     */}
          {/* ============================================================ */}
          {mode === 'forgot' && (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">পাসওয়ার্ড পুনরুদ্ধার</h3>
                <p className="text-xs text-slate-500">
                  আপনার নিবন্ধিত ইমেইল ঠিকানা দিন। আমরা আপনাকে পাসওয়ার্ড পরিবর্তনের লিংক পাঠাব।
                </p>
              </div>

              {recoveryMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  recoveryMessage.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {recoveryMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                  <span>{recoveryMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ইমেইল ঠিকানা</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="user@lifedrop.org.bd"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                <span>রিসেট লিংক পাঠান</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-2 cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>লগইন পেজে ফিরে যান</span>
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* 4. RESET PASSWORD CONFIRM FORM                                */}
          {/* ============================================================ */}
          {mode === 'reset' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">নতুন পাসওয়ার্ড সেট করুন</h3>
                <p className="text-xs text-slate-500">আপনার অ্যাকাউন্টের জন্য একটি নতুন পাসওয়ার্ড প্রদান করুন।</p>
              </div>

              {recoveryMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  recoveryMessage.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {recoveryMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                  <span>{recoveryMessage.text}</span>
                </div>
              )}

              {resetSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নতুন পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>পাসওয়ার্ড পরিবর্তন নিশ্চিত করুন</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
