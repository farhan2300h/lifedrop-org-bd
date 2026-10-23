/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ActivePage, BloodGroup, UserProfile } from './types';
import { bloodService } from './services/bloodService';
import { authService } from './services/supabaseClient';

import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { DonorSearchPage } from './components/DonorSearchPage';
import { DonorRegisterPage } from './components/DonorRegisterPage';
import { EmergencyRequestPage } from './components/EmergencyRequestPage';
import { EligibilityPage } from './components/EligibilityPage';
import { AboutContactPage } from './components/AboutContactPage';
import { AdminModal } from './components/AdminModal';
import { UserDashboardModal } from './components/UserDashboardModal';
import { AuthPage } from './components/AuthPage';
import { UserDashboardPage } from './components/UserDashboardPage';

function AppContent() {
  const [activePage, setActivePage] = useState<ActivePage>('home');

  const [searchFilters, setSearchFilters] = useState<{
    bloodGroup?: BloodGroup | 'ALL';
    division?: string;
    district?: string;
    upazila?: string;
  } | null>(null);

  // Authentication and user state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    () => authService.getCurrentUser()
  );

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
  const [urgentRequestsCount, setUrgentRequestsCount] = useState(0);

  // Synchronize authentication state
  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  // Update urgent blood request count
  useEffect(() => {
    const updateCount = () => {
      const requests = bloodService.getRequests();

      setUrgentRequestsCount(
        requests.filter((request) => request.status === 'urgent').length
      );
    };

    updateCount();

    const unsubscribe = bloodService.subscribe(updateCount);

    return unsubscribe;
  }, []);

  // Navigate to donor search with filters
  const handleSearchWithFilters = (filters: {
    bloodGroup?: BloodGroup | 'ALL';
    division?: string;
    district?: string;
    upazila?: string;
  }) => {
    setSearchFilters(filters);
    setActivePage('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sign out
  const handleLogout = async () => {
    await authService.signOut();

    setCurrentUser(null);
    setActivePage('home');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full min-w-0 min-h-screen flex flex-col overflow-x-clip bg-[#fcfcfd] text-slate-800 antialiased selection:bg-red-100 selection:text-red-900">

      {/* Header navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        openAdminModal={() => setIsAdminModalOpen(true)}
        openUserDashboard={() => {
          setActivePage('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main page content */}
      <main className="w-full min-w-0 flex-1 pb-20 lg:pb-0">
        {activePage === 'home' && (
          <HomePage
            setActivePage={setActivePage}
            onSearchWithFilters={handleSearchWithFilters}
          />
        )}

        {activePage === 'search' && (
          <DonorSearchPage
            initialFilters={searchFilters}
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'register' && (
          <DonorRegisterPage
            setActivePage={setActivePage}
            currentUser={currentUser}
          />
        )}

        {activePage === 'emergency' && (
          <EmergencyRequestPage
            setActivePage={setActivePage}
            currentUser={currentUser}
          />
        )}

        {activePage === 'eligibility' && (
          <EligibilityPage setActivePage={setActivePage} />
        )}

        {(activePage === 'about' || activePage === 'contact') && (
          <AboutContactPage setActivePage={setActivePage} />
        )}

        {/* Login and registration */}
        {(activePage === 'login' || activePage === 'signup') && (
          <AuthPage
            initialMode={activePage}
            setActivePage={setActivePage}
            onAuthSuccess={(user) => {
              setCurrentUser(user);
            }}
          />
        )}

        {/* User dashboard */}
        {activePage === 'dashboard' && (
          currentUser ? (
            <UserDashboardPage
              currentUser={currentUser}
              setActivePage={setActivePage}
              openAdminModal={() => setIsAdminModalOpen(true)}
              onLogout={handleLogout}
            />
          ) : (
            <AuthPage
              initialMode="login"
              setActivePage={setActivePage}
              onAuthSuccess={(user) => {
                setCurrentUser(user);
                setActivePage('dashboard');
              }}
            />
          )
        )}
      </main>

      {/* Footer */}
      <Footer
        setActivePage={setActivePage}
        openAdminModal={() => setIsAdminModalOpen(true)}
      />

      {/* Fixed mobile bottom navigation: Home, Search, Emergency, Donors */}
      <MobileBottomNav
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        openAdminModal={() => setIsAdminModalOpen(true)}
        openUserDashboard={() => {
          if (currentUser) {
            setActivePage('dashboard');
          } else {
            setActivePage('login');
          }

          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        urgentRequestsCount={urgentRequestsCount}
      />

      {/* Admin modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        openUserDashboard={() => {
          setActivePage('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* User dashboard modal */}
      {currentUser && isUserDashboardOpen && (
        <UserDashboardModal
          isOpen={isUserDashboardOpen}
          onClose={() => setIsUserDashboardOpen(false)}
          currentUser={currentUser}
          openAdminModal={() => {
            setIsUserDashboardOpen(false);
            setIsAdminModalOpen(true);
          }}
          openRegisterPage={() => {
            setIsUserDashboardOpen(false);
            setActivePage('register');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          openEmergencyPage={() => {
            setIsUserDashboardOpen(false);
            setActivePage('emergency');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
