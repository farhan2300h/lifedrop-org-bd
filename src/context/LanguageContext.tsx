import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Nav
    appName: 'LifeDrop',
    tagline: 'Blood Donation Network Bangladesh',
    home: 'Home',
    findDonors: 'Find Donors',
    registerDonor: 'Become a Donor',
    emergencyRequests: 'Emergency Requests',
    eligibility: 'Eligibility',
    about: 'About',
    contact: 'Contact',
    adminLogin: 'Admin Login',
    emergencyNotice: 'Emergency blood needed? Submit a request immediately.',

    // Hero
    heroTitle: 'A Single Drop of Blood Can Save a Life in Bangladesh',
    heroSubtitle: 'Connect directly with voluntary, verified blood donors across all 64 districts. 100% voluntary, zero brokers, free of charge.',
    ctaFindDonor: 'Find Blood Donors',
    ctaEmergency: 'Post Emergency Request',
    ctaRegister: 'Register as Donor',
    heroBadge: 'Bangladesh Voluntary Blood Network',

    // Stats
    statDonors: 'Active Verified Donors',
    statLives: 'Lives Impacted',
    statDistricts: 'Districts Covered',
    statResponse: 'Avg. Match Response',

    // Live Requests
    liveRequestsTitle: 'Live Emergency Blood Requests',
    liveRequestsSubtitle: 'Patients currently admitted across hospitals in Bangladesh needing urgent transfusion',
    bags: 'Bags Needed',
    immediate: 'Immediate (< 2 hours)',
    today: 'Today',
    scheduled: 'Scheduled',
    callContact: 'Call Attendant',
    shareAlert: 'Share Request',
    viewAllRequests: 'View All Requests',

    // Search Page
    searchTitle: 'Search Blood Donors Across Bangladesh',
    searchSubtitle: 'Filter verified donors by blood group, division, district, and upazila',
    selectBloodGroup: 'Blood Group',
    allBloodGroups: 'All Blood Groups',
    division: 'Division',
    allDivisions: 'All Divisions',
    district: 'District',
    allDistricts: 'All Districts',
    upazila: 'Upazila / Thana',
    allUpazilas: 'All Upazilas',
    onlyAvailable: 'Available to donate now',
    searchByName: 'Search by donor name or keyword...',
    donorsFound: 'Donors Found',
    eligibleNow: 'Eligible to Donate',
    eligibleIn: 'Eligible in',
    days: 'days',
    neverDonated: 'First-time Donor',
    lastDonated: 'Last Donated',
    totalDonations: 'Total Donations',
    times: 'times',
    callDonor: 'Call Donor',
    whatsapp: 'WhatsApp',
    copyNumber: 'Copy Number',
    copied: 'Copied!',

    // Registration Form
    registerTitle: 'Join as a Voluntary Blood Donor',
    registerSubtitle: 'Your contact will only be shared when someone in your area needs your blood group',
    fullName: 'Full Name (নাম)',
    phone: 'Mobile Number (01XXXXXXXXX)',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    age: 'Age (Years)',
    lastDonationDate: 'Last Donation Date (if any)',
    firstTimeDonor: "I haven't donated blood before (First time)",
    occupation: 'Occupation (Optional)',
    submitRegistration: 'Complete Registration',
    declaration: 'I declare that I am physically healthy, between 18-65 years of age, weigh at least 45 kg, and wish to donate blood voluntarily without any financial compensation.',

    // Emergency Request Form
    requestTitle: 'Post an Emergency Blood Request',
    requestSubtitle: 'Broadcast your patient need instantly across our donor network and volunteer volunteers',
    patientName: 'Patient Name',
    hospitalName: 'Hospital / Clinic Name & Address',
    unitsNeeded: 'Units / Bags Needed',
    medicalReason: 'Medical Condition / Reason',
    urgencyLevel: 'Urgency Level',
    dateNeeded: 'Required Date',
    attendantName: 'Attendant / Contact Person Name',
    attendantPhone: 'Emergency Contact Phone (01XXXXXXXXX)',
    additionalNotes: 'Additional Instructions (e.g. Ward / Bed no.)',
    submitRequest: 'Broadcast Emergency Request',
    disclaimerBroker: 'Caution: LifeDrop does NOT charge any money for blood. Do not pay any brokers (দালাল). Voluntary donation is an act of humanitarian compassion.',

    // Compatibility
    compatibilityTitle: 'Blood Group Compatibility Matrix',
    compatibilitySubtitle: 'Understand who can donate to whom before scheduling a transfusion',
    canDonateTo: 'Can Donate To',
    canReceiveFrom: 'Can Receive From',

    // Process
    processTitle: 'Simple 4-Step Blood Donation Process',
    step1Title: '1. Registration & Vitals',
    step1Desc: 'Quick check of blood pressure, weight (min 45kg), and hemoglobin levels.',
    step2Title: '2. Health Screening',
    step2Desc: 'Brief confidential questions to ensure safe donation for both donor and recipient.',
    step3Title: '3. 10-Minute Donation',
    step3Desc: 'Relax in a comfortable donor chair. The actual draw takes only 8-10 minutes (350-450ml).',
    step4Title: '4. Refreshment & Rest',
    step4Desc: 'Rest for 10-15 minutes with fluids and snacks. Your plasma replenishes within 24-48 hours.',

    // Eligibility Checker
    eligibilityTitle: 'Blood Donation Eligibility Guide',
    eligibilitySubtitle: 'Check your eligibility before visiting a hospital or blood donation camp in Bangladesh',
    checkEligibility: 'Check My Eligibility',
    
    // Admin
    adminPortal: 'Admin & Verification Portal',
    adminNotice: 'Frontend Demo Mode: Inspect donor directory and live emergency requests. This interface is prepared for Supabase PostgreSQL database integration.',
    loginWithDemo: 'Use Demo Admin',
    logout: 'Logout Admin',
    verifyDonor: 'Verify Donor',
    verified: 'Verified',
    unverified: 'Unverified',
    markFulfilled: 'Mark as Fulfilled',
    markUrgent: 'Mark as Urgent',

    // Footer
    footerRights: 'LifeDrop Voluntary Blood Donation Network Bangladesh. Non-profit community initiative.',
    emergencyHotline: 'Emergency Volunteer Hotline: 01800-000000 (24/7)'
  },
  bn: {
    // Brand & Nav
    appName: 'লাইফড্রপ',
    tagline: 'রক্তদান নেটওয়ার্ক বাংলাদেশ',
    home: 'হোম',
    findDonors: 'রক্তদাতা খুঁজুন',
    registerDonor: 'রক্তদাতা হোন',
    emergencyRequests: 'জরুরি রক্তের আবেদন',
    eligibility: 'যোগ্যতা যাচাই',
    about: 'আমাদের সম্পর্কে',
    contact: 'যোগাযোগ',
    adminLogin: 'অ্যাডমিন লগইন',
    emergencyNotice: 'জরুরি রক্তের প্রয়োজন? এখনই আবেদন পোস্ট করুন।',

    // Hero
    heroTitle: 'আপনার এক ফোঁটা রক্ত, বাঁচাতে পারে একটি প্রিয় প্রাণ',
    heroSubtitle: 'বাংলাদেশের ৬৪ জেলার বিশ্বস্ত ও স্বেচ্ছাসেবী রক্তদাতাদের সাথে তাৎক্ষণিক সংযোগ। সম্পূর্ণ বিনামূল্যে, দালালমুক্ত ও নিরাপদ।',
    ctaFindDonor: 'রক্তদাতা খুঁজুন',
    ctaEmergency: 'জরুরি রক্তের আবেদন',
    ctaRegister: 'রক্তদাতা হিসেবে যুক্ত হোন',
    heroBadge: 'বাংলাদেশ স্বেচ্ছাসেবী রক্তদান নেটওয়ার্ক',

    // Stats
    statDonors: 'সক্রিয় নিবন্ধিত রক্তদাতা',
    statLives: 'উপকৃত রোগীর সংখ্যা',
    statDistricts: 'জেলায় কার্যক্রম',
    statResponse: 'গড় সাড়া প্রদানের সময়',

    // Live Requests
    liveRequestsTitle: 'চলমান জরুরি রক্তের আবেদন',
    liveRequestsSubtitle: 'বাংলাদেশের বিভিন্ন হাসপাতালে বর্তমানে চিকিৎসাধীন রোগীদের জরুরি রক্তের তালিকা',
    bags: 'ব্যাগ প্রয়োজন',
    immediate: 'তাৎক্ষণিক (< ২ ঘণ্টা)',
    today: 'আজকের মধ্যে',
    scheduled: 'নির্ধারিত তারিখে',
    callContact: 'কল করুন',
    shareAlert: 'শেয়ার করুন',
    viewAllRequests: 'সকল আবেদন দেখুন',

    // Search Page
    searchTitle: 'সারাদেশে রক্তদাতা অনুসন্ধান করুন',
    searchSubtitle: 'রক্তের গ্রুপ, বিভাগ, জেলা এবং উপজেলা অনুযায়ী রক্তদাতা খুঁজুন',
    selectBloodGroup: 'রক্তের গ্রুপ',
    allBloodGroups: 'সকল রক্তের গ্রুপ',
    division: 'বিভাগ',
    allDivisions: 'সকল বিভাগ',
    district: 'জেলা',
    allDistricts: 'সকল জেলা',
    upazila: 'উপজেলা / থানা',
    allUpazilas: 'সকল উপজেলা',
    onlyAvailable: 'বর্তমানে রক্তদানে প্রস্তুত',
    searchByName: 'নাম বা কি-ওয়ার্ড দিয়ে খুঁজুন...',
    donorsFound: 'জন রক্তদাতা পাওয়া গেছে',
    eligibleNow: 'রক্তদানে প্রস্তুত',
    eligibleIn: 'রক্তদান সম্ভব',
    days: 'দিন পর',
    neverDonated: 'নতুন রক্তদাতা',
    lastDonated: 'সর্বশেষ রক্তদান',
    totalDonations: 'মোট রক্তদান',
    times: 'বার',
    callDonor: 'কল করুন',
    whatsapp: 'হোয়াটসঅ্যাপ',
    copyNumber: 'নম্বর কপি করুন',
    copied: 'কপি হয়েছে!',

    // Registration Form
    registerTitle: 'স্বেচ্ছাসেবী রক্তদাতা হিসেবে যুক্ত হোন',
    registerSubtitle: 'আপনার এলাকায় আপনার রক্তের গ্রুপের প্রয়োজন হলেই কেবল যোগাযোগ করা হবে',
    fullName: 'পূর্ণ নাম',
    phone: 'মোবাইল নম্বর (০১XXXXXXXXX)',
    gender: 'লিঙ্গ',
    male: 'পুরুষ',
    female: 'নারী',
    other: 'অন্যান্য',
    age: 'বয়স (বছর)',
    lastDonationDate: 'সর্বশেষ রক্তদানের তারিখ (যদি থাকে)',
    firstTimeDonor: 'আমি এর আগে রক্ত দিইনি (প্রথমবার)',
    occupation: 'পেশা (ঐচ্ছিক)',
    submitRegistration: 'নিবন্ধন সম্পন্ন করুন',
    declaration: 'আমি ঘোষণা করছি যে আমি শারীরিকভাবে সুস্থ, বয়স ১৮-৬৫ এর মধ্যে, ওজন কমপক্ষে ৪৫ কেজি এবং কোনো আর্থিক বিনিময় ছাড়াই স্বেচ্ছায় রক্তদানে ইচ্ছুক।',

    // Emergency Request Form
    requestTitle: 'জরুরি রক্তের আবেদন ফরম',
    requestSubtitle: 'আপনার রোগীর রক্তের চাহিদা তাৎক্ষণিকভাবে আমাদের নেটওয়ার্কে ছড়িয়ে দিন',
    patientName: 'রোগীর নাম',
    hospitalName: 'হাসপাতাল / ক্লিনিকের নাম ও ঠিকানা',
    unitsNeeded: 'প্রয়োজনীয় রক্তের পরিমাণ (ব্যাগ)',
    medicalReason: 'রোগের বিবরণ / কারণ',
    urgencyLevel: 'জরুরিতা',
    dateNeeded: 'রক্তের প্রয়োজনীয় তারিখ',
    attendantName: 'যোগাযোগকারী ব্যক্তির নাম',
    attendantPhone: 'জরুরি মোবাইল নম্বর (০১XXXXXXXXX)',
    additionalNotes: 'অতিরিক্ত তথ্য (যেমন: ওয়ার্ড / কেবিন নং)',
    submitRequest: 'জরুরি আবেদন প্রচার করুন',
    disclaimerBroker: 'সতর্কতা: লাইফড্রপ রক্তদানের জন্য কোনো টাকা নেয় না। রক্তের দালালদের কোনো অর্থ দেবেন না। স্বেচ্ছায় রক্তদান একটি মহৎ মানবিক দায়িত্ব।',

    // Compatibility
    compatibilityTitle: 'রক্তের গ্রুপের সামঞ্জস্য তালিকা',
    compatibilitySubtitle: 'রক্তদানের পূর্বে জেনে নিন কে কাকে রক্ত দিতে ও নিতে পারবেন',
    canDonateTo: 'যাকে দিতে পারবেন',
    canReceiveFrom: 'যার কাছ থেকে নিতে পারবেন',

    // Process
    processTitle: 'রক্তদানের সহজ ৪টি ধাপ',
    step1Title: '১. নিবন্ধন ও স্বাস্থ্য পরীক্ষা',
    step1Desc: 'রক্তচাপ, ওজন (কমপক্ষে ৪৫ কেজি) এবং হিমোগ্লোবিন পরিমাপ।',
    step2Title: '২. স্বাস্থ্য স্ক্রিনিং',
    step2Desc: 'রক্তদাতা ও গ্রহীতা উভয়ের সুরক্ষায় সংক্ষিপ্ত স্বাস্থ্য প্রশ্নাবলি।',
    step3Title: '৩. ১০ মিনিটের রক্তদান',
    step3Desc: 'আরামদায়ক চেয়ারে বিশ্রাম নিয়ে মাত্র ৮-১০ মিনিটে রক্ত গ্রহণ (৩৫০-৪৫০ মিলি)।',
    step4Title: '৪. বিশ্রাম ও নাশতা গ্রহণ',
    step4Desc: '১০-১৫ মিনিট বিশ্রাম নিয়ে হালকা নাশতা ও পানি গ্রহণ। ২৪-৪৮ ঘণ্টায় তরল পূরণ হয়।',

    // Eligibility Checker
    eligibilityTitle: 'রক্তদানের যোগ্যতার নির্দেশিকা',
    eligibilitySubtitle: 'হাসপাতাল বা রক্তদান ক্যাম্পে যাওয়ার পূর্বে আপনার শারীরিক প্রস্তুতি দেখে নিন',
    checkEligibility: 'আমার যোগ্যতা যাচাই করুন',

    // Admin
    adminPortal: 'অ্যাডমিন ও ভেরিফিকেশন প্যানেল',
    adminNotice: 'ডেমো মোড: রক্তদাতা ও জরুরি রক্তের আবেদন পরিচালনা করুন। এটি ভবিষ্যতে Supabase ডেটাবেজের সাথে সংযোগের জন্য প্রস্তুত।',
    loginWithDemo: 'ডেমো অ্যাডমিন হিসেবে প্রবেশ করুন',
    logout: 'লগআউট',
    verifyDonor: 'যাচাই করুন',
    verified: 'যাচাইকৃত',
    unverified: 'অযাচাইকৃত',
    markFulfilled: 'সম্পন্ন হয়েছে',
    markUrgent: 'জরুরি চিহ্নিত করুন',

    // Footer
    footerRights: 'লাইফড্রপ স্বেচ্ছাসেবী রক্তদান নেটওয়ার্ক বাংলাদেশ। অলাভজনক সামাজিক উদ্যোগ।',
    emergencyHotline: 'জরুরি হটলাইন: ০১৮০০-০০০০০০ (২৪/৭)'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('lifedrop_lang');
    return saved === 'en' ? 'en' : 'bn';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('lifedrop_lang', newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
