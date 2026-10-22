import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile, Donor, BloodRequest, RequestStatus, BloodGroup, Gender, ActivePage } from '../types';
import { bloodService } from '../services/bloodService';
import { authService, getSupabaseConfig } from '../services/supabaseClient';
import { BANGLADESH_DIVISIONS } from '../data/bangladeshGeo';
import { 
  User, 
  HeartHandshake, 
  AlertCircle, 
  CheckCircle, 
  CheckCircle2,
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
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Edit3,
  Briefcase,
  Share2,
  Database,
  ArrowRight,
  Award,
  Star,
  Crown,
  Printer,
  Download,
  Sparkles,
  QrCode
} from 'lucide-react';
import { certificateService, DonorBadge } from '../services/certificateService';
import { smsOtpService } from '../services/smsOtpService';
import { CertificateModal } from './CertificateModal';
import { OtpVerificationModal } from './OtpVerificationModal';
import { DonationCertificate } from '../types';

interface UserDashboardPageProps {
  currentUser: UserProfile;
  setActivePage: (page: ActivePage) => void;
  openAdminModal: () => void;
  onLogout: () => void;
}

type DashboardTab = 'profile' | 'donor' | 'requests' | 'certificates' | 'security';


// Avatar Presets for users to choose easily
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=250&q=80'
];

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  currentUser,
  setActivePage,
  openAdminModal,
  onLogout
}) => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DashboardTab>('profile');

  // Profile Form States
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(currentUser.bloodGroup || 'O+');
  const [division, setDivision] = useState(currentUser.division || 'Dhaka');
  const [district, setDistrict] = useState(currentUser.district || 'Dhaka');
  const [upazila, setUpazila] = useState(currentUser.upazila || 'Dhanmondi');
  const [gender, setGender] = useState<Gender>(currentUser.gender || 'male');
  const [age, setAge] = useState<number>(currentUser.age || 25);
  const [occupation, setOccupation] = useState(currentUser.occupation || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || AVATAR_PRESETS[0]);
  const [isCustomAvatarOpen, setIsCustomAvatarOpen] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  // Status message
  const [profileMessage, setProfileMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Donor Data
  const [donorRecord, setDonorRecord] = useState<Donor | null>(null);
  const [lastDonationDateInput, setLastDonationDateInput] = useState('');

  // Requests Data
  const [userRequests, setUserRequests] = useState<BloodRequest[]>([]);

  // Password Update States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // RBAC Test State
  const [rbacTestResult, setRbacTestResult] = useState<{ action: string; status: 'denied' | 'success'; message: string } | null>(null);

  // Requirement 2: Digital Certificates State
  const [userCertificates, setUserCertificates] = useState<DonationCertificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<DonationCertificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isAddingDonationRecord, setIsAddingDonationRecord] = useState(false);
  const [newDonationHospital, setNewDonationHospital] = useState('');
  const [newDonationDate, setNewDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDonationLocation, setNewDonationLocation] = useState('');
  const [newDonationNotes, setNewDonationNotes] = useState('');
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const isProfileLocked = currentUser.role !== 'admin';

  // Requirement 1: Phone OTP Verification State in Dashboard
  const [isDashboardOtpOpen, setIsDashboardOtpOpen] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(() => {
    return phone ? smsOtpService.isPhoneVerified(phone) : false;
  });

  const supabaseConfig = getSupabaseConfig();

  // Load user data & records
  const refreshUserData = () => {
    const donor = bloodService.getUserDonorProfile(currentUser.id);
    setDonorRecord(donor);
    if (donor?.lastDonationDate) {
      setLastDonationDateInput(donor.lastDonationDate);
    }
    const reqs = bloodService.getUserRequests(currentUser.id);
    setUserRequests(reqs);

    // Sync & load certificates
    if (donor) {
      const certs = certificateService.syncCertificatesForDonor(donor, currentUser);
      setUserCertificates(certs);
    } else {
      const certs = certificateService.getUserCertificates(currentUser.id, undefined, currentUser.fullName);
      setUserCertificates(certs);
    }
  };

  useEffect(() => {
    refreshUserData();
    const unsub = bloodService.subscribe(refreshUserData);
    return unsub;
  }, [currentUser.id]);


  // Geographic cascade
  const availableDistricts = useMemo(() => {
    const divObj = BANGLADESH_DIVISIONS.find(d => d.nameEn === division);
    return divObj ? divObj.districts : [];
  }, [division]);

  const availableUpazilas = useMemo(() => {
    const distObj = availableDistricts.find(d => d.nameEn === district);
    return distObj ? distObj.upazilas : [];
  }, [availableDistricts, district]);

  // Save Profile Details (Requirement 5)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsSavingProfile(true);

    const res = await authService.updateProfile(currentUser.id, {
      fullName: fullName.trim(),
      phone: phone.trim(),
      bloodGroup,
      division,
      district,
      upazila,
      gender,
      age,
      occupation: occupation.trim(),
      bio: bio.trim(),
      avatarUrl
    }, currentUser);

    setIsSavingProfile(false);

    if (res.success) {
      // Sync linked donor if one exists
      if (donorRecord) {
        bloodService.updateDonor(donorRecord.id, {
          fullName: fullName.trim(),
          phone: phone.trim(),
          bloodGroup,
          division,
          district,
          upazila,
          photoUrl: avatarUrl,
          occupation: occupation.trim()
        }, currentUser);
      }

      setProfileMessage({ text: 'আপনার ব্যক্তিগত তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!', isError: false });
      setTimeout(() => setProfileMessage(null), 3500);
    } else {
      setProfileMessage({ text: res.message || 'সংরক্ষণ ব্যর্থ হয়েছে।', isError: true });
    }
  };

  // Activate / Become a Donor (Requirement 6)
  const handleActivateDonor = async () => {
    const newDonor = await bloodService.activateUserAsDonor(currentUser, {
      bloodGroup,
      division,
      district,
      upazila,
      gender,
      age,
      occupation
    });
    setDonorRecord(newDonor);
    setProfileMessage({ text: 'অভিনন্দন! আপনি সফলভাবে রক্তদাতা নেটওয়ার্কে যুক্ত হয়েছেন।', isError: false });
  };

  // Toggle Donor Availability
  const handleToggleAvailability = () => {
    if (!donorRecord) return;
    try {
      bloodService.updateDonor(donorRecord.id, { isAvailable: !donorRecord.isAvailable }, currentUser);
      refreshUserData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Requirement 4: Submit New Donation Info for Admin Verification
  const handleSubmitNewDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonationHospital.trim() || !newDonationDate) {
      setProfileMessage({ text: 'অনুগ্রহ করে হাসপাতালের নাম ও রক্তদানের তারিখ সঠিকভাবে দিন।', isError: true });
      return;
    }

    let targetDonor = donorRecord;
    if (!targetDonor) {
      targetDonor = await bloodService.activateUserAsDonor(currentUser, {
        bloodGroup,
        division,
        district,
        upazila
      });
      setDonorRecord(targetDonor);
    }
    if (!targetDonor) return;

    setIsSubmittingDonation(true);
    try {
      bloodService.submitDonationRecord(
        targetDonor.id,
        {
          hospital: newDonationHospital.trim(),
          date: newDonationDate,
          location: newDonationLocation.trim() || `${upazila}, ${district}`,
          notes: newDonationNotes.trim()
        },
        currentUser
      );

      setProfileMessage({
        text: 'আপনার রক্তদানের তথ্যটি সফলভাবে পর্যালোচনার জন্য জমা দেওয়া হয়েছে! অ্যাডমিন যাচাই করে অনুমোদন দিলে আপনার মোট রক্তদানের সংখ্যা বৃদ্ধি পাবে এবং প্রশংসাপত্র প্রস্তুত হবে।',
        isError: false
      });
      setNewDonationHospital('');
      setNewDonationLocation('');
      setNewDonationNotes('');
      setIsAddingDonationRecord(false);
      refreshUserData();
      setTimeout(() => setProfileMessage(null), 5000);
    } catch (err: any) {
      setProfileMessage({ text: err.message || 'রক্তদানের তথ্য জমা দিতে সমস্যা হয়েছে।', isError: true });
    } finally {
      setIsSubmittingDonation(false);
    }
  };


  // Request Status Changer
  const handleRequestStatusChange = (reqId: string, status: RequestStatus) => {
    try {
      bloodService.updateRequestStatus(reqId, status, currentUser);
      refreshUserData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete User's Blood Request
  const handleDeleteRequest = (reqId: string) => {
    if (window.confirm('আপনি কি এই রক্তের আবেদনটি মুছে ফেলতে চান?')) {
      try {
        bloodService.deleteRequest(reqId, currentUser);
        refreshUserData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Password Change Handler
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);

    if (newPassword !== confirmPassword) {
      setPwdMessage({ text: 'উভয় পাসওয়ার্ড একই হতে হবে।', isError: true });
      return;
    }

    if (newPassword.length < 6) {
      setPwdMessage({ text: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', isError: true });
      return;
    }

    const res = await authService.updatePassword(newPassword);
    if (res.success) {
      setPwdMessage({ text: res.message, isError: false });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdMessage(null), 3500);
    } else {
      setPwdMessage({ text: res.message, isError: true });
    }
  };

  // RBAC Permission Test (Requirement 7)
  const testUnauthorizedAdminAction = () => {
    try {
      bloodService.approveDonor('test-donor-id', currentUser);
      setRbacTestResult({
        action: 'অ্যাডমিন অনুমতি টেস্ট',
        status: 'success',
        message: 'সতর্কতা: সাধারণ ইউজারের মাধ্যমে অনুমোদন সফল হয়েছে (নিরাপত্তা ত্রুটি)!'
      });
    } catch (err: any) {
      setRbacTestResult({
        action: 'অ্যাডমিন অনুমতি টেস্ট',
        status: 'denied',
        message: `প্রবেশাধিকার প্রত্যাখ্যাত (403 Forbidden): "${err.message}". ব্যাকএন্ড এবং Supabase RLS দিয়ে সাধারণ ইউজারের অনুমতি সঠিকভাবে সুরক্ষিত রয়েছে!`
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          {/* User info snippet with Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-red-100 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="absolute -bottom-1 -right-1 p-1.5 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                title="ছবি পরিবর্তন করুন"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                  {currentUser.fullName}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {currentUser.role === 'admin' ? '🛡️ প্রধান অ্যাডমিন' : '👤 সাধারণ সদস্য (User)'}
                </span>
                <span className="text-sm font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                  {bloodGroup}
                </span>
              </div>

              <p className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-3">
                <span>{currentUser.email}</span>
                {phone && <span>• {phone}</span>}
                <span>• {district}, {division}</span>
              </p>

              <div className="flex items-center gap-2 pt-1 text-xs">
                {donorRecord ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>রক্তদাতা স্ট্যাটাস: {donorRecord.isAvailable ? 'রক্তদানে প্রস্তুত' : 'অনুপলব্ধ'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>রক্তদাতা হিসেবে তালিকাভুক্ত নন</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {currentUser.role === 'admin' && (
              <button
                onClick={openAdminModal}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Shield className="w-4 h-4 text-red-500" />
                <span>অ্যাডমিন কন্ট্রোল প্যানেল</span>
              </button>
            )}

            <button
              onClick={() => {
                setActivePage('emergency');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>জরুরি রক্তের অনুরোধ</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1 overflow-x-auto text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>প্রোফাইল ও ছবি</span>
        </button>

        <button
          onClick={() => setActiveTab('donor')}
          className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'donor'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>রক্তদাতা প্রোফাইল</span>
          {donorRecord && (
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>আমার রক্তের অনুরোধ</span>
          <span className="text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
            {userRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'certificates'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>ডিজিটাল সনদ ও ব্যাজ</span>
          <span className="text-[11px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
            {userCertificates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-2.5 px-4 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>নিরাপত্তা ও পাসওয়ার্ড</span>
        </button>
      </div>


      {/* Global Status Message */}
      {profileMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 transition-all ${
          profileMessage.isError
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {profileMessage.isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span className="font-semibold">{profileMessage.text}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: PROFILE & PHOTO EDITING (Requirement 5)               */}
      {/* ============================================================ */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Avatar & Photo Customizer */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-red-600" />
                <span>প্রোফাইল ছবি নির্বাচন</span>
              </h3>

              <div className="text-center space-y-3">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-28 h-28 mx-auto rounded-2xl object-cover border-4 border-red-50 shadow-md"
                />
                <p className="text-xs text-slate-500">
                  নিচের প্রি-সেট থেকে যেকোনো একটি ছবি নির্বাচন করুন অথবা নিজস্ব ছবির লিংক দিন।
                </p>
              </div>

              {/* Avatar Preset Grid */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {AVATAR_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                      avatarUrl === preset ? 'border-red-600 scale-105 shadow-xs' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${index + 1}`} className="w-full h-14 object-cover rounded-lg" />
                  </button>
                ))}
              </div>

              {/* Custom Image URL Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomAvatarOpen(!isCustomAvatarOpen)}
                  className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isCustomAvatarOpen ? 'কাস্টম লিংক বন্ধ করুন' : 'নিজস্ব ছবির URL যোগ করুন'}</span>
                </button>

                {isCustomAvatarOpen && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="url"
                      value={customAvatarInput}
                      onChange={(e) => setCustomAvatarInput(e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customAvatarInput.trim()) {
                          setAvatarUrl(customAvatarInput.trim());
                          setIsCustomAvatarOpen(false);
                        }
                      }}
                      className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      ছবি প্রয়োগ করুন
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cloud Storage Note (Requirement 8) */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs space-y-2 text-slate-600">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-red-600" />
                <span>ক্লাউড ডাটাবেজ স্থিতি</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                {supabaseConfig.isConfigured
                  ? 'আপনার সকল প্রোফাইল তথ্য Supabase PostgreSQL ক্লাউডে সংরক্ষিত হচ্ছে।'
                  : 'বর্তমানে ব্রাউজারের লোকাল স্টোরেজে সুরক্ষিতভাবে সংরক্ষিত। .env ফাইল কনফিগার করলে ক্লাউডে সিঙ্ক হবে।'}
              </p>
            </div>
          </div>

          {/* Right Column: Personal Info Form */}
          <div className="md:col-span-8">
            <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-red-600" />
                    <span>ব্যক্তিগত তথ্যাদি ও প্রোফাইল</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isProfileLocked 
                      ? 'নিরাপত্তা ও নির্ভরযোগ্যতার স্বার্থে মূল তথ্য অপরিবর্তনশীল' 
                      : 'অ্যাডমিন মোড: ব্যবহারকারীর তথ্য সম্পাদনা'}
                  </p>
                </div>
                {isProfileLocked && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <Lock className="w-3 h-3 text-amber-600" />
                    তথ্য লককৃত
                  </span>
                )}
              </div>

              {/* Security Policy Notice (Requirement 4) */}
              {isProfileLocked && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">তথ্যের সত্যতা ও নিরাপত্তা নীতি:</span>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      সাধারণ ব্যবহারকারী নিজের নাম, রক্তের গ্রুপ, মোবাইল নম্বর বা ঠিকানা পরিবর্তন করতে পারবেন না। তথ্যে সংশোধন থাকলে অ্যাডমিন সহায়তায় যোগাযোগ করুন। আপনি নিচে শুধু রক্তদানের নতুন তথ্য জমা দিতে পারবেন।
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name (Locked for regular user) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>পুরো নাম</span>
                    {isProfileLocked && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    disabled={isProfileLocked}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-xs ${
                      isProfileLocked
                        ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed font-medium'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-600'
                    }`}
                    required
                  />
                </div>

                {/* Email (Readonly) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>ইমেইল ঠিকানা</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </label>
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed font-mono font-medium"
                  />
                </div>

                {/* Phone (Locked for regular user) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <span>মোবাইল নম্বর</span>
                      {isProfileLocked && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    {isPhoneVerified || smsOtpService.isPhoneVerified(phone) ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ওটিপি যাচাইকৃত
                      </span>
                    ) : null}
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    disabled={isProfileLocked}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhone(val);
                      setIsPhoneVerified(smsOtpService.isPhoneVerified(val));
                    }}
                    className={`w-full p-2.5 border rounded-xl text-xs font-mono ${
                      isProfileLocked
                        ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed font-medium'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-600'
                    }`}
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </div>

                {/* Blood Group (Locked for regular user) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>রক্তের গ্রুপ</span>
                    {isProfileLocked && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  <select
                    value={bloodGroup}
                    disabled={isProfileLocked}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className={`w-full p-2.5 border rounded-xl text-xs font-bold text-red-700 ${
                      isProfileLocked
                        ? 'bg-slate-100 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-600'
                    }`}
                  >
                    {(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as BloodGroup[]).map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Gender (Locked for regular user) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>লিঙ্গ</span>
                    {isProfileLocked && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  <select
                    value={gender}
                    disabled={isProfileLocked}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className={`w-full p-2.5 border rounded-xl text-xs ${
                      isProfileLocked
                        ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-600'
                    }`}
                  >
                    <option value="male">পুরুষ</option>
                    <option value="female">নারী</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>

                {/* Age (Locked for regular user) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>বয়স (বছর)</span>
                    {isProfileLocked && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="65"
                    value={age}
                    disabled={isProfileLocked}
                    onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                    className={`w-full p-2.5 border rounded-xl text-xs ${
                      isProfileLocked
                        ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-600'
                    }`}
                  />
                </div>

                {/* Division (Locked for regular user) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>বিভাগ</span>
                    {isProfileLocked && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  <select
                    value={division}
                    disabled={isProfileLocked}
                    onChange={(e) => {
                      setDivision(e.target.value);
                      const divObj = BANGLADESH_DIVISIONS.find(d => d.nameEn === e.target.value);
                      if (divObj && divObj.districts[0]) {
                        setDistrict(divObj.districts[0].nameEn);
                        setUpazila(divObj.districts[0].upazilas[0] || '');
                      }
                    }}
                    className={`w-full p-2.5 border rounded-xl text-xs ${
                      isProfileLocked
                        ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-600'
                    }`}
                  >
                    {BANGLADESH_DIVISIONS.map(d => (
                      <option key={d.id} value={d.nameEn}>{d.nameBn} ({d.nameEn})</option>
                    ))}
                  </select>
                </div>

                {/* District (Locked for regular user) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>জেলা</span>
                    {isProfileLocked && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  <select
                    value={district}
                    disabled={isProfileLocked}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      const distObj = availableDistricts.find(d => d.nameEn === e.target.value);
                      if (distObj && distObj.upazilas[0]) {
                        setUpazila(distObj.upazilas[0]);
                      }
                    }}
                    className={`w-full p-2.5 border rounded-xl text-xs ${
                      isProfileLocked
                        ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-600'
                    }`}
                  >
                    {availableDistricts.map(d => (
                      <option key={d.id} value={d.nameEn}>{d.nameBn} ({d.nameEn})</option>
                    ))}
                  </select>
                </div>

                {/* Upazila (Locked for regular user) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>উপজেলা / থানা</span>
                    {isProfileLocked && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  <select
                    value={upazila}
                    disabled={isProfileLocked}
                    onChange={(e) => setUpazila(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-xs ${
                      isProfileLocked
                        ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-600'
                    }`}
                  >
                    {availableUpazilas.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action row at bottom of Profile form */}
              <div className="pt-2">
                {isProfileLocked ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>নাম, রক্তের গ্রুপ, ফোন ও ঠিকানা অপরিবর্তনশীল।</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('donor')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>রক্তদানের নতুন তথ্য জমা দিন &rarr;</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    <span>প্রোফাইল তথ্য সংরক্ষণ করুন (অ্যাডমিন)</span>
                  </button>
                )}
              </div>
            </form>

            {/* Requirement 3: User Donation History Display directly on Profile View */}
            <div className="mt-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-red-600" />
                    <span>রক্তদানের ইতিহাস ও বিবরণ</span>
                  </h3>
                  <p className="text-xs text-slate-500">আপনার সম্পন্ন করা রক্তদান ও যাচাইয়ের অবস্থা</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('donor')}
                  className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন তথ্য জমা দিন</span>
                </button>
              </div>

              {donorRecord?.history && donorRecord.history.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {donorRecord.history.map((record) => (
                    <div key={record.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{record.hospital}</span>
                        <span className="text-slate-500 text-[11px] block">{record.location}</span>
                        {record.notes && (
                          <span className="text-slate-500 text-[10px] italic block">{record.notes}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-700 font-semibold">{record.date}</span>
                        {record.status === 'pending' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            যাচাইাধীন (Pending)
                          </span>
                        ) : record.status === 'rejected' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                            বাতিলকৃত
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            অনুমোদিত
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl space-y-2">
                  <p>এখনও কোনো রক্তদানের রেকর্ড যোগ করা হয়নি।</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('donor')}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    প্রথম রক্তদানের তথ্য জমা দিন &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: DONOR STATUS & DONATIONS (Requirement 6)             */}
      {/* ============================================================ */}
      {activeTab === 'donor' && (
        <div className="space-y-6">
          {donorRecord ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Digital Donor Card */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-linear-to-br from-red-600 via-red-700 to-rose-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <Droplet className="absolute -right-6 -bottom-6 w-44 h-44 text-white/10 pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white text-red-600 flex items-center justify-center font-black">
                        <Droplet className="w-5 h-5 fill-red-600 text-red-600" />
                      </div>
                      <div>
                        <span className="font-bold text-base tracking-tight block">LifeDrop</span>
                        <span className="text-[10px] text-red-200 tracking-wider uppercase block">
                          Volunteer Donor Card
                        </span>
                      </div>
                    </div>
                    <span className="text-2xl font-black bg-white/20 px-3 py-1 rounded-xl">
                      {donorRecord.bloodGroup}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-red-200 uppercase block">রক্তদাতার নাম</span>
                      <span className="text-base font-bold block">{donorRecord.fullName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-red-200 block">মোবাইল:</span>
                        <span className="font-mono font-semibold">{donorRecord.phone}</span>
                      </div>
                      <div>
                        <span className="text-red-200 block">মোট রক্তদান:</span>
                        <span className="font-bold text-sm text-yellow-300">{donorRecord.totalDonations || 0} বার</span>
                      </div>
                    </div>

                    <div className="text-[11px]">
                      <span className="text-red-200 block">ঠিকানা:</span>
                      <span>{donorRecord.upazila}, {donorRecord.district}, {donorRecord.division}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between text-[11px]">
                    <span className="bg-white/20 px-2 py-0.5 rounded font-mono text-[10px]">
                      ID: {donorRecord.id.substring(0, 12)}
                    </span>
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {donorRecord.approvalStatus === 'approved' ? 'ভেরিফাইড রক্তদাতা' : 'পেন্ডিং ভেরিফিকেশন'}
                    </span>
                  </div>
                </div>

                {/* Quick Availability Switch */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">রক্তদানের প্রস্তুতি স্ট্যাটাস</h4>
                    <p className="text-[11px] text-slate-500">জরুরি প্রয়োজনে রোগীরা আপনাকে কল করতে পারবে</p>
                  </div>
                  <button
                    onClick={handleToggleAvailability}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      donorRecord.isAvailable
                        ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {donorRecord.isAvailable ? '✓ প্রস্তুত (Active)' : 'অনুপলব্ধ (Inactive)'}
                  </button>
                </div>
              </div>

              {/* Right Column: Update Donation History & Schedule */}
              <div className="md:col-span-7 space-y-4">
                {/* Submit New Blood Donation Entry Form (Requirement 4) */}
                <form onSubmit={handleSubmitNewDonation} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-red-600" />
                      <span>রক্তদানের নতুন তথ্য জমা দিন</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      সফলভাবে রক্তদান সম্পন্ন করার পর এখানে তথ্য জমা দিন। অ্যাডমিন যাচাই করে অনুমোদন দিলে আপনার রক্তদানের সংখ্যা আপডেট হবে।
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        হাসপাতাল / রক্তদান কেন্দ্রের নাম <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল"
                        value={newDonationHospital}
                        onChange={(e) => setNewDonationHospital(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          রক্তদানের তারিখ <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          value={newDonationDate}
                          onChange={(e) => setNewDonationDate(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          অবস্থান / জেলা
                        </label>
                        <input
                          type="text"
                          placeholder={`যেমন: ${district}, ${division}`}
                          value={newDonationLocation}
                          onChange={(e) => setNewDonationLocation(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        নোট বা স্লিপ বিবরণ (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: রোগীর জন্য জরুরি রক্তদান / রক্তের ব্যাগ নম্বর"
                        value={newDonationNotes}
                        onChange={(e) => setNewDonationNotes(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingDonation}
                      className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingDonation ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span>রক্তদানের তথ্য জমা দিন (যাচাইয়ের জন্য)</span>
                    </button>
                  </div>
                </form>

                {/* Donation Records Log */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span>অতীত রক্তদানের ইতিহাস</span>
                    <span className="text-xs text-red-600 font-semibold">
                      অনুমোদিত অনুদান: {donorRecord.totalDonations || 0} বার
                    </span>
                  </h3>

                  {donorRecord.history && donorRecord.history.length > 0 ? (
                    <div className="divide-y divide-slate-100 text-xs">
                      {donorRecord.history.map((record) => (
                        <div key={record.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 block">{record.hospital}</span>
                            <span className="text-slate-500 text-[11px] block">{record.location}</span>
                            {record.notes && (
                              <span className="text-slate-500 text-[10px] italic block">{record.notes}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-700 font-semibold">{record.date}</span>
                            {record.status === 'pending' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                অপেক্ষমাণ (পেন্ডিং)
                              </span>
                            ) : record.status === 'rejected' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                                বাতিল
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                অনুমোদিত
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                      এখনও কোনো রক্তদানের রেকর্ড যোগ করা হয়নি। রক্তদানের পর উপরের ফর্ম থেকে তথ্য জমা দিন।
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* If User is NOT a donor yet, offer instant 1-click activation (Requirement 6) */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-5 shadow-xs max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-sm">
                <HeartHandshake className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  আপনি কি লাইফড্রপ রক্তদাতা হতে চান?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                  আপনার এক ব্যাগ রক্ত বাঁচাতে পারে একটি মুমূর্ষু শিশুর প্রাণ। আপনার প্রোফাইলের তথ্যের ভিত্তিতে এখনই নিজেকে রক্তদাতা হিসেবে সক্রিয় করুন।
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1 max-w-sm mx-auto text-left">
                <p><strong>রক্তের গ্রুপ:</strong> {bloodGroup}</p>
                <p><strong>ফোন নম্বর:</strong> {phone || 'প্রোফাইলে দিন'}</p>
                <p><strong>ঠিকানা:</strong> {district}, {division}</p>
              </div>

              <button
                type="button"
                onClick={handleActivateDonor}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>রক্তদাতা হিসেবে সক্রিয় করুন (Activate as Donor)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: MY EMERGENCY REQUESTS (Requirement 4)                  */}
      {/* ============================================================ */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">আপনার পোস্টকৃত রক্তের আবেদনসমূহ</h3>
              <p className="text-xs text-slate-500">জরুরি রক্তের প্রয়োজন মিটে গেলে স্ট্যাটাস পরিবর্তন করুন</p>
            </div>

            <button
              onClick={() => {
                setActivePage('emergency');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন রক্তের অনুরোধ তৈরি করুন</span>
            </button>
          </div>

          {userRequests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">আপনি এখনও কোনো রক্তের আবেদন পোস্ট করেননি</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                জরুরি মুহূর্তে রক্তের প্রয়োজন হলে ফর্ম পূরণ করে আবেদনটি সরাসরি লাইভ প্ল্যাটফর্মে প্রচার করতে পারবেন।
              </p>
              <button
                onClick={() => {
                  setActivePage('emergency');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-bold text-red-600 hover:underline pt-1 cursor-pointer"
              >
                আবেদন ফর্ম খুলুন &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
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
                          <MapPin className="w-3.5 h-3.5 text-red-600" />
                          {req.hospital}, {req.district}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        req.status === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : req.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {req.status === 'urgent' ? 'জরুরি (Urgent)' : req.status === 'in_progress' ? 'প্রক্রিয়াধীন' : 'সম্পন্ন (Fulfilled)'}
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

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 pt-1">
                    <span>তারিখ প্রয়োজন: <strong>{req.dateNeeded}</strong> • যোগাযোগ: {req.contactPhone}</span>

                    <div className="flex items-center gap-2">
                      {req.status !== 'fulfilled' && (
                        <button
                          onClick={() => handleRequestStatusChange(req.id, 'fulfilled')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          রক্ত পেয়েছি (সম্পন্ন করুন)
                        </button>
                      )}
                      {req.status === 'urgent' && (
                        <button
                          onClick={() => handleRequestStatusChange(req.id, 'in_progress')}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          প্রক্রিয়াধীন করুন
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

      {/* ============================================================ */}
      {/* TAB: DIGITAL CERTIFICATES & DONOR APPRECIATION BADGES       */}
      {/* ============================================================ */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          
          {/* Top Banner: Donor Recognition Hero */}
          <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-red-900/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
              <Award className="w-64 h-64 text-amber-400" />
            </div>

            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>অফিসিয়াল ডিজিটাল প্রশংসাপত্র ও সম্মাননা</span>
              </div>

              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white font-display">
                রক্তদানের ডিজিটাল সার্টিফিকেট (Certificate of Appreciation)
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                মানবতার সেবায় আপনার প্রতিটি রক্তদান একটি নতুন জীবনের আশা জাগিয়ে তোলে। সফলভাবে রক্তদানের পর আপনার জন্য ডিজিটাল সম্মাননা সনদ প্রস্তুত করা হয়, যা সরাসরি ডাউনলোড ও প্রিন্ট করা যায়।
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingDonationRecord(!isAddingDonationRecord)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-red-900/50 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন রক্তদান যোগ করুন ও প্রশংসাপত্র পান</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form to Record Completed Blood Donation & Instant Certificate Generation */}
          {isAddingDonationRecord && (
            <form onSubmit={handleSubmitNewDonation} className="bg-white border-2 border-red-200 rounded-3xl p-6 shadow-md space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    রক্তদানের নতুন তথ্য জমা দিন
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingDonationRecord(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    হাসপাতাল / রক্তদান কেন্দ্রের নাম <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল"
                    value={newDonationHospital}
                    onChange={(e) => setNewDonationHospital(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    রক্তদানের তারিখ <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDonationDate}
                    onChange={(e) => setNewDonationDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    স্থান / এলাকা
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ধানমন্ডি, ঢাকা"
                    value={newDonationLocation}
                    onChange={(e) => setNewDonationLocation(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDonationRecord(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDonation}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-red-200 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingDonation ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>রক্তদানের তথ্য জমা দিন (যাচাইয়ের অপেক্ষায়)</span>
                </button>
              </div>
            </form>
          )}

          {/* Donor Achievement Badges & Milestones */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  রক্তদাতা সম্মাননা মেডেল ও ব্যাজ
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                মোট রক্তদান: <strong className="text-red-600 font-bold">{donorRecord?.totalDonations || userCertificates.length || 0} বার</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {certificateService.getDonorBadges(donorRecord?.totalDonations || userCertificates.length || 0).map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    badge.unlocked
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 opacity-60 grayscale'
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-2 shadow-xs ${
                    badge.unlocked ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {badge.iconName === 'crown' ? (
                      <Crown className="w-6 h-6" />
                    ) : badge.iconName === 'star' ? (
                      <Star className="w-6 h-6" />
                    ) : (
                      <Award className="w-6 h-6" />
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 leading-tight">
                    {badge.titleBn}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                    {badge.descriptionBn}
                  </p>
                  <div className="mt-2 text-[10px]">
                    {badge.unlocked ? (
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                        ✓ আনলকড
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        প্রয়োজন: {badge.requiredDonations} বার
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certificates Grid List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  আপনার অর্জিত প্রশংসাপত্রসমূহ ({userCertificates.length})
                </h3>
                <p className="text-xs text-slate-500">
                  লাইফড্রপ বাংলাদেশ কর্তৃক সত্যায়িত ও কিউআর ভেরিফাইড সম্মাননা সনদ
                </p>
              </div>
            </div>

            {userCertificates.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4">
                <Award className="w-16 h-16 text-amber-300 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    এখনও কোনো প্রশংসাপত্র ইস্যু করা হয়নি
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    আপনি কি সম্প্রতি রক্তদান করেছেন? আপনার রক্তদানের হাসপাতাল ও তারিখ যোগ করুন, সাথে সাথে অফিসিয়াল ডিজিটাল প্রশংসাপত্র তৈরি হয়ে যাবে।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingDonationRecord(true)}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  প্রথম রক্তদান যোগ করুন ও সনদ পান
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {userCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-white rounded-3xl border-2 border-amber-200/90 shadow-md overflow-hidden hover:border-amber-400 transition-all flex flex-col justify-between group"
                  >
                    {/* Certificate Mini Top Preview */}
                    <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 p-4 text-white text-center relative overflow-hidden">
                      <div className="text-[10px] font-bold tracking-widest uppercase text-amber-200">
                        LifeDrop Blood Network
                      </div>
                      <h4 className="text-sm font-extrabold font-serif mt-0.5">
                        প্রশংসাপত্র ও সম্মাননা সনদ
                      </h4>
                      <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-xs rounded-full text-[11px] font-mono">
                        <ShieldCheck className="w-3 h-3 text-amber-300" />
                        <span>{cert.serialNumber}</span>
                      </div>
                    </div>

                    {/* Certificate Details */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                          রক্তদাতা
                        </span>
                        <h3 className="font-bold text-base text-slate-900 font-serif">
                          {cert.donorName}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                          <Droplet className="w-3 h-3 fill-red-600 text-red-600" />
                          <span>গ্রুপ: {cert.bloodGroup}</span>
                          <span className="text-red-300">•</span>
                          <span>{cert.donationCount}ম রক্তদান</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 border border-slate-100">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            তারিখ:
                          </span>
                          <span className="font-semibold text-slate-800">{cert.donationDate}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 truncate">
                          <span className="flex items-center gap-1 shrink-0">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            হাসপাতাল:
                          </span>
                          <span className="font-semibold text-slate-800 truncate" title={cert.hospital}>
                            {cert.hospital}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCert(cert);
                            setIsCertModalOpen(true);
                          }}
                          className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>সনদ দেখুন ও ডাউনলোড</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: SECURITY & PASSWORD (Requirement 7)                    */}
      {/* ============================================================ */}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Password Reset Form */}
          <div className="md:col-span-6 space-y-4">
            <form onSubmit={handlePasswordUpdate} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <KeyRound className="w-4 h-4 text-red-600" />
                <span>পাসওয়ার্ড পরিবর্তন করুন</span>
              </h3>

              {pwdMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pwdMessage.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {pwdMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                  <span>{pwdMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নতুন পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                পাসওয়ার্ড পরিবর্তন সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* Right Column: RBAC Security Policy & Testing Tool (Requirement 7) */}
          <div className="md:col-span-6 space-y-4">
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-red-400" />
                <span>অ্যাক্সেস কন্ট্রোল ও নিরাপত্তা নীতি (RBAC)</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার অ্যাকাউন্টটি সাধারণ সদস্য (Role: user) হিসেবে সুরক্ষিত। ব্যাকএন্ড ও Supabase Row Level Security পলিসি অনুযায়ী:
              </p>

              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>আপনি শুধুমাত্র নিজের প্রোফাইল ও নিজের রক্তের অনুরোধ সম্পাদনা করতে পারেন।</li>
                <li>অ্যাডমিন ব্যতীত কেউ রক্তদাতা অনুমোদন বা অন্যদের অনুরোধ মুছতে পারে না।</li>
                <li>ক্লায়েন্ট থেকে নিজে নিজে রোল পরিবর্তন করে অ্যাডমিন হওয়া অসম্ভব।</li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={testUnauthorizedAdminAction}
                  className="w-full py-2.5 px-3 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>নিরাপত্তা পলিসি যাচাই করুন (Test 403 Forbidden)</span>
                </button>
              </div>

              {rbacTestResult && (
                <div className="p-3 bg-white/10 rounded-xl text-xs text-slate-200 font-mono leading-relaxed border border-white/10">
                  {rbacTestResult.message}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Requirement 2: Digital Certificate View & Print Modal */}
      <CertificateModal
        isOpen={isCertModalOpen}
        certificate={selectedCert}
        onClose={() => {
          setIsCertModalOpen(false);
          setSelectedCert(null);
        }}
      />

      {/* Requirement 1: Dashboard Phone Verification OTP Modal */}
      <OtpVerificationModal
        isOpen={isDashboardOtpOpen}
        phone={phone}
        purpose="phone_verification"
        onVerified={(verified) => {
          setIsPhoneVerified(true);
          setProfileMessage({ text: 'আপনার মোবাইল নম্বর সফলভাবে ওটিপি দিয়ে যাচাই সম্পন্ন হয়েছে!', isError: false });
          setTimeout(() => setProfileMessage(null), 3500);
        }}
        onClose={() => setIsDashboardOtpOpen(false)}
      />

    </div>
  );
};

