import React from 'react';
import { ActivePage, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  Home,
  Search,
  AlertCircle,
  Droplet
} from 'lucide-react';

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
  const { lang } = useLanguage();

  const handleNav = (page: ActivePage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    {
      label: lang === 'bn' ? 'হোম' : 'Home',
      page: 'home' as ActivePage,
      icon: Home
    },
    {
      label: lang === 'bn' ? 'রক্ত খুঁজুন' : 'Find Blood',
      page: 'search' as ActivePage,
      icon: Search
    },
    {
      label: lang === 'bn' ? 'জরুরি রক্ত' : 'Emergency',
      page: 'emergency' as ActivePage,
      icon: AlertCircle
    },
    {
      label: lang === 'bn' ? 'ডোনার' : 'Donors',
      page: 'search' as ActivePage,
      icon: Droplet
    }
  ];

  return (
    <nav
      aria-label="নিচের নেভিগেশন"
      className="fixed bottom-0 left-0 right-0 z-[100] w-full bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="grid grid-cols-4 h-16 w-full max-w-screen-lg mx-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activePage === item.page;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNav(item.page)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 min-w-0 w-full h-full transition-colors ${
                isActive
                  ? 'text-red-600'
                  : 'text-slate-500 hover:text-red-600'
              }`}
            >
              <span className="relative flex items-center justify-center">
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
                  } ${index === 3 ? 'text-red-600' : ''}`}
                />

                {index === 2 && urgentRequestsCount > 0 && (
                  <span className="absolute -top-2 -right-3 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {urgentRequestsCount > 99
                      ? '99+'
                      : urgentRequestsCount}
                  </span>
                )}
              </span>

              <span
                className={`text-[11px] leading-tight whitespace-nowrap ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-red-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
