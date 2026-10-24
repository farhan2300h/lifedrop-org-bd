import React, { useState, useEffect } from 'react';
import { authService, convertFileToBase64 } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { X, ShieldCheck, User, UserPlus, Lock, Upload, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface AuthPageProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'admin';
  setCurrentUser: (user: UserProfile | null) => void;
  openDashboard: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  setCurrentUser,
  openDashboard
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'admin'>(initialMode);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setIsResetPassword(false);
    setResetSent(false);
  }, [initialMode, isOpen]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [district, setDistrict] = useState('গাজীপুর (Gazipur)');
  const [upazila, setUpazila] = useState('Sreepur');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        setAvatarUrl(base64);
      } catch (err) {
        setErrorMsg('ছবি প্রসেস করতে সমস্যা হয়েছে।');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (isResetPassword) {
      setTimeout(() => {
        setLoading(false);
        setResetSent(true);
      }, 1000);
      return;
    }

    const res = await authService.signIn(email, password);
    setLoading(false);

    if (res.success && res.user) {
      if (avatarUrl) {
        await authService.updateProfile(res.user.id, { 
          avatarUrl, 
          fullName: fullName || res.user.fullName, 
          phone: phone || res.user.phone, 
          bloodGroup, 
          district, 
          upazila 
        });
      }
      setCurrentUser(res.user);
      onClose();
      openDashboard();
    } else {
      setErrorMsg('ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      
      {/* স্ক্রিনশটের হুবহু লাল টপ ব্যানার ও পপ-আপ কার্ড */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden relative my-auto animate-in zoom-in-95">
        
        {/* Red Top Header Banner */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 px-6 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-xs font-bold tracking-wide">
              {mode === 'admin' ? 'LifeDrop একাউন্ট ও অ্যাডমিন পোর্টাল' : 'LifeDrop রক্তদাতা পোর্টাল'}
            </h4>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5">

          {/* ১. পাসওয়ার্ড ভুলে গেছেন? (FORGOT PASSWORD FORM) */}
          {isResetPassword ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">পাসওয়ার্ড রিসেট করুন</h3>
                <p className="text-xs text-slate-500">আপনার নিবন্ধিত ইমেইল দিলে আমরা পাসওয়ার্ড রিসেট লিংক পাঠাব</p>
              </div>

              {resetSent && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>আমরা <strong>{email || 'blooddonationnetwork5@
