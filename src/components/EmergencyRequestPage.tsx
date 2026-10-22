import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BloodGroup, UrgencyLevel, BloodRequest, ActivePage, UserProfile, RequestStatus } from '../types';
import { bloodService } from '../services/bloodService';
import { BANGLADESH_DIVISIONS } from '../data/bangladeshGeo';
import { EmergencyCard } from './EmergencyCard';
import { 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  Building2, 
  MapPin, 
  Copy, 
  Check, 
  Share2, 
  ShieldAlert, 
  ArrowRight, 
  Clock, 
  UserCheck, 
  KeyRound, 
  Siren, 
  Sparkles,
  Filter,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { smsOtpService } from '../services/smsOtpService';
import { OtpVerificationModal } from './OtpVerificationModal';

interface EmergencyRequestPageProps {
  setActivePage: (page: ActivePage) => void;
  currentUser?: UserProfile | null;
}

export const EmergencyRequestPage: React.FC<EmergencyRequestPageProps> = ({ setActivePage, currentUser }) => {
  const { lang, t } = useLanguage();

  const [allRequests, setAllRequests] = useState<BloodRequest[]>(() => bloodService.getRequests());
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'donor_found' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    const unsub = bloodService.subscribe(() => {
      setAllRequests(bloodService.getRequests());
    });
    return unsub;
  }, []);

  const handleUpdateStatus = (reqId: string, newStatus: RequestStatus) => {
    try {
      bloodService.updateRequestStatus(reqId, newStatus, currentUser);
      setAllRequests(bloodService.getRequests());
    } catch (err: any) {
      alert(err.message || 'অনুমতি নেই: স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।');
    }
  };

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [hemoglobin, setHemoglobin] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [unitsRequired, setUnitsRequired] = useState<number>(1);
  const [hospital, setHospital] = useState('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Shahbagh');
  const [contactName, setContactName] = useState(currentUser?.fullName || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [urgency, setUrgency] = useState<UrgencyLevel>('immediate');
  const [reason, setReason] = useState('Emergency Surgery');
  const [dateNeeded, setDateNeeded] = useState(new Date().toISOString().split('T')[0]);
  const [timeNeeded, setTimeNeeded] = useState('10:00 AM');
  const [attendantNotes, setAttendantNotes] = useState('');
  const [consent, setConsent] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState<BloodRequest | null>(null);
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);

  // Requirement 1: SMS / OTP verification for contact phone
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!patientName.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে রোগীর নাম লিখুন।' : 'Please enter the patient name.');
      return;
    }
    if (!hospital.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে হাসপাতালের নাম ও ঠিকানা লিখুন।' : 'Please enter the hospital name.');
      return;
    }
    if (!contactName.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে যোগাযোগকারী ব্যক্তির নাম দিন।' : 'Please enter contact person name.');
      return;
    }

    const cleanPhone = contactPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('01') || cleanPhone.length !== 11) {
      setErrorMsg(
        lang === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01812345678)।'
          : 'Please enter a valid 11-digit Bangladeshi mobile number.'
      );
      return;
    }

    if (!consent) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে প্রয়োজন অনুযায়ী যোগাযোগের সম্মতি প্রদান করুন।' : 'Please accept the contact consent.');
      return;
    }

    // Requirement 1: Verify emergency contact number with OTP
    if (!isPhoneVerified && !smsOtpService.isPhoneVerified(cleanPhone)) {
      setIsOtpModalOpen(true);
      return;
    }

    const newReq = await bloodService.addRequest({
      patientName: patientName.trim(),
      patientAge: patientAge ? parseInt(patientAge) : undefined,
      hemoglobin: hemoglobin.trim() || undefined,
      bloodGroup,
      unitsRequired,
      hospital: hospital.trim(),
      division,
      district,
      upazila,
      contactName: contactName.trim(),
      contactPhone: cleanPhone,
      urgency,
      reason: reason.trim(),
      dateNeeded,
      timeNeeded: timeNeeded.trim() || undefined,
      consent: true,
      attendantNotes: attendantNotes.trim() || undefined
    }, currentUser);

    setSubmittedRequest(newReq);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBroadcastTemplate = (req: BloodRequest) => {
    return `🚨 [জরুরি রক্তের আবেদন / EMERGENCY BLOOD CALL] 🚨
রক্তের গ্রুপ: ${req.bloodGroup} (${req.unitsRequired} ব্যাগ)
রোগী: ${req.patientName}
হাসপাতাল: ${req.hospital}
উপজেলা/জেলা: ${req.upazila}, ${req.district}
কারণ: ${req.reason}
জরুরিতা: ${req.urgency.toUpperCase()}
যোগাযোগ: ${req.contactName} - ${req.contactPhone}
${req.attendantNotes ? `মন্তব্য: ${req.attendantNotes}\n` : ''}
লাইফড্রপ স্বেচ্ছাসেবী নেটওয়ার্ক বাংলাদেশ`;
  };

  const handleCopyBroadcast = () => {
    if (submittedRequest) {
      navigator.clipboard.writeText(getBroadcastTemplate(submittedRequest));
      setCopiedBroadcast(true);
      setTimeout(() => setCopiedBroadcast(false), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {submittedRequest ? (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-red-600 mx-auto" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {lang === 'bn' ? 'জরুরি রক্তের আবেদন সফলভাবে প্রচারিত হয়েছে!' : 'Emergency Blood Request Broadcasted!'}
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              {lang === 'bn'
                ? 'আবেদনটি লাইফড্রপ নেটওয়ার্কের লাইভ ড্যাশবোর্ডে যুক্ত হয়েছে। দ্রুত রক্তদাতা পেতে নিচের মেসেজটি বিভিন্ন রক্তদান ফেসবুক ও হোয়াটসঅ্যাপ গ্রুপে শেয়ার করুন।'
                : 'Your request is now live on the LifeDrop emergency feed. You can also copy the formatted broadcast text below to share in Facebook and WhatsApp groups.'}
            </p>
          </div>

          {/* Request Card Preview */}
          <div className="max-w-xl mx-auto">
            <EmergencyCard request={submittedRequest} />
          </div>

          {/* Social Media Broadcast Template */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-red-600" />
                {lang === 'bn' ? 'গ্রুপে শেয়ার করার জন্য মেসেজ টেমপ্লেট' : 'Copy Broadcast Template for Social Media'}
              </span>
              <button
                onClick={handleCopyBroadcast}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 py-1 px-2.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
              >
                {copiedBroadcast ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBroadcast ? t('copied') : (lang === 'bn' ? 'কপি করুন' : 'Copy Text')}</span>
              </button>
            </div>
            <pre className="text-xs text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
              {getBroadcastTemplate(submittedRequest)}
            </pre>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => setActivePage('search')}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{lang === 'bn' ? 'সরাসরি রক্তদাতা খুঁজুন' : 'Search Donors Directly'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSubmittedRequest(null);
                setPatientName('');
                setHospital('');
              }}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'আরেকটি আবেদন পোস্ট করুন' : 'Post Another Request'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center sm:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span>{lang === 'bn' ? 'জরুরি রক্তের চাহিদা' : 'EMERGENCY REQUEST'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('requestTitle')}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {t('requestSubtitle')}
            </p>
          </div>

          {/* Anti-Broker Warning Callout */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>{lang === 'bn' ? 'সতর্কবার্তা: ' : 'Anti-Broker Notice: '}</strong>
              {t('disclaimerBroker')}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Patient Name, Age & Hemoglobin */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {lang === 'bn' ? 'রোগীর নাম' : t('patientName')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মো. রফিকুল ইসলাম"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {lang === 'bn' ? 'রোগীর বয়স' : 'Patient Age'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="যেমন: ৪৫"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {lang === 'bn' ? 'হিমোগ্লোবিন (g/dL)' : 'Hemoglobin'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 7.2"
                  value={hemoglobin}
                  onChange={(e) => setHemoglobin(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Blood Group, Units, Urgency, Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {lang === 'bn' ? 'ব্যাগের সংখ্যা' : t('unitsNeeded')} <span className="text-red-600">*</span>
                </label>
                <select
                  value={unitsRequired}
                  onChange={(e) => setUnitsRequired(parseInt(e.target.value) || 1)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {lang === 'bn' ? 'ব্যাগ' : 'Bag(s)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {lang === 'bn' ? 'প্রয়োজনীয় তারিখ' : t('dateNeeded')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateNeeded}
                  onChange={(e) => setDateNeeded(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {lang === 'bn' ? 'প্রয়োজনীয় সময়' : 'Time Needed'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: সকাল ১০:৩০"
                  value={timeNeeded}
                  onChange={(e) => setTimeNeeded(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Urgency Level */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {lang === 'bn' ? 'জরুরিতার মাত্রা' : t('urgencyLevel')} <span className="text-red-600">*</span>
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
              >
                <option value="immediate">{lang === 'bn' ? 'তাৎক্ষণিক জরুরি (১-২ ঘণ্টার মধ্যে)' : t('immediate')}</option>
                <option value="today">{lang === 'bn' ? 'আজকের মধ্যে প্রয়োজন' : t('today')}</option>
                <option value="scheduled">{lang === 'bn' ? 'নির্ধারিত দিনে (পরিকল্পিত অপারেশন)' : t('scheduled')}</option>
              </select>
            </div>

            {/* Medical Reason */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {t('medicalReason')} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. C-Section Delivery / Dengue Platelet / Open Heart Surgery / Accident"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Hospital Name & Address */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {t('hospitalName')} <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka Medical College Hospital (DMC), New Building, Ward 7"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Geographic Cascade */}
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

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {t('attendantName')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sazzad Hossain (Brother)"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('attendantPhone')} <span className="text-red-600">*</span>
                  </label>
                  {(isPhoneVerified || smsOtpService.isPhoneVerified(contactPhone)) ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      যাচাইকৃত (Verified)
                    </span>
                  ) : contactPhone.replace(/\D/g, '').length === 11 ? (
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
                    value={contactPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContactPhone(val);
                      setIsPhoneVerified(smsOtpService.isPhoneVerified(val));
                    }}
                    className={`w-full text-sm bg-white border rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 font-mono focus:outline-hidden focus:ring-2 ${
                      isPhoneVerified || smsOtpService.isPhoneVerified(contactPhone)
                        ? 'border-emerald-300 focus:ring-emerald-400 focus:border-emerald-500 bg-emerald-50/10'
                        : 'border-slate-200 focus:ring-red-500 focus:border-red-500'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-slate-500">
                    জরুরি যোগাযোগের সক্রিয় মোবাইল নম্বর
                  </span>
                  {!isPhoneVerified && !smsOtpService.isPhoneVerified(contactPhone) && contactPhone.replace(/\D/g, '').length === 11 && (
                    <span className="text-[11px] text-amber-700 font-medium">
                      * ওটিপি কোড দিয়ে নিশ্চিত করা বাধ্যতামূলক
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Additional Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {t('additionalNotes')}
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Blood cross-match sample ready at blood bank counter. Please call before coming."
                value={attendantNotes}
                onChange={(e) => setAttendantNotes(e.target.value)}
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* প্রয়োজন অনুযায়ী যোগাযোগের সম্মতি */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-200 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                  required
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block font-semibold mb-0.5">
                    {lang === 'bn' ? 'প্রয়োজন অনুযায়ী যোগাযোগের সম্মতি:' : 'Contact Consent:'}
                  </strong>
                  {lang === 'bn' 
                    ? 'আমি নিশ্চিত করছি যে রোগীর জন্য প্রকৃতপক্ষেই রক্ত প্রয়োজন। জরুরি রক্তদানের জন্য রক্তদাতাগণ আমার উল্লেখিত মোবাইল নম্বরে সরাসরি যোগাযোগ করতে পারবেন।'
                    : 'I confirm that blood is genuinely needed for this patient and potential volunteer donors can contact me directly at the provided phone number.'}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full min-h-[48px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <AlertCircle className="w-5 h-5" />
                <span>{lang === 'bn' ? 'রক্তের অনুরোধ পাঠান' : t('submitRequest')}</span>
              </button>
            </div>
          </form>

          {/* ============================================================ */}
          {/* LIVE EMERGENCY BLOOD REQUESTS LIST WITH STATUS MANAGEMENT    */}
          {/* স্ট্যাটাস: অপেক্ষমাণ, ডোনার পাওয়া গেছে, সম্পন্ন, বাতিল            */}
          {/* ============================================================ */}
          <div className="mt-12 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Siren className="w-5 h-5 text-red-600" />
                  <span>জরুরি রক্তের লাইভ অনুরোধসমূহ</span>
                </h3>
                <p className="text-xs text-slate-500">
                  চলমান রক্তের আবেদন ও বর্তমান স্থিতি। আবেদনকারী ও অ্যাডমিন স্ট্যাটাস পরিবর্তন করতে পারবেন।
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-semibold">
                {[
                  { id: 'all', label: 'সব অনুরোধ' },
                  { id: 'pending', label: 'অপেক্ষমাণ' },
                  { id: 'donor_found', label: 'ডোনার পাওয়া গেছে' },
                  { id: 'completed', label: 'সম্পন্ন' },
                  { id: 'cancelled', label: 'বাতিল' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-red-600 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtered Requests Grid */}
            {allRequests.filter(req => {
              if (statusFilter === 'all') return true;
              if (statusFilter === 'pending') return req.status === 'pending' || req.status === 'urgent';
              if (statusFilter === 'donor_found') return req.status === 'donor_found' || req.status === 'in_progress';
              if (statusFilter === 'completed') return req.status === 'completed' || req.status === 'fulfilled';
              if (statusFilter === 'cancelled') return req.status === 'cancelled';
              return true;
            }).length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                এই ক্যাটাগরিতে বর্তমানে কোনো রক্তের অনুরোধ নেই।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allRequests
                  .filter(req => {
                    if (statusFilter === 'all') return true;
                    if (statusFilter === 'pending') return req.status === 'pending' || req.status === 'urgent';
                    if (statusFilter === 'donor_found') return req.status === 'donor_found' || req.status === 'in_progress';
                    if (statusFilter === 'completed') return req.status === 'completed' || req.status === 'fulfilled';
                    if (statusFilter === 'cancelled') return req.status === 'cancelled';
                    return true;
                  })
                  .map((req) => {
                    const isOwnerOrAdmin = Boolean(
                      currentUser?.role === 'admin' || 
                      (currentUser && req.userId && req.userId === currentUser.id)
                    );

                    const statusBadgeInfo = (() => {
                      switch (req.status) {
                        case 'donor_found':
                        case 'in_progress':
                          return {
                            text: 'ডোনার পাওয়া গেছে',
                            cls: 'bg-blue-50 text-blue-700 border-blue-200',
                            icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          };
                        case 'completed':
                        case 'fulfilled':
                          return {
                            text: 'সম্পন্ন',
                            cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                            icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          };
                        case 'cancelled':
                          return {
                            text: 'বাতিল',
                            cls: 'bg-slate-100 text-slate-600 border-slate-200',
                            icon: <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          };
                        case 'pending':
                        case 'urgent':
                        default:
                          return {
                            text: 'অপেক্ষমাণ',
                            cls: 'bg-amber-50 text-amber-800 border-amber-200',
                            icon: <Clock className="w-3.5 h-3.5 text-amber-600" />
                          };
                      }
                    })();

                    return (
                      <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-red-200 transition-all space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                              {req.bloodGroup}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 leading-tight">
                                {req.patientName} {req.patientAge ? `(${req.patientAge} বছর)` : ''}
                              </h4>
                              <p className="text-xs text-red-600 font-medium">
                                {req.reason} • {req.unitsRequired} ব্যাগ
                              </p>
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadgeInfo.cls}`}>
                            {statusBadgeInfo.icon}
                            <span>{statusBadgeInfo.text}</span>
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{req.hospital}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{req.upazila}, {req.district}</span>
                            {req.timeNeeded && <span>• সময়: {req.timeNeeded}</span>}
                          </div>
                        </div>

                        {/* Status Change Control for Owner or Admin */}
                        {isOwnerOrAdmin && (
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-slate-600">
                              স্ট্যাটাস পরিবর্তন করুন:
                            </span>
                            <div className="flex items-center gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(req.id, 'donor_found')}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold cursor-pointer"
                              >
                                ডোনার পাওয়া গেছে
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(req.id, 'completed')}
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold cursor-pointer"
                              >
                                সম্পন্ন
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold cursor-pointer"
                              >
                                বাতিল
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Contact Action */}
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-600">
                            যোগাযোগ: <strong>{req.contactName}</strong>
                          </span>
                          <a
                            href={`tel:${req.contactPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>কল করুন ({req.contactPhone})</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requirement 1: Emergency Contact Phone OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        phone={contactPhone}
        purpose="emergency_request"
        onVerified={(verifiedPhone) => {
          setIsPhoneVerified(true);
          setErrorMsg('');
        }}
        onClose={() => setIsOtpModalOpen(false)}
      />
    </div>
  );
};

