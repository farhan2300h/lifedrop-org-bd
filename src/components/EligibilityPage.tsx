import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ActivePage } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Droplet, 
  ShieldCheck, 
  HeartHandshake, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface EligibilityPageProps {
  setActivePage: (page: ActivePage) => void;
}

export const EligibilityPage: React.FC<EligibilityPageProps> = ({ setActivePage }) => {
  const { lang, t } = useLanguage();

  // Quiz state
  const [ageOk, setAgeOk] = useState<boolean | null>(null);
  const [weightOk, setWeightOk] = useState<boolean | null>(null);
  const [intervalOk, setIntervalOk] = useState<boolean | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [medsOk, setMedsOk] = useState<boolean | null>(null);
  const [tattooOk, setTattooOk] = useState<boolean | null>(null);
  const [evaluated, setEvaluated] = useState(false);

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluated(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleReset = () => {
    setAgeOk(null);
    setWeightOk(null);
    setIntervalOk(null);
    setHealthOk(null);
    setMedsOk(null);
    setTattooOk(null);
    setEvaluated(false);
  };

  const isEligible = 
    ageOk === true && 
    weightOk === true && 
    intervalOk === true && 
    healthOk === true && 
    medsOk === true && 
    tattooOk === true;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'bn' ? 'ক্লিনিক্যাল নির্দেশিকা' : 'DONATION ELIGIBILITY'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('eligibilityTitle')}
        </h1>
        <p className="text-sm text-slate-600 mt-1.5">
          {t('eligibilitySubtitle')}
        </p>
      </div>

      {/* Interactive Self-Assessment Quiz */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {lang === 'bn' ? 'দ্রুত যোগ্যতা যাচাই কুইজ' : 'Quick Self-Assessment Quiz'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn' ? 'নিচের প্রশ্নগুলোর উত্তর দিয়ে জেনে নিন আপনি রক্তদানের জন্য প্রস্তুত কিনা' : 'Answer the 6 clinical questions below to verify if you can donate today'}
            </p>
          </div>
          {evaluated && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg border border-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'আবার শুরু করুন' : 'Reset'}</span>
            </button>
          )}
        </div>

        <form onSubmit={handleEvaluate} className="space-y-5">
          {/* Question 1: Age */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                1. {lang === 'bn' ? 'আপনার বয়স কি ১৮ থেকে ৬৫ বছরের মধ্যে?' : 'Is your age between 18 and 65 years?'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn' ? 'স্বেচ্ছায় রক্তদানের জন্য ন্যূনতম বয়স ১৮ বছর।' : 'Minimum legal voluntary donation age in Bangladesh is 18.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setAgeOk(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  ageOk === true ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setAgeOk(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  ageOk === false ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'না' : 'No'}
              </button>
            </div>
          </div>

          {/* Question 2: Weight */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                2. {lang === 'bn' ? 'আপনার ওজন কি অন্তত ৪৫ কেজি (পুরুষ ও নারী উভয়ের জন্য)?' : 'Is your body weight at least 45 kg (100 lbs)?'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn' ? 'রক্তদাতার রক্ত সঞ্চালনের সুরক্ষার জন্য ৪৫-৫০ কেজি ওজন বাধ্যতামূলক।' : 'Required for donor hemodynamic stability.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setWeightOk(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  weightOk === true ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setWeightOk(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  weightOk === false ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'না' : 'No'}
              </button>
            </div>
          </div>

          {/* Question 3: Interval */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                3. {lang === 'bn' ? 'সর্বশেষ রক্তদানের পর কি অন্তত ৩ মাস (৯০ দিন) পার হয়েছে?' : 'Has it been at least 3 months (90 days) since your last donation?'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn' ? 'যদি জীবনে কখনো রক্ত না দিয়ে থাকেন, তবে "হ্যাঁ" সিলেক্ট করুন।' : 'If you have never donated before, select "Yes".'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIntervalOk(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  intervalOk === true ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setIntervalOk(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  intervalOk === false ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'না' : 'No'}
              </button>
            </div>
          </div>

          {/* Question 4: Current Health */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                4. {lang === 'bn' ? 'আপনি কি বর্তমানে সম্পূর্ণ সুস্থ (জ্বর, সর্দি, বা সংক্রমণমুক্ত)?' : 'Are you feeling healthy and symptom-free today (no fever, flu, or infection)?'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn' ? 'হালকা জ্বর বা ঠাণ্ডা থাকলে সুস্থ হওয়ার পর রক্তদান করতে হবে।' : 'Wait until you are fully recovered before donating.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setHealthOk(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  healthOk === true ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setHealthOk(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  healthOk === false ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'না' : 'No'}
              </button>
            </div>
          </div>

          {/* Question 5: Medications / Antibiotics */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                5. {lang === 'bn' ? 'গত ৭ দিনে কি কোনো অ্যান্টিবায়োটিক সেবন করেছেন?' : 'Have you taken antibiotics in the last 7 days?'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn' ? 'অ্যান্টিবায়োটিক কোর্স শেষ হওয়ার পর অন্তত ৭ দিন অপেক্ষা করতে হয়।' : 'Wait 7 days after finishing any antibiotic regimen.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Note: If user has NOT taken antibiotics, that's good (medsOk=true) */}
              <button
                type="button"
                onClick={() => setMedsOk(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  medsOk === false ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'হ্যাঁ, সেবন করেছি' : 'Yes, took antibiotics'}
              </button>
              <button
                type="button"
                onClick={() => setMedsOk(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  medsOk === true ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'না, সেবন করিনি' : 'No antibiotics taken'}
              </button>
            </div>
          </div>

          {/* Question 6: Surgery / Tattoo / Dental */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                6. {lang === 'bn' ? 'গত ৬ মাসে কি কোনো বড় সার্জারি, ট্যাটু বা রক্ত গ্রহণ করেছেন?' : 'Any major surgery, tattooing, or blood transfusion in the past 6 months?'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn' ? 'রক্তবাহিত রোগ স্ক্রিনিং নিশ্চিতের জন্য ৬ মাসের বিরতি মানা হয়।' : '6-month deferral window ensures window-period infection screening.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTattooOk(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  tattooOk === false ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setTattooOk(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  tattooOk === true ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {lang === 'bn' ? 'না' : 'No'}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={ageOk === null || weightOk === null || intervalOk === null || healthOk === null || medsOk === null || tattooOk === null}
              className="w-full min-h-[44px] bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {lang === 'bn' ? 'ফলাফল দেখুন' : 'Check My Assessment Result'}
            </button>
          </div>
        </form>

        {/* Assessment Verdict Result Box */}
        {evaluated && (
          <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in duration-300">
            {isEligible ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">
                  {lang === 'bn' ? 'অভিনন্দন! আপনি রক্তদানের জন্য সম্পূর্ণ উপযুক্ত' : 'You Are Eligible to Donate Blood!'}
                </h3>
                <p className="text-sm text-slate-600 max-w-lg mx-auto">
                  {lang === 'bn'
                    ? 'আপনার শারীরিক মানদণ্ড সাধারণ রক্তদানের প্রয়োজনীয় শর্ত পূরণ করেছে। আপনি যেকোনো সময় নিকটস্থ হাসপাতাল বা রক্তদান সেন্টারে গিয়ে রক্ত দিতে পারেন।'
                    : 'Your answers satisfy standard voluntary blood donation criteria in Bangladesh. Register as a donor to help patients in emergency need.'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActivePage('register')}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {t('ctaRegister')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
                <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">
                  {lang === 'bn' ? 'সাময়িক বিরতি প্রয়োজন' : 'Temporary Deferral Advised'}
                </h3>
                <p className="text-sm text-slate-700 max-w-lg mx-auto">
                  {lang === 'bn'
                    ? 'আপনার উত্তরের ওপর ভিত্তি করে আপাতত রক্তদান না করার পরামর্শ দেওয়া হচ্ছে। ওজন কম থাকা, সম্প্রতি অ্যান্টিবায়োটিক গ্রহণ, অসুস্থতা বা ৩ মাস পূর্ণ না হওয়া এর কারণ হতে পারে।'
                    : 'Based on your responses, you should observe a temporary waiting period or consult with a transfusion medicine physician.'}
                </p>
                <p className="text-xs text-slate-500">
                  {lang === 'bn'
                    ? 'শারীরিক অবস্থা স্বাভাবিক হলে পুনরায় যোগ্যতা যাচাই করুন।'
                    : 'Re-assess once you have completed recovery or elapsed waiting intervals.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pre-Donation & Post-Donation Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pre-donation Do's */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span>{lang === 'bn' ? 'রক্তদানের পূর্বপ্রস্তুতি (Before Donation)' : 'Before Donating Blood'}</span>
          </h3>
          <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{lang === 'bn' ? 'রক্তদানের ২-৩ ঘণ্টা পূর্বে পুষ্টিকর খাবার গ্রহণ করুন, খালি পেটে রক্ত দেবেন না।' : 'Have a healthy meal 2-3 hours prior; never donate on an empty stomach.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{lang === 'bn' ? 'রক্তদানের আগে অন্তত ৫০০ মিলি (২ গ্লাস) পানি পান করুন।' : 'Drink at least 500ml (2 glasses) of water or fruit juice beforehand.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{lang === 'bn' ? 'আগের রাতে কমপক্ষে ৬-৮ ঘণ্টা পর্যাপ্ত ঘুম নিশ্চিত করুন।' : 'Get 6-8 hours of sound sleep the night before.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{lang === 'bn' ? 'রক্তদানের পূর্বে অন্তত ২ ঘণ্টা ধূমপান থেকে বিরত থাকুন।' : 'Avoid smoking for at least 2 hours before donation.'}</span>
            </li>
          </ul>
        </div>

        {/* Post-donation Care */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>{lang === 'bn' ? 'রক্তদানের পর করণীয় (After Donation)' : 'After Donating Blood'}</span>
          </h3>
          <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{lang === 'bn' ? 'রক্তদান শেষে বেডে ১০-১৫ মিনিট বিশ্রাম নিন, দ্রুত উঠবেন না।' : 'Rest reclining for 10-15 minutes; do not stand up abruptly.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{lang === 'bn' ? 'পরবর্তী কয়েক ঘণ্টা প্রচুর পানি ও তরল খাবার গ্রহণ করুন।' : 'Drink plenty of water and electrolytes over the next 24 hours.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{lang === 'bn' ? 'যে হাত দিয়ে রক্ত দিয়েছেন, তা দিয়ে অন্তত ৪-৫ ঘণ্টা ভারী কাজ করবেন না।' : 'Avoid strenuous physical exercise or heavy lifting with that arm for 5 hours.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{lang === 'bn' ? 'অনুভূতি খারাপ লাগলে কিছু সময় শুয়ে থাকুন ও পা উঁচুতে রাখুন।' : 'If you feel lightheaded, sit down and put your head between your knees.'}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bangladesh Myth Busters */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold text-slate-900 text-center">
          {lang === 'bn' ? 'রক্তদান সম্পর্কিত সাধারণ ভ্রান্ত ধারণা ও সত্যতা' : 'Common Myths vs. Clinical Facts in Bangladesh'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-red-700">
              ❌ {lang === 'bn' ? 'ভ্রান্ত ধারণা: রক্ত দিলে শরীর দুর্বল হয়ে যায়।' : 'Myth: Donating blood makes you weak or sick.'}
            </p>
            <p className="text-slate-600 leading-relaxed">
              ✅ {lang === 'bn' ? 'সত্যতা: একজন সুস্থ প্রাপ্তবয়স্কের শরীরে প্রায় ৫ লিটার রক্ত থাকে, যার মাত্র ৩৫০-৪৫০ মিলি গ্রহণ করা হয়। শরীর ২৪-৪৮ ঘণ্টার মধ্যে তরল এবং ২১ দিনে লোহিত রক্তকণিকা পুনরায় তৈরি করে।' : 'Fact: A healthy body stores ~5 liters of blood and donates only ~450ml. Fluid volume restores in 24 hours and red cells replenish within 3-4 weeks.'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-red-700">
              ❌ {lang === 'bn' ? 'ভ্রান্ত ধারণা: নারীদের রক্ত দেওয়া উচিত নয়।' : 'Myth: Women cannot safely donate blood.'}
            </p>
            <p className="text-slate-600 leading-relaxed">
              ✅ {lang === 'bn' ? 'সত্যতা: যেকোনো প্রাপ্তবয়স্ক সুস্থ নারী যার ওজন ৪৫+ কেজি এবং হিমোগ্লোবিন ১২ গ্রাম/ডেসিলিটার বা বেশি, তিনি সম্পূর্ণ নিরাপদে রক্ত দিতে পারেন।' : 'Fact: Any healthy woman weighing 45+ kg with adequate hemoglobin (≥12.0 g/dL) can donate safely.'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-red-700">
              ❌ {lang === 'bn' ? 'ভ্রান্ত ধারণা: রক্ত দিলে কোনো রোগ সংক্রমিত হতে পারে।' : 'Myth: You can contract diseases while donating.'}
            </p>
            <p className="text-slate-600 leading-relaxed">
              ✅ {lang === 'bn' ? 'সত্যতা: রক্ত গ্রহণের জন্য প্রতিটি ক্ষেত্রে সম্পূর্ণ নতুন, জীবাণুমুক্ত ওয়ান-টাইম ডিসপোজেবল সিরিঞ্জ ও রক্তের ব্যাগ ব্যবহৃত হয়।' : 'Fact: Modern donation kits and needles are 100% sterile, single-use, and disposed immediately after draw.'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <p className="font-bold text-red-700">
              ❌ {lang === 'bn' ? 'ভ্রান্ত ধারণা: নিয়মিত রক্ত দিলে ওজন বেড়ে যায়।' : 'Myth: Blood donation leads to weight gain.'}
            </p>
            <p className="text-slate-600 leading-relaxed">
              ✅ {lang === 'bn' ? 'সত্যতা: রক্তদানের সাথে অতিরিক্ত ওজন বৃদ্ধির কোনো চিকিৎসা সম্পর্ক নেই। বরং এটি রক্তে অতিরিক্ত আয়রন নিয়ন্ত্রণে রেখে হার্ট ভালো রাখতে সহায়ক।' : 'Fact: Blood donation does not cause weight gain. In fact, it helps balance body iron stores and cardiovascular health.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
