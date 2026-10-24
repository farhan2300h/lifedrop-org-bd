import React, { useState } from 'react';
import { 
  Heart, Search, AlertCircle, Shield, Clock, Users, MapPin, CheckCircle, ArrowRight, Activity, Award
} from 'lucide-react';

interface HomePageProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenRegister,
  onOpenLogin
}) => {
  const [selectedBlood, setSelectedBlood] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-red-50 via-white to-slate-50 pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-5xl mx-auto space-y-6 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100/80 border border-red-200 text-red-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>বাংলাদেশের স্বেচ্ছাসেবী রক্তদান নেটওয়ার্ক • ৬৪ জেলায় বিস্তৃত</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            আপনার এক ফোটা রক্ত, <br />
            <span className="text-red-600">বাঁচাতে পারে একটি প্রিয় প্রাণ</span>
          </h1>

          {/* ইসলামিক বাণী */}
          <div className="max-w-2xl mx-auto bg-white p-4 sm:p-5 rounded-2xl border-l-4 border-red-600 shadow-sm text-left my-4">
            <p className="text-sm font-bold text-slate-800 leading-relaxed">
              “অন্যের বিপদে আপনি যদি মানুষের পাশে দাঁড়ান, আপনার বিপদেও মহান আল্লাহ পাক কাউকে না কাউকে আপনার পাশে পাঠাবেন, ইনশাআল্লাহ।”
            </p>
            <p className="text-xs text-red-600 font-bold mt-1.5">— মানবকল্যাণে রক্তদানের অনন্য সওয়াব ও আত্মতৃপ্তি</p>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            বাংলাদেশের ৬৪ জেলার বিশ্বস্ত ও স্বেচ্ছাসেবী রক্তদাতাদের সাথে তাৎক্ষণিক সংযোগ। সম্পূর্ণ বিনামূল্যে, দালালমুক্ত ও নিরাপদ।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenRegister}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-red-600/25 transition-all cursor-pointer flex items-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>রক্তদাতা হিসেবে যুক্ত হোন</span>
            </button>
            <button
              onClick={onOpenLogin}
              className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-xs shadow-md transition-all cursor-pointer"
            >
              <span>লগইন করুন</span>
            </button>
          </div>
        </div>
      </section>

      {/* সার্চ সেকশন (রক্ত খুঁজুন) */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <Search className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-bold text-slate-900">জরুরি প্রয়োজনে রক্ত খুঁজুন</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">রক্তের গ্রুপ নির্বাচন করুন</label>
              <select 
                value={selectedBlood} 
                onChange={(e) => setSelectedBlood(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">সকল গ্রুপ</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">জেলা নির্বাচন করুন</label>
              <input 
                type="text" 
                placeholder="যেমন: ঢাকা, গাজীপুর, ময়মনসিংহ" 
                value={selectedDistrict} 
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                <span>রক্তদাতা সন্ধান করুন</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* যেভাবে কাজ করে (৩টি ধাপ) */}
      <section className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-slate-900">কিভাবে LifeDrop কাজ করে?</h2>
          <p className="text-xs text-slate-500">সহজ ৩টি ধাপে সরাসরি রক্তদাতার সাথে যোগাযোগ করুন</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center">01</div>
            <h3 className="text-sm font-bold text-slate-900">নিবন্ধন সম্পূর্ণ করুন</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              স্বেচ্ছাসেবক অথবা রক্তদাতা হিসেবে নাম, রক্ত গ্রুপ ও এলাকা বেছে নিয়ে ফ্রিতে অ্যাকাউন্ট তৈরি করুন।
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center">02</div>
            <h3 className="text-sm font-bold text-slate-900">জরুরি রক্তের আবেদন করুন</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              হাসপাতালের নাম, রক্তের গ্রুপ ও ব্যাগের সংখ্যা লিখে প্ল্যাটফর্মে রক্তের রিকোয়েস্ট পোস্ট করুন।
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center">03</div>
            <h3 className="text-sm font-bold text-slate-900">সরাসরি রক্তদাতার সাথে কথা বলুন</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              নিকটস্থ রক্তদাতার ফোন নম্বরে কল করে বা হোয়াটসঅ্যাপে সরাসরি যোগাযোগ করে রক্ত সংগ্রহ করুন।
            </p>
          </div>
        </div>
      </section>

      {/* পরিসংখান সেকশন */}
      <section className="bg-slate-900 text-white py-10 px-4 rounded-3xl max-w-5xl mx-auto shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-red-500">৬৪+</div>
            <div className="text-[11px] text-slate-400 font-semibold">জেলায় উপস্থিতি</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-red-500">১০০%</div>
            <div className="text-[11px] text-slate-400 font-semibold">বিনামূল্যে সেবা</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-red-500">২৪/৭</div>
            <div className="text-[11px] text-slate-400 font-semibold">জরুরি রক্তদাতা নেটওয়ার্ক</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-red-500">নিরাপদ</div>
            <div className="text-[11px] text-slate-400 font-semibold">ভেরিফাইড ডোনার সিস্টেম</div>
          </div>
        </div>
      </section>

    </div>
  );
};
