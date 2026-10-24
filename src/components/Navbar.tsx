import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Heart, LogIn, UserPlus, User, LogOut, Shield, ChevronDown, Phone, MessageCircle } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  onOpenRegister: () => void;
  onOpenUserLogin: () => void;
  onOpenAdminLogin: () => void;
  onLogout: () => void;
  onOpenDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenRegister,
  onOpenUserLogin,
  onOpenAdminLogin,
  onLogout,
  onOpenDashboard
}) => {
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner (Contact & WhatsApp English) */}
      <div className="bg-red-700 text-white text-[11px] py-1 px-4 flex justify-between items-center max-w-7xl mx-auto">
        <span className="font-medium">জরুরি রক্তের প্রয়োজনে সরাসরি যোগাযোগ করুন</span>
        <div className="flex items-center gap-3">
          <a href="tel:+8801950902300" className="flex items-center gap-1 hover:underline font-semibold">
            <Phone className="w-3 h-3" />
            <span>+8801950902300</span>
          </a>
          <a href="https://wa.me/8801950902300" target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-emerald-600 px-2 py-0.5 rounded-full font-bold hover:bg-emerald-700">
            <MessageCircle className="w-3 h-3" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-9 h-9 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="text-base font-black text-slate-900 tracking-tight block leading-none">LifeDrop</span>
            <span className="text-[9px] font-bold text-red-600 tracking-wider">রক্তদান নেটওয়ার্ক</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!currentUser ? (
            <>
              {/* Login Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                >
                  <LogIn className="w-3.5 h-3.5 text-red-600" />
                  <span>লগইন</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {showLoginDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 space-y-1">
                    <button
                      onClick={() => { setShowLoginDropdown(false); onOpenUserLogin(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <User className="w-4 h-4 text-red-600" />
                      <span>User লগইন</span>
                    </button>

                    <button
                      onClick={() => { setShowLoginDropdown(false); onOpenAdminLogin(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      <Shield className="w-4 h-4 text-red-500" />
                      <span>Admin লগইন</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Join as Donor Button */}
              <button
                onClick={onOpenRegister}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-1 transition-colors cursor-pointer shadow-sm shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>রক্তদাতা হিসেবে যুক্ত হোন</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenDashboard}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-4 h-4 text-red-600" />
                <span>{currentUser.fullName}</span>
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="লগআউট"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
