import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BloodGroup, Gender, Donor, ActivePage, DonationRecord, UserProfile } from '../types';
import { bloodService } from '../services/bloodService';
import { authService } from '../services/supabaseClient';
import { BANGLADESH_DIVISIONS } from '../data/bangladeshGeo';
import { 
  HeartHandshake, 
  CheckCircle2, 
  Droplet, 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  Calendar, 
  Phone, 
  MapPin,
  AlertCircle,
  Plus,
  Trash2,
  Info,
  ShieldAlert,
  UserCheck,
  User,
  LogIn,
  KeyRound,
  Sparkles,
  Lock,
  Camera,
  Upload,
  X as CloseIcon,
  Image as ImageIcon
} from 'lucide-react';
import { smsOtpService } from '../services/smsOtpService';
import { OtpVerificationModal } from './OtpVerificationModal';
import { certificateService } from '../services/certificateService';


interface DonorRegisterPageProps {
  setActivePage: (page: ActivePage) => void;
  currentUser?: UserProfile | null;
}

export const DonorRegisterPage: React.FC<DonorRegisterPageProps> = ({ setActivePage, currentUser }) => {
  const { lang, t } = useLanguage();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [photoUrl, setPhotoUrl] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Dhanmondi');
  const [age, setAge] = useState<number>(24);
  const [gender, setGender] = useState<Gender>('male');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [occupation, setOccupation] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('ছবির আকার সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে পারে।');
      return;
    }

    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Account integration states (Requirement 6)
  const [createAccountWithDonor, setCreateAccountWithDonor] = useState(!currentUser);
  const [accountPassword, setAccountPassword] = useState('');
  const [confirmAccountPassword, setConfirmAccountPassword] = useState('');

  // Explicit consent states
  const [consentContact, setConsentContact] = useState(false);
  const [consentVoluntary, setConsentVoluntary] = useState(false);
  const [phoneConsent, setPhoneConsent] = useState(true);

  // Past donation history entries
  const [historyEntries, setHistoryEntries] = useState<{ hospital: string; date: string; location: string }[]>([]);
  const [newHospital, setNewHospital] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [registeredDonor, setRegisteredDonor] = useState<Donor | null>(null);
  
  // Requirement 1: SMS / OTP verification state
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(() => {
    return currentUser?.phone ? smsOtpService.isPhoneVerified(currentUser.phone) : false;
  });


  // Geographic cascade
  const availableDistricts = useMemo(() => {
    const divObj = BANGLADESH_DIVISIONS.find(d => d.nameEn === division);
    return divObj ? divObj.districts : [];
  }, [division]);

  const availableUpazilas = useMemo(() => {
    const distObj = availableDistricts.find(d => d.nameEn === district);
    return distObj ? distObj.upazilas : [];
  }, [district, availableDistricts]);

  const handleDivisionChange = (newDiv: string) => {
    setDivision(newDiv);
    const divObj = BANGLADESH_DIVISIONS.find(d => d.nameEn === newDiv);
    if (divObj && divObj.districts.length > 0) {
      setDistrict(divObj.districts[0].nameEn);
      setUpazila(divObj.districts[0].upazilas[0] || '');
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const distObj = availableDistricts.find(d => d.nameEn === newDist);
    if (distObj && distObj.upazilas.length > 0) {
      setUpazila(distObj.upazilas[0]);
    }
  };

  const handleAddHistory = () => {
    if (!newHospital.trim() || !newDate) return;
    setHistoryEntries([
      ...historyEntries,
      {
        hospital: newHospital.trim(),
        date: newDate,
        location: newLocation.trim() || `${district}, ${division}`
      }
    ]);
    setNewHospital('');
    setNewDate('');
    setNewLocation('');
  };

  const handleRemoveHistory = (index: number) => {
    setHistoryEntries(historyEntries.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।' : 'Please enter your full name.');
      return;
    }

    // Bangladesh mobile number validation (starts with 01, 11 digits)
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('01') || cleanPhone.length !== 11) {
      setErrorMsg(
        lang === 'bn' 
          ? 'অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)।' 
          : 'Please enter a valid 11-digit Bangladeshi mobile number (e.g., 01712345678).'
      );
      return;
    }

    // Requirement 1: Mobile OTP Verification enforcement
    if (!isPhoneVerified && !smsOtpService.isPhoneVerified(cleanPhone)) {
      setIsOtpModalOpen(true);
      return;
    }

    if (age < 18 || age > 65) {
      setErrorMsg(
        lang === 'bn' 
          ? 'রক্তদানের জন্য বয়স ১৮ থেকে ৬৫ বছরের মধ্যে হতে হবে।' 
          : 'Donors must be between 18 and 65 years old.'
      );
      return;
    }

    if (!consentContact || !consentVoluntary) {
      setErrorMsg(
        lang === 'bn' 
          ? 'অনুগ্রহ করে যোগাযোগ সম্মতি ও স্বেচ্ছাসেবী রক্তদানের শর্তসমূহে টিক দিন।' 
          : 'Please confirm explicit consent for contact visibility and voluntary participation.'
      );
      return;
    }

    let effectiveUser: UserProfile | null = currentUser || null;

    // Requirement 6: If user is not logged in but chooses to create account
    if (!currentUser && createAccountWithDonor) {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('অ্যাকাউন্ট তৈরি করার জন্য একটি সঠিক ইমেইল ঠিকানা প্রদান করা আবশ্যক।');
        return;
      }
      if (accountPassword.length < 6) {
        setErrorMsg('অ্যাকাউন্টের পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
        return;
      }
      if (accountPassword !== confirmAccountPassword) {
        setErrorMsg('উভয় পাসওয়ার্ড একই হতে হবে।');
        return;
      }

      const signUpRes = await authService.signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password: accountPassword,
        phone: cleanPhone,
        bloodGroup,
        division,
        district,
        upazila,
        gender,
        age,
        occupation
      });

      if (!signUpRes.success) {
        setErrorMsg(signUpRes.message || 'অ্যাকাউন্ট তৈরি ব্যর্থ হয়েছে।');
        return;
      }
      if (signUpRes.user) {
        effectiveUser = signUpRes.user;
      }
    }

    const formattedHistory: DonationRecord[] = historyEntries.map((h, i) => ({
      id: `h-new-${Date.now()}-${i}`,
      hospital: h.hospital,
      date: h.date,
      location: h.location
    }));

    const newDonor = await bloodService.addDonor({
      fullName: fullName.trim(),
      photoUrl: photoUrl.trim() || undefined,
      bloodGroup,
      phone: cleanPhone,
      email: email.trim() || undefined,
      division,
      district,
      upazila,
      age,
      gender,
      lastDonationDate: isFirstTime ? null : (lastDonationDate || (historyEntries[0]?.date) || null),
      isAvailable: true,
      phoneConsent,
      occupation: occupation.trim() || undefined,
      notes: notes.trim() || undefined,
      initialHistory: formattedHistory
    }, effectiveUser);

    setRegisteredDonor(newDonor);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {registeredDonor ? (
        /* Registration Success Confirmation with Digital Donor Card */
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {lang === 'bn' ? 'নিবন্ধন সফল হয়েছে (অ্যাডমিন অনুমোদনের অপেক্ষায়)' : 'Registration Submitted for Review!'}
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              {lang === 'bn'
                ? 'আপনার প্রোফাইলটি সফলভাবে সংরক্ষিত হয়েছে। যাচাইকরণ সম্পন্ন হলে এটি পাবলিক ডিরেক্টরিতে প্রকাশিত হবে।'
                : 'Your profile has been saved. It is queued in the Admin moderation panel for verification before appearing in public searches.'}
            </p>
          </div>

          {/* Backend storage disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              {lang === 'bn'
                ? 'ডেমো বিজ্ঞপ্তি: এই তথ্যটি বর্তমানে আপনার ব্রাউজারের লোকাল স্টোরেজে সংরক্ষিত হয়েছে। স্থায়ী ক্লাউড ব্যাকএন্ডের জন্য অ্যাডমিন প্যানেল থেকে Supabase ডাটাবেজ সংযোগ করা যাবে।'
                : 'Preview Note: This registration is stored in your client demo session. When the Supabase cloud backend is configured, records will sync to the PostgreSQL database.'}
            </span>
          </div>

          {/* Digital Donor ID Card */}
          <div className="max-w-md mx-auto bg-linear-to-br from-red-600 via-red-700 to-rose-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <Droplet className="absolute -right-6 -bottom-6 w-44 h-44 text-white/10 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white text-red-600 flex items-center justify-center font-black">
                  <Droplet className="w-5 h-5 fill-red-600 text-red-600" />
                </div>
                <div>
                  <span className="font-bold text-base tracking-tight block">LifeDrop</span>
                  <span className="text-[10px] text-red-100 tracking-wider uppercase block">
                    Volunteer Donor Card
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black bg-white/20 px-3 py-1 rounded-lg">
                  {registeredDonor.bloodGroup}
                </span>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <div>
                <span className="text-[10px] text-red-200 uppercase tracking-wider block">Donor Name</span>
                <span className="text-lg font-bold">{registeredDonor.fullName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-red-200 uppercase block">Location</span>
                  <span className="font-medium">{registeredDonor.upazila}, {registeredDonor.district}</span>
                </div>
                <div>
                  <span className="text-[10px] text-red-200 uppercase block">Division</span>
                  <span className="font-medium">{registeredDonor.division}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/10">
                <div>
                  <span className="text-[10px] text-red-200 uppercase block">Emergency Phone</span>
                  <span className="font-mono">{registeredDonor.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-red-200 uppercase block">Status</span>
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Pending Approval
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] text-red-200">
              <span>ID: {registeredDonor.id.toUpperCase().substring(0, 16)}</span>
              <span>100% Voluntary · Bangladesh</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setActivePage('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-red-400" />
              <span>আমার ড্যাশবোর্ডে প্রবেশ করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActivePage('search');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('findDonors')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setRegisteredDonor(null);
                setFullName('');
                setPhone('');
                setHistoryEntries([]);
              }}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'আরেকটি নিবন্ধন করুন' : 'Register Another Donor'}
            </button>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <div className="space-y-6">
          <div className="text-center sm:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
              <HeartHandshake className="w-4 h-4" />
              <span>{lang === 'bn' ? 'রক্তদাতা নিবন্ধন' : 'DONOR ONBOARDING'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('registerTitle')}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {t('registerSubtitle')}
            </p>
          </div>

          {/* Account Integration Status Banner (Requirement 6) */}
          {currentUser ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">অ্যাকাউন্ট সংযুক্ত: {currentUser.fullName}</span>
                  <span className="text-[11px] text-emerald-700">{currentUser.email} • এই রক্তদাতা প্রোফাইলটি আপনার ইউজার ড্যাশবোর্ডের সাথে সংযুক্ত থাকবে</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePage('dashboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer"
              >
                ড্যাশবোর্ডে যান &rarr;
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">ইতিমধ্যে LifeDrop অ্যাকাউন্ট আছে?</span>
                  <span className="text-[11px] text-slate-500">লগইন করলে আপনার পূর্ববর্তী সংরক্ষিত তথ্য স্বয়ংক্রিয়ভাবে ফর্মটিতে যুক্ত হবে।</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePage('login');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>লগইন করুন</span>
              </button>
            </div>
          )}

          {/* Disclaimer regarding demo environment */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p>
              {lang === 'bn'
                ? 'নিরাপত্তা বিজ্ঞপ্তি: রক্তদানে সম্মতি ছাড়া কোনো তথ্য উন্মুক্ত করা হবে না। এই ইন্টারফেসটি নিরাপদ ও এনক্রিপ্টেড ব্যাকএন্ডের জন্য প্রস্তুত।'
                : 'Privacy Notice: Your telephone number is guarded by explicit consent. Live production deployment will connect securely to a dedicated Supabase database with Row Level Security.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Full Name & Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t('fullName')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Mahmud"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t('selectBloodGroup')} <span className="text-red-600">*</span>
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full text-sm font-bold bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
                >
                  {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Photo URL & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('phone')} <span className="text-red-600">*</span>
                  </label>
                  {(isPhoneVerified || smsOtpService.isPhoneVerified(phone)) ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      যাচাইকৃত (Verified)
                    </span>
                  ) : phone.replace(/\D/g, '').length === 11 ? (
                    <button
                      type="button"
                      onClick={() => setIsOtpModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md border border-red-200 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      ওটিপি পাঠান
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhone(val);
                      setIsPhoneVerified(smsOtpService.isPhoneVerified(val));
                    }}
                    className={`w-full text-sm bg-white border rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 font-mono focus:outline-hidden focus:ring-2 ${
                      isPhoneVerified || smsOtpService.isPhoneVerified(phone)
                        ? 'border-emerald-300 focus:ring-emerald-400 focus:border-emerald-500 bg-emerald-50/10'
                        : 'border-slate-200 focus:ring-red-500 focus:border-red-500'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-slate-500">
                    {lang === 'bn' ? '১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর' : '11-digit Bangladeshi mobile number'}
                  </span>
                  {!isPhoneVerified && !smsOtpService.isPhoneVerified(phone) && phone.replace(/\D/g, '').length === 11 && (
                    <span className="text-[11px] text-amber-700 font-medium">
                      * ওটিপি যাচাই প্রয়োজন
                    </span>
                  )}
                </div>
              </div>


              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  ছবি আপলোড (গ্যালারি বা ক্যামেরা)
                </label>
                {photoUrl ? (
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <img
                      src={photoUrl}
                      alt="Donor Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {photoFileName || 'নির্বাচিত ছবি'}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium">ছবি সফলভাবে লোড হয়েছে</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl('');
                        setPhotoFileName('');
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="ছবি মুছুন"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl p-3 bg-slate-50/60 hover:bg-red-50/30 transition-all cursor-pointer group">
                    <div className="flex items-center gap-2 text-slate-600 group-hover:text-red-600">
                      <Camera className="w-4 h-4" />
                      <span className="text-xs font-semibold">মোবাইলের গ্যালারি বা ফাইল থেকে ছবি নির্বাচন করুন</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG বা WEBP (সর্বোচ্চ ৫ MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                  </label>
                )}
                <span className="text-[10px] text-slate-500 block mt-1">
                  * লোকাল প্রিভিউ সক্রিয়। Supabase Storage যুক্ত হলে সরাসরি ক্লাউডে সংরক্ষিত হবে।
                </span>
              </div>
            </div>

            {/* Geographic cascade: Division, District, Upazila */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t('division')} <span className="text-red-600">*</span>
                </label>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
                >
                  {BANGLADESH_DIVISIONS.map((div) => (
                    <option key={div.id} value={div.nameEn}>
                      {lang === 'bn' ? div.nameBn : div.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t('district')} <span className="text-red-600">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
                >
                  {availableDistricts.map((dist) => (
                    <option key={dist.id} value={dist.nameEn}>
                      {lang === 'bn' ? dist.nameBn : dist.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t('upazila')} <span className="text-red-600">*</span>
                </label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
                >
                  {availableUpazilas.map((upz) => (
                    <option key={upz} value={upz}>
                      {upz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Age, Gender & Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t('age')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min={18}
                  max={65}
                  required
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t('gender')} <span className="text-red-600">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
                >
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t('occupation')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Student / Teacher / Banker"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Last Donation Date & First Time Checkbox */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block">
                {t('lastDonationDate')}
              </label>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFirstTime}
                    onChange={(e) => setIsFirstTime(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <span>{t('firstTimeDonor')}</span>
                </label>
              </div>

              {!isFirstTime && (
                <div className="max-w-xs">
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={lastDonationDate}
                    onChange={(e) => setLastDonationDate(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              )}
            </div>

            {/* Donation History with dates and locations */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block">
                {lang === 'bn' ? 'পূর্ববর্তী রক্তদানের ইতিহাস যোগ করুন (ঐচ্ছিক)' : 'Add Prior Donation History (Optional)'}
              </label>

              {historyEntries.length > 0 && (
                <div className="space-y-2 mb-3">
                  {historyEntries.map((h, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-800">{h.hospital}</strong> ({h.location}) · <span className="font-mono text-slate-500">{h.date}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHistory(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Hospital name (e.g. DMCH)"
                  value={newHospital}
                  onChange={(e) => setNewHospital(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Location / City"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddHistory}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Explicit Consent & Privacy Governance (Requirement 4) */}
            <div className="space-y-3 pt-2 border-t border-slate-100 bg-red-50/50 p-4 rounded-xl border border-red-100">
              <span className="text-xs font-bold text-red-800 uppercase tracking-wider block">
                {lang === 'bn' ? 'স্বেচ্ছাসেবী সম্মতি ও গোপনীয়তা' : 'Explicit Voluntary Consent & Privacy Governance'}
              </span>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentContact}
                  onChange={(e) => setConsentContact(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500 mt-0.5 shrink-0 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed select-none">
                  {lang === 'bn'
                    ? 'আমি স্বেচ্ছায় আমার রক্তের গ্রুপ, এলাকা এবং যোগাযোগ নম্বর রোগীদের জরুরি প্রয়োজনে ব্যবহারের স্পষ্ট সম্মতি প্রদান করছি।'
                    : 'I explicitly consent to making my blood group, upazila, and contact details discoverable for emergency blood transfusions.'}
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentVoluntary}
                  onChange={(e) => setConsentVoluntary(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500 mt-0.5 shrink-0 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed select-none">
                  {lang === 'bn'
                    ? 'আমি ঘোষণা করছি যে আমি সুস্থ, বয়স ১৮-৬৫ এবং কোনো আর্থিক বিনিময় বা দালালি ছাড়া রক্তদানে ইচ্ছুক।'
                    : 'I declare that I am healthy, aged 18-65, and participate purely voluntary without financial compensation.'}
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-1 border-t border-red-100">
                <input
                  type="checkbox"
                  checked={phoneConsent}
                  onChange={(e) => setPhoneConsent(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500 mt-0.5 shrink-0 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed select-none">
                  {lang === 'bn'
                    ? 'আমার ফোন নম্বর সরাসরি কার্ডে দেখান (আনচেক করলে কেবল রোগীর স্বজন ক্লিক করে সম্মতি দিলে নম্বর দৃশ্যমান হবে)।'
                    : 'Display phone number directly on my donor card (Uncheck to require click-to-reveal confirmation).'}
                </span>
              </label>
            </div>

            {/* Optional Account Creation Card for Guest Donors (Requirement 6) */}
            {!currentUser && (
              <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createAccountWithDonor}
                    onChange={(e) => setCreateAccountWithDonor(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-600 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">
                      এই তথ্যের সাথে আমার একটি LifeDrop ইউজার অ্যাকাউন্ট তৈরি করুন
                    </span>
                    <span className="text-slate-600 text-[11px] block mt-0.5">
                      অ্যাকাউন্ট তৈরি করলে আপনি নিজের ড্যাশবোর্ড থেকে রক্তদানের তারিখ আপডেট, রক্তদানের ইতিহাস এবং জরুরি রক্তের আবেদন পরিচালনা করতে পারবেন।
                    </span>
                  </div>
                </label>

                {createAccountWithDonor && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-red-100">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        অ্যাকাউন্টের পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="password"
                          value={accountPassword}
                          onChange={(e) => setAccountPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-600"
                          required={createAccountWithDonor}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmAccountPassword}
                        onChange={(e) => setConfirmAccountPassword(e.target.value)}
                        placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-600"
                        required={createAccountWithDonor}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full min-h-[48px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm sm:text-base rounded-xl shadow-md shadow-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <HeartHandshake className="w-5 h-5" />
                <span>{t('submitRegistration')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        phone={phone}
        purpose="donor_registration"
        onVerified={(verifiedNum) => {
          setIsPhoneVerified(true);
          setErrorMsg('');
        }}
        onClose={() => setIsOtpModalOpen(false)}
      />
    </div>
  );
};

