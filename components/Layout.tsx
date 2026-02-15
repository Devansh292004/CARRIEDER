
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Briefcase, 
  FileText, 
  Search, 
  Camera, 
  Video, 
  Image as ImageIcon, 
  MessageCircle, 
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Users,
  Map,
  CheckCircle2,
  Settings,
  Linkedin,
  Infinity,
  Gavel,
  Radar
} from 'lucide-react';
import { AppRoute } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

// Subtle Gradient Background
const GradientBackground = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#111] pointer-events-none z-0" />
);

const Layout: React.FC<LayoutProps> = ({ children, activeRoute, onNavigate }) => {
  const { user, logout } = useAuth();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [activeRoute]); 

  const navItems = [
    { id: AppRoute.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppRoute.APPLICATION_TRACKER, label: 'Application Tracker', icon: CheckCircle2 },
    { id: AppRoute.RESONANCE_ENGINE, label: 'Opportunity Discovery', icon: Radar },
    { id: AppRoute.CAREER_PATHFINDER, label: 'Career Roadmap', icon: Map },
    { id: AppRoute.RESUME_FORGE, label: 'Resume Builder', icon: FileText },
    { id: AppRoute.THE_TRIBUNAL, label: 'Hiring Committee Sim', icon: Gavel },
    { id: AppRoute.CHRONO_LAPSE, label: 'Career Simulator', icon: Infinity },
    { id: AppRoute.HEADHUNTER, label: 'Recruiter Finder', icon: Users },
    { id: AppRoute.LINKEDIN_ARCHITECT, label: 'LinkedIn Optimizer', icon: Linkedin },
    { id: AppRoute.OUTREACH_NEXUS, label: 'Networking Strategy', icon: Users },
    { id: AppRoute.COMPANY_RECON, label: 'Company Intelligence', icon: Search },
    { id: AppRoute.INTERVIEW_COACH, label: 'Interview Coach', icon: MessageCircle },
    { id: AppRoute.TRUST_CENTER, label: 'Credential Verification', icon: ShieldCheck },
    { id: AppRoute.HEADSHOT_STUDIO, label: 'AI Headshots', icon: Camera },
    { id: AppRoute.VIDEO_PITCH, label: 'Video Pitch', icon: Video },
    { id: AppRoute.BRAND_ASSETS, label: 'Portfolio Assets', icon: ImageIcon },
  ];

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() 
    : 'US';

  return (
    <div className="min-h-screen bg-barker-dark flex font-sans overflow-hidden text-gray-300 selection:bg-barker-gold selection:text-white">
      <GradientBackground />
      
      {/* Sidebar */}
      <aside className="w-64 bg-black/90 border-r border-white/5 flex flex-col z-20 backdrop-blur-xl relative">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-barker-gold/10 rounded-lg">
               <Briefcase className="w-5 h-5 text-barker-gold" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">Carrieder</span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">AI Suite</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin relative z-30">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'text-white bg-barker-gold/20 border border-barker-gold/50 shadow-[0_0_15px_rgba(229,62,62,0.2)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-barker-gold' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span className="relative z-10">{item.label}</span>
                {isActive && <div className="absolute inset-0 bg-barker-gold opacity-10 blur-md"></div>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-white/5 space-y-3 relative z-30">
          <button 
             onClick={() => onNavigate(AppRoute.SETTINGS)}
             className={`w-full flex items-center gap-2 text-xs font-medium transition-colors px-2 py-1.5 rounded-lg ${activeRoute === AppRoute.SETTINGS ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white'}`}
          >
             <Settings className="w-3 h-3" /> Settings
          </button>
          
          <div className="flex items-center gap-3 pt-2 border-t border-white/5">
            <div className="w-9 h-9 rounded-full bg-barker-gold flex items-center justify-center text-white font-bold text-sm shadow-inner relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
               <span className="relative z-10">{initials}</span>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.title}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-white transition-colors pl-1 py-1"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 relative overflow-y-auto h-screen bg-transparent z-10 scrollbar-thin scrollbar-thumb-barker-gold/20 scrollbar-track-transparent">
         <div className="w-full max-w-[1920px] mx-auto p-4 md:p-8 lg:p-10 relative z-10 min-h-screen flex flex-col justify-start">
            {/* Animation Wrapper */}
            <div className="animate-fade-in-up w-full h-full">
               {children}
            </div>
         </div>
      </main>
    </div>
  );
};

export default Layout;
