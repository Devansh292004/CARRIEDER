
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Briefcase, FileText, Search, Camera, Video, 
  Image as ImageIcon, MessageCircle, LayoutDashboard,
  ShieldCheck, LogOut, Users, Map, CheckCircle2,
  Settings, Linkedin, Infinity, Gavel, Radar,
  DollarSign, Volume2, VolumeX, Hexagon, Cpu, Hammer,
  ArrowUpCircle, Navigation
} from 'lucide-react';
import { AppRoute, CareerStage } from '../types';
import CommandCenter from './CommandCenter';
import { playHover, playClick, toggleMute, getMuteStatus } from '../services/soundService';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

// Priority Mapping for Dynamic Layout
const STAGE_PRIORITIES: Record<CareerStage, AppRoute[]> = {
    'preparation': [
        AppRoute.RESUME_FORGE,
        AppRoute.CAREER_PATHFINDER,
        AppRoute.HEADSHOT_STUDIO,
        AppRoute.BRAND_ASSETS,
        AppRoute.LINKEDIN_ARCHITECT
    ],
    'discovery': [
        AppRoute.RESONANCE_ENGINE,
        AppRoute.COMPANY_RECON,
        AppRoute.HEADHUNTER,
        AppRoute.SYSTEM_ARCHITECT
    ],
    'outreach': [
        AppRoute.OUTREACH_NEXUS,
        AppRoute.LINKEDIN_ARCHITECT,
        AppRoute.PROOF_OF_WORK,
        AppRoute.HEADHUNTER
    ],
    'application': [
        AppRoute.THE_ARCHITECT,
        AppRoute.APPLICATION_TRACKER,
        AppRoute.PROOF_OF_WORK,
        AppRoute.RESUME_FORGE
    ],
    'interview': [
        AppRoute.INTERVIEW_COACH,
        AppRoute.THE_TRIBUNAL,
        AppRoute.VIDEO_PITCH,
        AppRoute.SYSTEM_ARCHITECT
    ] as AppRoute[], // Adding SYSTEM_ARCHITECT (War Room) logic dynamically
    'negotiation': [
        AppRoute.NEGOTIATION_COACH,
        AppRoute.TRUST_CENTER,
        AppRoute.CHRONO_LAPSE
    ]
};

