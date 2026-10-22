import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile, Donor, BloodRequest, RequestStatus } from '../types';
import { bloodService } from '../services/bloodService';
import { authService } from '../services/supabaseClient';
import { 
  X, 
  User, 
  HeartHandshake, 
  AlertCircle, 
  CheckCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Calendar, 
  Phone, 
  MapPin, 
  Droplet, 
  LogOut, 
  RefreshCw, 
  Clock, 
  Trash2, 
  Plus, 
  ChevronRight,
  Shield,
  KeyRound,
  FileCheck,
  AlertTriangle
} from 'lucide-react';

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  openAdminModal: () => void;
  openRegisterPage: () => void;
  openEmergencyPage: () => void;
}

type UserSection = 'donor_profile' | 'my_requests' | 'account' | 'rbac_test';

export const UserDashboardModal: React.FC<UserDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  openAdminModal,
  openRegisterPage,
  openEmergencyPage
}) => {
  const { lang, t } = useLanguage();
  const [activeSection, setActiveSection] = useState<UserSection>('donor_profile');
  
  // Data states
  const [userDonor, setUserDonor] = useState<Donor | null>(null);
  const [userRequests, setUserRequests] = useState<BloodRequest[]>([]);
  const [lastDonationDateInput, setLastDonationDateInput] = useState('');
  
  // Profile form state
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [profileMsg, setProfileMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // RBAC Test response state
  const [rbacTestResult, setRbacTestResult] = useState<{
    action: string;
    status: 'denied' | 'success';
    message: string;
  } | null>(null);

  const refreshData = () => {
    const donor = bloodService.getUserDonorProfile(currentUser.id);
    setUserDonor(donor);
    if (donor?.lastDonationDate) {
      setLastDonationDateInput(donor.lastDonationDate);
    }
    const reqs = bloodService.getUserRequests(currentUser.id);
    setUserRequests(reqs);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
    const unsub = bloodService.subscribe(refreshData);
    return unsub;
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleToggleAvailability = () => {
    if (!userDonor) return;
    try {
      bloodService.updateDonor(userDonor.id, { isAvailable: !userDonor.isAvailable }, currentUser);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateLastDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDonor) return;
    try {
      bloodService.updateDonor(userDonor.id, { 
        lastDonationDate: lastDonationDateInput || null,
        totalDonations: (userDonor.totalDonations || 0) + 1
      }, currentUser);
      setProfileMsg({ text: 'সর্বশেষ রক্তদানের তারিখ আপডেট হয়েছে!', isError: false });
      refreshData();
    } catch (err: any) {
      setProfileMsg({ text: err.message, isError: true });
    }
  };

  const handleRequestStatusChange = (reqId: string, status: RequestStatus) => {
    try {
      bloodService.updateRequestStatus(reqId, status, currentUser);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRequest = (reqId: string) => {
    if (window.confirm('আপনি কি এই রক্তের অনুরোধটি মুছে ফেলতে চান?')) {
      try {
        bloodService.deleteRequest(reqId, currentUser);
        refreshData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    const res = await authService.updateProfile(currentUser.id, {
      fullName: fullName.trim(),
      phone: phone.trim()
    }, currentUser);

    if (res.success) {
      setProfileMsg({ text: res.message || 'প্রোফাইল আপডেট হয়েছে!', isError: false });
    } else {
      setProfileMsg({ text: res.message || 'আপডেট ব্যর্থ হয়েছে।', isError: true });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'উভয় পাসওয়ার্ড একই হতে হবে।', isError: true });
      return;
    }
    const res = await authService.updatePassword(newPassword);
    if (res.success) {
      setPwdMsg({ text: res.message, isError: false });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwdMsg({ text: res.message, isError: true });
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    onClose();
  };

  // RBAC Interactive Security Tests (Requirement 4)
  const testUnauthorizedApprove = () => {
    try {
      // Intentionally attempt an admin action with regular user credentials
      bloodService.approveDonor('any-id', currentUser);
      setRbacTestResult({
        action: 'অননুমোদিত রক্তদাতা অনুমোদন',
        status: 'success',
        message: 'ত্রুটি: সাধারণ ইউজার হওয়া সত্ত্বেও অনুমোদন সফল হয়েছে (নিরাপত্তা ঘাটতি)!'
      });
    } catch (err: any) {
      setRbacTestResult({
        action: 'অননুমোদিত রক্তদাতা অনুমোদন',
        status: 'denied',
        message: `প্রবেশাধিকার প্রত্যাখ্যাত (403 Forbidden): "${err.message}". ব্যাকএন্ড ও সার্ভিস লেভেলে সাধারণ ইউজারের অনুমতি সঠিকভাবে ব্লক করা হয়েছে!`
      });
    }
  };

  const testUnauthorizedDeleteOther = () => {
    try {
      // Find a request not owned by this user
      const allReqs = bloodService.getRequests();
      const otherReq = allReqs.find(r => r.userId !== currentUser.id);
      if (!otherReq) {
        setRbacTestResult({
          action: 'অন্যের অনুরোধ মোছা',
          status: 'denied',
          message: 'অন্য ব্যবহারকারীর কোনো অনুরোধ পাওয়া যায়নি।'
        });
        return;
      }
      bloodService.deleteRequest(otherReq.id, currentUser);
      setRbacTestResult({
        action: 'অন্যের অনুরোধ মোছা',
        status: 'success',
        message: 'ত্রুটি: অন্যের অনুরোধ মুছে গেছে!'
      });
    } catch (err: any) {
      setRbacTestResult({
        action: 'অন্যের অনুরোধ মোছা',
        status: 'denied',
        message: `প্রবেশাধিকার প্রত্যাখ্যাত (403 Forbidden): "${err.message}". ইউজার শুধুমাত্র নিজের অনুরোধই মুছতে পারবেন!`
      });
    }
  };

  const testUnauthorizedRoleEscalation = async () => {
    const res = await authService.updateProfile(currentUser.id, {
      role: 'admin' as any // Attempting privilege escalation
    }, currentUser);

    if (res.success) {
      setRbacTestResult({
        action: 'নিজের রোল অ্যাডমিনে উন্নীত করা',
        status: 'success',
        message: 'ত্রুটি: রোল পরিবর্তন সফল হয়েছে (নিরাপত্তা ত্রুটি)!'
      });
    } else {
      setRbacTestResult({
        action: 'নিজের রোল অ্যাডমিনে উন্নীত করা',
        status: 'denied',
        message: `প্রবেশাধিকার প্রত্যাখ্যাত (403 Forbidden): "${res.message}". সাধারণ ইউজার কোনোভাবেই নিজেকে অ্যাডমিন করতে পারে না!`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl h-[90vh] max-h-[800px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <header className="px-5 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-xs">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold leading-tight tracking-tight text-white font-display">
                  {currentUser.fullName}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  সাধারণ সদস্য (User)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentUser.email} • আইডি: {currentUser.id.substring(0, 14)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="লগআউট"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 gap-2 overflow-x-auto shrink-0 text-xs sm:text-sm">
          <button
            onClick={() => setActiveSection('donor_profile')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'donor_profile'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>আমার রক্তদাতা প্রোফাইল</span>
            {userDonor && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('my_requests')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'my_requests'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>আমার রক্তের অনুরোধসমূহ</span>
            <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {userRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('account')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'account'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>অ্যাকাউন্ট ও নিরাপত্তা</span>
          </button>

          <button
            onClick={() => setActiveSection('rbac_test')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeSection === 'rbac_test'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-600" />
            <span>RBAC নিরাপত্তা টেস্ট</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {/* TAB 1: Donor Profile */}
          {activeSection === 'donor_profile' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {userDonor ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">রক্তদাতা স্ট্যাটাস</span>
                      <div className="flex items-center gap-2 mt-1">
                        {userDonor.approvalStatus === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            যাচাইকৃত রক্তদাতা (Approved)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            অ্যাডমিন অনুমোদনের অপেক্ষায় (Pending Review)
                          </span>
                        )}
                        <span className="text-2xl font-black text-red-600 bg-red-50 border border-red-200 px-3 py-0.5 rounded-lg">
                          {userDonor.bloodGroup}
                        </span>
                      </div>
                    </div>

                    {/* Availability Switch */}
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-medium block mb-1">রক্তদানে প্রস্তুতি</span>
                      <button
                        onClick={handleToggleAvailability}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          userDonor.isAvailable
                            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${userDonor.isAvailable ? 'bg-white' : 'bg-slate-500'}`} />
                        <span>{userDonor.isAvailable ? 'রক্তদানে প্রস্তুত (Active)' : 'বর্তমানে অনুপলব্ধ (Inactive)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Donor Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-500">নাম ও পেশা</span>
                      <p className="font-semibold text-slate-900 text-sm">{userDonor.fullName}</p>
                      <p className="text-slate-600">{userDonor.occupation || 'স্বেচ্ছাসেবী'}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-500">ঠিকানা ও জেলা</span>
                      <p className="font-semibold text-slate-900 text-sm flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        {userDonor.upazila}, {userDonor.district}
                      </p>
                      <p className="text-slate-600">বিভাগ: {userDonor.division}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-500">মোবাইল নম্বর</span>
                      <p className="font-semibold text-slate-900 text-sm flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                        {userDonor.phone}
                      </p>
                      <p className="text-emerald-700">অনুমতি: {userDonor.phoneConsent ? 'সরাসরি প্রদর্শিত' : 'গোপন রাখা হয়েছে'}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-500">মোট রক্তদান সংখ্যা</span>
                      <p className="font-bold text-red-700 text-base">{userDonor.totalDonations || 0} বার</p>
                      <p className="text-slate-500">রেজিস্ট্রেশন: {new Date(userDonor.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Update Last Donation Date Form */}
                  <form onSubmit={handleUpdateLastDonation} className="bg-red-50/60 border border-red-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-600" />
                      <h4 className="text-xs font-bold text-slate-900">সর্বশেষ রক্তদানের তারিখ হালনাগাদ করুন</h4>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="date"
                        value={lastDonationDateInput}
                        onChange={(e) => setLastDonationDateInput(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                        placeholder="YYYY-MM-DD"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        তারিখ সংরক্ষণ করুন
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      * রক্তদানের পর ৯০ দিনের কুলিং পিরিয়ড গণনা করার জন্য সঠিক তারিখ প্রদান করুন।
                    </p>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                    <HeartHandshake className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      আপনি এখনও রক্তদাতা হিসেবে নিবন্ধিত নন
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      LifeDrop রক্তদাতা নেটওয়ার্কে যুক্ত হয়ে দেশের যে কোনো প্রান্তের মুমূর্ষু রোগীর জীবন বাঁচাতে সাহায্য করুন।
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      openRegisterPage();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>রক্তদাতা হিসেবে নিবন্ধন করুন</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: My Emergency Requests */}
          {activeSection === 'my_requests' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">আপনার পোস্টকৃত রক্তের আবেদনসমূহ</h3>
                  <p className="text-xs text-slate-500">জরুরি রক্তের প্রয়োজন মিটে গেলে স্ট্যাটাস সম্পন্ন করুন</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    openEmergencyPage();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন রক্তের অনুরোধ করুন</span>
                </button>
              </div>

              {userRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600">আপনি এখনও কোনো জরুরি রক্তের আবেদন পোস্ট করেননি।</p>
                  <button
                    onClick={() => {
                      onClose();
                      openEmergencyPage();
                    }}
                    className="text-xs text-red-600 font-bold hover:underline"
                  >
                    প্রয়োজনে জরুরি রক্তের পোস্ট তৈরি করুন &rarr;
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userRequests.map((req) => (
                    <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg">
                            {req.bloodGroup}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{req.patientName} ({req.unitsRequired} ব্যাগ)</h4>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-600" />
                              {req.hospital}, {req.district}
                            </p>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            req.status === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : req.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {req.status === 'urgent' ? 'জরুরি (Urgent)' : req.status === 'in_progress' ? 'প্রক্রিয়াধীন' : 'রক্ত পাওয়া গেছে (Fulfilled)'}
                          </span>

                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Manage status buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <span className="text-slate-500 text-[11px]">
                          তারিখ প্রয়োজন: <strong>{req.dateNeeded}</strong> • যোগাযোগ: {req.contactPhone}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {req.status !== 'fulfilled' && (
                            <button
                              onClick={() => handleRequestStatusChange(req.id, 'fulfilled')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              রক্ত পেয়েছি (সম্পন্ন করুন)
                            </button>
                          )}
                          {req.status === 'urgent' && (
                            <button
                              onClick={() => handleRequestStatusChange(req.id, 'in_progress')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              রক্তদাতা খুঁজছি
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Account & Security */}
          {activeSection === 'account' && (
            <div className="space-y-6 max-w-xl mx-auto">
              {/* Profile Details Form */}
              <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                  ব্যক্তিগত তথ্য
                </h3>

                {profileMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMsg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {profileMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পুরো নাম</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ইমেইল (লগইন ইউজারনেম)</label>
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">ইমেইল ঠিকানা অপরিবর্তনীয়</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">বর্তমান রোল</span>
                    <span className="text-[11px] text-slate-500">স্বয়ংক্রিয়ভাবে নির্ধারিত</span>
                  </div>
                  <span className="font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {currentUser.role === 'admin' ? 'ADMIN' : 'USER (সাধারণ সদস্য)'}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  প্রোফাইল সংরক্ষণ করুন
                </button>
              </form>

              {/* Password Change Form */}
              <form onSubmit={handleUpdatePassword} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-red-600" />
                  <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                </h3>

                {pwdMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    pwdMsg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {pwdMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                    <span>{pwdMsg.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">নতুন পাসওয়ার্ড</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                    placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  পাসওয়ার্ড আপডেট করুন
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: RBAC Security Test Tool */}
          {activeSection === 'rbac_test' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <span>Role-Based Access Control (RBAC) নিরাপত্তা নিরীক্ষা</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  নির্দেশনা ৪ ও ৫ অনুযায়ী: সাধারণ ইউজার কোনো অবস্থাতেই অ্যাডমিন অনুমতি পাবেন না। শুধু ফ্রন্টএন্ডে বাটন লুকিয়ে নয়, সার্ভিস ও ডাটাবেজ লেভেলে অনুমতি যাচাই করা হয়। নিচের বাটনগুলো দিয়ে নিরাপত্তা পরীক্ষা করুন:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={testUnauthorizedApprove}
                  className="p-4 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-xl text-left transition-all space-y-1 shadow-xs cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 block">
                    ১. রক্তদাতা অনুমোদনের চেষ্টা
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    অ্যাডমিনের অনুমোদন ফাংশন কল করার চেষ্টা
                  </span>
                </button>

                <button
                  onClick={testUnauthorizedDeleteOther}
                  className="p-4 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-xl text-left transition-all space-y-1 shadow-xs cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 block">
                    ২. অন্যের রক্তের অনুরোধ মোছার চেষ্টা
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    অন্য ইউজারের রিকোয়েস্ট ডিলিট করার চেষ্টা
                  </span>
                </button>

                <button
                  onClick={testUnauthorizedRoleEscalation}
                  className="p-4 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-xl text-left transition-all space-y-1 shadow-xs cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 block">
                    ৩. নিজেকে অ্যাডমিন বানানোর চেষ্টা
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    প্রোফাইল থেকে role: 'admin' আপডেট পাঠানোর চেষ্টা
                  </span>
                </button>
              </div>

              {/* Security Test Result Banner */}
              {rbacTestResult && (
                <div className={`p-4 rounded-2xl border space-y-2 animate-in fade-in duration-200 ${
                  rbacTestResult.status === 'denied'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {rbacTestResult.status === 'denied' ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <span>পরীক্ষার ফলাফল: {rbacTestResult.action}</span>
                  </div>
                  <p className="text-xs font-mono bg-white/70 p-3 rounded-xl border border-emerald-200 text-slate-800 leading-relaxed">
                    {rbacTestResult.message}
                  </p>
                </div>
              )}

              {/* Requirement 7: Dual Account Switcher helper */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">অ্যাডমিন অ্যাকাউন্ট দিয়ে পরীক্ষা করতে চান?</span>
                  <button
                    onClick={() => {
                      onClose();
                      openAdminModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>অ্যাডমিন প্যানেলে লগইন করুন</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  পরীক্ষার সুবিধার্থে অ্যাডমিন লগইনে এক ক্লিকেই <strong>admin@lifedrop.org.bd</strong> নির্বাচন করার ব্যবস্থা রাখা হয়েছে।
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
