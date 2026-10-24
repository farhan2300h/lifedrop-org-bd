import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile } from '../types';
import { authService, convertFileToBase64 } from '../services/supabaseClient';
import { 
  ShieldCheck, CheckCircle, AlertCircle, Save, FileUp
} from 'lucide-react';

interface UserDashboardProps {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  openAdminModal: () => void;
}

export const UserDashboardPage: React.FC<UserDashboardProps> = ({
  currentUser,
  setCurrentUser,
  openAdminModal
}) => {
  const { lang, t } = useLanguage();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bloodGroup, setBloodGroup] = useState(currentUser?.bloodGroup || 'O+');
  const [gender, setGender] = useState(currentUser?.gender || 'পুরুষ');
  const [age, setAge] = useState<number>(currentUser?.age || 26);
  const [division, setDivision] = useState(currentUser?.division || 'ঢাকা (Dhaka)');
  const [district, setDistrict] = useState(currentUser?.district || 'গাজীপুর (Gazipur)');
  const [upazila, setUpazila] = useState(currentUser?.upazila || 'Sreepur');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');

  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setBloodGroup(currentUser.bloodGroup || 'O+');
      setGender(currentUser.gender || 'পুরুষ');
      setAge(currentUser.age || 26);
      setDivision(currentUser.division || 'ঢাকা (Dhaka)');
      setDistrict(currentUser.district || 'গাজীপুর (Gazipur)');
      setUpazila(currentUser.upazila || 'Sreepur');
      setAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  // 📁 গ্যালারি থেকে ফাইল সিলেক্ট
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।');
      return;
    }

    try {
      setIsUploading(true);
      setSaveError('');
      const base64Image = await convertFileToBase64(file);
      setAvatarUrl(base64Image);
      setIsUploading(false);
      setSaveSuccess('গ্যালারি থেকে ছবি সফলভাবে নেওয়া হয়েছে! নিচে সেভ বাটনে চাপ দিন।');
    } catch (err) {
      setIsUploading(false);
      setSaveError('ছবি প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  // 💾 সেভ বাটন হ্যান্ডলার
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess('');
    setSaveError('');

    const updates: Partial<UserProfile> = {
      fullName,
      phone,
      bloodGroup,
      gender,
      age: Number(age),
      division,
      district,
      upazila,
      avatarUrl
    };

    const res = await authService.updateProfile(currentUser.id, updates, currentUser);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setSaveSuccess('আপনার প্রোফাইল তথ্য ও ছবি সফলভাবে সেভ হয়েছে!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } else {
      setSaveError(res.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* হেডার */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-red-500 bg-slate-100 shrink-0">
            <img 
              src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'} 
              alt={fullName} 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{fullName || 'Habibur Rahman'}</h2>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold text-xs rounded-full">{bloodGroup}</span>
            </div>
            <p className="text-xs text-slate-500">{currentUser.email} | {phone}</p>
            <p className="text-xs text-slate-400">{upazila}, {district}</p>
          </div>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={openAdminModal}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>অ্যাডমিন কন্ট্রোল প্যানেল</span>
          </button>
        )}
      </div>

      {/* প্রোফাইল ফরম */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b">ব্যক্তিগত তথ্য ও প্রোফাইল এডিটিং</h3>

        {saveSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* গ্যালারি ছবি আপলোড সেকশন */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <label className="block text-xs font-bold text-slate-700">গ্যালারি থেকে প্রোফাইল ছবি নির্বাচন</label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors">
                <FileUp className="w-4 h-4" />
                <span>{isUploading ? 'ছবি প্রসেস হচ্ছে...' : '📁 গ্যালারি থেকে ছবি বেছে নিন'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-500">গ্যালারি থেকে সরাসরি পিকচার সিলেক্ট করতে পারবেন।</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">পুরো নাম</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">রক্তের গ্রুপ</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">বয়স (বছর)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">জেলা</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">উপজেলা / থানা</label>
              <input
                type="text"
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>প্রোফাইল তথ্য ও ছবি সেভ করুন</span>
          </button>
        </form>
      </div>
    </div>
  );
};
