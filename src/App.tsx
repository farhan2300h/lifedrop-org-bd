import React, { useState, useEffect } from 'react';

import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { AuthPage } from './components/AuthPage';
import { UserDashboardPage } from './components/UserDashboardPage';
import { AdminModal } from './components/AdminModal';
import { MobileBottomNav } from './components/MobileBottomNav';

import { authService } from './services/supabaseClient';
import { UserProfile } from './types';

type TabType = 'home' | 'search' | 'emergency' | 'donor';

export function App() {
  const [currentUser, setCurrentUser] =
    useState<UserProfile | null>(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [authMode, setAuthMode] =
    useState<'login' | 'signup' | 'admin'>('login');

  const [isAdminModalOpen, setIsAdminModalOpen] =
    useState(false);

  const [currentView, setCurrentView] =
    useState<'home' | 'dashboard'>('home');

  const [currentTab, setCurrentTab] =
    useState<TabType>('home');

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

  // নিচের Navigation-এর কেন্দ্রীয় handler
  const handleNavigation = (tab: string) => {
    const validTabs: TabType[] = [
      'home',
      'search',
      'emergency',
      'donor',
    ];

    if (!validTabs.includes(tab as TabType)) {
      return;
    }

    const selectedTab = tab as TabType;

    setCurrentTab(selectedTab);

    // Dashboard খোলা থাকলে Navigation চাপলে
    // মূল ওয়েবসাইটে ফিরে আসবে।
    setCurrentView('home');
  };

  const handleLogout = () => {
    authService.signOut();
    setCurrentUser(null);
    setCurrentView('home');
    setCurrentTab('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 md:pb-0">

      <Navbar
        currentUser={currentUser}
        onOpenRegister={() => {
          setAuthMode('signup');
          setIsAuthOpen(true);
        }}
        onOpenUserLogin={() => {
          setAuthMode('login');
          setIsAuthOpen(true);
        }}
        onOpenAdminLogin={() => {
          setAuthMode('admin');
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
        onOpenDashboard={() => {
          setCurrentView('dashboard');
        }}
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
            currentTab={currentTab}
            onOpenRegister={() => {
              setAuthMode('signup');
              setIsAuthOpen(true);
            }}
            onOpenLogin={() => {
              setAuthMode('login');
              setIsAuthOpen(true);
            }}
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

      {/* মোবাইলের নিচের Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={handleNavigation}
      />

    </div>
  );
}

export default App;
