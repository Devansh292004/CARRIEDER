
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
import NegotiationCoach from './components/NegotiationCoach';
import SystemArchitect from './components/SystemArchitect';
import ProofOfWork from './components/ProofOfWork';
import MagnumOpus from './components/MagnumOpus';
import Settings from './components/Settings';
import Login from './components/Login';
import OnboardingTour from './components/OnboardingTour';
import { AppRoute } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Helper to manage visibility while keeping state alive (Keep-Alive pattern)
interface PageWrapperProps {
  id: AppRoute;
  activeRoute: AppRoute;
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ id, activeRoute, children }) => {
  const isActive = activeRoute === id;
  return (
    <div 
      className={`${isActive ? 'block' : 'hidden'} h-full w-full animate-fade-in`}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
};

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
    <div className="min-h-screen bg-[#020c1b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Initializing System Core...</p>
      </div>
    </div>
  );

  if (!user) {
    return <Login />;
  }

  return (
    <Layout activeRoute={route} onNavigate={navigate}>
      
      {showTour && (
        <OnboardingTour onNavigate={navigate} onComplete={completeTour} />
      )}

      <PageWrapper id={AppRoute.DASHBOARD} activeRoute={route}>
        <Dashboard onNavigate={navigate} isVisible={route === AppRoute.DASHBOARD} />
      </PageWrapper>

      <PageWrapper id={AppRoute.THE_ARCHITECT} activeRoute={route}>
        <MagnumOpus />
      </PageWrapper>

      <PageWrapper id={AppRoute.PROOF_OF_WORK} activeRoute={route}>
        <ProofOfWork />
      </PageWrapper>

      <PageWrapper id={AppRoute.RESONANCE_ENGINE} activeRoute={route}>
        <CareerResonanceEngine />
      </PageWrapper>

      <PageWrapper id={AppRoute.SYSTEM_ARCHITECT} activeRoute={route}>
        <SystemArchitect />
      </PageWrapper>

      <PageWrapper id={AppRoute.THE_TRIBUNAL} activeRoute={route}>
        <TheTribunal />
      </PageWrapper>

      <PageWrapper id={AppRoute.CHRONO_LAPSE} activeRoute={route}>
        <ChronoLapse />
      </PageWrapper>

      <PageWrapper id={AppRoute.APPLICATION_TRACKER} activeRoute={route}>
        <ApplicationTracker />
      </PageWrapper>

      <PageWrapper id={AppRoute.HEADHUNTER} activeRoute={route}>
        <Headhunter />
      </PageWrapper>
      
      <PageWrapper id={AppRoute.LINKEDIN_ARCHITECT} activeRoute={route}>
        <LinkedInArchitect />
      </PageWrapper>

      <PageWrapper id={AppRoute.CAREER_PATHFINDER} activeRoute={route}>
        <CareerPathfinder />
      </PageWrapper>

      <PageWrapper id={AppRoute.OUTREACH_NEXUS} activeRoute={route}>
        <OutreachNexus />
      </PageWrapper>

      <PageWrapper id={AppRoute.NEGOTIATION_COACH} activeRoute={route}>
        <NegotiationCoach />
      </PageWrapper>

      <PageWrapper id={AppRoute.RESUME_FORGE} activeRoute={route}>
        <ResumeForge />
      </PageWrapper>

      <PageWrapper id={AppRoute.COMPANY_RECON} activeRoute={route}>
        <CompanyRecon />
      </PageWrapper>

      <PageWrapper id={AppRoute.HEADSHOT_STUDIO} activeRoute={route}>
        <HeadshotStudio />
      </PageWrapper>

      <PageWrapper id={AppRoute.VIDEO_PITCH} activeRoute={route}>
        <VideoPitch />
      </PageWrapper>

      <PageWrapper id={AppRoute.BRAND_ASSETS} activeRoute={route}>
        <BrandAssets />
      </PageWrapper>

      <PageWrapper id={AppRoute.INTERVIEW_COACH} activeRoute={route}>
        <InterviewCoach />
      </PageWrapper>

      <PageWrapper id={AppRoute.TRUST_CENTER} activeRoute={route}>
        <TrustCenter />
      </PageWrapper>

      <PageWrapper id={AppRoute.SETTINGS} activeRoute={route}>
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
