import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Donor, BloodRequest, RequestStatus, UserProfile, UserRole, DonationRecord } from '../types';
import { bloodService } from '../services/bloodService';
import { authService, getSupabaseConfig, supabase } from '../services/supabaseClient';
import { certificateService } from '../services/certificateService';
import { 
  X, 
  Shield, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Database, 
  LogOut, 
  RefreshCw, 
  Search, 
  KeyRound, 
  FileCode, 
  Check, 
  Copy, 
  UserCheck, 
  UserX, 
  Clock, 
  Info,
  Users,
  AlertTriangle,
  Mail,
  ArrowLeft,
  Settings,
  HeartHandshake,
  Activity,
  UserCog,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  ExternalLink,
  Phone,
  MapPin,
  Megaphone,
  Award,
  Calendar
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  openUserDashboard: () => void;
}

type AdminSection = 'overview' | 'pending' | 'donations' | 'donors' | 'requests' | 'users' | 'content' | 'settings';
type AuthView = 'login' | 'signup' | 'forgot_request' | 'reset_confirm';

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
  openUserDashboard
}) => {
  const { lang, t } = useLanguage();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [authView, setAuthView] = useState<AuthView>('login');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign Up state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Password Recovery state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Admin Data state
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [pendingDonations, setPendingDonations] = useState<{ donor: Donor; record: DonationRecord }[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Content Notice state
  const [emergencyNotice, setEmergencyNotice] = useState('জরুরি রক্তের প্রয়োজনে সরাসরি কল করুন: +8801950902300 (২৪ ঘণ্টা খোলা)');
  const [noticeSavedMsg, setNoticeSavedMsg] = useState(false);

  // Handle Supabase password recovery session & URL cleanup
  useEffect(() => {
    let isMounted = true;

    const checkRecovery = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const hasRecoveryCallback =
        hash.includes('reset-password') ||
        hash.includes('type=recovery') ||
        hash.includes('access_token=') ||
        search.includes('type=recovery') ||
        search.includes('code=') ||
        search.includes('access_token=');

      if (hasRecoveryCallback && isMounted) {
        setAuthView('reset_confirm');
        setRecoveryMessage(null);
        setAuthError('');
        setAuthSuccess('');
      }
    };

    checkRecovery();
    window.addEventListener('hashchange', checkRecovery);
    window.addEventListener('popstate', checkRecovery);

    const { data: authListener } = supabase
      ? supabase.auth.onAuthStateChange((event) => {
          if (!isMounted) return;
          if (event === 'PASSWORD_RECOVERY') {
            setAuthView('reset_confirm');
            setRecoveryMessage(null);
            setAuthError('');
            setAuthSuccess('');
          }
        })
      : { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      isMounted = false;
      window.removeEventListener('hashchange', checkRecovery);
      window.removeEventListener('popstate', checkRecovery);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshAdminData = () => {
    setDonors(bloodService.getDonors());
    setRequests(bloodService.getRequests());
    setPendingDonations(bloodService.getAllPendingDonations());
    if (currentUser?.role === 'admin') {
      try {
        setUsersList(authService.getAllUsers(currentUser));
      } catch {
        // safe fallback
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshAdminData();
    }
    const unsub = bloodService.subscribe(refreshAdminData);
    return unsub;
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);

    const res = await authService.signIn(email, password);
    setIsSubmitting(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setEmail('');
      setPassword('');

      if (res.user.role === 'user') {
        setAuthSuccess('সাধারণ ব্যবহারকারী হিসেবে লগইন সফল হয়েছে! আপনার ইউজার ড্যাশবোর্ডে নেওয়া হচ্ছে...');
        setTimeout(() => {
          onClose();
          openUserDashboard();
        }, 1200);
      }
    } else {
      setAuthError(res.message || 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  // Handle Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);

    const res = await authService.signUp({
      fullName: signupName,
      email: signupEmail,
      phone: signupPhone,
      password: signupPassword
    });
    setIsSubmitting(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAuthSuccess(res.message || 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!');
      setTimeout(() => {
        onClose();
        openUserDashboard();
      }, 1500);
    } else {
      setAuthError(res.message || 'নিবন্ধন ব্যর্থ হয়েছে।');
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  // Password Recovery Handlers
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);
    setIsSubmitting(true);

    const res = await authService.sendPasswordResetEmail(recoveryEmail);
    setIsSubmitting(false);

    if (res.success) {
      setRecoveryMessage({ text: res.message, isError: false });
      if (res.isDemo) {
        setTimeout(() => {
          setAuthView('reset_confirm');
        }, 1500);
      }
    } else {
      setRecoveryMessage({ text: res.message, isError: true });
    }
  };

  // Clean URL hash so reset popup never reappears after success
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);

    if (newPassword !== confirmPassword) {
      setRecoveryMessage({ text: 'উভয় পাসওয়ার্ড একই হতে হবে।', isError: true });
      return;
    }

    if (newPassword.length < 8) {
      setRecoveryMessage({ text: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।', isError: true });
      return;
    }

    setIsSubmitting(true);
    const res = await authService.updatePassword(newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setResetSuccessMessage(res.message);
      setNewPassword('');
      setConfirmPassword('');

      // Permanently remove URL parameters/hash from browser history
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      setTimeout(() => {
        setResetSuccessMessage('');
        setAuthView('login');
      }, 2000);
    } else {
      setRecoveryMessage({ text: res.message, isError: true });
    }
  };

  const supabaseConfig = getSupabaseConfig();
  const isAdminAuthenticated = currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <header className="px-5 py-3.5 border-b border-red-800 bg-linear-to-r from-red-700 via-red-800 to-rose-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-red-700 flex items-center justify-center font-black shadow-xs">
              <Shield className="w-5 h-5 fill-red-700 text-red-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold leading-tight tracking-tight text-white font-display">
                  {isAdminAuthenticated ? 'LifeDrop অ্যাডমিন কন্ট্রোল প্যানেল' : 'LifeDrop অ্যাকাউন্ট ও অ্যাডমিন পোর্টাল'}
                </h2>
                {isAdminAuthenticated && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30">
                    SUPER ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-red-100/90">
                {isAdminAuthenticated 
                  ? 'রক্তদাতা অনুমোদন, জরুরি অনুরোধ, ব্যবহারকারী ও সিস্টেম ব্যবস্থাপনা'
                  : 'নিরাপদ লগইন, নতুন অ্যাকাউন্ট তৈরি ও পাসওয়ার্ড রিকভারি'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminAuthenticated && (
              <button
                onClick={() => {
                  onClose();
                  openUserDashboard();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-red-200" />
                <span>সাধারণ ইউজার ভিউ</span>
              </button>
            )}

            {currentUser && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            )}

            <button
              onClick={() => {
                // Clear URL Hash when closing modal manually
                if (window.location.hash) {
                  window.history.replaceState(null, '', window.location.pathname);
                }
                onClose();
              }}
              className="p-1.5 text-red-100 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* AUTHENTICATION FLOW */}
        {!isAdminAuthenticated ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
            
            <div className="w-full md:w-5/12 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-red-950/70 text-red-300 border border-red-800/60 px-3 py-1 rounded-full text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <span>Role-Based Access Control (RBAC)</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                    নিরাপদ ও অধিকারভিত্তিক অ্যাক্সেস
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    LifeDrop সিস্টেমে সাধারণ সদস্য ও অ্যাডমিনের জন্য রয়েছে পৃথক ও সুনির্দিষ্ট অধিকার।
                  </p>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-red-400 font-bold block">👤 সাধারণ ইউজার (Role: user)</span>
                    <p className="text-slate-300 text-[11px]">
                      নিজের অ্যাকাউন্ট, প্রোফাইল, রক্তদাতা নিবন্ধন ও জরুরি রক্তের অনুরোধ পরিচালনা করতে পারেন।
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="text-emerald-400 font-bold block">🛡️ অ্যাডমিন (Role: admin)</span>
                    <p className="text-slate-300 text-[11px]">
                      সকল ইউজার, রক্তদাতা অনুমোদন, অনুরোধ, নোটিশ ও কনটেন্ট পরিচালনা করতে পারেন।
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400">
                সিস্টেম স্ট্যাটাস: <strong className="text-slate-300">{supabaseConfig.isConfigured ? 'Supabase Connected' : 'Review Mode'}</strong>
              </div>
            </div>

            <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-center">
              
              <div className="flex border-b border-slate-200 mb-6 gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                    authView === 'login'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  লগইন (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('signup');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                    authView === 'signup'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  নতুন একাউন্ট খুলুন (Sign Up)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('forgot_request');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                    authView === 'forgot_request' || authView === 'reset_confirm'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  পাসওয়ার্ড রিকভারি
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
              {authSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {authView === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ইমেইল ঠিকানা (Email)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="blooddonationnetwork5@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        পাসওয়ার্ড (Password)
                      </label>
                      <button
                        type="button"
                        onClick={() => setAuthView('forgot_request')}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                      >
                        পাসওয়ার্ড ভুলে গেছেন?
                      </button>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>লগইন করুন</span>
                  </button>
                </form>
              )}

              {authView === 'signup' && (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      আপনার পুরো নাম (Full Name)
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="যেমন: তানভীর হাসান"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ইমেইল ঠিকানা (Email)
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus
