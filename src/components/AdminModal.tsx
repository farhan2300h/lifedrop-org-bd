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

  // Sign Up state (Requirement 5: default role = user)
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

      // If user is regular user, inform and open User Dashboard
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

  // Handle Sign Up (Requirement 5)
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

  // Donor Moderation Handlers (Protected by RBAC)
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

  // User Role Management (Admin only)
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

-- 4. Automatic Trigger for New Registrations (Forces Default Role = 'user')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Member'),
    new.raw_user_meta_data->>'phone',
    'user' -- Strict RBAC: No self-promotion to admin
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

-- Profiles: Users read own or public, only Admins view all
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'user'); -- Prevents role tampering

-- Donors: Public views approved donors; Users view/edit own; Admins manage all
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

-- Blood Requests: Public views all; Users create and manage own; Admin manages all
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
            {/* If Admin is logged in, offer 1-click switch to User Dashboard (Requirement 3) */}
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

        {/* ============================================================ */}
        {/* VIEW 1: AUTHENTICATION FLOW (LOGIN, SIGN UP, PASSWORD RESET)  */}
        {/* ============================================================ */}
        {!isAdminAuthenticated ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
            
            {/* Left Promotional / Dual Role Info Panel */}
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
                    LifeDrop সিস্টেমে সাধারণ সদস্য ও অ্যাডমিনের জন্য রয়েছে পৃথক ও সুনির্দিষ্ট অধিকার। সাধারণ ইউজার নিজের প্রোফাইল ও রক্তের অনুরোধ নিয়ন্ত্রণ করবেন, আর অ্যাডমিন সমগ্র নেটওয়ার্ক পরিচালনা করবেন।
                  </p>
                </div>

                {/* Role Highlights */}
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

            {/* Right Forms Area */}
            <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-center">
              
              {/* Form Navigation Tabs */}
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

              {/* Status / Error Alerts */}
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

              {/* 1. SIGN IN FORM */}
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

              {/* 2. SIGN UP FORM (Requirement 5: default role=user) */}
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

                  {/* RBAC Notice (Requirement 5) */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      নিরাপত্তা নীতি: নতুন রেজিস্ট্রেশন করলে স্বয়ংক্রিয়ভাবে 'সাধারণ সদস্য (User)' রোল বরাদ্দ করা হয়। কেউ নিজের অ্যাকাউন্ট থেকে অ্যাডমিন রোল তৈরি করতে পারেন না।
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    <span>অ্যাকাউন্ট তৈরি করুন (Register as User)</span>
                  </button>
                </form>
              )}

              {/* 3. PASSWORD RECOVERY: REQUEST RESET */}
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
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    <span>রিসেট লিংক পাঠান</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthView('login')}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-2 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>লগইন পেজে ফিরে যান</span>
                  </button>
                </form>
              )}

              {/* 4. PASSWORD RECOVERY: RESET CONFIRM FORM */}
              {authView === 'reset_confirm' && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">নতুন পাসওয়ার্ড সেট করুন</h4>
                    <p className="text-xs text-slate-500">আপনার অ্যাকাউন্টের জন্য একটি শক্তিশালী নতুন পাসওয়ার্ড প্রদান করুন।</p>
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
                      placeholder="কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>পাসওয়ার্ড পরিবর্তন নিশ্চিত করুন</span>
                  </button>
                </form>
              )}

            </div>

          </div>
        ) : (
          /* ============================================================ */
          /* VIEW 2: FULL ADMIN CONTROL PANEL (ONLY ACCESSIBLE BY ADMIN)  */
          /* ============================================================ */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-60 bg-slate-900 text-slate-300 flex flex-row md:flex-col shrink-0 border-r border-slate-800 overflow-x-auto md:overflow-y-auto">
              
              {/* Admin profile snippet */}
              <div className="hidden md:block p-4 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">{currentUser.fullName}</span>
                    <span className="text-[10px] text-red-400 font-mono block">admin@lifedrop.org.bd</span>
                  </div>
                </div>
              </div>

              {/* Sidebar Tabs */}
              <nav className="flex md:flex-col p-2 gap-1 w-full text-xs">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeSection === 'overview' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>ওভারভিউ ও মেট্রিক্স</span>
                </button>

                <button
                  onClick={() => setActiveSection('pending')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeSection === 'pending' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>নিবন্ধন যাচাই</span>
                  </span>
                  {pendingDonors.length > 0 && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {pendingDonors.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveSection('donations')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeSection === 'donations' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span>রক্তদান অনুমোদন</span>
                  </span>
                  {pendingDonations.length > 0 && (
                    <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {pendingDonations.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveSection('donors')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeSection === 'donors' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <HeartHandshake className="w-4 h-4" />
                    <span>সকল রক্তদাতা</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{approvedDonors.length}</span>
                </button>

                <button
                  onClick={() => setActiveSection('requests')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeSection === 'requests' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>রক্তের অনুরোধসমূহ</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{requests.length}</span>
                </button>

                {/* Requirement 2: Users & Roles Management */}
                <button
                  onClick={() => setActiveSection('users')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeSection === 'users' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>ইউজার ও রোল (RBAC)</span>
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded-full">
                    {usersList.length}
                  </span>
                </button>

                {/* Requirement 2: Notices, Banners & Content */}
                <button
                  onClick={() => setActiveSection('content')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeSection === 'content' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Megaphone className="w-4 h-4 text-emerald-400" />
                  <span>নোটিশ ও কনটেন্ট</span>
                </button>

                {/* Requirement 4 & 6: Settings, Schema & RLS */}
                <button
                  onClick={() => setActiveSection('settings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeSection === 'settings' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>সেটিংস ও Supabase RLS</span>
                </button>
              </nav>

              {/* Requirement 3: Admin acting as Regular User button */}
              <div className="hidden md:block p-3 mt-auto border-t border-slate-800">
                <button
                  onClick={() => {
                    onClose();
                    openUserDashboard();
                  }}
                  className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4 text-red-400" />
                  <span>ইউজার ড্যাশবোর্ডে যান</span>
                </button>
              </div>
            </aside>

            {/* Main Admin Working Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              
              {/* TAB 1: OVERVIEW */}
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">সিস্টেম সারসংক্ষেপ</h3>
                    <p className="text-xs text-slate-500">LifeDrop বাংলাদেশ রক্তদান নেটওয়ার্কের রিয়েল-টাইম মেট্রিক্স</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-xs text-slate-500 block">অনুমোদিত রক্তদাতা</span>
                      <span className="text-2xl font-black text-slate-900">{approvedDonors.length}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold block mt-1">✓ পাবলিক সার্চে সক্রিয়</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
                      <span className="text-xs text-amber-800 font-semibold block">পেন্ডিং আবেদন</span>
                      <span className="text-2xl font-black text-amber-700">{pendingDonors.length}</span>
                      <span className="text-[10px] text-amber-600 block mt-1">যাচাইকরণের অপেক্ষায়</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs">
                      <span className="text-xs text-rose-800 font-semibold block">জরুরি অনুরোধ</span>
                      <span className="text-2xl font-black text-rose-700">
                        {requests.filter(r => r.status === 'urgent').length}
                      </span>
                      <span className="text-[10px] text-rose-600 block mt-1">তাৎক্ষণিক রক্ত প্রয়োজন</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
                      <span className="text-xs text-blue-800 font-semibold block">মোট ইউজার</span>
                      <span className="text-2xl font-black text-blue-700">{usersList.length}</span>
                      <span className="text-[10px] text-blue-600 block mt-1">RBAC সুরক্ষিত অ্যাকাউন্ট</span>
                    </div>
                  </div>

                  {/* Pending review quick banner */}
                  {pendingDonors.length > 0 && (
                    <div className="bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8 text-amber-100 shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm sm:text-base">
                            {pendingDonors.length} টি নতুন রক্তদাতা নিবন্ধন অনুমোদনের অপেক্ষায়
                          </h4>
                          <p className="text-xs text-amber-100">
                            মেডিকেল নিরাপত্তা ও সঠিক ফোন নম্বরের ভিত্তিতে অনুমোদন সম্পন্ন করুন।
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveSection('pending')}
                        className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-xs hover:bg-amber-50 transition-colors shrink-0 cursor-pointer"
                      >
                        অনুমোদন করুন &rarr;
                      </button>
                    </div>
                  )}

                  {/* Live Activity list */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">সাম্প্রতিক কার্যক্রম</h4>
                    <div className="divide-y divide-slate-100 text-xs">
                      {donors.slice(0, 4).map(d => (
                        <div key={d.id} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px]">
                              {d.bloodGroup}
                            </span>
                            <span className="font-semibold text-slate-800">{d.fullName}</span>
                            <span className="text-slate-400">({d.district}, {d.division})</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            d.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {d.approvalStatus === 'approved' ? 'অনুমোদিত' : 'পেন্ডিং'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PENDING APPROVALS */}
              {activeSection === 'pending' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">পেন্ডিং রক্তদাতা অনুমোদন তালিকা</h3>
                      <p className="text-xs text-slate-500">অনুমোদনের পর রক্তদাতার তথ্য সরাসরি পাবলিক সার্চে প্রদর্শিত হবে</p>
                    </div>
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                      মোট পেন্ডিং: {pendingDonors.length}
                    </span>
                  </div>

                  {pendingDonors.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-sm">কোনো পেন্ডিং আবেদন নেই!</h4>
                      <p className="text-xs text-slate-500">সকল রক্তদাতা যাচাই সম্পন্ন হয়েছে।</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingDonors.map(donor => (
                        <div key={donor.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-black text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-xl">
                                {donor.bloodGroup}
                              </span>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{donor.fullName}</h4>
                                <p className="text-xs text-slate-500">
                                  {donor.gender === 'male' ? 'পুরুষ' : 'নারী'} • বয়স: {donor.age} বছর • পেশা: {donor.occupation || 'তথ্য নেই'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveDonor(donor.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              >
                                <Check className="w-4 h-4" />
                                <span>অনুমোদন করুন</span>
                              </button>
                              <button
                                onClick={() => handleRejectDonor(donor.id)}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                                <span>বাতিল</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-red-600" />
                              {donor.upazila}, {donor.district}, {donor.division}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-600" />
                              {donor.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              সর্বশেষ রক্তদান: {donor.lastDonationDate || 'প্রথমবার'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2.5: DONATION HISTORY APPROVALS (Requirement 7) */}
              {activeSection === 'donations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">রক্তদানের ইতিহাস অনুমোদন তালিকা</h3>
                      <p className="text-xs text-slate-500">
                        ব্যবহারকারীদের জমা দেওয়া রক্তদানের তথ্য যাচাই করুন। অনুমোদন দিলে রক্তদানের সংখ্যা আপডেট হবে এবং ডিজিটাল সনদপত্র তৈরি হবে।
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full">
                      মোট পেন্ডিং: {pendingDonations.length}
                    </span>
                  </div>

                  {pendingDonations.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-sm">কোনো পেন্ডিং রক্তদানের রেকর্ড নেই!</h4>
                      <p className="text-xs text-slate-500">ব্যবহারকারী রক্তদানের তথ্য জমা দিলে এখানে পর্যালোচনার জন্য প্রদর্শিত হবে।</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingDonations.map(({ donor, record }) => (
                        <div key={record.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-black text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-xl">
                                {donor.bloodGroup}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 text-sm">{donor.fullName}</h4>
                                  <span className="text-[10px] bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded-full">
                                    অনুমোদনের অপেক্ষায়
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium mt-0.5">
                                  হাসপাতাল: <span className="text-slate-900 font-bold">{record.hospital}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveDonation(donor.id, record.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              >
                                <Check className="w-4 h-4" />
                                <span>অনুমোদন করুন</span>
                              </button>
                              <button
                                onClick={() => handleRejectDonation(donor.id, record.id)}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                                <span>বাতিল</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-red-600" />
                              রক্তদানের তারিখ: <strong>{record.date}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-600" />
                              অবস্থান: {record.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                              পূর্ববর্তী রক্তদান: {donor.totalDonations || 0} বার
                            </span>
                          </div>

                          {record.notes && (
                            <div className="bg-slate-50/70 p-2.5 rounded-lg text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-700">নোট/বিবরণ: </span>
                              {record.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ALL DONORS DATABASE */}
              {activeSection === 'donors' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">সকল রক্তদাতার তালিকা</h3>
                      <p className="text-xs text-slate-500">অনুমোদিত, পেন্ডিং ও ভেরিফাইড রক্তদাতা ব্যবস্থাপনা</p>
                    </div>

                    <div className="w-full sm:w-64 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="নাম, জেলা বা রক্তের গ্রুপ খুঁজুন..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">রক্তদাতা</th>
                            <th className="py-3 px-3">রক্তের গ্রুপ</th>
                            <th className="py-3 px-3">ঠিকানা</th>
                            <th className="py-3 px-3">মোবাইল</th>
                            <th className="py-3 px-3">স্ট্যাটাস</th>
                            <th className="py-3 px-3 text-right">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {donors
                            .filter(d => 
                              d.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                              d.district.toLowerCase().includes(searchFilter.toLowerCase()) ||
                              d.bloodGroup.toLowerCase().includes(searchFilter.toLowerCase())
                            )
                            .map(donor => (
                              <tr key={donor.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{donor.fullName}</div>
                                  <div className="text-[10px] text-slate-400">{donor.occupation || 'স্বেচ্ছাসেবী'}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                    {donor.bloodGroup}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-600">
                                  {donor.upazila}, {donor.district}
                                </td>
                                <td className="py-3 px-3 font-mono">
                                  {donor.phone}
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    donor.approvalStatus === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {donor.approvalStatus === 'approved' ? 'Approved' : 'Pending'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleToggleAvailability(donor)}
                                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                                        donor.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                      }`}
                                      title="প্রস্তুতি টগল"
                                    >
                                      {donor.isAvailable ? 'Active' : 'Inactive'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDonor(donor.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                                      title="মুছে ফেলুন"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ALL BLOOD REQUESTS */}
              {activeSection === 'requests' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">জরুরি রক্তের আবেদন ব্যবস্থাপনা</h3>
                    <p className="text-xs text-slate-500">রোগীর তথ্য, রক্তের গ্রুপ, হাসপাতাল ও যোগাযোগের বিবরণ</p>
                  </div>

                  <div className="space-y-3">
                    {requests.map(req => (
                      <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-xl">
                              {req.bloodGroup}
                            </span>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">
                                {req.patientName} ({req.unitsRequired} ব্যাগ প্রয়োজন)
                              </h4>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-600" />
                                {req.hospital}, {req.district}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={req.status}
                              onChange={(e) => handleStatusChange(req.id, e.target.value as RequestStatus)}
                              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold"
                            >
                              <option value="urgent">জরুরি (Urgent)</option>
                              <option value="in_progress">প্রক্রিয়াধীন (In Progress)</option>
                              <option value="fulfilled">সম্পন্ন (Fulfilled)</option>
                            </select>

                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                          <span>কারণ: <strong>{req.reason}</strong></span>
                          <span>তারিখ: <strong>{req.dateNeeded}</strong></span>
                          <span>যোগাযোগ: <strong>{req.contactName} ({req.contactPhone})</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: USERS & ROLES (RBAC ROSTER - Requirement 2) */}
              {activeSection === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">ব্যবহারকারী ও রোল ব্যবস্থাপনা (RBAC)</h3>
                      <p className="text-xs text-slate-500">সকল নিবন্ধিত ব্যবহারকারী এবং তাদের অনুমোদনের মাত্রা</p>
                    </div>
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      মোট ইউজার: {usersList.length}
                    </span>
                  </div>

                  {/* RBAC Rules Banner (Requirements 4 & 5) */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-red-400">
                      <ShieldCheck className="w-4 h-4 text-red-400" />
                      <span>Role-Based Access Control (RBAC) পলিসি ও সুরক্ষা</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                      <li>নতুন প্রতিটি রেজিস্ট্রেশনে ডিফল্টভাবে <strong>'user'</strong> রোল নির্ধারিত হয়।</li>
                      <li>সাধারণ ইউজার কোনোভাবেই নিজেকে অ্যাডমিন করতে পারে না (সার্ভিস ও RLS দ্বারা ব্লকড)।</li>
                      <li>শুধুমাত্র অনুমোদিত অ্যাডমিন অন্য সদস্যকে অ্যাডমিন অধিকার প্রদান বা প্রত্যাহার করতে পারেন।</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">ইউজার নাম</th>
                          <th className="py-3 px-3">ইমেইল</th>
                          <th className="py-3 px-3">ফোন</th>
                          <th className="py-3 px-3">বর্তমান রোল</th>
                          <th className="py-3 px-3 text-right">রোল পরিবর্তন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {usersList.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {user.fullName}
                              {user.id === currentUser?.id && (
                                <span className="ml-2 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                                  আপনি
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-mono">
                              {user.email}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              {user.phone || 'তথ্য নেই'}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                user.role === 'admin'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {user.role === 'admin' ? '🛡️ ADMIN' : '👤 USER'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {user.id !== currentUser?.id ? (
                                <button
                                  onClick={() => handleRoleToggle(user)}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                                >
                                  {user.role === 'admin' ? 'মেম্বার করুন' : 'অ্যাডমিন বানান'}
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">প্রধান অ্যাডমিন</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: NOTICES, BANNERS & CONTENT (Requirement 2) */}
              {activeSection === 'content' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">ওয়েবসাইট নোটিশ ও ব্যানার কনটেন্ট</h3>
                    <p className="text-xs text-slate-500">টপ নোটিশ বার, জরুরি নির্দেশনা ও ব্যানার আপডেট করুন</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-red-600" />
                      <span>টপ নোটিশ বার টেক্সট (Emergency Strip)</span>
                    </h4>

                    {noticeSavedMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>নোটিশ সফলভাবে হালনাগাদ করা হয়েছে!</span>
                      </div>
                    )}

                    <textarea
                      rows={3}
                      value={emergencyNotice}
                      onChange={(e) => setEmergencyNotice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-600"
                    />

                    <button
                      onClick={() => {
                        setNoticeSavedMsg(true);
                        setTimeout(() => setNoticeSavedMsg(false), 2500);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      নোটিশ প্রকাশ করুন
                    </button>
                  </div>

                  {/* Official Hotline Card Info */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">অফিসিয়াল যোগাযোগ সেটিংস</h4>
                    <div className="text-xs space-y-1.5 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p><strong>CEO / Admin:</strong> মোঃ হাবিবুর রহমান (CEO-HABIB)</p>
                      <p><strong>হটলাইন:</strong> +8801950902300 (WhatsApp সক্রিয়)</p>
                      <p><strong>ঠিকানা:</strong> যোগিরছিট, শ্রীপুর, গাজীপুর, বাংলাদেশ।</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: SETTINGS & SUPABASE RLS (Requirement 4 & 6) */}
              {activeSection === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">সেটিংস ও Supabase PostgreSQL RLS</h3>
                    <p className="text-xs text-slate-500">
                      ক্লাউড ডাটাবেজ সংযোগ, Row-Level Security পলিসি এবং ব্যাকএন্ড কনফিগারেশন
                    </p>
                  </div>

                  {/* Connection Status Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Database className="w-5 h-5 text-red-600" />
                        <span className="text-xs font-bold text-slate-900">Supabase ক্লাউড ডাটাবেজ স্ট্যাটাস</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        supabaseConfig.isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {supabaseConfig.isConfigured ? 'সক্রিয় সংযোগ (Connected)' : 'লোকাল ডেমো মোড (Ready for Keys)'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      URL: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">{supabaseConfig.url}</code>
                    </p>

                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        onClick={handleResetData}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>ডেমো ডেটা রিসেট করুন</span>
                      </button>
                    </div>
                  </div>

                  {/* Complete SQL Schema with RLS Policies */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-red-600" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Supabase PostgreSQL Schema & RLS Policies (RBAC)
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Supabase SQL Editor-এ একবার রান করলেই সকল টেবিল, ট্রিগার ও RLS পলিসি কনফিগার হবে
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleCopySchema}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSchema ? 'কপি হয়েছে!' : 'SQL কোড কপি করুন'}</span>
                      </button>
                    </div>

                    <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
                      {supabaseSqlSchema}
                    </pre>
                  </div>
                </div>
              )}

            </main>

          </div>
        )}

      </div>
    </div>
  );
};
                   </div>

                      <button
                        onClick={handleCopySchema}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5
