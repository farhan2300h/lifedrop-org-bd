import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ActivePage, BloodRequest, BloodGroup } from '../types';
import { bloodService } from '../services/bloodService';
import { BLOOD_GROUPS, BANGLADESH_DIVISIONS } from '../data/bangladeshGeo';
import { EmergencyCard } from './EmergencyCard';
import { 
  Search, 
  AlertCircle, 
  HeartHandshake, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Building2,
  Droplets,
  Award,
  ShieldAlert,
  PhoneCall,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface HomePageProps {
  setActivePage: (page: ActivePage) => void;
  onSearchWithFilters: (filters: { bloodGroup?: BloodGroup | 'ALL'; division?: string; district?: string; upazila?: string }) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setActivePage,
  onSearchWithFilters
}) => {
  const { lang, t } = useLanguage();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [stats, setStats] = useState(bloodService.getStats());
  const [selectedCompatGroup, setSelectedCompatGroup] = useState<BloodGroup>('O+');

  // Quick search form state
  const [searchBloodGroup, setSearchBloodGroup] = useState<BloodGroup | 'ALL'>('ALL');
  const [searchDivision, setSearchDivision] = useState<string>('ALL');
  const [searchDistrict, setSearchDistrict] = useState<string>('ALL');
  const [searchUpazila, setSearchUpazila] = useState<string>('ALL');

  useEffect(() => {
    const updateData = () => {
      setRequests(bloodService.getRequests());
      setStats(bloodService.getStats());
    };
    updateData();
    const unsubscribe = bloodService.subscribe(updateData);
    return unsubscribe;
  }, []);

  const urgentRequests = requests
    .filter(r => r.status === 'urgent')
    .slice(0, 4);

  const currentCompat = BLOOD_GROUPS.find(bg => bg.group === selectedCompatGroup) || BLOOD_GROUPS[0];

  // Cascading geographic dropdowns for hero search
  const availableDistricts = useMemo(() => {
    if (searchDivision === 'ALL') return [];
    const div = BANGLADESH_DIVISIONS.find(d => d.nameEn.toLowerCase() === searchDivision.toLowerCase());
    return div ? div.districts : [];
  }, [searchDivision]);

  const availableUpazilas = useMemo(() => {
    if (searchDistrict === 'ALL' || !availableDistricts.length) return [];
    const dist = availableDistricts.find(d => d.nameEn.toLowerCase() === searchDistrict.toLowerCase());
    return dist ? dist.upazilas : [];
  }, [searchDistrict, availableDistricts]);

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchWithFilters({
      bloodGroup: searchBloodGroup,
      division: searchDivision,
      district: searchDistrict,
      upazila: searchUpazila
    });
  };

  const handleBloodGroupDirectClick = (group: BloodGroup) => {
    setSearchBloodGroup(group);
    onSearchWithFilters({
      bloodGroup: group,
      division: searchDivision,
      district: searchDistrict,
      upazila: searchUpazila
    });
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-white pt-6 sm:pt-12 pb-10 sm:pb-16 border-b border-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headlines, Quotes & Actions */}
            <div className="lg:col-span-7 space-y-5 text-left">
              {/* Quiet unboxed kicker */}
              <div className="inline-flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse" />
                <span>{lang === 'bn' ? 'বাংলাদেশ স্বেচ্ছাসেবী রক্তদান নেটওয়ার্ক' : 'Bangladesh Voluntary Blood Network'}</span>
                <span aria-hidden="true" className="text-red-300">·</span>
                <span className="text-slate-600 font-medium">{lang === 'bn' ? '৬৪ জেলায় বিস্তৃত' : '64 Districts'}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.18] text-balance font-display">
                {lang === 'bn' 
                  ? 'আপনার এক ফোঁটা রক্ত, বাঁচাতে পারে একটি প্রিয় প্রাণ' 
                  : 'A Single Drop of Blood Can Save a Life in Bangladesh'}
              </h1>

              {/* Spiritual & Humanitarian Inspiration Quote */}
              <div className="bg-red-50/90 border-l-4 border-red-600 p-4 sm:p-5 rounded-r-2xl shadow-2xs space-y-1.5">
                <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed font-sans">
                  “অন্যের বিপদে আপনি যদি মানুষের পাশে দাঁড়ান, আপনার বিপদেও মহান আল্লাহ পাক কাউকে না কাউকে আপনার পাশে পাঠাবেন, ইনশাআল্লাহ।”
                </p>
                <p className="text-xs text-red-700 font-medium">
                  {lang === 'bn' 
                    ? '— মানবকল্যাণে রক্তদানের অনন্য সওয়াব ও আত্মতৃপ্তি' 
                    : '— "If you stand by people in their distress, Almighty Allah will surely send someone by your side in your time of distress, InshaAllah."'}
                </p>
              </div>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
                {lang === 'bn'
                  ? 'বাংলাদেশের ৬৪ জেলার বিশ্বস্ত ও স্বেচ্ছাসেবী রক্তদাতাদের সাথে তাৎক্ষণিক সংযোগ। সম্পূর্ণ বিনামূল্যে, দালালমুক্ত ও নিরাপদ।'
                  : 'Connect directly with voluntary, verified blood donors across all 64 districts. 100% voluntary, zero brokers, free of charge.'}
              </p>

              {/* Quick Action CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  onClick={() => setActivePage('search')}
                  className="min-h-[48px] px-6 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-5 h-5" />
                  <span>{lang === 'bn' ? 'রক্তদাতা খুঁজুন' : 'Find Blood Donors'}</span>
                </button>

                <button
                  onClick={() => setActivePage('emergency')}
                  className="min-h-[48px] px-6 py-3 bg-white hover:bg-red-50 active:bg-red-100 text-red-700 font-bold text-sm sm:text-base rounded-xl border-2 border-red-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span>{lang === 'bn' ? 'জরুরি রক্তের আবেদন' : 'Post Emergency Request'}</span>
                </button>

                <button
                  onClick={() => setActivePage('register')}
                  className="min-h-[48px] px-4 py-3 text-slate-700 hover:text-red-700 font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4 text-red-600" />
                  <span>{lang === 'bn' ? 'রক্তদাতা হিসেবে যুক্ত হোন' : 'Become a Donor'} &rarr;</span>
                </button>
              </div>
            </div>

            {/* Right Column: Hero Photo */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-red-100 aspect-16/11 sm:aspect-16/10 lg:aspect-4/3 bg-slate-100">
                <img
                  src="/src/assets/images/hero_blood_donation_1792355610642.jpg"
                  alt="Blood donation at a modern healthcare center in Bangladesh"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-200 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'bn' ? '১০০% স্বেচ্ছাসেবী ও নিরাপদ' : '100% Voluntary & Safe'}</span>
                  </div>
                  <p className="text-sm font-semibold leading-snug">
                    {lang === 'bn' 
                      ? 'প্রতি ৩ মাস পর পর রক্তদান আপনার শরীরকে রাখে সুস্থ ও কর্মক্ষম' 
                      : 'Donating blood every 3 months stimulates new red blood cell production.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Hero-Connected Quick Search & Blood Group Selection (রক্তের গ্রুপ ও রক্তদাতা অনুসন্ধান) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
        <div className="bg-white rounded-3xl border border-red-100 p-6 sm:p-8 shadow-lg shadow-slate-200/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-red-600" />
                <span>{lang === 'bn' ? 'তাৎক্ষণিক রক্তদাতা অনুসন্ধান' : 'Find Blood Donors by Blood Group & Area'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn' 
                  ? 'আপনার কাঙ্ক্ষিত রক্তের গ্রুপ নির্বাচন করুন অথবা সরাসরি এলাকা দিয়ে খুঁজুন' 
                  : 'Select a blood group or filter by division, district, and upazila'}
              </p>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold self-start sm:self-auto">
              {lang === 'bn' ? '✓ সরাসরি যোগাযোগ নম্বর' : '✓ Verified Contacts'}
            </span>
          </div>

          {/* Blood Groups Selector Grid (8 groups: A+, A-, B+, B-, O+, O-, AB+, AB-) */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              {lang === 'bn' ? 'রক্তের গ্রুপ নির্বাচন করুন:' : 'Select Blood Group:'}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as BloodGroup[]).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => handleBloodGroupDirectClick(group)}
                  className={`py-3 px-2 rounded-xl text-center font-black text-sm sm:text-base border transition-all cursor-pointer ${
                    searchBloodGroup === group
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-200 scale-105'
                      : 'bg-slate-50 hover:bg-red-600 hover:text-white text-slate-800 border-slate-200 hover:border-red-600'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Cascading Area Search Form */}
          <form onSubmit={handleQuickSearchSubmit} className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              {/* Division */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'বিভাগ' : 'Division'}
                </label>
                <select
                  value={searchDivision}
                  onChange={(e) => {
                    setSearchDivision(e.target.value);
                    setSearchDistrict('ALL');
                    setSearchUpazila('ALL');
                  }}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  <option value="ALL">{lang === 'bn' ? 'সকল বিভাগ' : 'All Divisions'}</option>
                  {BANGLADESH_DIVISIONS.map((div) => (
                    <option key={div.id} value={div.nameEn}>
                      {lang === 'bn' ? div.nameBn : div.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'জেলা' : 'District'}
                </label>
                <select
                  value={searchDistrict}
                  onChange={(e) => {
                    setSearchDistrict(e.target.value);
                    setSearchUpazila('ALL');
                  }}
                  disabled={searchDivision === 'ALL'}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer"
                >
                  <option value="ALL">
                    {searchDivision === 'ALL' 
                      ? (lang === 'bn' ? 'প্রথমে বিভাগ বাছুন' : 'Select Division first') 
                      : (lang === 'bn' ? 'সকল জেলা' : 'All Districts')}
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'উপজেলা / থানা' : 'Upazila / Thana'}
                </label>
                <select
                  value={searchUpazila}
                  onChange={(e) => setSearchUpazila(e.target.value)}
                  disabled={searchDistrict === 'ALL'}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer"
                >
                  <option value="ALL">
                    {searchDistrict === 'ALL'
                      ? (lang === 'bn' ? 'প্রথমে জেলা বাছুন' : 'Select District first')
                      : (lang === 'bn' ? 'সকল উপজেলা' : 'All Upazilas')}
                  </option>
                  {availableUpazilas.map((upz) => (
                    <option key={upz} value={upz}>
                      {upz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Submit Button */}
              <div>
                <button
                  type="submit"
                  className="w-full min-h-[42px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'রক্তদাতা খুঁজুন' : 'Search Donors'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* 3. Medical Warning & Anti-Broker Notice (মেডিকেল সতর্কতা ও দালাল বিরোধী নোটিশ) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-r from-red-700 via-red-800 to-rose-900 text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-300" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {lang === 'bn' ? 'জরুরি মেডিকেল সতর্কতা ও আইনি নির্দেশনা' : 'EMERGENCY MEDICAL & LEGAL ADVISORY'}
              </span>
              <p className="text-sm font-semibold leading-relaxed">
                {lang === 'bn' 
                  ? 'রক্ত ক্রয়-বিক্রয় আইনত দণ্ডনীয় অপরাধ। লাইফড্রপের সকল রক্তদাতা সম্পূর্ণ বিনামূল্যে মানবতার খাতিরে রক্তদান করেন। কোনো দালাল চক্রকে অর্থ প্রদান করবেন না।' 
                  : 'Blood commercialization is strictly illegal. All LifeDrop donors contribute purely voluntary without any fees. Never pay middlemen or brokers.'}
              </p>
              <p className="text-xs text-red-100">
                {lang === 'bn' 
                  ? 'হাসপাতালে রক্ত নেওয়ার আগে অবশ্যই সম্পূর্ণ স্ক্রিনিং ও ক্রস-ম্যাচিং সম্পন্ন করুন।' 
                  : 'Always ensure professional laboratory cross-matching and transfusion screening.'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-white/20">
            <a
              href="tel:+8801950902300"
              className="w-full sm:w-auto px-4 py-2.5 bg-white text-red-800 hover:bg-red-50 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs font-mono"
              title="কল করুন"
            >
              <PhoneCall className="w-4 h-4 text-red-600" />
              <span>+8801950902300</span>
            </a>
            <a
              href="https://wa.me/8801950902300"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
              title="হোয়াটসঅ্যাপে চ্যাট করুন"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp চ্যাট</span>
            </a>
          </div>
        </div>
      </section>

      {/* 4. Statistics Strip (পরিসংখ্যান) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Stat 1 */}
            <div className="pt-4 sm:pt-0 sm:px-4 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-red-600 mb-1.5">
                <Users className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'bn' ? 'সক্রিয় নিবন্ধিত রক্তদাতা' : 'Verified Donors'}
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                {stats.totalDonors}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'bn' ? 'সরাসরি যোগাযোগের জন্য প্রস্তুত' : 'Verified contact numbers'}
              </p>
            </div>

            {/* Stat 2 */}
            <div className="pt-4 sm:pt-0 sm:px-4 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-red-600 mb-1.5">
                <Droplets className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'bn' ? 'উপকৃত রোগীর সংখ্যা' : 'Lives Impacted'}
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                {stats.fulfilledRequests}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'bn' ? 'সফল রক্তদানে সহায়তাপ্রাপ্ত' : 'Transfusions coordinated'}
              </p>
            </div>

            {/* Stat 3 */}
            <div className="pt-4 sm:pt-0 sm:px-4 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-red-600 mb-1.5">
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'bn' ? 'জেলায় কার্যক্রম' : 'Districts Covered'}
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                64 / 64
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'bn' ? 'বাংলাদেশের ৮টি বিভাগব্যাপী' : 'Across 8 divisions in BD'}
              </p>
            </div>

            {/* Stat 4 */}
            <div className="pt-4 sm:pt-0 sm:px-4 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-red-600 mb-1.5">
                <Clock className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'bn' ? 'গড় সাড়া প্রদানের সময়' : 'Avg. Response'}
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                &lt; 15 min
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'bn' ? 'জরুরি আবেদনের গড় সাড়া' : 'Direct emergency reach'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Live Emergency Blood Requests (চলমান জরুরি রক্তের আবেদন) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-600 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse" />
              <span>{lang === 'bn' ? 'সরাসরি চলমান জরুরি রক্তের আবেদন' : 'LIVE EMERGENCY BLOOD CALLS'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t('liveRequestsTitle')}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t('liveRequestsSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePage('emergency')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
            >
              <span>{t('viewAllRequests')} ({requests.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {urgentRequests.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">
              {lang === 'bn' ? 'বর্তমানে কোনো জরুরি রক্তের আবেদন অমীমাংসিত নেই' : 'No active urgent blood requests at this moment'}
            </h3>
            <button
              onClick={() => setActivePage('emergency')}
              className="mt-4 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer"
            >
              {t('ctaEmergency')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {urgentRequests.map((req) => (
              <EmergencyCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Blood Compatibility Matrix (রক্তের গ্রুপের সামঞ্জস্য তালিকা) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 block mb-1">
              {lang === 'bn' ? 'রক্ত সঞ্চালন বিজ্ঞান' : 'TRANSFUSION COMPATIBILITY'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('compatibilityTitle')}
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              {t('compatibilitySubtitle')}
            </p>
          </div>

          {/* Group Selector Buttons */}
          <div className="mb-8">
            <span className="text-xs text-slate-400 block mb-3 font-medium">
              {lang === 'bn' ? 'আপনার রক্তের গ্রুপ বেছে নিন:' : 'Select your blood group to check compatibility:'}
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg.group}
                  onClick={() => setSelectedCompatGroup(bg.group)}
                  className={`py-3 px-2 rounded-xl text-center font-black text-sm transition-all cursor-pointer ${
                    selectedCompatGroup === bg.group
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-white/50 scale-105'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {bg.group}
                </button>
              ))}
            </div>
          </div>

          {/* Compatibility Details Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80">
            {/* Can Donate To */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{selectedCompatGroup} {t('canDonateTo')}:</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {currentCompat.canDonateTo.map((target) => (
                  <span
                    key={target}
                    className="px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-bold text-sm rounded-lg"
                  >
                    {target}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 pt-1">
                {selectedCompatGroup === 'O-' && (
                  lang === 'bn' 
                    ? 'ও নেগেটিভ রক্ত যেকোনো রক্তের গ্রুপের রোগীর জন্য জরুরি অবস্থায় ব্যবহারযোগ্য।'
                    : 'O- is the Universal Red Blood Cell Donor, critically needed in trauma emergency rooms.'
                )}
              </p>
            </div>

            {/* Can Receive From */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <HeartHandshake className="w-5 h-5 shrink-0" />
                <span>{selectedCompatGroup} {t('canReceiveFrom')}:</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {currentCompat.canReceiveFrom.map((source) => (
                  <span
                    key={source}
                    className="px-3.5 py-1.5 bg-amber-950/70 border border-amber-500/30 text-amber-300 font-bold text-sm rounded-lg"
                  >
                    {source}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 pt-1">
                {selectedCompatGroup === 'AB+' && (
                  lang === 'bn'
                    ? 'এবি পজিটিভ সার্বজনীন গ্রহীতা (Universal Recipient), যেকোনো গ্রুপ থেকে রক্ত নিতে পারেন।'
                    : 'AB+ is the Universal Recipient, capable of safely receiving all ABO blood types.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 4-Step Donation Process (রক্তদানের সহজ ৪টি ধাপ) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-1">
            {lang === 'bn' ? 'সহজ ও নিরাপদ প্রক্রিয়া' : 'SAFE & SIMPLE GUIDELINES'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('processTitle')}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            {lang === 'bn' 
              ? 'একজন সুস্থ প্রাপ্তবয়স্ক মানুষ প্রতি ৯০ দিনে একবার নিশ্চিন্তে রক্ত দিতে পারেন' 
              : 'Every healthy adult between 18-65 can donate blood safely in under 30 minutes total time'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-red-200 transition-colors shadow-2xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 font-black flex items-center justify-center text-lg">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-base">{t('step1Title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('step1Desc')}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-red-200 transition-colors shadow-2xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 font-black flex items-center justify-center text-lg">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-base">{t('step2Title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('step2Desc')}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-red-200 transition-colors shadow-2xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 font-black flex items-center justify-center text-lg">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-base">{t('step3Title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('step3Desc')}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-red-200 transition-colors shadow-2xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 font-black flex items-center justify-center text-lg">
                04
              </div>
              <h3 className="font-bold text-slate-900 text-base">{t('step4Title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('step4Desc')}</p>
            </div>
          </div>
        </div>

        {/* Eligibility Quiz Banner */}
        <div className="mt-8 bg-red-50 rounded-3xl p-6 sm:p-7 border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-200">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">
                {lang === 'bn' ? 'আপনি কি রক্তদানের জন্য উপযুক্ত?' : 'Wondering if you are eligible to donate?'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {lang === 'bn' ? 'আমাদের ইন্টারেক্টিভ ২ মিনিটের চেকার দিয়ে জেনে নিন।' : 'Take our quick 7-question clinical assessment.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('eligibility')}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            {t('checkEligibility')}
          </button>
        </div>
      </section>

      {/* 8. Medical & Campus Volunteers Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md aspect-4/3 bg-slate-100">
            <img
              src="/src/assets/images/volunteers_bangladesh_1792355611372.jpg"
              alt="Bangladeshi youth and medical volunteers outside Dhaka Medical College Hospital"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>

          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              {lang === 'bn' ? 'স্বেচ্ছাসেবী নেটওয়ার্ক' : 'HUMANITARIAN COMMUNITY'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'bn'
                ? 'মেডিকেল শিক্ষার্থী ও তরুণ স্বেচ্ছাসেবীদের সম্মিলিত প্রচেষ্টা'
                : 'Driven by Medical Students & Youth Volunteers Across Bangladesh'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {lang === 'bn'
                ? 'লাইফড্রপ সম্পূর্ণ অলাভজনক একটি প্ল্যাটফর্ম। আমাদের ভলান্টিয়াররা ঢাকা মেডিকেল, স্যার সলিমুল্লাহ, চট্টগ্রাম মেডিকেল, সিলেট এম এ জি ওসমানী, রাজশাহী ও ময়মনসিংহ মেডিকেলসহ দেশের প্রধান প্রধান সরকারি ও বেসরকারি হাসপাতালের সাথে সমন্বয় করে জরুরি রক্তের যোগান নিশ্চিত করছেন।'
                : 'LifeDrop is a non-profit volunteer initiative. Our volunteer liaison network collaborates closely with Dhaka Medical College Hospital, BSMMU, CMCH Chittagong, RMCH Rajshahi, and divisional transfusion centers to eliminate middleman brokers and connect genuine donors.'}
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{lang === 'bn' ? 'দালালমুক্ত সরাসরি যোগাযোগ: ' : 'Direct Connection: '}</strong>
                  {lang === 'bn' ? 'রোগীর স্বজন ও রক্তদাতার মাঝে কোনো তৃতীয় পক্ষ নেই।' : 'No agents or commercial middlemen.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{lang === 'bn' ? 'গোপনীয়তা ও নিরাপত্তা: ' : 'Privacy & Safety: '}</strong>
                  {lang === 'bn' ? 'আপনার তথ্য কেবল রক্তদানের মহৎ উদ্দেশ্যেই ব্যবহৃত হয়।' : 'Data strictly protected.'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActivePage('about')}
                className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                <span>{lang === 'bn' ? 'আমাদের নেটওয়ার্ক সম্পর্কে আরও জানুন' : 'Learn more about our volunteer mission'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
