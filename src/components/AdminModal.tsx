import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Donor, BloodRequest, RequestStatus, UserProfile, UserRole, DonationRecord } from '../types';
import { bloodService } from '../services/bloodService';
import { authService, getSupabaseConfig, supabase } from '../services/supabaseClient';
import { certificateService } from '../services/certificateService';
import { 
  X, Shield, Lock, CheckCircle, AlertCircle, Trash2, Database, LogOut, RefreshCw, 
  Search, KeyRound, UserCheck, UserX, Clock, Info, Users, AlertTriangle, Mail, ArrowLeft, 
  Settings, HeartHandshake, Activity, UserPlus, Check, Award, Megaphone, Edit3, Eye
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  openUserDashboard: () => void;
}

type AdminSection = 'overview' | 'donors' | 'requests' | 'users';

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
  openUserDashboard
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  const refreshAdminData = () => {
    setDonors(bloodService.getDonors());
    setRequests(bloodService.getRequests());
    if (currentUser?.role === 'admin') {
      try {
        setUsersList(authService.getAllUsers(currentUser));
      } catch {}
    }
  };

  useEffect(() => {
    if (isOpen) refreshAdminData();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  // 1. Issue Certificate Action
  const handleIssueCertificate = (donor: Donor) => {
    try {
      certificateService.issueCertificate({
        donorId: donor.id,
        userId: donor.userId,
        donorName: donor.fullName,
        bloodGroup: donor.bloodGroup,
        donationDate: new Date().toISOString().split('T')[0],
        hospital: 'জরুরি রক্তদান কেন্দ্র',
        location: `${donor.upazila}, ${donor.district}`,
        donationCount: donor.totalDonations || 1
      });
      alert(`${donor.fullName}-কে সফলভাবে প্রশংসা সনদপত্র ইস্যু করা হয়েছে!`);
      refreshAdminData();
    } catch (err: any) {
      alert(err.message || 'সনদপত্র ইস্যু করতে সমস্যা হয়েছে।');
    }
  };

  // 2. Member Edit Action
  const handleEditUserRole = (user: UserProfile) => {
    const newRole: UserRole = user.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`আপনি কি ${user.fullName}-এর রোল '${newRole}' করতে চান?`)) {
      authService.updateUserRole(user.id, newRole, currentUser);
      refreshAdminData();
    }
  };

  // 3. Delete Request Action
  const handleDeleteRequest = (id: string) => {
    if (window.confirm('আপনি কি এই রক্তের অনুরোধটি ডিলিট করতে চান?')) {
      bloodService.deleteRequest(id, currentUser);
      refreshAdminData();
    }
  };

  const isAdminAuthenticated = currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="px-5 py-3.5 bg-linear-to-r from-red-700 via-red-800 to-rose-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-red-700 flex items-center justify-center font-black shadow-xs">
              <Shield className="w-5 h-5 fill-red-700 text-red-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">LifeDrop অ্যাডমিন কন্ট্রোল প্যানেল</h2>
              <p className="text-xs text-red-100">রক্তদাতা, অনুরোধ, ইউজার এডিটিং ও সার্টিফিকেট প্যানেল</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { onClose(); openUserDashboard(); }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-red-200" />
              <span>ইউজার ভিউ</span>
            </button>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" /> লগআউট
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dashboard Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar Menu */}
          <aside className="w-60 bg-slate-900 text-white p-4 space-y-2 border-r border-slate-800 shrink-0">
            <div className="pb-3 mb-2 border-b border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">অ্যাডমিন মেনু</span>
            </div>

            <button
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'overview' ? 'bg-red-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>ওভারভিউ (Overview)</span>
            </button>

            <button
              onClick={() => setActiveSection('donors')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'donors' ? 'bg-red-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>রক্তদাতা তালিকা ({donors.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('requests')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'requests' ? 'bg-red-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>রক্তের অনুরোধ ({requests.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('users')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'users' ? 'bg-red-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>সকল ব্যবহারকারী ({usersList.length})</span>
            </button>
          </aside>

          {/* Right Main Content */}
          <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
            
            {/* 1. OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">ড্যাশবোর্ড সামারি</h3>
                  <p className="text-xs text-slate-500">লাইফড্রপ নেটওয়ার্কের বর্তমান হালনাগাদ তথ্য</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-xs font-semibold text-slate-500">মোট নিবন্ধিত রক্তদাতা</span>
                    <span className="text-2xl font-black text-red-600 block">{donors.length} জন</span>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-xs font-semibold text-slate-500">জরুরি রক্তের অনুরোধ</span>
                    <span className="text-2xl font-black text-red-600 block">{requests.length} টি</span>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-xs font-semibold text-slate-500">মোট ইউজার অ্যাকাউন্ট</span>
                    <span className="text-2xl font-black text-red-600 block">{usersList.length} জন</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DONOR LIST & CERTIFICATE ISSUANCE */}
            {activeSection === 'donors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">রক্তদাতা ব্যবস্থাপনা ও সনদপত্র</h3>
                  <input
                    type="text"
                    placeholder="নাম বা রক্ত দিয়ে খুঁজুন..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs">
                  {donors
                    .filter(d => d.fullName.toLowerCase().includes(searchFilter.toLowerCase()) || d.bloodGroup.includes(searchFilter))
                    .map(donor => (
                      <div key={donor.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{donor.fullName}</span>
                            <span className="px-2 py-0.2 bg-red-100 text-red-700 rounded-full font-black text-[10px]">
                              {donor.bloodGroup}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            📱 {donor.phone} | 📍 {donor.upazila}, {donor.district}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleIssueCertificate(donor)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>সনদপত্র প্রদান</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 3. BLOOD REQUESTS */}
            {activeSection === 'requests' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">জরুরি রক্তের আবেদনসমূহ</h3>
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs">
                  {requests.map(req => (
                    <div key={req.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{req.patientName} ({req.bloodGroup})</p>
                        <p className="text-slate-500 text-[11px]">🏥 {req.hospital} | 📱 {req.contactPhone}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold uppercase">
                          {req.status}
                        </span>
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="আবেদন মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. ALL USERS & ROLE EDITING */}
            {activeSection === 'users' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">নিবন্ধিত ব্যবহারকারী ও পারমিশন এডিটিং</h3>
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs">
                  {usersList.map(user => (
                    <div key={user.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{user.fullName}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">{user.email} | {user.phone}</p>
                      </div>

                      <button
                        onClick={() => handleEditUserRole(user)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>রোল পরিবর্তন ({user.role === 'admin' ? 'User করুন' : 'Admin করুন'})</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
};
