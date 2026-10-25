import React, { useEffect, useMemo, useState } from 'react';
import {
  Heart, Search, AlertCircle, Phone, MessageCircle, MapPin, Calendar,
  CheckCircle2, FileText, PlusCircle, Users, Inbox, Activity, Droplet,
  Eye, ArrowRight, ShieldCheck, HandHeart, Loader2, Image as ImageIcon
} from 'lucide-react';
import { bloodService } from '../services/bloodService';
import type { Donor, BloodRequest, BloodGroup } from '../types';

interface HomePageProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  currentTab?: string;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const EMPTY_FORM = {
  patientName: '',
  patientAge: '',
  hemoglobin: '',
  bloodGroup: 'O+' as BloodGroup,
  unitsRequired: '1',
  hospital: '',
  division: '',
  district: '',
  upazila: '',
  dateNeeded: '',
  timeNeeded: '',
  reason: '',
  contactName: '',
  contactPhone: '',
  urgency: 'immediate',
  attendantNotes: '',
  consent: false,
};

const bnStatus = (status: string) => {
  const statuses: Record<string, string> = {
    urgent: 'জরুরি', pending: 'অপেক্ষমাণ', in_progress: 'প্রক্রিয়াধীন',
    fulfilled: 'সম্পন্ন', completed: 'সম্পন্ন', cancelled: 'বাতিল',
  };
  return statuses[status] || status;
};

