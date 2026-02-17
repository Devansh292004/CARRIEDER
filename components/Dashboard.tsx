
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppRoute, JobOpportunity, CareerStage } from '../types';
import QuickTips from './QuickTips';
import { getMarketInsights, findLatestOpportunities, generateDeepCareerStrategy } from '../services/geminiService';
import { Activity, TrendingUp, Award, ArrowRight, Radar, Radio, ExternalLink, MapPin, Briefcase, AlertTriangle, RefreshCw, Cpu, Globe, Crosshair, Terminal, MessageSquare, BrainCircuit, Sparkles, ChevronRight, CheckCircle2, Target, Zap, Wifi, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  onNavigate: (route: AppRoute) => void;
  isVisible: boolean;
}

const STAGES: { id: CareerStage; label: string; desc: string }[] = [
    { id: 'preparation', label: 'Foundation', desc: 'Optimize assets & define trajectory' },
    { id: 'discovery', label: 'Discovery', desc: 'Identify targets & market intel' },
    { id: 'outreach', label: 'Infiltration', desc: 'Network penetration & contact' },
    { id: 'application', label: 'Attack', desc: 'High-volume submission & tracking' },
    { id: 'interview', label: 'Showtime', desc: 'Simulation, prep & performance' },
    { id: 'negotiation', label: 'Closing', desc: 'Offer analysis & leverage' }
];

