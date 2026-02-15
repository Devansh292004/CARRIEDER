
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ResumeForge from './components/ResumeForge';
import CompanyRecon from './components/CompanyRecon';
import HeadshotStudio from './components/HeadshotStudio';
import VideoPitch from './components/VideoPitch';
import BrandAssets from './components/BrandAssets';
import InterviewCoach from './components/InterviewCoach';
import TrustCenter from './components/TrustCenter';
import OutreachNexus from './components/OutreachNexus';
import CareerPathfinder from './components/CareerPathfinder';
import ApplicationTracker from './components/ApplicationTracker';
import Headhunter from './components/Headhunter';
import LinkedInArchitect from './components/LinkedInArchitect';
import ChronoLapse from './components/ChronoLapse';
import TheTribunal from './components/TheTribunal';
import CareerResonanceEngine from './components/CareerResonanceEngine';
import Settings from './components/Settings';
import Login from './components/Login';
import OnboardingTour from './components/OnboardingTour';
import { AppRoute } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check routing
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (Object.values(AppRoute).includes(hash as AppRoute)) {
        setRoute(hash as AppRoute);
      } else {
        setRoute(AppRoute.DASHBOARD);
      }
    };

    handleHashChange(); // Init
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check for onboarding status when user is loaded
  useEffect(() => {
    if (user) {
      const hasCompletedTour = localStorage.getItem('carrieder_tour_completed');
      if (!hasCompletedTour) {
        // Small delay to ensure UI is ready
        setTimeout(() => setShowTour(true), 1000);
      }
    }
  }, [user]);

  const navigate = (newRoute: AppRoute) => {
    window.location.hash = newRoute;
  };

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem('carrieder_tour_completed', 'true');
    navigate(AppRoute.DASHBOARD);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-barker-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Initializing System Core...</p>
      </div>
    </div>
  );

  if (!user) {
    return <Login />;
  }

  // Helper to manage visibility while keeping state alive (Keep-Alive pattern)
  const PageWrapper = ({ id, children }: { id: AppRoute, children: React.ReactNode }) => {
    const isActive = route === id;
    return (
      <div 
        className={`${isActive ? 'block' : 'hidden'} h-full w-full animate-fade-in-up`}
        aria-hidden={!isActive}
      >
        {children}
      </div>
    );
  };

  return (
    <Layout activeRoute={route} onNavigate={navigate}>
      
      {showTour && (
        <OnboardingTour onNavigate={navigate} onComplete={completeTour} />
      )}

      <PageWrapper id={AppRoute.DASHBOARD}>
        <Dashboard onNavigate={navigate} isVisible={route === AppRoute.DASHBOARD} />
      </PageWrapper>

      <PageWrapper id={AppRoute.RESONANCE_ENGINE}>
        <CareerResonanceEngine />
      </PageWrapper>

      <PageWrapper id={AppRoute.THE_TRIBUNAL}>
        <TheTribunal />
      </PageWrapper>

      <PageWrapper id={AppRoute.CHRONO_LAPSE}>
        <ChronoLapse />
      </PageWrapper>

      <PageWrapper id={AppRoute.APPLICATION_TRACKER}>
        <ApplicationTracker />
      </PageWrapper>

      <PageWrapper id={AppRoute.HEADHUNTER}>
        <Headhunter />
      </PageWrapper>
      
      <PageWrapper id={AppRoute.LINKEDIN_ARCHITECT}>
        <LinkedInArchitect />
      </PageWrapper>

      <PageWrapper id={AppRoute.CAREER_PATHFINDER}>
        <CareerPathfinder />
      </PageWrapper>

      <PageWrapper id={AppRoute.OUTREACH_NEXUS}>
        <OutreachNexus />
      </PageWrapper>

      <PageWrapper id={AppRoute.RESUME_FORGE}>
        <ResumeForge />
      </PageWrapper>

      <PageWrapper id={AppRoute.COMPANY_RECON}>
        <CompanyRecon />
      </PageWrapper>

      <PageWrapper id={AppRoute.HEADSHOT_STUDIO}>
        <HeadshotStudio />
      </PageWrapper>

      <PageWrapper id={AppRoute.VIDEO_PITCH}>
        <VideoPitch />
      </PageWrapper>

      <PageWrapper id={AppRoute.BRAND_ASSETS}>
        <BrandAssets />
      </PageWrapper>

      <PageWrapper id={AppRoute.INTERVIEW_COACH}>
        <InterviewCoach />
      </PageWrapper>

      <PageWrapper id={AppRoute.TRUST_CENTER}>
        <TrustCenter />
      </PageWrapper>

      <PageWrapper id={AppRoute.SETTINGS}>
        <Settings />
      </PageWrapper>
    </Layout>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
