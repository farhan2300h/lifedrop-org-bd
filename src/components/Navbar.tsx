import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Heart, LogIn, UserPlus, User, LogOut, Shield, ChevronDown } from 'lucide-react';

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
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <div>
            <span className="text-lg font-black text-slate-900 tracking-tight block leading-none">LifeDrop</span>
            <span className="text-[10px] font-bold text-red-600 tracking-wider">রক্তদান নেটওয়ার্ক</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!currentUser ? (
            <>
              {/* ১. লগইন বাটন Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  <LogIn className="w-4 h-4 text-red-600" />
                  <span>লগইন</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showLoginDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1 animate-in fade-in">
                    <button
                      onClick={() => { setShowLoginDropdown(false); onOpenUserLogin(); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <User className="w-4 h-4 text-red-600" />
                      <span>User লগইন</span>
                    </button>

                    <button
                      onClick={() => { setShowLoginDropdown(false); onOpenAdminLogin(); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      <Shield className="w-4 h-4 text-red-500" />
                      <span>Admin লগইন</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ২. রক্তদাতা হিসেবে যুক্ত হোন বাটন */}
              <button
                onClick={onOpenRegister}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>রক্তদাতা হিসেবে যুক্ত হোন</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenDashboard}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-red-600" />
                <span>{currentUser.fullName}</span>
              </button>
              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="লগআউট"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};
