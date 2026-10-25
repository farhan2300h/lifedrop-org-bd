import React, { useEffect, useMemo, useState } from 'react';
import {
  Heart, Search, AlertCircle, Phone, MessageCircle, MapPin, Calendar,
  CheckCircle2, PlusCircle, Users, Droplet, Activity, Eye, TestTube2,
  GlassWater, Moon, ShieldCheck, Utensils, Bed, ArrowRight, Hospital,
  HeartPulse, Loader2
} from 'lucide-react';
import { bloodService } from '../services/bloodService';
import type { Donor, BloodRequest, BloodGroup } from '../types';

interface HomePageProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  currentTab?: string;
}

const GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EMPTY_FORM = {
  patientName: '', patientAge: '', hemoglobin: '', bloodGroup: 'O+' as BloodGroup,
  unitsRequired: '1', hospital: '', division: '', district: '', upazila: '',
  dateNeeded: '', timeNeeded: '', contactName: '', contactPhone: '',
  urgency: 'urgent' as const, reason: '', attendantNotes: '', consent: false
};
const card = 'rounded-3xl border border-slate-200 bg-white shadow-sm';
const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100';
const dateText = (value?: string | null) => {
  if (!value) return 'তথ্য দেওয়া হয়নি';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('bn-BD');
};

