
import React, { useState } from 'react';
import { simulateFutureTimeline } from '../services/geminiService';
import { FutureSimulation, TimeNode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
    Clock, 
    Play, 
    SkipForward, 
    AlertTriangle, 
    TrendingUp, 
    Mail, 
    Slack, 
    Award, 
    Newspaper, 
    Infinity,
    Zap
} from 'lucide-react';

const ChronoLapse: React.FC = () => {
  const { user } = useAuth();
  
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [sim, setSim] = useState<FutureSimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [yearIndex, setYearIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSimulate = async () => {
      if (!targetCompany || !targetRole) return;
      setLoading(true);
      setSim(null);
      setYearIndex(0);
      try {
          const result = await simulateFutureTimeline(targetCompany, targetRole, user?.title || 'Candidate');
          setSim(result);
      } catch (e) {
          alert("Simulation Failed. Please retry.");
      } finally {
          setLoading(false);
      }
  };

  const ArtifactView = ({ node }: { node: TimeNode }) => {
      const typeIcons = {
          email: Mail,
          slack: Slack,
          news: Newspaper,
          award: Award
      };
      const Icon = typeIcons[node.artifact.type] || Mail;

      return (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden backdrop-blur-md animate-fade-in-up">
              
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-barker-gold font-mono text-xs uppercase tracking-widest">
                      <Icon className="w-4 h-4" />
                      {node.artifact.type.toUpperCase()} ITEM
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                      {node.artifact.date}
                  </div>
              </div>

              <div className="font-serif relative">
                  <h4 className="text-lg font-bold text-white mb-2">{node.artifact.title}</h4>
                  {node.artifact.sender && (
                      <p className="text-xs text-gray-400 mb-4 border-l-2 border-gray-600 pl-2">
                          From: <span className="text-gray-200">{node.artifact.sender}</span>
                      </p>
                  )}
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {node.artifact.content}
                  </p>
              </div>
          </div>
      );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-6 mb-4 border-b border-barker-gold/20 pb-6 shrink-0">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel shadow-[0_0_30px_rgba(229,62,62,0.15)]">
          <Infinity className="w-8 h-8 text-barker-gold animate-pulse-slow" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">Career Path Simulator</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            Gemini 3.0 Pro • Long-term Projection
          </p>
        </div>
      </div>

      {!sim && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,62,62,0.1),transparent_70%)]"></div>
              
              <div className="z-10 w-full max-w-md space-y-8 p-8">
                  <div className="text-center space-y-2">
                      <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white">Start Simulation</h3>
                      <p className="text-gray-500 text-xs uppercase tracking-widest">
                          Simulate 5 years of your life based on a key career move.
                      </p>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Target Organization</label>
                          <input 
                            value={targetCompany}
                            onChange={(e) => setTargetCompany(e.target.value)}
                            placeholder="E.g. OpenAI"
                            className="w-full bg-black/60 border border-white/10 text-white p-4 rounded-xl focus:border-barker-gold outline-none"
                          />
                      </div>
                      <div>
                          <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Role Trajectory</label>
                          <input 
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            placeholder="E.g. Product Manager"
                            className="w-full bg-black/60 border border-white/10 text-white p-4 rounded-xl focus:border-barker-gold outline-none"
                          />
                      </div>
                      
                      <button 
                        onClick={handleSimulate}
                        disabled={!targetCompany || !targetRole}
                        className="btn-barker w-full py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,62,62,0.4)] hover:shadow-[0_0_40px_rgba(229,62,62,0.6)]"
                      >
                          <Zap className="w-4 h-4" /> GENERATE SCENARIO
                      </button>
                  </div>
              </div>
          </div>
      )}

      {loading && (
          <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-24 h-24 relative">
                  <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-barker-gold rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-barker-gold animate-pulse">
                      {Math.floor(Math.random() * 2029)}
                  </div>
              </div>
              <p className="mt-8 text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">Calculating Career Trajectory...</p>
              <p className="mt-2 text-blue-500 font-mono text-[10px] uppercase">Processing Variables</p>
          </div>
      )}

      {sim && (
          <div className="flex-1 flex flex-col gap-8 relative">
              {/* Timeline Scrubber */}
              <div className="relative h-24 bg-black/40 border-y border-white/10 flex items-center px-12">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,rgba(255,255,255,0.1)_50%,transparent_51%)] bg-[size:50px_100%]"></div>
                  
                  {/* Nodes */}
                  <div className="relative w-full h-1 bg-white/10 flex items-center justify-between z-10">
                      {sim.timeline.map((node, i) => (
                          <button 
                            key={i}
                            onClick={() => setYearIndex(i)}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 relative group ${i === yearIndex ? 'bg-barker-gold border-white scale-150 shadow-[0_0_15px_#E53E3E]' : i < yearIndex ? 'bg-white border-white' : 'bg-black border-gray-600'}`}
                          >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-gray-400 group-hover:text-white transition-colors">
                                  {new Date().getFullYear() + node.year}
                              </div>
                          </button>
                      ))}
                  </div>
              </div>

              {/* Main Stage */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 px-4 overflow-y-auto">
                  
                  {/* Left: Context & Market */}
                  <div className="space-y-8 flex flex-col justify-center">
                      <div>
                          <div className="flex items-center gap-3 mb-2">
                              <span className="text-6xl font-black text-white/10 select-none">
                                  {new Date().getFullYear() + sim.timeline[yearIndex].year}
                              </span>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                  sim.timeline[yearIndex].sentiment === 'growth' ? 'bg-green-900/20 text-green-400 border-green-500/30' :
                                  sim.timeline[yearIndex].sentiment === 'danger' ? 'bg-red-900/20 text-red-400 border-red-500/30' :
                                  'bg-blue-900/20 text-blue-400 border-blue-500/30'
                              }`}>
                                  {sim.timeline[yearIndex].sentiment} Phase
                              </div>
                          </div>
                          
                          <h3 className="text-3xl font-display font-bold text-white mb-4 leading-tight">
                              {sim.timeline[yearIndex].title}
                          </h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-6 border-l-2 border-white/10 pl-4">
                              {sim.timeline[yearIndex].description}
                          </p>

                          <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                              <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3" /> Global Context
                              </h5>
                              <p className="text-xs text-gray-300 font-mono">
                                  "{sim.timeline[yearIndex].marketContext}"
                              </p>
                          </div>
                      </div>

                      <div className="flex gap-4">
                          <button 
                             onClick={() => setYearIndex(Math.max(0, yearIndex - 1))}
                             disabled={yearIndex === 0}
                             className="p-4 bg-white/5 rounded-full hover:bg-white/10 disabled:opacity-30 border border-white/10 transition-colors"
                          >
                              <SkipForward className="w-6 h-6 rotate-180 text-white" />
                          </button>
                          <button 
                             onClick={() => setYearIndex(Math.min(sim.timeline.length - 1, yearIndex + 1))}
                             disabled={yearIndex === sim.timeline.length - 1}
                             className="flex-1 bg-barker-gold hover:bg-red-600 text-white font-bold text-sm uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-gray-800"
                          >
                              Next Year <Play className="w-4 h-4 fill-current" />
                          </button>
                      </div>
                  </div>

                  {/* Right: The Artifact */}
                  <div className="flex items-center justify-center perspective-[1000px]">
                      <div className="w-full max-w-md transform transition-all duration-700 hover:rotate-y-2 hover:scale-105">
                          <ArtifactView node={sim.timeline[yearIndex]} />
                          
                          {/* Probability Score */}
                          <div className="mt-8 flex justify-center">
                              <div className="bg-black/60 backdrop-blur border border-white/10 px-6 py-2 rounded-full flex items-center gap-3">
                                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Success Probability</div>
                                  <div className="text-xl font-bold text-white">{sim.probabilityScore}%</div>
                              </div>
                          </div>
                      </div>
                  </div>

              </div>
          </div>
      )}
    </div>
  );
};

export default ChronoLapse;
