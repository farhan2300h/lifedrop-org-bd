import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Donor, BloodGroup, ActivePage } from '../types';
import { bloodService, calculateDonorEligibility } from '../services/bloodService';
import { BANGLADESH_DIVISIONS } from '../data/bangladeshGeo';
import { DonorProfileModal } from './DonorProfileModal';
import { 
  Search, 
  MapPin, 
  Phone, 
  Check, 
  RotateCcw, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  HeartHandshake,
  UserCheck,
  Eye,
  Info,
  Loader2
} from 'lucide-react';

interface DonorSearchPageProps {
  initialFilters?: {
    bloodGroup?: BloodGroup | 'ALL';
    division?: string;
    district?: string;
    upazila?: string;
  } | null;
  setActivePage: (page: ActivePage) => void;
}

export const DonorSearchPage: React.FC<DonorSearchPageProps> = ({
  initialFilters,
  setActivePage
}) => {
  const { lang, t } = useLanguage();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>(initialFilters?.bloodGroup || 'ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>(initialFilters?.division || 'ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialFilters?.district || 'ALL');
  const [selectedUpazila, setSelectedUpazila] = useState<string>(initialFilters?.upazila || 'ALL');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Modal for full donor profile & history
  const [selectedDonorForProfile, setSelectedDonorForProfile] = useState<Donor | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.bloodGroup) setSelectedBloodGroup(initialFilters.bloodGroup);
      if (initialFilters.division) setSelectedDivision(initialFilters.division);
      if (initialFilters.district) setSelectedDistrict(initialFilters.district);
      if (initialFilters.upazila) setSelectedUpazila(initialFilters.upazila);
    }
  }, [initialFilters]);

  useEffect(() => {
    const load = () => {
      setDonors(bloodService.getDonors());
    };
    load();
    const unsub = bloodService.subscribe(load);
    return unsub;
  }, []);

  // Simulate smooth tactile search loading state when filters change
  const triggerLoading = () => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  };

  // Districts based on selected division
  const availableDistricts = useMemo(() => {
    if (selectedDivision === 'ALL') return [];
    const div = BANGLADESH_DIVISIONS.find(d => d.nameEn.toLowerCase() === selectedDivision.toLowerCase());
    return div ? div.districts : [];
  }, [selectedDivision]);

  // Upazilas based on selected district
  const availableUpazilas = useMemo(() => {
    if (selectedDistrict === 'ALL' || !availableDistricts.length) return [];
    const dist = availableDistricts.find(d => d.nameEn.toLowerCase() === selectedDistrict.toLowerCase());
    return dist ? dist.upazilas : [];
  }, [selectedDistrict, availableDistricts]);

  // Reset dependent dropdowns
  const handleDivisionChange = (divName: string) => {
    triggerLoading();
    setSelectedDivision(divName);
    setSelectedDistrict('ALL');
    setSelectedUpazila('ALL');
  };

  const handleDistrictChange = (distName: string) => {
    triggerLoading();
    setSelectedDistrict(distName);
    setSelectedUpazila('ALL');
  };

  const handleResetFilters = () => {
    triggerLoading();
    setSelectedBloodGroup('ALL');
    setSelectedDivision('ALL');
    setSelectedDistrict('ALL');
    setSelectedUpazila('ALL');
    setOnlyAvailable(false);
    setSearchQuery('');
  };

  // Filtered Donors list (only approved donors in public search)
  const filteredDonors = useMemo(() => {
    return donors
      .filter(d => d.approvalStatus === 'approved')
      .filter((donor) => {
        // Blood group filter
        if (selectedBloodGroup !== 'ALL' && donor.bloodGroup !== selectedBloodGroup) {
          return false;
        }
        // Division filter
        if (selectedDivision !== 'ALL' && donor.division.toLowerCase() !== selectedDivision.toLowerCase()) {
          return false;
        }
        // District filter
        if (selectedDistrict !== 'ALL' && donor.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
          return false;
        }
        // Upazila filter
        if (selectedUpazila !== 'ALL' && donor.upazila.toLowerCase() !== selectedUpazila.toLowerCase()) {
          return false;
        }
        // Availability filter
        if (onlyAvailable) {
          const { isEligible } = calculateDonorEligibility(donor.lastDonationDate);
          if (!donor.isAvailable || !isEligible) {
            return false;
          }
        }
        // Search query (name, phone, notes, occupation)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = donor.fullName.toLowerCase().includes(q);
          const matchesPhone = donor.phone.includes(q);
          const matchesNotes = donor.notes?.toLowerCase().includes(q);
          const matchesOccupation = donor.occupation?.toLowerCase().includes(q);
          if (!matchesName && !matchesPhone && !matchesNotes && !matchesOccupation) {
            return false;
          }
        }
        return true;
      });
  }, [donors, selectedBloodGroup, selectedDivision, selectedDistrict, selectedUpazila, onlyAvailable, searchQuery]);

  const handleCopyPhone = (id: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('searchTitle')}
        </h1>
        <p className="text-sm text-slate-600 mt-1.5">
          {t('searchSubtitle')}
        </p>
      </div>

      {/* Demo Notice Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {lang === 'bn'
              ? 'এটি ডেমো প্রিভিউ: রক্তদাতাদের নাম ও নম্বর কাল্পনিক। গোপনীয়তা নিশ্চিত করতে আসল কোনো ফোন নম্বর উন্মুক্ত করা হয়নি।'
              : 'Demo Preview Mode: Donor profiles shown below are fictional demo records. No real private numbers are exposed.'}
          </span>
        </div>
        <button
          onClick={() => setActivePage('register')}
          className="text-xs font-bold text-red-700 hover:underline shrink-0 cursor-pointer"
        >
          {t('ctaRegister')} &rarr;
        </button>
      </div>

      {/* Filter Surface */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        {/* Blood Group Selector (Touch-first button array) */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">
            {t('selectBloodGroup')}
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
            <button
              onClick={() => {
                triggerLoading();
                setSelectedBloodGroup('ALL');
              }}
              className={`py-2 px-2 text-center text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                selectedBloodGroup === 'ALL'
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {lang === 'bn' ? 'সকল' : 'ALL'}
            </button>
            {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((group) => (
              <button
                key={group}
                onClick={() => {
                  triggerLoading();
                  setSelectedBloodGroup(group);
                }}
                className={`py-2 px-2 text-center text-xs sm:text-sm font-bold rounded-lg border transition-all cursor-pointer ${
                  selectedBloodGroup === group
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Geographic Cascading Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Division */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">
              {t('division')}
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
            >
              <option value="ALL">{t('allDivisions')}</option>
              {BANGLADESH_DIVISIONS.map((div) => (
                <option key={div.id} value={div.nameEn}>
                  {lang === 'bn' ? div.nameBn : div.nameEn} ({lang === 'bn' ? div.nameEn : div.nameBn})
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">
              {t('district')}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={selectedDivision === 'ALL'}
              className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
            >
              <option value="ALL">
                {selectedDivision === 'ALL' 
                  ? (lang === 'bn' ? 'প্রথমে বিভাগ নির্বাচন করুন' : 'Select Division first')
                  : t('allDistricts')}
              </option>
              {availableDistricts.map((dist) => (
                <option key={dist.id} value={dist.nameEn}>
                  {lang === 'bn' ? dist.nameBn : dist.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Upazila */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">
              {t('upazila')}
            </label>
            <select
              value={selectedUpazila}
              onChange={(e) => {
                triggerLoading();
                setSelectedUpazila(e.target.value);
              }}
              disabled={selectedDistrict === 'ALL'}
              className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
            >
              <option value="ALL">
                {selectedDistrict === 'ALL'
                  ? (lang === 'bn' ? 'প্রথমে জেলা নির্বাচন করুন' : 'Select District first')
                  : t('allUpazilas')}
              </option>
              {availableUpazilas.map((upazila) => (
                <option key={upazila} value={upazila}>
                  {upazila}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search bar & Availability checkbox */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchByName')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="w-full text-sm bg-slate-50/80 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => {
                  triggerLoading();
                  setOnlyAvailable(e.target.checked);
                }}
                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
              />
              <span>{t('onlyAvailable')}</span>
            </label>

            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          <strong className="text-slate-900 font-bold tabular-nums text-sm">{filteredDonors.length}</strong>{' '}
          {t('donorsFound')}
        </span>
        <span className="hidden sm:inline text-slate-400">
          {lang === 'bn' ? 'প্রোফাইল দেখতে যেকোনো কার্ডে ক্লিক করুন' : 'Click on any donor card to view full profile & donation history'}
        </span>
      </div>

      {/* Donors Grid with Loading and Empty States */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">
            {lang === 'bn' ? 'রক্তদাতা তালিকা রিফ্রেশ হচ্ছে...' : 'Searching verified donors across Bangladesh...'}
          </p>
        </div>
      ) : filteredDonors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
          <HeartHandshake className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-900">
            {lang === 'bn' ? 'এই ফিল্টারে কোনো রক্তদাতা পাওয়া যায়নি' : 'No blood donors match your current filter'}
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {lang === 'bn'
              ? 'অনুগ্রহ করে জেলা বা রক্তের গ্রুপের ফিল্টার পরিবর্তন করুন, অথবা আপনি নিজেই আপনার এলাকায় রক্তদাতা হিসেবে যুক্ত হোন!'
              : 'Try broadening your geographic filter or reset the blood group search. Or become the first donor registered in this area!'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              {lang === 'bn' ? 'সব ফিল্টার সাফ করুন' : 'Clear All Filters'}
            </button>
            <button
              onClick={() => setActivePage('register')}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl cursor-pointer"
            >
              {t('ctaRegister')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDonors.map((donor) => {
            const { isEligible, daysRemaining } = calculateDonorEligibility(donor.lastDonationDate);
            const waPhone = donor.phone.startsWith('0') ? `880${donor.phone.replace(/[^0-9]/g, '').substring(1)}` : donor.phone.replace(/[^0-9]/g, '');

            return (
              <div
                key={donor.id}
                onClick={() => setSelectedDonorForProfile(donor)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top: Photo/Avatar, Blood Group & Verification */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Photo or Blood Drop Initial */}
                      {donor.photoUrl ? (
                        <img
                          src={donor.photoUrl}
                          alt={donor.fullName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-extrabold text-base tracking-tight shadow-xs shadow-red-200 shrink-0">
                          {donor.bloodGroup}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-red-600 transition-colors">
                            {donor.fullName}
                          </h3>
                          {donor.isVerified && (
                            <span title="Verified Volunteer Donor">
                              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{donor.age} {lang === 'bn' ? 'বছর' : 'yrs'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{donor.gender}</span>
                          {donor.occupation && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[120px]">{donor.occupation}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200">
                        {donor.bloodGroup}
                      </span>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="py-2.5 border-t border-b border-slate-100 my-2 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{donor.upazila}, {donor.district}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 pl-5">
                      {donor.division} Division
                    </div>
                  </div>

                  {/* Availability Status (Self-Reported) */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{lang === 'bn' ? 'প্রাপ্যতা:' : 'Availability:'}</span>
                      {isEligible && donor.isAvailable ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          {t('eligibleNow')}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {t('eligibleIn')} {daysRemaining} {t('days')}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      {donor.availabilityReportedAt}
                    </p>
                  </div>

                  {/* Donation History count */}
                  <div className="text-xs text-slate-600 space-y-1 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t('totalDonations')}:</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {donor.totalDonations} {t('times')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t('lastDonated')}:</span>
                      <span className="font-medium text-slate-800">
                        {donor.lastDonationDate || t('neverDonated')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons & Profile Trigger */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  {donor.phoneConsent ? (
                    <a
                      href={`tel:${donor.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-h-[44px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{t('callDonor')}</span>
                    </a>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDonorForProfile(donor);
                      }}
                      className="flex-1 min-h-[44px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-amber-600" />
                      <span>{lang === 'bn' ? 'নম্বর ও প্রোফাইল' : 'Reveal Contact'}</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDonorForProfile(donor);
                    }}
                    className="min-h-[44px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="View Full Profile & History"
                  >
                    <span>{lang === 'bn' ? 'বিবরণ' : 'Profile'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Donor Profile Modal */}
      <DonorProfileModal
        donor={selectedDonorForProfile}
        onClose={() => setSelectedDonorForProfile(null)}
      />
    </div>
  );
};
