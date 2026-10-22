import React, { useState } from 'react';
import { Donor } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { calculateDonorEligibility } from '../services/bloodService';
import { 
  X, 
  MapPin, 
  Calendar, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  History, 
  Building2, 
  Eye, 
  EyeOff,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Heart
} from 'lucide-react';

interface DonorProfileModalProps {
  donor: Donor | null;
  onClose: () => void;
}

export const DonorProfileModal: React.FC<DonorProfileModalProps> = ({ donor, onClose }) => {
  const { lang, t } = useLanguage();
  const [revealedPhone, setRevealedPhone] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!donor) return null;

  const { isEligible, daysRemaining } = calculateDonorEligibility(donor.lastDonationDate);
  const isPhoneVisible = donor.phoneConsent || revealedPhone;
  const waPhone = donor.phone.startsWith('0') ? `880${donor.phone.replace(/[^0-9]/g, '').substring(1)}` : donor.phone.replace(/[^0-9]/g, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(donor.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="bg-linear-to-r from-red-600 to-rose-700 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
            aria-label="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {/* Optional Photo or Avatar */}
            <div className="relative">
              {donor.photoUrl ? (
                <img
                  src={donor.photoUrl}
                  alt={donor.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/80 shadow-md bg-white/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white text-red-600 flex items-center justify-center text-2xl font-black shadow-md border-2 border-white/80">
                  {donor.fullName.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[11px] font-black px-2 py-0.5 rounded-md border border-white/40 shadow-xs">
                {donor.bloodGroup}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                  {donor.fullName}
                </h2>
                {donor.isVerified && (
                  <span title="Verified Volunteer Donor">
                    <UserCheck className="w-4 h-4 text-emerald-300" />
                  </span>
                )}
              </div>
              <p className="text-xs text-red-100 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{donor.upazila}, {donor.district}, {donor.division}</span>
              </p>
              <div className="text-[11px] text-red-200 flex items-center gap-2">
                <span>{donor.age} {lang === 'bn' ? 'বছর' : 'yrs'}</span>
                <span>·</span>
                <span className="capitalize">{donor.gender}</span>
                {donor.occupation && (
                  <>
                    <span>·</span>
                    <span>{donor.occupation}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          {/* Availability Status (Clearly marked as self-reported) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {lang === 'bn' ? 'বর্তমান প্রাপ্যতা স্ট্যাটাস' : 'Availability Status'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium italic">
                {donor.availabilityReportedAt}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {donor.isAvailable && isEligible ? (
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{lang === 'bn' ? 'স্ব-ঘোষিত: রক্তদানে প্রস্তুত' : 'Self-Reported: Available to Donate Blood'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    {lang === 'bn' 
                      ? `স্ব-ঘোষিত: রক্তদান সম্পন্ন (${daysRemaining} দিন পর প্রস্তুত হবেন)` 
                      : `Self-Reported: Resting (${daysRemaining} days remaining)`}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              {lang === 'bn' 
                ? 'দ্রষ্টব্য: রক্তদাতার প্রাপ্যতা সম্পূর্ণ তাদের নিজস্ব ঘোষণা। রক্তদানের পূর্বে সরাসরি ফোনে কথা বলে সময় নিশ্চিত করুন।'
                : 'Note: Availability is self-reported by the donor. Please verify their physical readiness before scheduling.'}
            </p>
          </div>

          {/* Key Stats Strip */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                {lang === 'bn' ? 'মোট রক্তদান' : 'Total Donations'}
              </span>
              <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                {donor.totalDonations} {t('times')}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                {lang === 'bn' ? 'সর্বশেষ রক্তদান' : 'Last Donation'}
              </span>
              <span className="text-sm font-bold text-slate-900">
                {donor.lastDonationDate || (lang === 'bn' ? 'প্রথমবার দাতা' : 'First Time')}
              </span>
            </div>
          </div>

          {/* Donation History List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
              <History className="w-4 h-4 text-red-600" />
              <span>{lang === 'bn' ? 'রক্তদানের ইতিহাস' : 'Donation History (Hospital & Date)'}</span>
            </div>

            {donor.history && donor.history.length > 0 ? (
              <div className="space-y-2">
                {donor.history.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white border border-slate-200/90 rounded-xl p-3 text-xs flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{record.hospital}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] pl-5">{record.location}</p>
                      {record.notes && (
                        <p className="text-slate-600 italic text-[11px] pl-5">"{record.notes}"</p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0 bg-slate-100 px-2 py-0.5 rounded">
                      {record.date}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                {lang === 'bn' ? 'কোনো পূর্ববর্তী রক্তদানের রেকর্ড যুক্ত নেই (নতুন নিবন্ধিত)।' : 'No prior donation records logged yet (First-time registered donor).'}
              </div>
            )}
          </div>

          {/* Notes */}
          {donor.notes && (
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-xs text-slate-700">
              <span className="font-semibold text-red-700 block mb-1">
                {lang === 'bn' ? 'দাতার বিশেষ বার্তা:' : 'Donor Preference:'}
              </span>
              <p className="italic">"{donor.notes}"</p>
            </div>
          )}

          {/* Consent-Based Phone Number Visibility */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {lang === 'bn' ? 'যোগাযোগ নম্বর (সম্মতিভিত্তিক)' : 'Emergency Contact (Consent-Based)'}
              </span>
              <span className="text-[10px] text-slate-500">
                {donor.phoneConsent ? 'Publicly Consented' : 'Protected Contact'}
              </span>
            </div>

            {!isPhoneVisible ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-2.5">
                <p className="text-xs text-amber-900 leading-relaxed">
                  {lang === 'bn' 
                    ? 'এই রক্তদাতা অপ্রয়োজনীয় কল রোধে সম্মতি-সুরক্ষিত নম্বর ব্যবহার করছেন। আপনি কি রোগীর জরুরি স্বজন?'
                    : 'This donor requested spam protection. Please confirm you are a patient attendant before viewing the phone number.'}
                </p>
                <button
                  onClick={() => setRevealedPhone(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'নম্বর দেখতে ক্লিক করুন' : 'Confirm & Reveal Phone Number'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-mono text-base font-bold text-slate-900">{donor.phone}</span>
                  <button
                    onClick={handleCopy}
                    className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                  >
                    {copied ? t('copied') : t('copyNumber')}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${donor.phone}`}
                    className="min-h-[44px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{t('callDonor')}</span>
                  </a>
                  <a
                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent('Hello, I saw your LifeDrop Bangladesh donor profile. Are you available for blood donation?')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-center text-slate-400 pt-2">
            LifeDrop Bangladesh · Fictional demo record for frontend review
          </div>
        </div>
      </div>
    </div>
  );
};
