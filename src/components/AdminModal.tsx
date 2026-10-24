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

  // Handle Supabase password recovery session
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

  const handleApproveDonation = (donorId: string, recordId: string) => {
    try {
      bloodService.approveDonationRecord(donorId, recordId, currentUser);
      const donor = donors.find(d => d.id === donorId);
      const rec = donor?.history.find(r => r.id === recordId);
      if (donor && rec) {
        certificateService.issueCertificate({
          donorId: donor.id,
          userId: donor.userId,
          donorName: donor.fullName,
          bloodGroup: donor.bloodGroup,
          donationDate: rec.date,
          hospital: rec.hospital,
          location: rec.location,
          donationCount: donor.totalDonations
        });
      }
      refreshAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectDonation = (donorId: string, recordId: string) => {
    try {
      bloodService.rejectDonationRecord(donorId, recordId, currentUser);
      refreshAdminData();
    } catch (err: any) {
      alert(err.message);
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
      setTimeout(() => {
        setResetSuccessMessage('');
        setAuthView('login');
      }, 2500);
    } else {
      setRecoveryMessage({ text: res.message, isError: true });
    }
  };

  // Donor Moderation Handlers
  const handleApproveDonor = (id: string) => {
    try {
      bloodService.approveDonor(id, currentUser);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectDonor = (id: string) => {
    if (window.confirm('আপনি কি এই রক্তদাতার আবেদনটি বাতিল করতে চান?')) {
      try {
        bloodService.rejectDonor(id, currentUser);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleToggleVerification = (donor: Donor) => {
    try {
      bloodService.updateDonor(donor.id, { isVerified: !donor.isVerified }, currentUser);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleAvailability = (donor: Donor) => {
    try {
      bloodService.updateDonor(donor.id, { isAvailable: !donor.isAvailable }, currentUser);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDonor = (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই রক্তদাতার রেকর্ডটি ডিলিট করতে চান?')) {
      try {
        bloodService.deleteDonor(id, currentUser);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleStatusChange = (id: string, status: RequestStatus) => {
    try {
      bloodService.updateRequestStatus(id, status, currentUser);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRequest = (id: string) => {
    if (window.confirm('এই রক্তের আবেদনটি ডিলিট করতে চান?')) {
      try {
        bloodService.deleteRequest(id, currentUser);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // User Role Management
  const handleRoleToggle = (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      alert('নিরাপত্তা নিয়ম: আপনি নিজের অ্যাকাউন্ট থেকে নিজের অ্যাডমিন রোল পরিবর্তন করতে পারবেন না।');
      return;
    }
    const newRole: UserRole = user.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`আপনি কি ${user.fullName}-এর রোল '${newRole}' করতে চান?`)) {
      authService.updateUserRole(user.id, newRole, currentUser);
      refreshAdminData();
    }
  };

  const handleResetData = () => {
    if (window.confirm('সকল ডেমো রক্তদাতা ও রক্তের অনুরোধ পূর্বাবস্থায় ফিরিয়ে নিতে চান?')) {
      bloodService.resetToSampleData();
    }
  };

  const pendingDonors = donors.filter(d => d.approvalStatus === 'pending');
  const approvedDonors = donors.filter(d => d.approvalStatus === 'approved');

  // Supabase PostgreSQL Production Schema with RLS
  const supabaseSqlSchema = `-- LifeDrop Bangladesh PostgreSQL Database Schema & Row-Level Security (Supabase)
-- 1. Profiles Table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Roles Table for RBAC Authority
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  UNIQUE(user_id, role)
);

-- 3. Security Definer Function to Check Admin Privilege
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Automatic Trigger for New Registrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Member'),
    new.raw_user_meta_data->>'phone',
    'user'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Donors Table
CREATE TABLE IF NOT EXISTS public.donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  blood_group TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  last_donation_date DATE,
  total_donations INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  availability_reported_at TEXT DEFAULT 'Self-reported recently',
  is_verified BOOLEAN DEFAULT FALSE,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  phone_consent BOOLEAN DEFAULT TRUE,
  occupation TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Emergency Blood Requests Table
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  units_required INTEGER NOT NULL DEFAULT 1,
  hospital TEXT NOT NULL,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'immediate',
  reason TEXT NOT NULL,
  date_needed DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'urgent' CHECK (status IN ('urgent', 'in_progress', 'fulfilled')),
  attendant_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Row-Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'user');

CREATE POLICY "Public views approved donors" ON public.donors
  FOR SELECT USING (approval_status = 'approved' OR user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can register as donor" ON public.donors
  FOR INSERT WITH CHECK (auth.uid() = user_id AND approval_status = 'pending');

CREATE POLICY "Users update own donor info" ON public.donors
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (
    public.is_admin() OR 
    (auth.uid() = user_id AND approval_status = 'pending')
  );

CREATE POLICY "Users or admin can delete donor" ON public.donors
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Public views requests" ON public.blood_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can create request" ON public.blood_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update own request" ON public.blood_requests
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own request" ON public.blood_requests
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
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
                title="অ্যাডমিন হিসেবে ইউজার ফিচার ব্যবহার করুন"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-red-200" />
                <span>সাধারণ ইউজার ভিউ</span>
              </button>
            )}

            {currentUser && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="লগআউট"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-red-100 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* VIEW 1: AUTHENTICATION FLOW */}
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
                সিস্টেম স্ট্যাটাস: <strong className="text-slate-300">{supabaseConfig.isConfigured ? 'Supabase Connected' : 'Review Mode (Active)'}</strong>
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
                      placeholder="admin@lifedrop.org.bd বা আপনার ইমেইল"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      মোবাইল নম্বর (Phone)
                    </label>
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      পাসওয়ার্ড (Password)
                    </label>
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-colors"
                      required
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      নিরাপত্তা নীতি: নতুন রেজিস্ট্রেশন করলে স্বয়ংক্রিয়ভাবে 'সাধারণ সদস্য (User)' রোল নির্ধারিত হয়।
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    <span>অ্যাকাউন্ট তৈরি করুন</span>
                  </button>
                </form>
              )}

              {authView === 'forgot_request' && (
                <form onSubmit={handleSendResetEmail} className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">পাসওয়ার্ড রিসেট করুন</h4>
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
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="admin@lifedrop.org.bd"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={is
