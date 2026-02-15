
import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types';
import { 
  ChevronRight, X, Shield, FileText, Map, 
  Target, Terminal, Cpu, ArrowRight, SkipForward 
} from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
  onNavigate: (route: AppRoute) => void;
}

const TOUR_STEPS = [
  {
    id: 'welcome',
    route: AppRoute.DASHBOARD,
    title: 'Mission: Hired',
    icon: Terminal,
    content: "Welcome, Operative. The job market is a battlefield of algorithms and automated filters. Carrieder is your tactical suite designed to bypass these defenses and secure high-value targets. Let's review your arsenal."
  },
  {
    id: 'resume',
    route: AppRoute.RESUME_FORGE,
    title: 'Resume Forge',
    icon: FileText,
    content: "Your primary weapon. The Forge doesn't just format your resume; it runs deep packet inspection against JD algorithms. Use 'Deep Audit' to see exactly why you aren't getting callbacks, then let the AI rewrite your dossier to match the target's keywords perfectly."
  },
  {
    id: 'pathfinder',
    route: AppRoute.CAREER_PATHFINDER,
    title: 'Career Pathfinder',
    icon: Map,
    content: "Navigation is critical. Don't just apply blindly. Upload your resume and define a target role (e.g., 'Senior Architect'). The Pathfinder calculates the skill gap velocity and generates a step-by-step roadmap to bridge the divide between where you are and where you want to be."
  },
  {
    id: 'tracker',
    route: AppRoute.APPLICATION_TRACKER,
    title: 'Pipeline Command',
    icon: Target,
    content: "Manage your active pursuits. This Kanban board tracks every application from 'Target' to 'Offer'. Use the integrated 'Headhunter Scout' to identify key decision-makers at your target companies and bypass the generic application pile."
  },
  {
    id: 'ready',
    route: AppRoute.DASHBOARD,
    title: 'System Online',
    icon: Shield,
    content: "You are now fully operational. Configure your API keys in Settings for maximum power, or begin by scanning the market on your Dashboard. Good hunting."
  }
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-navigate when step changes
  useEffect(() => {
    onNavigate(TOUR_STEPS[currentStep].route);
  }, [currentStep, onNavigate]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300); // Allow animation to finish
  };

  if (!isVisible) return null;

  const StepIcon = TOUR_STEPS[currentStep].icon;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none p-4 sm:p-0">
      {/* Backdrop with Scanlines */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-500" onClick={handleClose}>
         <div className="absolute inset-0 scanlines opacity-30"></div>
      </div>

      {/* Holographic Card */}
      <div className="relative pointer-events-auto w-full max-w-lg bg-barker-panel border border-barker-gold/30 rounded-2xl shadow-[0_0_50px_rgba(229,62,62,0.15)] overflow-hidden animate-fade-in-up">
        
        {/* Top Decorative Bar */}
        <div className="h-1 w-full bg-gray-800">
           <div 
             className="h-full bg-barker-gold transition-all duration-500 ease-out shadow-[0_0_10px_#E53E3E]" 
             style={{ width: `${progress}%` }}
           ></div>
        </div>

        <div className="p-8 relative">
           {/* Background Grid */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

           {/* Content */}
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-3 text-barker-gold">
                    <div className="p-3 bg-barker-gold/10 rounded-lg border border-barker-gold/20">
                       <StepIcon className="w-6 h-6" />
                    </div>
                    <div>
                       <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1">
                          Briefing Phase {currentStep + 1}/{TOUR_STEPS.length}
                       </div>
                       <h2 className="text-2xl font-bold text-white tracking-tight">
                          {TOUR_STEPS[currentStep].title}
                       </h2>
                    </div>
                 </div>
                 <button 
                    onClick={handleClose} 
                    className="text-gray-500 hover:text-white transition-colors"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="min-h-[100px] text-gray-300 text-sm leading-relaxed font-sans border-l-2 border-white/10 pl-4 mb-8">
                 {TOUR_STEPS[currentStep].content}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                 <button 
                    onClick={handleClose}
                    className="text-xs font-mono text-gray-500 hover:text-white uppercase tracking-wider flex items-center gap-2 transition-colors"
                 >
                    <SkipForward className="w-3 h-3" /> Abort Tutorial
                 </button>

                 <button 
                    onClick={handleNext}
                    className="bg-barker-gold hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all hover:scale-105"
                 >
                    {currentStep === TOUR_STEPS.length - 1 ? (
                        <>ACKNOWLEDGE <Cpu className="w-4 h-4" /></>
                    ) : (
                        <>PROCEED <ChevronRight className="w-4 h-4" /></>
                    )}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
