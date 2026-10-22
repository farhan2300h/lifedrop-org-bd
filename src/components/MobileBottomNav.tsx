import React from 'react';
import { ActivePage, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Home, Search, AlertCircle, Droplet } from 'lucide-react';

interface MobileBottomNavProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  currentUser?: UserProfile | null;
  openAdminModal?: () => void;
  openUserDashboard?: () => void;
  urgentRequestsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  setActivePage,
  urgentRequestsCount
}) => {
  const { lang, t } = useLanguage();

  const handleNav = (page: ActivePage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-4 items-center justify-items-center h-16 max-w-lg mx-auto px-2">
        {/* ১. হোম */}
        <button
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center justify-center w-full py-1.5 transition-all cursor-pointer ${
            activePage === 'home' 
              ? 'text-red-600 font-bold scale-105' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="হোমপেজ"
        >
          <Home className={`w-5 h-5 transition-transform ${activePage === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-1 font-medium tracking-tight">
            {lang === 'bn' ? 'হোম' : 'Home'}
          </span>
        </button>

        {/* ২. রক্ত খুঁজুন */}
        <button
          onClick={() => handleNav('search')}
          className={`flex flex-col items-center justify-center w-full py-1.5 transition-all cursor-pointer ${
            activePage === 'search' 
              ? 'text-red-600 font-bold scale-105' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="রক্ত খুঁজুন"
        >
          <Search className={`w-5 h-5 transition-transform ${activePage === 'search' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-1 font-medium tracking-tight">
            {lang === 'bn' ? 'রক্ত খুঁজুন' : 'Search'}
          </span>
        </button>

        {/* ৩. জরুরি রক্তের অনুরোধ */}
        <button
          onClick={() => handleNav('emergency')}
          className={`flex flex-col items-center justify-center w-full py-1.5 relative transition-all cursor-pointer ${
            activePage === 'emergency' 
              ? 'text-red-700 font-bold scale-105' 
              : 'text-slate-500 hover:text-red-600'
          }`}
          title="জরুরি রক্তের অনুরোধ"
        >
          <div className="relative">
            <AlertCircle className={`w-5 h-5 transition-transform ${activePage === 'emergency' ? 'text-red-600 stroke-[2.5]' : ''}`} />
            {urgentRequestsCount > 0 && (
              <span className="absolute -top-1 -right-2.5 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs animate-pulse">
                {urgentRequestsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 font-medium tracking-tight">
            {lang === 'bn' ? 'জরুরি রক্ত' : 'Emergency'}
          </span>
        </button>

        {/* ৪. ডোনার */}
        <button
          onClick={() => handleNav('search')}
          className={`flex flex-col items-center justify-center w-full py-1.5 transition-all cursor-pointer ${
            activePage === 'search' && window.location.hash === '#donors'
              ? 'text-red-600 font-bold scale-105' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="নিবন্ধিত রক্তদাতাদের তালিকা"
        >
          <Droplet className="w-5 h-5 text-red-600" />
          <span className="text-[11px] mt-1 font-medium tracking-tight">
            {lang === 'bn' ? 'ডোনার' : 'Donors'}
          </span>
        </button>
      </div>
    </nav>
  );
};

