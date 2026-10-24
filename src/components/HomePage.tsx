import React, { useState } from 'react';
import { 
  Heart, Search, AlertCircle, Phone, MessageCircle, MapPin, Calendar, Clock, 
  User, CheckCircle2, AlertTriangle, RefreshCw, FileText, Filter, PlusCircle
} from 'lucide-react';

interface RequestItem {
  refNo: string;
  patientName: string;
  bloodGroup: string;
  units: string;
  hospital: string;
  division: string;
  district: string;
  upazila: string;
  date: string;
  time: string;
  diseaseDetails: string;
  applicantName: string;
  applicantPhone: string;
  status: 'অপেক্ষমাণ' | 'ডোনার পাওয়া গেছে' | 'সম্পন্ন' | 'বাতিল';
}

interface DonorItem {
  id: string;
  name: string;
  bloodGroup: string;
  phone: string;
  district: string;
  upazila: string;
  area: string;
  lastDonated: string;
  nextAvailable: string;
  isReady: boolean;
  avatarUrl?: string;
}

interface HomePageProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  currentTab?: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenRegister,
  onOpenLogin,
  currentTab = 'home'
}) => {
  // ১. রক্ত খুঁজুন / আবেদন তৈরি ফর্ম স্টেট
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([
    {
      refNo: 'REQ-849201',
      patientName: 'আরিফুল ইসলাম',
      bloodGroup: 'O+',
      units: '২ ব্যাগ',
      hospital: 'স্কয়ার হাসপাতাল, পান্থপথ',
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'ধানমন্ডি',
      date: '2026-10-26',
      time: 'সকাল ১০:০০',
      diseaseDetails: 'ওপেন হার্ট সার্জারি',
      applicantName: 'মাহমুদুল হাসান',
      applicantPhone: '01803000000',
      status: 'অপেক্ষমাণ'
    }
  ]);

  // ফর্মে নতুন তথ্য ইনপুট
  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: 'O+',
    units: '১ ব্যাগ',
    hospital: '',
    division: 'ঢাকা (Dhaka)',
    district: 'গাজীপুর (Gazipur)',
    upazila: 'শ্রীপুর (Sreepur)',
    date: '',
    time: '',
    diseaseDetails: '',
    applicantName: '',
    applicantPhone: ''
  });

  const [createdRefNo, setCreatedRefNo] = useState<string | null>(null);

  // ৩. ডোনার তালিকা স্টেট
  const [donors, setDonors] = useState<DonorItem[]>([
    {
      id: 'd1',
      name: 'হাবিবুর রহমান',
      bloodGroup: 'O+',
      phone: '01803000000',
      district: 'গাজীপুর',
      upazila: 'শ্রীপুর',
      area: 'স্কয়ার মাস্টারবাড়ি',
      lastDonated: '2026-06-15',
      nextAvailable: '2026-09-15',
      isReady: true,
      avatarUrl: ''
    },
    {
      id: 'd2',
      name: 'তানভীর আহমেদ',
      bloodGroup: 'A+',
      phone: '01711000000',
      district: 'ঢাকা',
      upazila: 'মিরপুর',
      area: 'মিরপুর ১০',
      lastDonated: '2026-05-10',
      nextAvailable: '2026-08-10',
      isReady: true,
      avatarUrl: ''
    }
  ]);

  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  // রক্তের আবেদন জমা দেওয়ার হ্যান্ডলার
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef = 'REQ-' + Math.floor(100000 + Math.random() * 900000);
    const newReq: RequestItem = {
      ...formData,
      refNo: newRef,
      status: 'অপেক্ষমাণ'
    };
    setRequests([newReq, ...requests]);
    setCreatedRefNo(newRef);
    setShowRequestForm(false);
  };

  // ডোনার রেডি স্ট্যাটাস পরিবর্তন
  const toggleDonorReady = (id: string) => {
    setDonors(donors.map(d => d.id === id ? { ...d, isReady: !d.isReady } : d));
  };

  const filteredDonors = donors.filter(d => {
    const matchBlood = !filterBloodGroup || d.bloodGroup === filterBloodGroup;
    const matchDistrict = !filterDistrict || d.district.toLowerCase().includes(filterDistrict.toLowerCase());
    return matchBlood && matchDistrict;
  });

  return (
    <div className="space-y-12 pb-20">
      
      {/* -------------------- ১. হোম সেকশন -------------------- */}
      <section id="home" className="bg-gradient-to-b from-red-50 via-white to-slate-50 pt-8 pb-10 px-4 border-b border-slate-100">
        <div className="max-w-5xl mx-auto space-y-5 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100/80 border border-red-200 text-red-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>বাংলাদেশের স্বেচ্ছাসেবী রক্তদান নেটওয়ার্ক • ৬৪ জেলায় বিস্তৃত</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            আপনার এক ফোটা রক্ত, <br />
            <span className="text-red-600">বাঁচাতে পারে একটি প্রিয় প্রাণ</span>
          </h1>

          <div className="max-w-2xl mx-auto bg-white p-4 rounded-2xl border-l-4 border-red-600 shadow-xs text-left">
            <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
              “অন্যের বিপদে আপনি যদি মানুষের পাশে দাঁড়ান, আপনার বিপদেও মহান আল্লাহ পাক কাউকে না কাউকে আপনার পাশে পাঠাবেন, ইনশাআল্লাহ।”
            </p>
            <p className="text-[11px] text-red-600 font-bold mt-1">— মানবকল্যাণে রক্তদানের অনন্য সওয়াব ও আত্মতৃপ্তি</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenRegister}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center gap-2"
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


      {/* -------------------- ১. রক্ত খুঁজুন (SEARCH & CREATE REQUEST) -------------------- */}
      <section id="search-section" className="max-w-5xl mx-auto px-4 scroll-mt-20 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Search className="w-6 h-6 text-red-600" />
              <span>১. রক্ত খুঁজুন ও আবেদনের তালিকা</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">সাধারণ রক্তের প্রয়োজনের জন্য ফর্ম পূরণ করুন এবং তালিকাটি দেখুন</p>
          </div>

          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showRequestForm ? 'আবেদন ফর্ম বন্ধ করুন' : 'নতুন রক্তের আবেদন করুন'}</span>
          </button>
        </div>

        {/* রেফারেন্স সাকসেস মেসেজ */}
        {createdRefNo && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              <span>আপনার আবেদনটি সফলভাবে জমা হয়েছে!</span>
            </div>
            <p>আপনার আবেদনের ইউনিক রেফারেন্স নম্বর: <span className="font-mono font-black text-red-600 text-sm">{createdRefNo}</span>। এটি পরবর্তীতে সংরক্ষণে রাখুন।</p>
          </div>
        )}

        {/* রক্তদানের নতুন আবেদন ফর্ম */}
        {showRequestForm && (
          <form onSubmit={handleCreateRequest} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">রোগীর প্রয়োজনীয় রক্তের আবেদন ফর্ম</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">রোগীর নাম *</label>
                <input type="text" required placeholder="রোগীর পুরো নাম" value={formData.patientName} onChange={e => setFormData({ ...formData, patientName: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">রক্তের গ্রুপ *</label>
                <select value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-red-600">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">রক্তের পরিমাণ (ব্যাগের সংখ্যা) *</label>
                <input type="text" required placeholder="যেমন: ১ ব্যাগ / ২ ব্যাগ" value={formData.units} onChange={e => setFormData({ ...formData, units: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">সম্ভাব্য তারিখ *</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">কোন সময়ের মধ্যে প্রয়োজন *</label>
                <input type="text" required placeholder="যেমন: সকাল ১০:০০ টা" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">বিভাগ *</label>
                <input type="text" required value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">জেলা *</label>
                <input type="text" required value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">উপজেলা / থানা *</label>
                <input type="text" required value={formData.upazila} onChange={e => setFormData({ ...formData, upazila: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">হাসপাতাল ও বিস্তারিত ঠিকানা *</label>
              <input type="text" required placeholder="হাসপাতালের নাম ও রুম/ওয়ার্ড নম্বর" value={formData.hospital} onChange={e => setFormData({ ...formData, hospital: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">রোগীর রোগ বা অপারেশনের বিবরণ</label>
              <textarea rows={2} placeholder="রোগের বিস্তারিত বিবরণ সংক্ষেপে লিখুন..." value={formData.diseaseDetails} onChange={e => setFormData({ ...formData, diseaseDetails: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">আবেদনকারীর নাম *</label>
                <input type="text" required placeholder="আপনার নাম" value={formData.applicantName} onChange={e => setFormData({ ...formData, applicantName: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">আবেদনকারীর মোবাইল নম্বর *</label>
                <input type="text" required placeholder="017XXXXXXXX" value={formData.applicantPhone} onChange={e => setFormData({ ...formData, applicantPhone: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md text-xs cursor-pointer">
              আবেদন জমা দিন (Submit Request)
            </button>
          </form>
        )}

        {/* আবেদনের তালিকা */}
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.refNo} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-red-600 text-white font-black text-xs rounded-lg">{req.bloodGroup}</span>
                  <span className="font-bold text-slate-900 text-sm">{req.patientName}</span>
                  <span className="text-[11px] font-mono text-slate-400">({req.refNo})</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  req.status === 'অপেক্ষমাণ' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  req.status === 'ডোনার পাওয়া গেছে' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  স্ট্যাটাস: {req.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> <span>{req.hospital}, {req.upazila}, {req.district}</span></div>
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" /> <span>তারিখ: {req.date} ({req.time})</span></div>
                <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" /> <span>পরিমাণ: {req.units} ({req.diseaseDetails || 'সাধারণ'})</span></div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <span className="text-slate-500">আবেদনকারী: <strong>{req.applicantName}</strong></span>
                <a href={`tel:${req.applicantPhone}`} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>যোগাযোগ করুন</span>
                </a>
              </div>
            </div>
          ))}
        </div>

      </section>


      {/* -------------------- ২. জরুরি রক্ত (EMERGENCY SECTION) -------------------- */}
      <section id="emergency-section" className="max-w-5xl mx-auto px-4 scroll-mt-20">
        <div className="bg-gradient-to-r from-red-700 to-rose-900 rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-7 h-7 text-amber-300 animate-bounce" />
            <h2 className="text-xl font-black">২. 🚨 জরুরি রক্ত (Emergency Urgent Support)</h2>
          </div>
          <p className="text-xs sm:text-sm text-red-100 leading-relaxed max-w-2xl">
            অতি জরুরি মুহূর্তে রক্ত সংগ্রহের জন্য বিলম্ব না করে সরাসরি আমাদের হটলাইনে ফোন করুন অথবা হোয়াটসঅ্যাপে যোগাযোগ করুন।
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a href="tel:+8801950902300" className="px-5 py-3 bg-white text-red-700 hover:bg-red-50 font-black rounded-2xl text-xs shadow-md flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-600" />
              <span>জরুরি কল: +8801950902300</span>
            </a>
            <a href="https://wa.me/8801950902300" target="_blank" rel="noreferrer" className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp চ্যাট করুন</span>
            </a>
          </div>
        </div>
      </section>


      {/* -------------------- ৩. 🩸 ডোনার (DONORS LIST & TOGGLE) -------------------- */}
      <section id="donor-section" className="max-w-5xl mx-auto px-4 scroll-mt-20 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-2xl">🩸</span>
              <span>৩. রক্তদাতাদের তালিকা (Registered Donors)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">যেসব রক্তদাতা প্রস্তুত আছেন তাদের তথ্য দেখতে নিচে ফিল্টার করুন</p>
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={filterBloodGroup} 
              onChange={e => setFilterBloodGroup(e.target.value)}
              className="p-2 bg-white border rounded-xl text-xs font-bold text-red-600"
            >
              <option value="">সকল গ্রুপ</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="জেলা লিখুন" 
              value={filterDistrict} 
              onChange={e => setFilterDistrict(e.target.value)}
              className="p-2 bg-white border rounded-xl text-xs font-medium w-28"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredDonors.map((donor) => (
            <div key={donor.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative">
              
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-red-100 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                    {donor.bloodGroup}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{donor.name}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-600" />
                      <span>{donor.area}, {donor.upazila}, {donor.district}</span>
                    </p>
                  </div>
                </div>

                {/* রক্ত দিতে প্রস্তুত সুইচ */}
                <button 
                  onClick={() => toggleDonorReady(donor.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    donor.isReady 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {donor.isReady ? '✓ রক্ত দিতে প্রস্তুত' : 'অনুপলব্ধ (Off)'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                <div>সর্বশেষ দান: <strong>{donor.lastDonated || 'N/A'}</strong></div>
                <div>পরবর্তী সম্ভাব্য দান: <strong className="text-red-600">{donor.nextAvailable || 'এখনই সম্ভব'}</strong></div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-700">মোবাইল: {donor.phone}</span>
                {donor.isReady ? (
                  <a href={`tel:${donor.phone}`} className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs">
                    <Phone className="w-3.5 h-3.5" />
                    <span>কল করুন</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">ডোনার সাময়িক বন্ধ আছেন</span>
                )}
              </div>

            </div>
          ))}
        </div>

      </section>

    </div>
  );
};