const VISA_TYPES = [
    { value: 'Citizen/PR', label: 'Citizen / PR' },
    { value: 'Student 500', label: 'Student Visa (500)' },
    { value: 'Graduate 485', label: 'Graduate Visa (485)' },
    { value: 'Sponsorship', label: 'Sponsorship Required' },
    { value: 'WHV', label: 'Working Holiday' }
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, isVisible }) => {
  const { user, updateUser } = useAuth();
  const [marketTrends, setMarketTrends] = useState<string>('');
  const [loadingTrends, setLoadingTrends] = useState(true);
  
  // Real-time radar state
  const [liveJobs, setLiveJobs] = useState<JobOpportunity[]>([]);
  const [scanning, setScanning] = useState(false);
  const [location, setLocation] = useState('Remote');
  const [targetRole, setTargetRole] = useState(user?.title === 'Candidate' ? 'Software Engineer' : user?.title || 'Engineer');
  const [visaStatus, setVisaStatus] = useState('Citizen/PR');
  const [radarError, setRadarError] = useState<string | null>(null);

  // Strategy Node State
  const [strategyQuery, setStrategyQuery] = useState('');
  const [strategyResult, setStrategyResult] = useState('');
  const [thinking, setThinking] = useState(false);

  // ATS Score State
  const atsScore = user?.atsScore || 0;
  const scoreRadius = 50;
  const scoreCircumference = 2 * Math.PI * scoreRadius;
  const scoreOffset = scoreCircumference - (Math.min(atsScore, 100) / 100) * scoreCircumference;

  // Load trends only once on mount
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const sector = user?.title && user.title !== 'Candidate' ? user.title : "Technology & Software";
        const trends = await getMarketInsights(sector);
        setMarketTrends(trends);
      } catch (e) {
        setMarketTrends("Unable to load real-time market data.");
      } finally {
        setLoadingTrends(false);
      }
    };
    if (!marketTrends && isVisible) fetchTrends();
  }, [user, isVisible, marketTrends]); 

  const handleScan = useCallback(async () => {
      setScanning(true);
      setRadarError(null);
      setLiveJobs([]); 

      try {
          const opportunities = await findLatestOpportunities(targetRole, location, visaStatus);
          
          if (opportunities.length > 0) {
            setLiveJobs(opportunities);
          } else {
             setRadarError("NO SIGNALS DETECTED IN SECTOR");
          }
      } catch (e: any) {
          console.error("Radar failed", e);
          setRadarError("SCAN INTERRUPTED - RETRY");
      } finally {
          setScanning(false);
      }
  }, [targetRole, location, visaStatus]);

  const handleDeepStrategy = async () => {
      if (!strategyQuery) return;
      setThinking(true);
      setStrategyResult('');
      try {
          const result = await generateDeepCareerStrategy(strategyQuery);
          setStrategyResult(result);
      } catch (e) {
          setStrategyResult("Process interrupted. Please try again.");
      } finally {
          setThinking(false);
      }
  };

  const handleStageChange = (newStage: CareerStage) => {
      updateUser({ currentStage: newStage });
  };

  const MissionBriefing = () => {
      const currentStageIdx = STAGES.findIndex(s => s.id === user?.currentStage);
      const nextStage = STAGES[currentStageIdx + 1];
      const activeStage = STAGES[currentStageIdx] || STAGES[0];

      return (
          <div className="glass-card p-0 rounded-3xl overflow-hidden mb-8 border-l-4 border-l-exo-primary animate-slide-up relative">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,192,0,0.05)_25%,transparent_25%,transparent_50%,rgba(255,192,0,0.05)_50%,rgba(255,192,0,0.05)_75%,transparent_75%,transparent_100%)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
              
              <div className="p-8 flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                  <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-exo-primary/10 text-exo-primary text-[10px] font-bold uppercase tracking-widest rounded border border-exo-primary/20">
                              Active Protocol
                          </span>
                          <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">
                              Phase {currentStageIdx + 1} of {STAGES.length}
                          </span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 uppercase tracking-wide">
                          {activeStage.label}
                      </h2>
                      <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
                          {activeStage.desc}. The system has reconfigured your navigation to prioritize tools for this phase. Execute recommended actions to proceed.
                      </p>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[200px]">
                      {nextStage && (
                          <button 
                             onClick={() => handleStageChange(nextStage.id)}
                             className="group flex items-center justify-between p-4 bg-white/5 hover:bg-exo-primary/10 border border-white/10 hover:border-exo-primary/30 rounded-xl transition-all"
                          >
                              <div className="text-left">
                                  <span className="block text-[10px] text-gray-500 uppercase font-bold group-hover:text-exo-primary transition-colors">Advance To</span>
                                  <span className="block text-sm font-bold text-white">{nextStage.label}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-exo-primary transform group-hover:translate-x-1 transition-all" />
                          </button>
                      )}
                      
                      <div className="flex gap-1">
                          {STAGES.map((s, i) => (
                              <button 
                                key={s.id}
                                onClick={() => handleStageChange(s.id)}
                                className={`h-1 flex-1 rounded-full transition-all ${i <= currentStageIdx ? 'bg-exo-primary shadow-[0_0_10px_#FFC000]' : 'bg-gray-800 hover:bg-gray-700'}`}
                                title={s.label}
                              />
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const getPseudoMatch = (id: string | undefined) => {
      if (!id) return 85;
      // Deterministic pseudo-random number based on ID string
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
          hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      return 70 + Math.abs(hash % 29); // 70% - 99%
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-6 mb-8 gap-4 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-exo-primary shadow-[0_0_10px_#6366f1]"></div>
        <div>
          <div className="flex items-center gap-2 text-exo-primary mb-1">
              <Cpu className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]">System Ready</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-2 tracking-tighter drop-shadow-2xl">
             Mission Control
          </h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-2">
            Central command for career optimization operations.
          </p>
        </div>
        <div className="text-right hidden md:block">
           <div className="flex items-center gap-2 justify-end text-exo-primary text-xs font-bold uppercase tracking-wider mb-1">
              {scanning ? (
                  <div className="flex gap-1">
                      <span className="w-1 h-3 bg-exo-primary animate-pulse"></span>
                      <span className="w-1 h-3 bg-exo-primary animate-pulse delay-75"></span>
                      <span className="w-1 h-3 bg-exo-primary animate-pulse delay-150"></span>
                  </div>
              ) : (
                  <div className={`w-2 h-2 rounded-full ${radarError ? 'bg-exo-error' : 'bg-exo-success shadow-[0_0_10px_#10b981]'}`}></div>
              )}
              {radarError ? 'SYSTEM ALERT' : scanning ? 'SCANNING...' : 'NETWORK ONLINE'}
           </div>
           <p className="text-[10px] text-gray-500 font-mono tracking-widest">SECURE UPLINK ESTABLISHED</p>
        </div>
      </div>

      <MissionBriefing />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        
        {/* ATS Score Card */}
        <div 
           onClick={() => onNavigate(AppRoute.RESUME_FORGE)}
           className="glass-card p-6 flex flex-col items-center justify-center cursor-pointer group relative min-h-[320px] rounded-3xl overflow-hidden animate-slide-up"
        >
          <div className="relative z-10 w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-white/5 shadow-[0_0_30px_rgba(99,102,241,0.1)]"></div>
              <svg className="w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r={scoreRadius} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                  <circle cx="50%" cy="50%" r={scoreRadius} stroke="#6366f1" strokeWidth="8" fill="transparent" strokeDasharray={scoreCircumference} strokeDashoffset={scoreOffset} strokeLinecap="round" className="transition-all duration-1000 ease-out shadow-[0_0_15px_#6366f1]" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-5xl font-black text-white tracking-tighter">{atsScore}</span>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Match Score</span>
              </div>
          </div>

          <div className="relative z-10 mt-6 text-center">
              <div className="text-xs font-bold text-exo-primary uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-2">
                  <Award className="w-4 h-4" /> Optimization Level
              </div>
              <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto leading-relaxed">
                  Analyze your resume against job descriptions to increase interview probability.
              </p>
          </div>
        </div>

        {/* --- LIVE INTERCEPT RADAR (ENHANCED) --- */}
        <div className="md:col-span-2 glass-card p-0 relative flex flex-col group rounded-3xl overflow-hidden animate-slide-up h-[650px] border border-white/10" style={{ animationDelay: '100ms' }}>
           {/* Header Controls */}
           <div className="border-b border-white/5 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-black/60 backdrop-blur-md z-20">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${scanning ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse shadow-[0_0_10px_currentColor]`}></div>
                        <div className={`absolute inset-0 w-3 h-3 rounded-full ${scanning ? 'bg-yellow-500' : 'bg-red-500'} animate-ping opacity-75`}></div>
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                        <Radar className="w-4 h-4 text-exo-primary" /> Live Intercept
                    </h3>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full justify-end">
                    <div className="flex-1 sm:flex-none min-w-[140px] bg-black/50 border border-white/10 rounded-lg flex items-center px-3 py-2 focus-within:border-exo-primary/50 transition-colors">
                        <Target className="w-3 h-3 text-gray-500 mr-2 flex-shrink-0" />
                        <input 
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            className="bg-transparent border-none text-xs text-white w-full outline-none placeholder-gray-600 font-mono uppercase"
                            placeholder="TARGET ROLE"
                        />
                    </div>
                    <div className="w-full sm:w-32 bg-black/50 border border-white/10 rounded-lg flex items-center px-3 py-2 focus-within:border-exo-primary/50 transition-colors">
                        <MapPin className="w-3 h-3 text-gray-500 mr-2 flex-shrink-0" />
                        <input 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="bg-transparent border-none text-xs text-white w-full outline-none placeholder-gray-600 font-mono uppercase"
                            placeholder="SECTOR"
                        />
                    </div>
                    <div className="w-full sm:w-auto bg-black/50 border border-white/10 rounded-lg flex items-center px-3 py-2 focus-within:border-exo-primary/50 transition-colors">
                        <ShieldCheck className="w-3 h-3 text-gray-500 mr-2 flex-shrink-0" />
                        <select 
                            value={visaStatus}
                            onChange={(e) => setVisaStatus(e.target.value)}
                            className="bg-transparent border-none text-xs text-white w-full outline-none font-mono uppercase appearance-none cursor-pointer"
                        >
                            {VISA_TYPES.map(v => (
                                <option key={v.value} value={v.value} className="bg-black text-gray-300">{v.label}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={handleScan}
                        disabled={scanning}
                        className="p-2 bg-exo-primary hover:bg-white text-black rounded-lg transition-colors flex-shrink-0 shadow-lg w-full sm:w-auto flex items-center justify-center"
                    >
                        <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                    </button>
                </div>
           </div>

           <div className="flex-1 flex relative min-h-0">
                {/* Visual Radar Display (Left) */}
                <div className="w-[30%] border-r border-white/5 bg-black/40 relative hidden lg:block overflow-hidden">
                    {/* Grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_19%,rgba(255,255,255,0.05)_20%,transparent_21%,transparent_39%,rgba(255,255,255,0.05)_40%,transparent_41%,transparent_59%,rgba(255,255,255,0.05)_60%,transparent_61%)] pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                    
                    {/* Sweep Animation */}
                    {scanning && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-r from-transparent via-exo-primary/10 to-transparent animate-[spin_3s_linear_infinite] rounded-full opacity-30 origin-center" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }}></div>
                        </div>
                    )}
                    
                    {/* Center Point */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                        <div className={`w-2 h-2 bg-exo-primary rounded-full shadow-[0_0_10px_#FFC000] z-10`}></div>
                        <div className={`absolute w-64 h-64 rounded-full border border-exo-primary/10 ${scanning ? 'animate-[ping_2s_linear_infinite]' : ''}`}></div>
                    </div>

                    {/* Stats Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-white/5">
                        <div className="flex justify-between text-[9px] font-mono text-gray-400 uppercase mb-2">
                            <span>Status: {scanning ? 'SCANNING' : radarError ? 'OFFLINE' : 'ACTIVE'}</span>
                            <span className="text-exo-primary">{liveJobs.length} TARGETS</span>
                        </div>
                        <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-exo-primary transition-all duration-1000 ${scanning ? 'w-full animate-pulse' : 'w-1/3'}`}></div>
                        </div>
                    </div>
                </div>

                {/* Job Feed (Right) */}
                <div className="flex-1 bg-[#0a0a0a] relative overflow-y-auto scrollbar-thin p-4 space-y-3">
                    {radarError ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 animate-fade-in">
                            <AlertTriangle className="w-12 h-12 text-exo-error mb-4 opacity-50" />
                            <p className="text-xs font-bold text-exo-error tracking-[0.2em] uppercase mb-4">{radarError}</p>
                            <button onClick={handleScan} className="px-6 py-2 border border-exo-error/30 text-exo-error text-[10px] font-bold uppercase tracking-widest hover:bg-exo-error/10 transition-colors rounded-lg">REBOOT SCANNER</button>
                        </div>
                    ) : liveJobs.length === 0 && !scanning ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50">
                            <Radio className="w-16 h-16 mb-4" />
                            <p className="text-xs font-mono uppercase tracking-widest">Awaiting Signal</p>
                        </div>
                    ) : (
                        liveJobs.map((job, idx) => {
                            const matchScore = getPseudoMatch(job.id);
                            return (
                                <div key={job.id || idx} className="group relative bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all duration-300 animate-slide-in-right overflow-hidden" style={{ animationDelay: `${idx * 100}ms` }}>
                                    {/* Signal Bar */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-exo-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex justify-between items-start gap-4 relative z-10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-bold text-white truncate group-hover:text-exo-primary transition-colors">{job.title}</h4>
                                                {matchScore > 90 && (
                                                    <span className="text-[9px] bg-exo-primary text-black px-1.5 rounded font-bold uppercase tracking-wider">Hot</span>
                                                )}
                                                {job.isNew && (
                                                    <span className="text-[9px] bg-blue-500 text-white px-1.5 rounded font-bold uppercase tracking-wider">New</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-400 font-mono mb-2">
                                                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.company}</span>
                                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                <span>{job.timestamp}</span>
                                            </div>
                                            
                                            {/* Pseudo Metrics */}
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex items-center gap-1.5" title="Signal Match">
                                                    <Wifi className={`w-3 h-3 ${matchScore > 85 ? 'text-green-500' : 'text-yellow-500'}`} />
                                                    <span className={`text-[10px] font-bold ${matchScore > 85 ? 'text-green-500' : 'text-yellow-500'}`}>{matchScore}% MATCH</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Globe className="w-3 h-3" />
                                                    <span className="text-[10px] uppercase">{location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <a 
                                            href={job.url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-3 bg-black/40 rounded-lg border border-white/10 hover:border-exo-primary hover:text-exo-primary transition-all text-gray-400"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
           </div>
        </div>
      </div>

      {/* Deep Strategy Node */}
      <div className="glass-card p-8 rounded-3xl border-l-4 border-l-exo-primary animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-6">
              <BrainCircuit className="w-6 h-6 text-exo-primary" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Strategic Career Advisor</h3>
              <span className="text-[10px] bg-exo-primary/10 text-exo-primary border border-exo-primary/20 px-2 py-1 rounded-full font-bold">GEMINI 3 PRO</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                  <textarea 
                    value={strategyQuery}
                    onChange={(e) => setStrategyQuery(e.target.value)}
                    placeholder="Describe a complex career dilemma (e.g., 'Should I switch from PM to Engineering in this economy?')"
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-exo-primary outline-none resize-none mb-4"
                  />
                  <button 
                    onClick={handleDeepStrategy}
                    disabled={thinking || !strategyQuery}
                    className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest shadow-lg"
                  >
                      {thinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                      INITIALIZE ADVISOR
                  </button>
              </div>
              <div className="flex-[2] bg-black/20 border border-white/5 rounded-xl p-6 min-h-[160px] max-h-[300px] overflow-y-auto scrollbar-thin">
                  {thinking ? (
                      <div className="flex flex-col items-center justify-center h-full text-exo-primary/50 space-y-4">
                          <BrainCircuit className="w-12 h-12 animate-pulse" />
                          <p className="font-mono text-xs uppercase tracking-widest">Deep Reasoning Active...</p>
                      </div>
                  ) : strategyResult ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{strategyResult}</ReactMarkdown>
                      </div>
                  ) : (
                      <div className="flex items-center justify-center h-full text-gray-600">
                          <p className="font-mono text-xs uppercase tracking-widest">Awaiting Input Parameters</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Market Intel (2/3) */}
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl relative group animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
            <Globe className="w-40 h-40 text-exo-primary rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
               <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-exo-primary" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Global Market Insights</h3>
               </div>
            </div>
            {loadingTrends ? (
              <div className="space-y-4 max-w-2xl">
                 <div className="h-4 bg-white/5 rounded w-full animate-pulse delay-100"></div>
                 <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse delay-200"></div>
              </div>
            ) : (
              <div className="font-mono text-sm leading-relaxed text-gray-300 h-[220px] overflow-y-auto scrollbar-thin pr-4">
                 <ReactMarkdown>{marketTrends}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="glass-card p-6 rounded-3xl h-full flex flex-col justify-center bg-gradient-to-br from-exo-primary/10 to-transparent border border-exo-primary/20">
              <div className="flex items-center gap-2 mb-4 text-exo-primary">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-widest text-sm">Pro Tip</h3>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                  "Use the <span className="font-bold text-white cursor-pointer hover:underline" onClick={() => onNavigate(AppRoute.PROOF_OF_WORK)}>Proof of Work</span> module to generate a tangible deliverable before your next interview. It increases callback rates by 40%."
              </p>
              <button 
                onClick={() => onNavigate(AppRoute.PROOF_OF_WORK)}
                className="mt-4 w-full py-2 bg-exo-primary/20 hover:bg-exo-primary/30 rounded-lg text-xs font-bold text-white uppercase tracking-widest transition-colors border border-exo-primary/30"
              >
                  Try It Now
              </button>
          </div>
          <QuickTips />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
