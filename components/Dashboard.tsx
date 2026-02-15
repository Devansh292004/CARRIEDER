
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppRoute, JobOpportunity } from '../types';
import QuickTips from './QuickTips';
import { getMarketInsights, findLatestOpportunities, generateDeepCareerStrategy } from '../services/geminiService';
import { Activity, TrendingUp, Award, ArrowRight, Radar, Radio, ExternalLink, MapPin, Briefcase, AlertTriangle, RefreshCw, Cpu, Globe, Crosshair, Terminal, MessageSquare, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  onNavigate: (route: AppRoute) => void;
  isVisible: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, isVisible }) => {
  const { user } = useAuth();
  const [marketTrends, setMarketTrends] = useState<string>('');
  const [loadingTrends, setLoadingTrends] = useState(true);
  
  // Real-time radar state
  const [liveJobs, setLiveJobs] = useState<JobOpportunity[]>([]);
  const [scanning, setScanning] = useState(false);
  const [location, setLocation] = useState('Remote');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
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
          const role = user?.title === 'Candidate' || !user?.title ? 'Software Engineering' : user.title;
          const opportunities = await findLatestOpportunities(role, location);
          
          if (opportunities.length > 0) {
            setLiveJobs(opportunities);
          } else {
             setRadarError("NO JOBS FOUND IN THIS SECTOR");
          }
      } catch (e: any) {
          console.error("Radar failed", e);
          setRadarError("SCAN FAILED - PLEASE RETRY");
      } finally {
          setScanning(false);
      }
  }, [user, location]);

  const toggleLocationEdit = () => {
      if (isEditingLocation) {
          setLiveJobs([]); 
          setRadarError(null); 
          handleScan();
      }
      setIsEditingLocation(!isEditingLocation);
  };

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

  return (
    <div className="space-y-6 lg:space-y-8 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-barker-gold/20 pb-6 mb-8 gap-4 relative">
        <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-barker-gold shadow-[0_0_10px_#E53E3E]"></div>
        <div>
          <div className="flex items-center gap-2 text-barker-gold mb-1">
              <Cpu className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Ready</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-2 tracking-tighter">
             Dashboard
          </h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-2">
            Overview of your job search progress and market insights.
          </p>
          <p className="text-gray-400 text-[10px] flex items-center gap-2 font-mono uppercase tracking-widest">
            USER: <span className="text-white font-bold">{user?.name?.toUpperCase()}</span> 
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>
            ID: {user?.id.substring(0,6)}
          </p>
        </div>
        <div className="text-right hidden md:block">
           <div className="flex items-center gap-2 justify-end text-barker-gold text-xs font-bold uppercase tracking-wider mb-1">
              {scanning ? (
                  <div className="flex gap-1">
                      <span className="w-1 h-3 bg-barker-gold animate-pulse"></span>
                      <span className="w-1 h-3 bg-barker-gold animate-pulse delay-75"></span>
                      <span className="w-1 h-3 bg-barker-gold animate-pulse delay-150"></span>
                  </div>
              ) : (
                  <div className={`w-2 h-2 rounded-full ${radarError ? 'bg-red-900' : 'bg-green-500 shadow-[0_0_5px_#22c55e]'}`}></div>
              )}
              {radarError ? 'SYSTEM ALERT' : scanning ? 'SCANNING...' : 'ONLINE'}
           </div>
           <p className="text-[10px] text-gray-500 font-mono tracking-widest">SECURE CONNECTION</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        
        {/* ATS Score Card */}
        <div 
           onClick={() => onNavigate(AppRoute.RESUME_FORGE)}
           className="barker-card p-6 flex flex-col items-center justify-center cursor-pointer group hover:border-barker-gold/60 relative min-h-[320px] bg-black/40 backdrop-blur-md overflow-hidden animate-fade-in-up"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(229,62,62,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(229,62,62,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          
          <div className="relative z-10 w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-white/5 shadow-[0_0_30px_rgba(229,62,62,0.1)]"></div>
              <svg className="w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r={scoreRadius} stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" />
                  <circle cx="50%" cy="50%" r={scoreRadius} stroke="#E53E3E" strokeWidth="8" fill="transparent" strokeDasharray={scoreCircumference} strokeDashoffset={scoreOffset} strokeLinecap="round" className="transition-all duration-1000 ease-out shadow-[0_0_10px_#E53E3E]" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-white tracking-tighter">{atsScore}</span>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Match Score</span>
              </div>
          </div>

          <div className="relative z-10 mt-6 text-center">
              <div className="text-xs font-bold text-barker-gold uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-2">
                  <Award className="w-4 h-4" /> Optimization Level
              </div>
              <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto leading-relaxed">
                  Analyze your resume against job descriptions to increase interview probability.
              </p>
          </div>
        </div>

        {/* Live Opportunity Radar */}
        <div className="md:col-span-2 barker-card p-0 relative flex flex-col group border-white/10 h-full min-h-[320px] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-black/60 border-b border-white/10 p-4 flex flex-wrap justify-between items-center z-20">
              <div className="flex items-center gap-4">
                 <div className={`p-2.5 rounded-lg border border-barker-gold/30 bg-barker-gold/5 ${scanning ? 'animate-pulse' : ''}`}>
                    <Radar className={`w-5 h-5 text-barker-gold ${scanning ? 'animate-spin' : ''}`} />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Job Radar</h3>
                    <p className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                        TARGET: <span className="text-barker-gold">{location.toUpperCase()}</span>
                    </p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded border border-white/10 hover:border-barker-gold/50 transition-colors group/loc">
                      <Crosshair className="w-3 h-3 text-gray-500 group-hover/loc:text-barker-gold" />
                      {isEditingLocation ? (
                          <input 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onBlur={toggleLocationEdit}
                            onKeyDown={(e) => e.key === 'Enter' && toggleLocationEdit()}
                            className="bg-transparent border-none outline-none text-xs text-white w-24 focus:ring-0 placeholder-gray-600 font-mono uppercase"
                            placeholder="CITY"
                            autoFocus
                          />
                      ) : (
                          <span onClick={toggleLocationEdit} className="text-xs text-gray-400 cursor-pointer hover:text-white font-mono uppercase tracking-wider">{location}</span>
                      )}
                  </div>
                  <button onClick={handleScan} disabled={scanning} className="p-2 bg-white/5 hover:bg-barker-gold/20 rounded-lg transition-colors text-gray-400 hover:text-barker-gold border border-transparent hover:border-barker-gold/30">
                    <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                  </button>
              </div>
           </div>
           
           <div className="flex-1 p-0 relative overflow-hidden bg-black/40">
              {scanning && (
                  <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-b from-transparent via-barker-gold/10 to-transparent animate-[scan_2s_linear_infinite] h-[20%] w-full"></div>
              )}
              <div className="absolute inset-0 overflow-y-auto scrollbar-thin p-4 space-y-2">
                  {radarError ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 animate-fade-in">
                        <p className="text-xs font-bold text-red-500 tracking-[0.2em] uppercase mb-4">{radarError}</p>
                        <button onClick={handleScan} className="px-6 py-2 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 transition-colors rounded">RETRY SCAN</button>
                      </div>
                  ) : liveJobs.length === 0 && !scanning ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60">
                        <Activity className="w-16 h-16 mb-4 text-gray-700" />
                        <p className="text-xs font-mono uppercase tracking-widest">Ready to Scan</p>
                    </div>
                  ) : (
                    liveJobs.map((job, idx) => (
                      <div key={job.id} className="group/item bg-black/40 border border-white/5 p-3 hover:border-barker-gold/40 hover:bg-barker-gold/5 transition-all flex items-center justify-between rounded relative overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-800 group-hover/item:bg-barker-gold transition-colors"></div>
                          <div className="flex items-center gap-4 pl-2 overflow-hidden">
                            <div className="p-2 bg-white/5 rounded border border-white/5 group-hover/item:border-barker-gold/20 transition-colors">
                                <Briefcase className="w-3 h-3 text-gray-400 group-hover/item:text-barker-gold" />
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="text-sm font-bold text-gray-200 truncate group-hover/item:text-white transition-colors font-sans">{job.title}</h4>
                                <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider font-mono">
                                    {job.company} <span className="text-gray-700 mx-1">::</span> {job.timestamp}
                                </p>
                            </div>
                          </div>
                          <a href={job.url} target="_blank" rel="noreferrer" className="p-2 text-gray-600 hover:text-white hover:bg-white/10 rounded transition-all">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                      </div>
                    ))
                  )}
              </div>
           </div>
        </div>
      </div>

      {/* Deep Strategy Node */}
      <div className="barker-card p-8 border-l-4 border-l-blue-600 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-6">
              <BrainCircuit className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Strategic Career Advisor</h3>
              <span className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-1 rounded">GEMINI 3 PRO THINKING</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                  <textarea 
                    value={strategyQuery}
                    onChange={(e) => setStrategyQuery(e.target.value)}
                    placeholder="Describe a complex career dilemma (e.g., 'Should I switch from PM to Engineering in this economy?')"
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500 outline-none resize-none mb-4"
                  />
                  <button 
                    onClick={handleDeepStrategy}
                    disabled={thinking || !strategyQuery}
                    className="btn-barker w-full py-3 bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2"
                  >
                      {thinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                      ASK ADVISOR
                  </button>
              </div>
              <div className="flex-[2] bg-black/20 border border-white/5 rounded-xl p-6 min-h-[160px] max-h-[300px] overflow-y-auto scrollbar-thin">
                  {thinking ? (
                      <div className="flex flex-col items-center justify-center h-full text-blue-400/50 space-y-4">
                          <BrainCircuit className="w-12 h-12 animate-pulse" />
                          <p className="font-mono text-xs uppercase tracking-widest">Reasoning in progress...</p>
                      </div>
                  ) : strategyResult ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{strategyResult}</ReactMarkdown>
                      </div>
                  ) : (
                      <div className="flex items-center justify-center h-full text-gray-600">
                          <p className="font-mono text-xs uppercase tracking-widest">Awaiting Input</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Market Intel (2/3) */}
        <div className="lg:col-span-2 barker-card p-8 relative group border-t-2 border-t-barker-gold animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
            <Globe className="w-40 h-40 text-barker-gold rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
               <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-barker-gold" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Market Insights</h3>
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
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <QuickTips />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