const Layout: React.FC<LayoutProps> = ({ children, activeRoute, onNavigate }) => {
  const { user, logout } = useAuth();
  const mainRef = useRef<HTMLElement>(null);
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [muted, setMuted] = useState(getMuteStatus());

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

  // Global Key Listener for Command Center
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandCenter(prev => !prev);
        playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMuteToggle = () => {
      const newState = toggleMute();
      setMuted(newState);
      if (!newState) playClick();
  };

  const allNavItems = [
    { id: AppRoute.THE_ARCHITECT, label: 'The Architect', icon: Hammer },
    { id: AppRoute.PROOF_OF_WORK, label: 'Proof of Work', icon: Cpu },
    { id: AppRoute.APPLICATION_TRACKER, label: 'Application Tracker', icon: CheckCircle2 },
    { id: AppRoute.RESONANCE_ENGINE, label: 'Opportunity Discovery', icon: Radar },
    { id: AppRoute.CAREER_PATHFINDER, label: 'Career Roadmap', icon: Map },
    { id: AppRoute.RESUME_FORGE, label: 'Resume Forge', icon: FileText },
    { id: AppRoute.SYSTEM_ARCHITECT, label: 'System Architect', icon: Hexagon },
    { id: AppRoute.THE_TRIBUNAL, label: 'Hiring Committee Sim', icon: Gavel },
    { id: AppRoute.CHRONO_LAPSE, label: 'Career Simulator', icon: Infinity },
    { id: AppRoute.HEADHUNTER, label: 'Headhunter Scout', icon: Users },
    { id: AppRoute.LINKEDIN_ARCHITECT, label: 'LinkedIn Architect', icon: Linkedin },
    { id: AppRoute.OUTREACH_NEXUS, label: 'Outreach Nexus', icon: Users },
    { id: AppRoute.NEGOTIATION_COACH, label: 'Negotiation Coach', icon: DollarSign },
    { id: AppRoute.COMPANY_RECON, label: 'Company Recon', icon: Search },
    { id: AppRoute.INTERVIEW_COACH, label: 'Interview Coach', icon: MessageCircle },
    { id: AppRoute.TRUST_CENTER, label: 'Trust Center', icon: ShieldCheck },
    { id: AppRoute.HEADSHOT_STUDIO, label: 'Headshot Studio', icon: Camera },
    { id: AppRoute.VIDEO_PITCH, label: 'Video Pitch', icon: Video },
    { id: AppRoute.BRAND_ASSETS, label: 'Brand Assets', icon: ImageIcon },
  ];

  // Dynamic sorting logic
  const currentStage = user?.currentStage || 'preparation';
  const priorityRoutes = STAGE_PRIORITIES[currentStage] || [];

  const priorityItems = allNavItems.filter(item => priorityRoutes.includes(item.id));
  const otherItems = allNavItems.filter(item => !priorityRoutes.includes(item.id));

  // Sort priority items to match the explicit order in STAGE_PRIORITIES
  priorityItems.sort((a, b) => priorityRoutes.indexOf(a.id) - priorityRoutes.indexOf(b.id));

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() 
    : 'US';

  return (
    <div className="min-h-screen bg-exo-void flex font-sans overflow-hidden text-gray-300 selection:bg-exo-primary selection:text-black relative">
      
      {/* Background Ambience */}
      <div className="bg-aurora opacity-30 pointer-events-none">
          <div className="blob bg-exo-primary w-[500px] h-[500px] top-[-100px] left-[-100px] animate-blob mix-blend-screen opacity-20"></div>
          <div className="blob bg-blue-900 w-[600px] h-[600px] bottom-[-50px] right-[-50px] animate-blob opacity-20" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Command Center Modal */}
      <CommandCenter 
        isOpen={showCommandCenter} 
        onClose={() => setShowCommandCenter(false)} 
        onNavigate={onNavigate}
      />

      {/* Sidebar - Floating Glass Style */}
      <aside className="w-72 p-4 flex flex-col z-20 h-screen hidden md:flex">
        <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden bg-exo-surface/80 border border-exo-primary/10">
            
            {/* Header */}
            <div className="p-6 border-b border-exo-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-exo-primary to-[#ff8800] rounded-xl shadow-[0_0_15px_rgba(255,192,0,0.4)]">
                   <Briefcase className="w-5 h-5 text-black" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-white block drop-shadow-md">Carrieder</span>
                  <span className="text-[10px] font-bold text-exo-primary uppercase tracking-widest">Exec Suite</span>
                </div>
              </div>
              
              <button 
                onClick={() => { setShowCommandCenter(true); playClick(); }}
                onMouseEnter={playHover}
                className="mt-6 w-full flex items-center justify-between px-3 py-2 bg-black/40 hover:bg-black/60 rounded-lg border border-exo-primary/10 hover:border-exo-primary/30 text-xs font-mono text-gray-400 transition-colors group"
              >
                 <span className="flex items-center gap-2 group-hover:text-white"><Search className="w-3 h-3" /> Quick Nav</span>
                 <span className="bg-exo-primary/10 px-1.5 py-0.5 rounded text-[10px] border border-exo-primary/20 text-exo-primary group-hover:bg-exo-primary group-hover:text-black transition-colors">⌘K</span>
              </button>
            </div>
            
            {/* Nav */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
              {/* Dashboard Always Top */}
              <button
                onClick={() => { playClick(); onNavigate(AppRoute.DASHBOARD); }}
                onMouseEnter={playHover}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden mb-4 ${
                  activeRoute === AppRoute.DASHBOARD
                    ? 'text-black bg-gradient-to-r from-exo-primary to-[#ff9900] shadow-[0_0_20px_rgba(255,192,0,0.3)] font-bold' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 relative z-10 transition-colors ${activeRoute === AppRoute.DASHBOARD ? 'text-black' : 'text-gray-500 group-hover:text-exo-primary'}`} />
                <span className="relative z-10">Mission Control</span>
              </button>

              {/* Priority Section */}
              <div className="px-3 pb-2 pt-1 text-[10px] font-bold text-exo-primary uppercase tracking-widest flex items-center gap-2 opacity-80">
                  <Navigation className="w-3 h-3" /> Recommended
              </div>
              {priorityItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { playClick(); onNavigate(item.id); }}
                    onMouseEnter={playHover}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                      isActive 
                        ? 'text-white bg-white/10 border border-exo-primary/50 shadow-[0_0_15px_rgba(255,192,0,0.1)]' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 relative z-10 transition-colors ${isActive ? 'text-exo-primary' : 'text-gray-500 group-hover:text-exo-primary'}`} />
                    <span className="relative z-10">{item.label}</span>
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-exo-primary shadow-[0_0_5px_#FFC000]"></div>
                  </button>
                );
              })}

              {/* All Tools Section */}
              <div className="px-3 pb-2 pt-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  Full Arsenal
              </div>
              {otherItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { playClick(); onNavigate(item.id); }}
                    onMouseEnter={playHover}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                      isActive 
                        ? 'text-white bg-white/10 border border-white/20' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 relative z-10 transition-colors ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`} />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-exo-primary/10 bg-black/40 space-y-3">
              <div className="flex gap-2">
                  <button 
                     onClick={handleMuteToggle}
                     className={`flex-1 flex items-center justify-center text-xs font-medium transition-colors py-2 rounded-lg border border-white/5 hover:bg-white/10 ${muted ? 'text-gray-600' : 'text-exo-primary'}`}
                  >
                     {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                  <button 
                     onClick={() => { playClick(); onNavigate(AppRoute.SETTINGS); }}
                     onMouseEnter={playHover}
                     className={`flex-[3] flex items-center justify-center gap-2 text-xs font-medium transition-colors py-2 rounded-lg border border-white/5 ${activeRoute === AppRoute.SETTINGS ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                  >
                     <Settings className="w-3 h-3" /> Settings
                  </button>
              </div>
              
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-bold text-sm shadow-inner ring-1 ring-exo-primary/30">
                   <span className="relative z-10">{initials}</span>
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="font-bold text-sm text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider">{currentStage}</p>
                </div>
                <button 
                  onClick={() => { playClick(); logout(); }}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 relative overflow-y-auto h-screen z-10 scrollbar-thin scrollbar-thumb-exo-primary/20 scrollbar-track-transparent">
         <div className="w-full max-w-[1920px] mx-auto p-4 md:p-8 relative z-10 min-h-screen flex flex-col">
            <div className="animate-fade-in w-full h-full">
               {children}
            </div>
         </div>
      </main>
    </div>
  );
};

export default Layout;