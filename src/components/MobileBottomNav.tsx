import React from 'react';
import { Home, Search, Activity, Users } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab
}) => {
  const navItems = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'search', label: 'রক্ত খুঁজুন', icon: Search },
    { id: 'emergency', label: 'জরুরি রক্ত', icon: Activity },
    { id: 'donor', label: 'ডোনার', icon: Users },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 bg-slate-950/95 text-white backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