export const HomePage: React.FC<HomePageProps> = ({
  onOpenRegister, onOpenLogin, currentTab = 'home'
}) => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successId, setSuccessId] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = async () => {
    try {
      setError('');
      await bloodService.init();
      const [d, r] = await Promise.all([
        bloodService.fetchRealDonors(),
        bloodService.fetchRealRequests()
      ]);
      setDonors(d);
      setRequests(r);
    } catch {
      setError('ডেটাবেজ থেকে তথ্য আনা যায়নি। সংযোগ ও ডেটাবেজ অনুমতি যাচাই করুন।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const unsubscribe = bloodService.subscribe(() => {
      setDonors(bloodService.getDonors());
      setRequests(bloodService.getRequests());
    });
    return unsubscribe;
  }, []);

  const approvedDonors = useMemo(
    () => donors.filter(d => d.approvalStatus === 'approved' && d.isVerified),
    [donors]
  );
  const filteredDonors = useMemo(() => approvedDonors.filter(d =>
    (!bloodFilter || d.bloodGroup === bloodFilter) &&
    (!districtFilter || (d.district || '').toLowerCase().includes(districtFilter.toLowerCase()))
  ), [approvedDonors, bloodFilter, districtFilter]);
  const activeRequests = useMemo(
    () => requests.filter(r => !['cancelled', 'rejected'].includes(String(r.status))).slice(0, 6),
    [requests]
  );
  const stats = bloodService.getStats();

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setSuccessId('');
    try {
      const saved = await bloodService.addRequest({
        patientName: form.patientName.trim(),
        patientAge: form.patientAge ? Number(form.patientAge) : undefined,
        hemoglobin: form.hemoglobin ? Number(form.hemoglobin) : undefined,
        bloodGroup: form.bloodGroup,
        unitsRequired: Number(form.unitsRequired),
        hospital: form.hospital.trim(),
        division: form.division.trim(),
        district: form.district.trim(),
        upazila: form.upazila.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        urgency: form.urgency,
        reason: form.reason.trim(),
        dateNeeded: form.dateNeeded,
        timeNeeded: form.timeNeeded || undefined,
        attendantNotes: form.attendantNotes.trim(),
        consent: form.consent
      });
      setSuccessId(saved.id);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadData();
    } catch {
      setFormError('আবেদন সংরক্ষণ করা যায়নি। ডেটাবেজ সংযোগ ও অনুমতি যাচাই করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  if (currentTab === 'search' || currentTab === 'donor') {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-3 py-6 pb-24 sm:px-5">
        <Heading title={currentTab === 'search' ? 'রক্ত খুঁজুন' : 'অনুমোদিত রক্তদাতাদের তালিকা'}
          desc="শুধু ডেটাবেজে থাকা অনুমোদিত রক্তদাতাদের তথ্য দেখানো হচ্ছে।" />
        <div className="grid gap-3 sm:grid-cols-2">
          <select className={input} value={bloodFilter} onChange={e => setBloodFilter(e.target.value)}>
            <option value="">সব রক্তের গ্রুপ</option>
            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <input className={input} placeholder="জেলা লিখুন" value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)} />
        </div>
        {loading ? <Loading /> : filteredDonors.length > 0
          ? <div className="grid gap-4 sm:grid-cols-2">{filteredDonors.map(d => <DonorCard key={d.id} donor={d} />)}</div>
          : <Empty icon={Users} title="এখনো কোনো অনুমোদিত ডোনার নেই"
              text="রেজিস্ট্রেশন ও অ্যাডমিন অনুমোদনের পর ডোনার এখানে দেখা যাবে।" />}
      </div>
    );
  }

  if (currentTab === 'emergency') {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-3 py-6 pb-24 sm:px-5">
        <Emergency />
        <div className="flex items-center justify-between gap-3">
          <Heading title="রক্তের আবেদন" desc="বাস্তব আবেদন ডেটাবেজ থেকে দেখানো হচ্ছে।" />
          <button onClick={() => setShowForm(v => !v)}
            className="shrink-0 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white">
            {showForm ? 'বন্ধ করুন' : 'আবেদন করুন'}
          </button>
        </div>
        {showForm && <RequestForm form={form} setForm={setForm} onSubmit={submitRequest} submitting={submitting} error={formError} />}
        {successId && <Success id={successId} />}
        {loading ? <Loading /> : activeRequests.length > 0
          ? activeRequests.map(r => <RequestCard key={r.id} request={r} />)
          : <Empty icon={Droplet} title="এখনো কোনো রক্তের আবেদন নেই" text="বাস্তব আবেদন জমা হলে এখানে দেখা যাবে।" />}
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50 pb-24">
      <section className="mx-auto max-w-6xl px-3 pt-4 sm:px-5 sm:pt-6">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-rose-950 via-red-800 to-red-600 text-white shadow-xl">
          <div className="grid items-center gap-4 p-5 sm:grid-cols-2 sm:p-9">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold">
                <Heart className="h-4 w-4 fill-current" /> LifeDrop Blood Donation Network
              </span>
              <h1 className="text-3xl font-black leading-tight sm:text-5xl">রক্ত দিন,<br /><span className="text-amber-300">জীবন বাঁচান</span> ❤️</h1>
              <p className="max-w-lg text-sm leading-7 text-rose-50 sm:text-base">
                আপনার স্বেচ্ছায় দেওয়া এক ব্যাগ রক্ত কারও জীবনে নতুন আশার আলো হতে পারে।
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => document.getElementById('donor-list')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-red-700">
                  <Search className="h-4 w-4" /> রক্ত খুঁজুন <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={onOpenRegister}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white">
                  <Heart className="h-4 w-4" /> রক্তদাতা হোন
                </button>
              </div>
            </div>
            <div className="relative flex min-h-48 items-center justify-center overflow-hidden rounded-2xl bg-red-950 sm:min-h-64">
              <img src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=85"
                alt="রক্তদান কার্যক্রম" className="absolute inset-0 h-full w-full object-cover opacity-60"
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              <div className="absolute inset-0 bg-gradient-to-r from-red-950/70 to-red-900/20" />
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-white/40 bg-white/15 backdrop-blur-sm sm:h-48 sm:w-48">
                <Droplet className="h-24 w-24 fill-red-500 text-white sm:h-32 sm:w-32" />
                <Heart className="absolute h-10 w-10 fill-white text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-3 sm:px-5">
        <Heading eyebrow="REAL DATABASE DATA" title="বাস্তব পরিসংখ্যান" desc="ডেটাবেজে থাকা তথ্য অনুযায়ী সংখ্যা দেখানো হচ্ছে।" />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={Users} value={String(stats.totalDonors)} label="অনুমোদিত রক্তদাতা" color="rose" />
          <Stat icon={Droplet} value={String(requests.length)} label="রক্তের আবেদন" color="blue" />
          <Stat icon={HeartPulse} value={String(stats.urgentRequests)} label="জরুরি আবেদন" color="orange" />
          <Stat icon={Eye} value="—" label="মোট ভিজিট" color="violet" />
        </div>
        {error && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
      </section>

      <section className="mx-auto max-w-6xl px-3 sm:px-5">
        <Heading title="দ্রুত কাজ" desc="প্রয়োজনীয় সেবায় দ্রুত প্রবেশ করুন।" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Quick icon={Search} title="রক্ত খুঁজুন" desc="গ্রুপ ও জেলা অনুযায়ী" color="rose" onClick={() => document.getElementById('donor-list')?.scrollIntoView({ behavior: 'smooth' })} />
          <Quick icon={AlertCircle} title="জরুরি রক্ত" desc="আবেদন দেখুন" color="red" onClick={() => document.getElementById('requests')?.scrollIntoView({ behavior: 'smooth' })} />
          <Quick icon={Users} title="ডোনার হোন" desc="স্বেচ্ছায় যুক্ত হোন" color="blue" onClick={onOpenRegister} />
          <Quick icon={Hospital} title="হাসপাতালের তথ্য" desc="জরুরি যোগাযোগ" color="green" onClick={() => document.getElementById('emergency')?.scrollIntoView({ behavior: 'smooth' })} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-3 sm:px-5">
        <Heading title="হিমোগ্লোবিন ও রক্তদানের যোগ্যতা" desc="রক্তদানের আগে স্বাস্থ্য পরীক্ষা জরুরি; চূড়ান্ত সিদ্ধান্ত নেবেন চিকিৎসাকর্মী।" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Info icon={TestTube2} title="হিমোগ্লোবিন পরীক্ষা" color="rose">
            <p>অনেক কেন্দ্রে সাধারণ নির্দেশনা হিসেবে পুরুষের জন্য প্রায় ১২.৫ g/dL এবং নারীর জন্য প্রায় ১২.০–১২.৫ g/dL সীমা ব্যবহৃত হতে পারে। কেন্দ্রভেদে নিয়ম আলাদা হতে পারে।</p>
            <p className="mt-2 font-bold text-slate-800">পরীক্ষা ছাড়া নিজে থেকে যোগ্যতা নির্ধারণ করবেন না।</p>
          </Info>
          <Info icon={ShieldCheck} title="আর কী পরীক্ষা হতে পারে?" color="blue">
            <ul className="list-disc space-y-1 pl-5">
              <li>বয়স ও ওজন যাচাই</li><li>রক্তচাপ ও সামগ্রিক স্বাস্থ্য পরীক্ষা</li>
              <li>অসুস্থতা, ওষুধ ও আগের রক্তদানের ইতিহাস জানানো</li><li>চিকিৎসাকর্মীর অনুমতি নেওয়া</li>
            </ul>
          </Info>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-3 sm:px-5">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white shadow-lg sm:p-7">
          <div className="flex gap-4">
            <Calendar className="h-8 w-8 shrink-0 text-rose-300" />
            <div>
              <h2 className="text-xl font-black sm:text-2xl">কত দিন পর আবার রক্ত দেবেন?</h2>
              <p className="mt-2 text-sm leading-7 text-slate-200">
                অনেক কেন্দ্রে পূর্ণ রক্তদানের পর অন্তত ৮–১২ সপ্তাহ বা প্রায় ৩ মাস বিরতি রাখা হয়; কোথাও আরও বেশি সময় প্রয়োজন হতে পারে। নিজের শেষ দানের তারিখ, স্বাস্থ্য এবং কেন্দ্রের নিয়ম অনুযায়ী পরবর্তী তারিখ নিশ্চিত করুন।
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-3 sm:px-5">
        <Heading title="রক্ত দেওয়ার আগে করণীয়" desc="রক্তদানের দিন নিজেকে প্রস্তুত রাখুন।" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Checklist icon={GlassWater} title="পর্যাপ্ত পানি পান করুন" text="রক্তদানের আগে পর্যাপ্ত পানি পান করুন, যাতে শরীরে পানির ঘাটতির ঝুঁকি কমে।" color="blue" />
          <Checklist icon={Utensils} title="স্বাভাবিক খাবার খান" text="খালি পেটে রক্ত দিতে যাবেন না; স্বাভাবিক ও পুষ্টিকর খাবার খান।" color="green" />
          <Checklist icon={Moon} title="পর্যাপ্ত ঘুম ও বিশ্রাম" text="ভালোভাবে ঘুমান। জ্বর বা অসুস্থতা থাকলে রক্তদান স্থগিত রাখুন।" color="violet" />
          <Checklist icon={Activity} title="নিজের স্বাস্থ্য সম্পর্কে জানান" text="অসুস্থতা, ওষুধ সেবন বা সাম্প্রতিক রক্তদানের ইতিহাস কর্মীদের জানান।" color="rose" />
          <Checklist icon={ShieldCheck} title="আর্থিক লেনদেন নয়" text="রক্তদান স্বেচ্ছাসেবামূলক। রক্তের বিনিময়ে টাকা নেওয়া বা দেওয়া যাবে না।" color="rose" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-3 sm:px-5">
        <Heading title="রক্ত দেওয়ার পরে করণীয়" desc="রক্তদানের পর কেন্দ্রের নির্দেশনা মেনে চলুন." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Checklist icon={GlassWater} title="পানি ও তরল পান করুন" text="পরবর্তী কয়েক ঘণ্টা পর্যাপ্ত পানি পান করুন।" color="blue" />
          <Checklist icon={Bed} title="বিশ্রাম নিন" text="কেন্দ্রের পরামর্শ অনুযায়ী বিশ্রাম নিন; মাথা ঘুরলে বসে বা শুয়ে পড়ুন।" color="green" />
          <Checklist icon={Activity} title="ভারী কাজ এড়িয়ে চলুন" text="সেদিন ভারী ব্যায়াম, ভার তোলা ও কঠোর পরিশ্রম এড়িয়ে চলুন।" color="violet" />
          <Checklist icon={HeartPulse} title="সমস্যা হলে সাহায্য নিন" text="অসুস্থ লাগলে, অজ্ঞান হওয়ার ভাব হলে বা রক্তপাত বন্ধ না হলে দ্রুত সাহায্য নিন।" color="rose" />
        </div>
      </section>

      <section id="requests" className="mx-auto max-w-6xl px-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Heading eyebrow="REAL BLOOD REQUESTS" title="রক্তের আবেদন" desc="ডেটাবেজ থেকে লোড হওয়া বাস্তব আবেদন।" />
          <button onClick={() => setShowForm(v => !v)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white">
            <PlusCircle className="h-4 w-4" />{showForm ? 'ফর্ম বন্ধ করুন' : 'নতুন আবেদন'}
          </button>
        </div>
        {showForm && <div className="mt-4"><RequestForm form={form} setForm={setForm} onSubmit={submitRequest} submitting={submitting} error={formError} /></div>}
        {successId && <div className="mt-4"><Success id={successId} /></div>}
        <div className="mt-4 space-y-3">
          {loading ? <Loading /> : activeRequests.length > 0
            ? activeRequests.map(r => <RequestCard key={r.id} request={r} />)
            : <Empty icon={Droplet} title="বর্তমানে কোনো সক্রিয় রক্তের আবেদন নেই" text="বাস্তব আবেদন জমা হলে এখানে দেখা যাবে।" />}
        </div>
      </section>

      <section id="donor-list" className="mx-auto max-w-6xl px-3 sm:px-5">
        <Heading title="অনুমোদিত রক্তদাতাদের তালিকা" desc="শুধু যাচাইকৃত ও অনুমোদিত ডোনার দেখানো হচ্ছে।" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select className={input} value={bloodFilter} onChange={e => setBloodFilter(e.target.value)}>
            <option value="">সব রক্তের গ্রুপ</option>{GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <input className={input} placeholder="জেলা লিখুন" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {loading ? <Loading /> : filteredDonors.length > 0
            ? filteredDonors.slice(0, 4).map(d => <DonorCard key={d.id} donor={d} />)
            : <div className="sm:col-span-2"><Empty icon={Users} title="এখনো কোনো অনুমোদিত ডোনার নেই" text="ডোনার রেজিস্ট্রেশন ও অনুমোদনের পর এখানে দেখা যাবে।" /></div>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-3 sm:px-5">
        <div className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
          <div className="grid sm:grid-cols-2">
            <div className="relative min-h-52 bg-rose-100">
              <img src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=85"
                alt="রক্তদানের সচেতনতামূলক ছবি" className="absolute inset-0 h-full w-full object-cover"
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              <div className="absolute inset-0 bg-gradient-to-r from-red-950/70 to-transparent" />
              <div className="relative p-6 text-white">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">রক্তদান সচেতনতা</span>
                <h2 className="mt-4 text-2xl font-black">রক্তদানে এগিয়ে আসুন</h2>
                <p className="mt-2 text-sm">মানুষের পাশে মানুষ থাকুক।</p>
              </div>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <h3 className="text-xl font-black text-slate-900">আপনার একটি রক্তদান, কারও জীবনে নতুন আশা</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                এখানে বাস্তব ক্যাম্পেইনের তারিখ, স্থান ও আয়োজকের তথ্য যুক্ত করা যাবে। বর্তমানে যাচাইকৃত ক্যাম্পেইনের তথ্য নেই, তাই কোনো বানানো ইভেন্ট দেখানো হচ্ছে না।
              </p>
              <button onClick={onOpenRegister} className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white">
                রক্তদাতা হিসেবে যুক্ত হোন <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="emergency" className="mx-auto max-w-6xl px-3 sm:px-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`${card} p-5 sm:p-6`}>
            <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-emerald-600" /><h2 className="text-lg font-black text-slate-900">নিরাপদ ও স্বেচ্ছামূলক রক্তদান</h2></div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              <li>রক্তদানের বিনিময়ে টাকা নেওয়া বা দেওয়া যাবে না।</li>
              <li>রক্ত কেনাবেচা নয়; অনুমোদিত রক্তদান কেন্দ্রের সহায়তা নিন।</li>
              <li>চিকিৎসাকর্মীর নির্দেশনা মেনে চলুন।</li>
            </ul>
          </div>
          <Emergency />
        </div>
      </section>
      <p className="mx-auto max-w-6xl px-4 text-center text-xs leading-6 text-slate-400">
        স্বাস্থ্য-সংক্রান্ত তথ্য সাধারণ সচেতনতার জন্য। রক্তদানের যোগ্যতা ও পরবর্তী দানের সময় রক্তদান কেন্দ্রের চিকিৎসাকর্মীর কাছ থেকে নিশ্চিত করুন।
      </p>
    </div>
  );
};

function Heading({ eyebrow, title, desc }: { eyebrow?: string; title: string; desc?: string }) {
  return <div>{eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">{eyebrow}</p>}<h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{title}</h2>{desc && <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>}</div>;
}
function Loading() {
  return <div className={`${card} flex items-center justify-center gap-2 p-8 text-sm text-slate-500`}><Loader2 className="h-5 w-5 animate-spin text-red-600" /> বাস্তব তথ্য লোড হচ্ছে...</div>;
}
function Empty({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return <div className={`${card} p-7 text-center`}><Icon className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-3 font-black text-slate-700">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div>;
}
function Stat({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string; label: string; color: string }) {
  const colors: Record<string, string> = { rose: 'bg-rose-50 text-rose-600', blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600', violet: 'bg-violet-50 text-violet-600' };
  return <div className={`${card} p-4 sm:p-5`}><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${colors[color]}`}><Icon className="h-5 w-5" /></span><div className="mt-3 text-3xl font-black text-slate-900">{value}</div><div className="mt-1 text-xs font-bold leading-5 text-slate-600 sm:text-sm">{label}</div></div>;
}
function Quick({ icon: Icon, title, desc, color, onClick }: { icon: React.ElementType; title: string; desc: string; color: string; onClick: () => void }) {
  const colors: Record<string, string> = { rose: 'bg-rose-50 text-rose-700 border-rose-100', red: 'bg-red-50 text-red-700 border-red-100', blue: 'bg-blue-50 text-blue-700 border-blue-100', green: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  return <button onClick={onClick} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${colors[color]}`}><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm"><Icon className="h-6 w-6" /></span><span className="mt-3 block text-sm font-black">{title}</span><span className="mt-1 block text-xs leading-5 opacity-80">{desc}</span></button>;
}
function Info({ icon: Icon, title, color, children }: { icon: React.ElementType; title: string; color: string; children: React.ReactNode }) {
  const c = color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600';
  return <div className={`${card} p-5 sm:p-6`}><div className="flex items-center gap-3"><span className={`rounded-xl p-3 ${c}`}><Icon className="h-6 w-6" /></span><h3 className="text-lg font-black text-slate-900">{title}</h3></div><div className="mt-4 text-sm leading-7 text-slate-600">{children}</div></div>;
}
function Checklist({ icon: Icon, title, text, color }: { icon: React.ElementType; title: string; text: string; color: string }) {
  const colors: Record<string, string> = { blue: 'bg-sky-50 text-sky-700', green: 'bg-emerald-50 text-emerald-700', violet: 'bg-violet-50 text-violet-700', rose: 'bg-rose-50 text-rose-700' };
  return <div className={`${card} flex gap-3 p-4 sm:p-5`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}><Icon className="h-5 w-5" /></span><div><h3 className="font-black text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div></div>;
}
function DonorCard({ donor }: { donor: Donor }) {
  return <div className={`${card} p-4`}><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 font-black text-red-700">{donor.bloodGroup}</div><div className="min-w-0 flex-1"><h3 className="truncate font-black text-slate-900">{donor.fullName || 'নাম উল্লেখ নেই'}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 text-red-500" />{[donor.upazila, donor.district, donor.division].filter(Boolean).join(', ') || 'ঠিকানা দেওয়া হয়নি'}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">অনুমোদিত</span></div><div className="mt-3 text-xs text-slate-500">সর্বশেষ রক্তদান: <b className="text-slate-700">{dateText(donor.lastDonationDate)}</b></div>{donor.phone && <a href={`tel:${donor.phone}`} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-bold text-white"><Phone className="h-4 w-4" /> যোগাযোগ করুন</a>}</div>;
}
function RequestCard({ request }: { request: BloodRequest }) {
  return <div className={`${card} p-4 sm:p-5`}><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="rounded-lg bg-red-600 px-3 py-1.5 font-black text-white">{request.bloodGroup}</span><h3 className="font-black text-slate-900">{request.patientName}</h3></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{request.status === 'urgent' ? 'জরুরি' : String(request.status)}</span></div><div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p className="flex gap-2"><Hospital className="h-4 w-4 shrink-0 text-red-500" />{request.hospital}, {[request.upazila, request.district].filter(Boolean).join(', ')}</p><p className="flex gap-2"><Calendar className="h-4 w-4 shrink-0" />{dateText(request.dateNeeded)} {request.timeNeeded || ''}</p><p className="flex gap-2"><Droplet className="h-4 w-4 shrink-0 text-red-500" />পরিমাণ: {request.unitsRequired} ব্যাগ</p></div>{request.contactPhone && <a href={`tel:${request.contactPhone}`} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"><Phone className="h-4 w-4" /> যোগাযোগ করুন</a>}</div>;
}
function Emergency() {
  return <div className="rounded-3xl bg-gradient-to-r from-red-700 to-rose-900 p-5 text-white shadow-lg sm:p-6"><h2 className="flex items-center gap-2 text-xl font-black"><AlertCircle className="h-7 w-7 text-amber-300" /> জরুরি রক্তের প্রয়োজনে</h2><p className="mt-2 text-sm leading-6 text-rose-50">জরুরি প্রয়োজনে হটলাইন বা WhatsApp-এ যোগাযোগ করুন।</p><div className="mt-4 flex flex-wrap gap-3"><a href="tel:+8801950902300" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-red-700"><Phone className="h-4 w-4" /> +8801950902300</a><a href="https://wa.me/8801950902300" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</a></div></div>;
}
function Success({ id }: { id: string }) {
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><div className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" /> আবেদন সিস্টেমে সংরক্ষিত হয়েছে</div><p className="mt-1">রেফারেন্স: <b className="font-mono">{id}</b></p></div>;
}
function RequestForm({ form, setForm, onSubmit, submitting, error }: {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string;
}) {
  const update = (key: keyof typeof EMPTY_FORM, value: string | boolean) => setForm(p => ({ ...p, [key]: value }));
  return (
    <form onSubmit={onSubmit} className={`${card} space-y-4 p-4 sm:p-6`}>
      <h3 className="text-lg font-black text-slate-900">রক্তের আবেদন ফর্ম</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input required className={input} placeholder="রোগীর নাম *" value={form.patientName} onChange={e => update('patientName', e.target.value)} />
        <select className={input} value={form.bloodGroup} onChange={e => update('bloodGroup', e.target.value)}>{GROUPS.map(g => <option key={g} value={g}>{g}</option>)}</select>
        <input className={input} type="number" min="0" placeholder="রোগীর বয়স (ঐচ্ছিক)" value={form.patientAge} onChange={e => update('patientAge', e.target.value)} />
        <input className={input} type="number" min="0" step="0.1" placeholder="হিমোগ্লোবিন g/dL (ঐচ্ছিক)" value={form.hemoglobin} onChange={e => update('hemoglobin', e.target.value)} />
        <input required className={input} type="number" min="1" max="20" placeholder="কত ব্যাগ *" value={form.unitsRequired} onChange={e => update('unitsRequired', e.target.value)} />
        <input required className={input} placeholder="হাসপাতালের নাম *" value={form.hospital} onChange={e => update('hospital', e.target.value)} />
        <input required className={input} placeholder="বিভাগ *" value={form.division} onChange={e => update('division', e.target.value)} />
        <input required className={input} placeholder="জেলা *" value={form.district} onChange={e => update('district', e.target.value)} />
        <input required className={input} placeholder="উপজেলা/থানা *" value={form.upazila} onChange={e => update('upazila', e.target.value)} />
        <input required className={input} type="date" value={form.dateNeeded} onChange={e => update('dateNeeded', e.target.value)} />
        <input className={input} placeholder="সময় (ঐচ্ছিক)" value={form.timeNeeded} onChange={e => update('timeNeeded', e.target.value)} />
        <input required className={input} placeholder="আবেদনকারীর নাম *" value={form.contactName} onChange={e => update('contactName', e.target.value)} />
        <input required className={input} type="tel" placeholder="মোবাইল নম্বর *" value={form.contactPhone} onChange={e => update('contactPhone', e.target.value)} />
        <textarea className={`${input} sm:col-span-2`} rows={3} placeholder="রোগের বিবরণ (ঐচ্ছিক)" value={form.reason} onChange={e => update('reason', e.target.value)} />
      </div>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600"><input required type="checkbox" checked={form.consent} onChange={e => update('consent', e.target.checked)} className="mt-1 h-4 w-4 accent-red-600" />আমি নিশ্চিত করছি যে দেওয়া তথ্য সঠিক এবং প্রয়োজনে যোগাযোগের সম্মতি দিচ্ছি।</label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-black text-white disabled:opacity-60">
        {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> জমা হচ্ছে...</> : <><PlusCircle className="h-5 w-5" /> আবেদন জমা দিন</>}
      </button>
    </form>
  );
}

export default HomePage;
 value={form.reason} onChange={e => update('reason', e.target.value)} />
      </div>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600"><input required type="checkbox" checked={form.consent} onChange={e => update('consent', e.target.checked)} className="mt-1 h-4 w-4 accent-red-600" />আমি নিশ্চিত করছি যে দেওয়া তথ্য সঠিক এবং প্রয়োজনে যোগাযোগের সম্মতি দিচ্ছি।</label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabl
