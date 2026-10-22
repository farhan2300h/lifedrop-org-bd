# LifeDrop Bangladesh (রক্তদান নেটওয়ার্ক বাংলাদেশ) 🩸

**LifeDrop Bangladesh** একটি আধুনিক, দ্রুত এবং সুরক্ষিত রক্তদান নেটওয়ার্ক ওয়েব অ্যাপ্লিকেশন। জরুরি রক্তের প্রয়োজনে রক্তগ্রহীতা এবং স্বেচ্ছাসেবী রক্তদাতাদের সরাসরি সংযুক্ত করার লক্ষ্যে এটি তৈরি করা হয়েছে।

---

## 🌟 প্রধান বৈশিষ্ট্যসমূহ (Key Features)

1. **জরুরি রক্তের অনুরোধ (Emergency Blood Request)**:
   - রোগীর বয়স, হিমোগ্লোবিনের মাত্রা, প্রয়োজনীয় রক্তের ব্যাগ ও সময়সীমা উল্লেখ করার সুবিধা।
   - হাসপাতালের নাম, বিভাগ, জেলা ও যোগাযোগের নম্বর।
   - রক্তদানের সম্মতিপত্র ও সত্যতা নিশ্চিতকরণ চেকবক্স।

2. **দ্বৈত লগইন ব্যবস্থা (Dual Authentication System)**:
   - **সাধারণ ব্যবহারকারী**: মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে সহজে লগইন।
   - **অ্যাডমিন প্যানেল**: অনুমোদিত ইমেইল ও পাসওয়ার্ডের মাধ্যমে নিরাপদ অ্যাডমিন প্রবেশাধিকার।

3. **লাইভ স্ট্যাটাস ট্র্যাকিং (Status Badges & Workflow)**:
   - অনুরোধের অবস্থা: `জরুরি প্রয়োজন` (Urgent), `রক্তদাতা পাওয়া গেছে` (Donor Assigned), `সম্পন্ন` (Fulfilled)।
   - অ্যাডমিন ও অনুরোধকারী কর্তৃক স্ট্যাটাস আপডেট করার সুবিধা।

4. **স্বেচ্ছাসেবী রক্তদাতা ডিরেক্টরি (Verified Donor Directory)**:
   - রক্তের গ্রুপ, বিভাগ এবং জেলা অনুযায়ী ফিল্টারিং।
   - সর্বশেষ রক্তদানের তারিখ ও রক্তদানে সক্ষমতা ট্র্যাকিং।
   - সরাসরি কল করার সুবিধা।

5. **মোবাইল-বান্ধব ফিক্সড নেভিগেশন (Bottom Navigation)**:
   - হোম (Home)
   - রক্তের অনুরোধ (Requests)
   - রক্তদাতা খুঁজুন (Find Donors)
   - আমার প্রোফাইল (Profile)

6. **ক্লাউড ডেটাবেস ও নিরাপত্তা (Supabase Ready)**:
   - Supabase Client ইন্টিগ্রেশন।
   - Row Level Security (RLS) ও আধুনিক সিকিউরিটি স্ট্যান্ডার্ড।
   - অফলাইন/ফলব্যাক মোড সহ নিরবচ্ছিন্ন অভিজ্ঞতা।

---

## 🛠️ প্রযুক্তি স্ট্যাক (Tech Stack)

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Backend / Database**: Supabase (PostgreSQL, Auth, RLS)
- **Deployment**: Vercel / Netlify / Cloud Run

---

## 🚀 লোকাল সেটআপ নির্দেশিকা (Local Setup)

### ১. রিপোজিটরি ক্লোন করুন
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/lifedrop-Bangladesh.git
cd lifedrop-Bangladesh
```

### ২. ডিপেন্ডেন্সি ইনস্টল করুন
```bash
npm install
```

### ৩. এনভায়রনমেন্ট ভেরিয়েবল সেটআপ করুন
`.env.example` ফাইল কপি করে `.env.local` তৈরি করুন:
```bash
cp .env.example .env.local
```
এরপর `.env.local` ফাইলে আপনার Supabase ক্রেডেনশিয়াল বসান:
```env
VITE_SUPABASE_URL=https://ncnboxpojpvnupbxjlhi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_zktOikIAh8y6QVTIAMlpfg_OOnsOLBM
```

### ৪. ডেভেলপমেন্ট সার্ভার চালু করুন
```bash
npm run dev
```
ব্রাউজারে `http://localhost:3000` এ প্রবেশ করুন।

### ৫. প্রজেক্ট বিল্ড করুন
```bash
npm run build
```

---

## 📄 লাইসেন্স (License)

LifeDrop Bangladesh রক্তদান নেটওয়ার্ক একটি উন্মুক্ত সমাজকল্যাণমূলক উদ্যোগ। 
MIT License-এর অধীনে প্রকাশিত।
