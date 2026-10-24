import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { AuthPage } from './components/AuthPage';
import { UserDashboardPage } from './components/UserDashboardPage';
import { AdminModal } from './components/AdminModal';
import { authService } from './services/supabaseClient';
import { UserProfile } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Auth Modal States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin'>('login');
  
  // Admin Control Panel State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
  // View State (home / dashboard)
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');

  useEffect(() => {
    // আগের লগইন করা ব্যবহারকারী থাকলে নেওয়া
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }

    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // ১) রেজিস্ট্রেশন বাটন হ্যান্ডলার
  const handleOpenRegister = () => {
    setAuthMode('signup');
    setIsAuthOpen(true);
  };

  // ২) ইউজার লগইন বাটন হ্যান্ডলার
  const handleOpenUserLogin = () => {
    setAuthMode('login');
    setIsAuthOpen(true);
  };

  // ৩) অ্যাডমিন লগইন বাটন হ্যান্ডলার
  const handleOpenAdminLogin = () => {
    setAuthMode('admin');
    setIsAuthOpen(true);
  };

  // ৪) লগআউট
  const handleLogout = () => {
    authService.signOut();
    setCurrentUser(null);
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* নেভিগেশন বার */}
      <Navbar
        currentUser={currentUser}
        onOpenRegister={handleOpenRegister}
        onOpenUserLogin={handleOpenUserLogin}
        onOpenAdminLogin={handleOpenAdminLogin}
        onLogout={handleLogout}
        onOpenDashboard={() => setCurrentView('dashboard')}
      />

      {/* মূল পেজ কনটেন্ট */}
      <main className="flex-1">
        {currentView === 'dashboard' && currentUser ? (
          <UserDashboardPage
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            openAdminModal={() => setIsAdminModalOpen(true)}
          />
        ) : (
          <HomePage 
            onOpenRegister={handleOpenRegister}
            onOpenLogin={handleOpenUserLogin}
          />
        )}
      </main>

      {/* রেজিস্ট্রেশন, ইউজার ও অ্যাডমিন লগইন পপ-আপ মোডাল */}
      <AuthPage
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        setCurrentUser={setCurrentUser}
        openDashboard={() => setCurrentView('dashboard')}
      />

      {/* অ্যাডমিন কন্ট্রোল প্যানেল মোডাল */}
      {isAdminModalOpen && currentUser?.role === 'admin' && (
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          currentUser={currentUser}
        />
      )}

    </div>
  );
}

export default App;
