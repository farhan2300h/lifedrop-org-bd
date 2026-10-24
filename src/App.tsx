import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { AuthPage } from './components/AuthPage';
import { UserDashboardPage } from './components/UserDashboardPage';
import { AdminModal } from './components/AdminModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { authService } from './services/supabaseClient';
import { UserProfile } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin'>('login');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');
  const [currentTab, setCurrentTab] = useState('home');

  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }

    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 md:pb-0">
      <Navbar
        currentUser={currentUser}
        onOpenRegister={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
        onOpenUserLogin={() => { setAuthMode('login'); setIsAuthOpen(true); }}
        onOpenAdminLogin={() => { setAuthMode('admin'); setIsAuthOpen(true); }}
        onLogout={() => { authService.signOut(); setCurrentUser(null); setCurrentView('home'); }}
        onOpenDashboard={() => setCurrentView('dashboard')}
      />

      <main className="flex-1">
        {currentView === 'dashboard' && currentUser ? (
          <UserDashboardPage
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            openAdminModal={() => setIsAdminModalOpen(true)}
          />
        ) : (
          <HomePage 
            onOpenRegister={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
            onOpenLogin={() => { setAuthMode('login'); setIsAuthOpen(true); }}
          />
        )}
      </main>

      <AuthPage
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        setCurrentUser={setCurrentUser}
        openDashboard={() => setCurrentView('dashboard')}
      />

      {isAdminModalOpen && currentUser?.role === 'admin' && (
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* মোবাইলের বটম নেভিগেশন বার */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'home') setCurrentView('home');
        }}
      />
    </div>
  );
}

export default App;
