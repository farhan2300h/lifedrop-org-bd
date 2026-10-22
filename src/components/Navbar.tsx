import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ActivePage, UserProfile } from '../types';
import { Droplet, Menu, X, Shield, PhoneCall, HeartHandshake, User, CheckCircle2 } from 'lucide-react';
import { NotificationBell } from './NotificationBell';


interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  currentUser: UserProfile | null;
  openAdminModal: () => void;
  openUserDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  currentUser,
  openAdminModal,
  openUserDashboard
}) => {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActivePage; labelKey: string }[] = [
    { id: 'home', labelKey: 'home' },
    { id: 'search', labelKey: 'findDonors' },
    { id: 'emergency', labelKey: 'emergencyRequests' },
    { id: 'eligibility', labelKey: 'eligibility' },
    { id: 'about', labelKey: 'about' }
  ];

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-red-100 shadow-xs">
      {/* Emergency Notification Top Strip */}
      <div className="bg-red-700 text-white text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-white shrink-0" />
            <span className="truncate">{t('emergencyNotice')}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 pl-3">
            <a
              href="tel:+8801950902300"
              className="inline-flex items-center gap-1.5 text-red-100 hover:text-white transition-colors font-mono"
              title="কল করুন"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>+8801950902300</span>
            </a>
            <a
              href="https://wa.me/8801950902300"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded font-semibold transition-colors"
              title="হোয়াটসঅ্যাপে চ্যাট করুন"
            >
              WhatsApp
            </a>
            {/* Language Switcher */}
            <div className="flex items-center bg-red-800/80 rounded px-1.5 py-0.5 text-[11px]">
              <button
                onClick={() => setLang('en')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  lang === 'en' ? 'bg-white text-red-800 font-bold' : 'text-red-100 hover:text-white'
                }`}
              >
                EN
              </button>
              <span className="text-red-300 mx-1">|</span>
              <button
                onClick={() => setLang('bn')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  lang === 'bn' ? 'bg-white text-red-800 font-bold' : 'text-red-100 hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Top Bar (3-Zone Contract) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left text-slate-900 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-600 rounded-md shrink-0 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-200 shrink-0">
            <Droplet className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="leading-tight">
            <span className="text-xl font-bold tracking-tight text-slate-900 block font-display">
              LifeDrop
            </span>
            <span className="text-[11px] text-red-600 font-medium block">
              {lang === 'bn' ? 'রক্তদান নেটওয়ার্ক বাংলাদেশ' : 'Blood Network Bangladesh'}
            </span>
          </div>
        </button>

        {/* Zone 2: Primary Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-700">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`whitespace-nowrap transition-colors relative py-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-600 rounded cursor-pointer ${
                activePage === item.id
                  ? 'text-red-600 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600'
                  : 'text-slate-600 hover:text-red-600'
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </nav>

        {/* Zone 3: Actions (User Dashboard / Admin Panel & Become a Donor) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Requirement 3: Real-Time Emergency Blood Notification Bell */}
          <NotificationBell
            onSelectRequest={() => {
              handleNavClick('emergency');
            }}
          />

          {/* RBAC Dynamic Profile / Auth Buttons */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.role === 'admin' ? (
                <button
                  onClick={openAdminModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-xs"
                  title="অ্যাডমিন কন্ট্রোল প্যানেল"
                >
                  <Shield className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  <span className="hidden sm:inline font-bold">অ্যাডমিন</span>
                </button>
              ) : null}

              <button
                onClick={() => handleNavClick('dashboard')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
                title="আমার ড্যাশবোর্ড"
              >
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span className="hidden sm:inline font-bold truncate max-w-[110px]">
                  {currentUser.fullName}
                </span>
                <span className="sm:hidden font-bold">ড্যাশবোর্ড</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleNavClick('login')}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                title="ইউজার লগইন"
              >
                <span>লগইন</span>
              </button>
              <button
                onClick={() => handleNavClick('signup')}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                title="নতুন অ্যাকাউন্ট রেজিস্ট্রেশন"
              >
                <span>রেজিস্ট্রেশন</span>
              </button>
            </div>
          )}

          {/* Become a Donor CTA Button */}
          <button
            onClick={() => handleNavClick('register')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm shadow-red-200 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-600 cursor-pointer whitespace-nowrap"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>{t('ctaRegister')}</span>
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-600"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Requirement 1: Strictly Login, Registration, Admin Login) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2.5 shadow-xl animate-in fade-in duration-200">
          <div className="flex flex-col space-y-2">
            {currentUser ? (
              <>
                <div className="p-3 bg-red-50/60 rounded-xl border border-red-100/80 mb-1">
                  <div className="flex items-center gap-2.5">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                        {currentUser.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openUserDashboard();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-900 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>আমার ড্যাশবোর্ড</span>
                  </span>
                  <span className="text-xs text-blue-600 font-mono">&rarr;</span>
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAdminModal();
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center justify-between shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500 fill-red-500" />
                      <span>অ্যাডমিন কন্ট্রোল প্যানেল</span>
                    </span>
                    <span className="text-xs text-red-400 font-mono">&rarr;</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {/* 1. Login */}
                <button
                  onClick={() => handleNavClick('login')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between border ${
                    activePage === 'login'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'text-slate-800 bg-slate-50/80 hover:bg-slate-100 border-slate-200/80'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-red-600" />
                    <span>১. লগইন (Login)</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">&rarr;</span>
                </button>

                {/* 2. Registration */}
                <button
                  onClick={() => handleNavClick('signup')}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between border ${
                    activePage === 'signup'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'text-red-700 bg-red-50/60 hover:bg-red-100/70 border-red-200/80'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <HeartHandshake className="w-4 h-4 text-red-600" />
                    <span>২. রেজিস্ট্রেশন (Registration)</span>
                  </span>
                  <span className="text-xs text-red-500 font-mono">&rarr;</span>
                </button>

                {/* 3. Admin Login */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAdminModal();
                  }}
                  className="w-full text-left px-3.5 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center justify-between shadow-xs transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-red-500 fill-red-500" />
                    <span>৩. অ্যাডমিন লগইন (Admin Login)</span>
                  </span>
                  <span className="text-xs text-red-400 font-mono">&rarr;</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