export const HomePage: React.FC<HomePageProps> = ({
  onOpenRegister,
  onOpenLogin,
  currentTab = 'home',
}) => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [createdRefNo, setCreatedRefNo] = useState<string | null>(null);
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadRealData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [realDonors, realRequests] = await Promise.all([
        bloodService.fetchRealDonors(),
        bloodService.fetchRealRequests(),
      ]);
      setDonors(realDonors);
      setRequests(realRequests);
    } catch {
      setLoadError('তথ্য লোড করা যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRealData();
    const unsubscribe = bloodService.subscribe(() => {
      setDonors(bloodService.getDonors());
      setRequests(bloodService.getRequests());
    });
    return unsubscribe;
  }, []);

  const approvedDonors = useMemo(
    () => donors.filter(d => d.approvalStatus === 'approved'),
    [donors]
  );

  const filteredDonors = useMemo(() => approvedDonors.filter(d => {
    const matchBlood = !filterBloodGroup || d.bloodGroup === filterBloodGroup;
    const matchDistrict = !filterDistrict ||
      (d.district || '').toLowerCase().includes(filterDistrict.toLowerCase());
    return matchBlood && matchDistrict;
  }), [approvedDonors, filterBloodGroup, filterDistrict]);

  const urgentRequests = useMemo(
    () => requests.filter(r => ['urgent', 'pending', 'in_progress'].includes(String(r.status))),
    [requests]
  );
  const completedRequests = useMemo(
    () => requests.filter(r => ['fulfilled', 'completed'].includes(String(r.status))),
    [requests]
  );

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRequestError('');
    setCreatedRefNo(null);
    try {
      const saved = await bloodService.addRequest({
        patientName: formData.patientName.trim(),
        patientAge: formData.patientAge ? Number(formData.patientAge) : undefined,
        hemoglobin: formData.hemoglobin ? Number(formData.hemoglobin) : undefined,
        bloodGroup: formData.bloodGroup,
        unitsRequired: Number(formData.unitsRequired),
        hospital: formData.hospital.trim(),
        division: formData.division.trim(),
        district: formData.district.trim(),
        upazila: formData.upazila.trim(),
        contactName: formData.contactName.trim(),
        contactPhone: formData.contactPhone.trim(),
        urgency: formData.urgency as BloodRequest['urgency'],
        reason: formData.reason.trim(),
        dateNeeded: formData.dateNeeded,
        timeNeeded: formData.timeNeeded || undefined,
        attendantNotes: formData.attendantNotes.trim() || undefined,
        consent: formData.consent,
      });
      setCreatedRefNo(saved.id);
      setShowRequestForm(false);
      setFormData(EMPTY_FORM);
      await loadRealData();
    } catch {
      setRequestError('আবেদন সংরক্ষণ করা যায়নি। ডেটাবেজ সংযোগ ও অনুমতি পরীক্ষা করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const showHome = currentTab === 'home';
  const showSearch = currentTab === 'home' || currentTab === 'search';
  const showEmergency = currentTab === 'home' || currentTab === 'emergency';
  const showDonors = currentTab === 'home' || currentTab === 'donor';

  return (
    <div className="bg-slate-50 text-slate-800 pb-24">
      {showHome && (
        <>
          {/* Hero: image is decorative only; all numbers below come from loaded records. */}
          <section className="relative isolate overflow-hidden bg-gradient-to-r from-red-950 via-red-800 to-rose-700 text-white">
            <div className="absolute inset-0 opacity-20" aria-hidden="true">
              <img
                src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1800&q=85"
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 sm:py-16 md:grid-cols-2 md:px-8">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold">
                  <Heart className="h-4 w-4 fill-current" /> LifeDrop Blood Donation Network
                </div>
                <h1 className="max-w-xl text-3xl font-black leading-tight sm:text-5xl">
                  আপনার এক ফোঁটা <span className="text-red-200">রক্ত</span><br />
                  বাঁচাতে পারে একটি প্রাণ
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-7 text-red-50 sm:text-base">
                  রক্তদাতা ও রক্তের প্রয়োজনে থাকা মানুষকে যুক্ত করার একটি মানবিক উদ্যোগ।
                  আজই পাশে দাঁড়ান, জীবন বাঁচাতে সাহায্য করুন।
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-red-700 shadow-lg transition hover:bg-red-50">
                    <Search className="h-4 w-4" /> রক্ত খুঁজুন
                  </button>
                  <button onClick={onOpenRegister}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20">
                    <Heart className="h-4 w-4" /> রক্তদাতা হিসেবে যুক্ত হোন
                  </button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="mx-auto max-w-md rounded-[2rem] border border-white/30 bg-white/10 p-5 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-5 text-slate-900">
                    <div className="rounded-2xl bg-red-100 p-4 text-red-600"><Droplet className="h-10 w-10 fill-current" /></div>
                    <div><p className="text-sm font-bold text-slate-500">রক্তদান করুন</p><p className="text-xl font-black">মানবতার পাশে থাকুন</p></div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/95 p-4 text-slate-900"><Heart className="mb-2 h-6 w-6 text-red-600" /><p className="text-sm font-bold">একটি দান</p><p className="text-xs text-slate-500">বাঁচাতে পারে জীবন</p></div>
                    <div className="rounded-2xl bg-white/95 p-4 text-slate-900"><HandHeart className="mb-2 h-6 w-6 text-red-600" /><p className="text-sm font-bold">স্বেচ্ছাসেবা</p><p className="text-xs text-slate-500">মানবতার জন্য</p></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Real counts only. Visitor tracking is deliberately not fabricated. */}
          <section className="mx-auto -mt-1 grid max-w-6xl grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 sm:px-6">
            {[
              { label: 'অনুমোদিত রক্তদাতা', value: loading ? '…' : String(approvedDonors.length), icon: Users, color: 'text-red-600 bg-red-50' },
              { label: 'মোট রক্তের অনুরোধ', value: loading ? '…' : String(requests.length), icon: Droplet, color: 'text-rose-600 bg-rose-50' },
              { label: 'জরুরি / চলমান অনুরোধ', value: loading ? '…' : String(urgentRequests.length), icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
              { label: 'সম্পন্ন অনুরোধ', value: loading ? '…' : String(completedRequests.length), icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
            ].map(item => {
              const Icon = item.icon;
              return <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={`mb-3 inline-flex rounded-xl p-2.5 ${item.color}`}><Icon className="h-5 w-5" /></div>
                <p className="text-2xl font-black text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{item.label}</p>
              </div>;
            })}
          </section>
          {!loading && loadError && <p className="mx-auto max-w-6xl px-4 text-sm text-red-700">{loadError}</p>}

          <section className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-black sm:text-xl"><Droplet className="h-6 w-6 text-red-600" /> রক্তের গ্রুপ অনুযায়ী দাতা</h2>
              <button onClick={onOpenRegister} className="text-xs font-bold text-red-700 hover:underline">দাতা হোন <ArrowRight className="inline h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {BLOOD_GROUPS.map((group, index) => {
                const count = approvedDonors.filter(d => d.bloodGroup === group).length;
                const tones = ['bg-red-50 border-red-100', 'bg-amber-50 border-amber-100', 'bg-blue-50 border-blue-100', 'bg-emerald-50 border-emerald-100'];
                return <button key={group} onClick={() => { setFilterBloodGroup(group); document.getElementById('donor-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className={`rounded-2xl border p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tones[index % tones.length]}`}>
                  <Droplet className="mx-auto mb-1 h-5 w-5 fill-current text-red-600" />
                  <p className="text-lg font-black">{group}</p>
                  <p className="mt-1 text-xl font-black text-slate-900">{loading ? '…' : count}</p>
                  <p className="text-[11px] text-slate-500">অনুমোদিত দাতা</p>
                </button>;
              })}
            </div>
          </section>
        </>
      )}

      {showSearch && (
        <section id="search-section" className="mx-auto max-w-6xl space-y-5 px-4 pt-8 sm:px-6">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
            <div><h2 className="flex items-center gap-2 text-xl font-black"><Search className="h-6 w-6 text-red-600" /> রক্তের অনুরোধ</h2><p className="mt-1 text-xs text-slate-500">ডেটাবেজে সংরক্ষিত অনুরোধগুলো এখানে দেখা যাবে।</p></div>
            <button onClick={() => setShowRequestForm(v => !v)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold text-white shadow hover:bg-red-700"><PlusCircle className="h-4 w-4" /> {showRequestForm ? 'ফর্ম বন্ধ করুন' : 'নতুন রক্তের আবেদন করুন'}</button>
          </div>

          {createdRefNo && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mr-2 inline h-5 w-5" /> আবেদন সংরক্ষিত হয়েছে। রেফারেন্স: <strong>{createdRefNo}</strong></div>}
          {requestError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{requestError}</div>}

          {showRequestForm && <form onSubmit={handleCreateRequest} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-7">
            <h3 className="border-b pb-3 font-black">রোগীর প্রয়োজনীয় রক্তের আবেদন</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-bold">রোগীর নাম *<input required value={formData.patientName} onChange={e => setFormData({ ...formData, patientName: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold">রক্তের গ্রুপ *<select value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal">{BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}</select></label>
              <label className="text-xs font-bold">কত ব্যাগ প্রয়োজন? *<input type="number" min="1" required value={formData.unitsRequired} onChange={e => setFormData({ ...formData, unitsRequired: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold">রোগীর বয়স<input type="number" min="0" max="120" value={formData.patientAge} onChange={e => setFormData({ ...formData, patientAge: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold">হিমোগ্লোবিন (g/dL)<input type="number" min="0" max="30" step="0.1" value={formData.hemoglobin} onChange={e => setFormData({ ...formData, hemoglobin: e.target.value })} placeholder="জানা থাকলে লিখুন" className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold">জরুরিতার মাত্রা<select value={formData.urgency} onChange={e => setFormData({ ...formData, urgency: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal"><option value="immediate">জরুরি</option><option value="within_24_hours">২৪ ঘণ্টার মধ্যে</option><option value="scheduled">নির্ধারিত</option></select></label>
              <label className="text-xs font-bold">বিভাগ *<input required value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold">জেলা *<input required value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold">উপজেলা / থানা *<input required value={formData.upazila} onChange={e => setFormData({ ...formData, upazila: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold sm:col-span-2 lg:col-span-3">হাসপাতালের নাম ও ঠিকানা *<input required value={formData.hospital} onChange={e => setFormData({ ...formData, hospital: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold">প্রয়োজনীয় তারিখ *<input type="date" required min={new Date().toISOString().slice(0, 10)} value={formData.dateNeeded} onChange={e => setFormData({ ...formData, dateNeeded: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold">সময়<input type="time" value={formData.timeNeeded} onChange={e => setFormData({ ...formData, timeNeeded: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold">আবেদনকারীর নাম *<input required value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold">মোবাইল নম্বর *<input required type="tel" value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="01XXXXXXXXX" className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
              <label className="text-xs font-bold sm:col-span-2 lg:col-span-3">রোগ / অপারেশনের বিবরণ *<textarea required value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" /></label>
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" required checked={formData.consent} onChange={e => setFormData({ ...formData, consent: e.target.checked })} className="mt-0.5" /> আমি নিশ্চিত করছি যে দেওয়া তথ্য সঠিক এবং যোগাযোগের জন্য আবেদনটি প্রকাশে সম্মতি দিচ্ছি।</label>
            <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-black text-white hover:bg-red-700 disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} {submitting ? 'সংরক্ষণ হচ্ছে…' : 'আবেদন জমা দিন'}</button>
          </form>}

          {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />বাস্তব তথ্য লোড হচ্ছে…</div> :
            requests.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center"><Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" /><h3 className="font-bold">এখনো কোনো রক্তের অনুরোধ নেই</h3><p className="mt-1 text-xs text-slate-500">ডেটাবেজে নতুন অনুরোধ জমা হলে এখানে দেখা যাবে।</p></div> :
            <div className="grid gap-4 md:grid-cols-2">{requests.map(req => <article key={req.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 border-b pb-3"><div><span className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-black text-white">{req.bloodGroup}</span><h3 className="mt-3 font-black">{req.patientName}</h3><p className="mt-1 text-xs text-slate-500">রেফারেন্স: {req.id}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{bnStatus(String(req.status))}</span></div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-red-600" />{req.hospital}, {req.upazila}, {req.district}</p>
                <p className="flex gap-2"><Calendar className="h-4 w-4 shrink-0" />প্রয়োজন: {req.dateNeeded || 'তারিখ দেওয়া হয়নি'} {req.timeNeeded || ''}</p>
                <p className="flex gap-2"><FileText className="h-4 w-4 shrink-0" />পরিমাণ: {req.unitsRequired} ব্যাগ</p>
                {req.hemoglobin != null && <p className="flex gap-2"><Activity className="h-4 w-4 shrink-0 text-red-600" />হিমোগ্লোবিন: {req.hemoglobin} g/dL</p>}
                {req.patientAge != null && <p>রোগীর বয়স: {req.patientAge} বছর</p>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3"><span className="text-xs text-slate-500">আবেদনকারী: {req.contactName}</span><a href={`tel:${req.contactPhone}`} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Phone className="h-3.5 w-3.5" /> কল করুন</a></div>
            </article>)}</div>}
        </section>
      )}

      {showEmergency && (
        <section id="emergency-section" className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-800 to-rose-950 p-6 text-white shadow-lg sm:p-8">
            <div className="absolute -right-5 -top-8 opacity-10"><Heart className="h-48 w-48" /></div>
            <div className="relative"><div className="flex items-center gap-3"><AlertCircle className="h-7 w-7 text-amber-300" /><h2 className="text-xl font-black">জরুরি রক্ত সহায়তা</h2></div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-red-100">জরুরি প্রয়োজনে LifeDrop-এর সঙ্গে যোগাযোগ করুন অথবা অনলাইনে রক্তের অনুরোধ জমা দিন।</p>
              <div className="mt-5 flex flex-wrap gap-3"><button onClick={() => { setShowRequestForm(true); document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-red-700"><PlusCircle className="mr-2 inline h-4 w-4" /> রক্তের অনুরোধ দিন</button><a href="tel:+8801950902300" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/40"><Phone className="mr-2 inline h-4 w-4" /> জরুরি কল</a><a href="https://wa.me/8801950902300" target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"><MessageCircle className="mr-2 inline h-4 w-4" /> WhatsApp</a></div>
              <p className="mt-3 text-xs text-red-200">হটলাইন নম্বরটি প্রকাশের আগে সঠিক ও সক্রিয় কি না যাচাই করুন।</p>
            </div>
          </div>
        </section>
      )}

      {showDonors && (
        <section id="donor-section" className="mx-auto max-w-6xl space-y-5 px-4 pt-8 sm:px-6">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
            <div><h2 className="flex items-center gap-2 text-xl font-black"><Users className="h-6 w-6 text-red-600" /> অনুমোদিত রক্তদাতা</h2><p className="mt-1 text-xs text-slate-500">শুধু ডেটাবেজে থাকা অনুমোদিত দাতাদের তথ্য দেখানো হয়।</p></div>
            <div className="flex gap-2"><select value={filterBloodGroup} onChange={e => setFilterBloodGroup(e.target.value)} className="min-w-28 rounded-xl border bg-white p-2.5 text-xs font-bold"><option value="">সব গ্রুপ</option>{BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}</select><input value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} placeholder="জেলা লিখুন" className="w-32 rounded-xl border bg-white p-2.5 text-xs" /></div>
          </div>
          {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />রক্তদাতার তথ্য লোড হচ্ছে…</div> :
            filteredDonors.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center"><Users className="mx-auto mb-3 h-10 w-10 text-slate-300" /><h3 className="font-bold">এখনো কোনো অনুমোদিত রক্তদাতা নেই</h3><p className="mt-1 text-xs text-slate-500">নতুন রক্তদাতা নিবন্ধন ও অনুমোদিত হলে এখানে দেখা যাবে।</p><button onClick={onOpenRegister} className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white">রক্তদাতা হিসেবে যুক্ত হোন</button></div> :
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredDonors.map(donor => <article key={donor.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-red-50 text-lg font-black text-red-700">{donor.photoUrl ? <img src={donor.photoUrl} alt="" className="h-full w-full object-cover" /> : <Droplet className="h-7 w-7 fill-current" />}</div><div className="min-w-0"><h3 className="truncate font-black">{donor.fullName}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 text-red-600" />{donor.upazila}, {donor.district}</p></div><span className="ml-auto rounded-lg bg-red-600 px-2.5 py-1.5 text-sm font-black text-white">{donor.bloodGroup}</span></div>
              <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><p>সর্বশেষ রক্তদান: <strong>{donor.lastDonationDate || 'তথ্য দেওয়া হয়নি'}</strong></p><p>মোট রক্তদান: <strong>{donor.totalDonations ?? 0}</strong></p><p>অবস্থা: <strong className={donor.isAvailable ? 'text-emerald-700' : 'text-slate-500'}>{donor.isAvailable ? 'রক্তদানে আগ্রহী' : 'বর্তমানে অনুপলব্ধ'}</strong></p></div>
              {donor.phoneConsent && donor.phone && <a href={`tel:${donor.phone}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white"><Phone className="h-4 w-4" /> যোগাযোগ করুন</a>}
            </article>)}</div>}
        </section>
      )}

      {showHome && (
        <>
          <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
            <div className="mb-5 flex items-center gap-2"><Heart className="h-6 w-6 fill-current text-red-600" /><h2 className="text-xl font-black">রক্তদান কেন জরুরি?</h2></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Heart, title: 'জীবন বাঁচানো', desc: 'রক্তের প্রয়োজনের সময়ে একজন দাতা জীবন বাঁচাতে সাহায্য করতে পারেন.', tone: 'bg-red-50 text-red-700' },
                { icon: ShieldCheck, title: 'নিরাপদ রক্তদান', desc: 'স্বাস্থ্যকর্মীর নির্দেশনা মেনে নিরাপদভাবে রক্তদান করুন.', tone: 'bg-amber-50 text-amber-700' },
                { icon: HandHeart, title: 'মানবিক দায়িত্ব', desc: 'স্বেচ্ছায় রক্তদান সমাজের পাশে দাঁড়ানোর একটি উপায়.', tone: 'bg-emerald-50 text-emerald-700' },
                { icon: Users, title: 'কমিউনিটির সহায়তা', desc: 'রক্তদাতা ও রক্তপ্রার্থীদের সংযোগে সহায়তা করুন.', tone: 'bg-blue-50 text-blue-700' },
              ].map(item => { const Icon = item.icon; return <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-3 inline-flex rounded-xl p-3 ${item.tone}`}><Icon className="h-6 w-6" /></div><h3 className="font-black">{item.title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{item.desc}</p></div>; })}
            </div>
          </section>
          <section className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
            <div className="rounded-3xl border border-red-100 bg-red-50 p-6 sm:flex sm:items-center sm:justify-between"><div><h2 className="text-xl font-black text-slate-900">আপনিও হতে পারেন একজন জীবনদাতা</h2><p className="mt-2 text-sm text-slate-600">রক্তদাতা হিসেবে নিবন্ধন করুন অথবা নিজের অ্যাকাউন্টে প্রবেশ করুন।</p></div><div className="mt-4 flex gap-3 sm:mt-0"><button onClick={onOpenRegister} className="rounded-xl bg-red-600 px-4 py-3 text-xs font-black text-white">রেজিস্ট্রেশন করুন</button><button onClick={onOpenLogin} className="rounded-xl border border-red-200 bg-white px-4 py-3 text-xs font-black text-red-700">লগইন</button></div></div>
          </section>
          <footer className="bg-gradient-to-r from-red-950 to-rose-900 text-white"><div className="mx-auto grid max-w-6xl gap-7 px-5 py-8 sm:grid-cols-3 sm:px-6"><div><div className="flex items-center gap-2 text-xl font-black"><Droplet className="h-7 w-7 fill-current" /> LifeDrop</div><p className="mt-2 text-xs leading-6 text-red-100">একটি মানবিক উদ্যোগ—নিরাপদ রক্তদানে মানুষকে যুক্ত করার প্রয়াস।</p></div><div><h3 className="font-black">দ্রুত লিংক</h3><div className="mt-3 flex flex-col gap-2 text-sm text-red-100"><button className="w-fit" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>হোম</button><button className="w-fit" onClick={onOpenRegister}>রক্তদাতা হিসেবে যুক্ত হোন</button><button className="w-fit" onClick={onOpenLogin}>লগইন</button></div></div><div><h3 className="font-black">যোগাযোগ</h3><p className="mt-3 text-sm text-red-100">বাংলাদেশ</p><p className="mt-2 text-xs text-red-200">প্রকাশিত যোগাযোগের তথ্য ব্যবহারের আগে যাচাই করুন।</p></div></div><div className="border-t border-white/15 px-4 py-4 text-center text-xs text-red-100">© {new Date().getFullYear()} LifeDrop Blood Donation Network</div></footer>
        </>
      )}
    </div>
  );
};

export default HomePage;
প্রয়াস।</p></div><div><h3 className="font-black">দ্রুত লিংক</h3><div className="mt-3 flex flex-col gap-2 text-sm text-red-100"><button className="w-fit" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>হোম</button><button className="w-fit" onClick={onOpenRegister}>রক্তদাতা হিসেবে যুক্ত হোন</button><button className="w-fit" onClick={onOpenLogin}>লগইন</button></div></div><div><h3 className="font-black">যোগাযোগ</h3><p className="mt-3 text-sm tex
