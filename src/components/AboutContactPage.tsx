import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ActivePage } from '../types';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  HeartHandshake, 
  Send, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Users,
  MessageSquare
} from 'lucide-react';

interface AboutContactPageProps {
  setActivePage: (page: ActivePage) => void;
}

export const AboutContactPage: React.FC<AboutContactPageProps> = ({ setActivePage }) => {
  const { lang, t } = useLanguage();

  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderSubject, setSenderSubject] = useState('Volunteer Inquiry');
  const [senderMessage, setSenderMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setSenderName('');
      setSenderPhone('');
      setSenderMessage('');
    }, 1000);
  };

  const transfusionCenters = [
    {
      name: 'Dhaka Medical College Hospital (DMCH) Blood Transfusion Dept.',
      location: 'Secretariat Road, Shahbagh, Dhaka',
      phone: '01711-001122',
      timing: '24 Hours Emergency'
    },
    {
      name: 'BSMMU (Bangabandhu Sheikh Mujib Medical University)',
      location: 'Shahbagh Circle, Dhaka',
      phone: '01819-223344',
      timing: '24 Hours Emergency'
    },
    {
      name: 'Bangladesh Red Crescent Society (National Blood Center)',
      location: '7/5 Aurangzeb Road, Mohammadpur, Dhaka',
      phone: '02-9116563 / 01811-458524',
      timing: '8:00 AM - 10:00 PM Daily'
    },
    {
      name: 'Chittagong Medical College Hospital (CMCH) Blood Bank',
      location: 'KB Fazlul Kader Road, Panchlaish, Chattogram',
      phone: '01911-334455',
      timing: '24 Hours Emergency'
    },
    {
      name: 'Sylhet MAG Osmani Medical College Hospital',
      location: 'Medical College Road, Sylhet',
      phone: '01723-445566',
      timing: '24 Hours Emergency'
    },
    {
      name: 'Rajshahi Medical College Hospital (RMCH)',
      location: 'Laxmipur, Rajshahi Sadar',
      phone: '01552-667788',
      timing: '24 Hours Emergency'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* About Section */}
      <section className="space-y-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>{lang === 'bn' ? 'আমাদের লক্ষ্য ও কার্যক্রম' : 'OUR MISSION & NETWORK'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {lang === 'bn' 
              ? 'একটিও প্রাণ যেন রক্তের অভাবে অকালে ঝরে না যায়' 
              : 'Connecting Bangladesh to Ensure No Life is Lost for Want of Blood'}
          </h1>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            {lang === 'bn'
              ? 'লাইফড্রপ (LifeDrop) বাংলাদেশের প্রতিটি বিভাগ, জেলা ও উপজেলার সাধারণ স্বেচ্ছাসেবী রক্তদাতাদের একটি ডিজিটাল ছাতার নিচে নিয়ে আসার উদ্যোগ। দালাল চক্র নির্মূল করে রোগীর স্বজন ও রক্তদাতার মাঝে নিরাপদ, বিনামূল্যে ও সরাসরি সেতুবন্ধন তৈরি করাই আমাদের প্রধান উদ্দেশ্য।'
              : 'LifeDrop is a volunteer-led nationwide emergency blood donation network designed to eliminate predatory blood brokers, speed up hospital transfusion response times, and celebrate humanitarian volunteerism across all 64 districts of Bangladesh.'}
          </p>
        </div>

        {/* Feature Grid with Generated Clinic Drive Photo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>{lang === 'bn' ? '১০০% স্বেচ্ছাসেবী ও সম্পূর্ণ বাণিজ্যিকতামুক্ত' : '100% Voluntary & Non-Commercial'}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === 'bn'
                  ? 'রক্ত অমূল্য। রক্ত কেনাবেচা করা আইনত ও নৈতিকভাবে দণ্ডনীয়। লাইফড্রপের সকল রক্তদাতা সম্পূর্ণ বিনামূল্যে রক্তদান করেন। কোনো ব্যবহারকারী বা মধ্যস্বত্বভোগী অর্থ দাবি করলে সরাসরি আমাদের হটলাইনে রিপোর্ট করার অনুরোধ করা হচ্ছে।'
                  : 'Blood is priceless. Selling blood is illegal and dangerous. Every donor on LifeDrop contributes purely on humanitarian grounds. Any demand for payment is strictly prohibited and banned.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>{lang === 'bn' ? 'উপজেলা ও থানাভিত্তিক দ্রুত অনুসন্ধান' : 'Upazila-Level Hyperlocal Matching'}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === 'bn'
                  ? 'ঢাকা বা বিভাগীয় শহরের বড় হাসপাতালের পাশাপাশি জেলা ও প্রত্যন্ত উপজেলার রোগীদের জরুরি রক্তের চাহিদা মেটাতে আমাদের ফিল্টার সিস্টেম অত্যন্ত নিখুঁত।'
                  : 'Patients in tertiary medical college hospitals as well as upazila health complexes can locate matching donors within minutes using our geographic filter.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>{lang === 'bn' ? 'স্বেচ্ছাসেবক ও মেডিকেল শিক্ষার্থী নেটওয়ার্ক' : 'Campus Volunteer Chapters'}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === 'bn'
                  ? 'দেশের শীর্ষ মেডিকেল কলেজ এবং পাবলিক বিশ্ববিদ্যালয়ের তরুণ স্বেচ্ছাসেবকরা ২৪ ঘণ্টা রক্তের জরুরি রিকুয়েস্ট ভেরিফিকেশনে সহায়তা করছেন।'
                  : 'Student volunteers and youth organizers in public universities and medical colleges maintain regional coordination to assist critical ICU and surgery cases.'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md aspect-4/3 bg-slate-100">
              <img
                src="/src/assets/images/blood_drive_clinic_1792355611008.jpg"
                alt="Voluntary blood donation drive in a Bangladesh institution"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bangladesh Transfusion Centers Directory */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-red-600 block mb-1">
            {lang === 'bn' ? 'জরুরি রক্তের ব্যাংক' : 'MAJOR BLOOD TRANSFUSION CENTERS'}
          </span>
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === 'bn' ? 'বাংলাদেশের প্রধান সরকারি ও দাতব্য ব্লাড ব্যাংক' : 'Key Hospital Blood Banks & Red Crescent Centers'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'bn' 
              ? 'হাসপাতালে রোগীর ক্রস-ম্যাচিং এবং রক্তের ব্যাগ স্ক্রিনিং নিশ্চিত করতে নিচের কেন্দ্রে যোগাযোগ করতে পারেন' 
              : 'Direct contacts for cross-matching and donor screening at key health facilities'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transfusionCenters.map((center, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                {center.name}
              </h3>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{center.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-emerald-700 font-medium">{center.timing}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-700 font-semibold">{center.phone}</span>
                <a
                  href={`tel:${center.phone.replace(/[^0-9]/g, '')}`}
                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg transition-colors"
                >
                  {t('callContact')}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Volunteer Inquiry Form */}
      <section className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Official Contact & Helplines */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-1">
                {lang === 'bn' ? 'অফিসিয়াল যোগাযোগ' : 'OFFICIAL CONTACT'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {lang === 'bn' ? 'যোগাযোগ — LifeDrop (CEO-HABIB)' : 'Contact — LifeDrop (CEO-HABIB)'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {lang === 'bn'
                  ? 'জরুরি রক্তের চাহিদা, রক্তদান ক্যাম্প আয়োজন বা যেকোনো তথ্যের জন্য সরাসরি অ্যাডমিন ও প্রধান সমন্বয়কের সাথে যোগাযোগ করুন।'
                  : 'For urgent blood calls, organizing blood drives, or network coordination, contact the admin desk directly.'}
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Primary Admin Phone Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-red-100 shadow-xs space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-200">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                      {lang === 'bn' ? 'অ্যাডমিনের মোবাইল নম্বর (CEO-HABIB)' : 'Admin Mobile (CEO-HABIB)'}
                    </span>
                    <a
                      href="tel:+8801950902300"
                      className="text-base sm:text-lg font-black text-slate-900 hover:text-red-600 font-mono transition-colors block"
                      title="সরাসরি কল করুন"
                    >
                      +8801950902300
                    </a>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href="tel:+8801950902300"
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'সরাসরি কল করুন' : 'Call Admin'}</span>
                  </a>
                </div>
              </div>

              {/* WhatsApp Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">
                      {lang === 'bn' ? 'WhatsApp সরাসরি চ্যাট' : 'Direct WhatsApp'}
                    </span>
                    <a
                      href="https://wa.me/8801950902300"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base sm:text-lg font-black text-slate-900 hover:text-emerald-600 font-mono transition-colors block"
                    >
                      +8801950902300
                    </a>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href="https://wa.me/8801950902300"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    title="হোয়াটসঅ্যাপে চ্যাট খুলুন"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'WhatsApp চ্যাট শুরু করুন (+8801950902300)' : 'Chat on WhatsApp'}</span>
                  </a>
                </div>
              </div>

              {/* Address Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                    {lang === 'bn' ? 'প্রধান কার্যালয়ের ঠিকানা' : 'Official Address'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                    যোগিরছিট, শ্রীপুর, গাজীপুর, বাংলাদেশ।
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Jogirchhit, Sreepur, Gazipur, Bangladesh.
                  </p>
                </div>
              </div>

              {/* Email Support Card */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Email Support</span>
                  <a href="mailto:blooddonationnetwork5@gmail.com" className="text-xs font-semibold text-slate-800 hover:text-red-600 truncate block">
                    blooddonationnetwork5@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Message Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            {messageSent ? (
              <div className="text-center py-10 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'bn' ? 'বার্তাটি সফলভাবে পাঠানো হয়েছে!' : 'Message Received!'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                  {lang === 'bn'
                    ? 'আমাদের স্বেচ্ছাসেবক টিম দ্রুত আপনার সাথে যোগাযোগ করবে। রক্তদানের সাথে থাকার জন্য ধন্যবাদ।'
                    : 'Our volunteer coordinators will respond to your inquiry shortly. Thank you for supporting blood donation in Bangladesh.'}
                </p>
                <button
                  onClick={() => setMessageSent(false)}
                  className="mt-2 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'আরেকটি বার্তা পাঠান' : 'Send another message'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'bn' ? 'আমাদের বার্তা পাঠান' : 'Send an Inquiry or Volunteer Request'}
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {t('phone')} *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {lang === 'bn' ? 'বিষয়' : 'Subject'}
                    </label>
                    <select
                      value={senderSubject}
                      onChange={(e) => setSenderSubject(e.target.value)}
                      className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer"
                    >
                      <option value="Volunteer Inquiry">Volunteer as Coordinator</option>
                      <option value="Organize Blood Drive">Organize Campus/Office Blood Drive</option>
                      <option value="Hospital Partnership">Hospital / Clinic Partnership</option>
                      <option value="General Inquiry">General Question / Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {lang === 'bn' ? 'বার্তা' : 'Message'} *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe how we can assist or collaborate..."
                    value={senderMessage}
                    onChange={(e) => setSenderMessage(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[44px] bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'বার্তা পাঠান' : 'Submit Inquiry'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
