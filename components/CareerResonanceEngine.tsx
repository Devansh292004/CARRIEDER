
import React, { useState, useEffect, useRef } from 'react';
import { generateCareerResonance } from '../services/geminiService';
import { ResonanceAnalysis, ResonanceOpportunity } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
    Radar, Link as LinkIcon, Database, 
    Hexagon, Zap, Globe, ArrowRight,
    TrendingUp, AlertTriangle, Layers, Maximize2, Pause, Play, RotateCcw,
    MousePointer2, Search, Cpu, X
} from 'lucide-react';

const CareerResonanceEngine: React.FC = () => {
  const { user } = useAuth();
  
  // Input State
  const [urls, setUrls] = useState<string[]>(['']);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<ResonanceAnalysis | null>(null);
  
  // Visualization State
  const [selectedNode, setSelectedNode] = useState<ResonanceOpportunity | null>(null);
  const [timeDilation, setTimeDilation] = useState(0); // 0 to 100 (Years)
  const [rotation, setRotation] = useState({ x: 20, y: 0 }); 
  const [autoRotate, setAutoRotate] = useState(true);
  
  // Refs for physics and interaction
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0.15 });

  // Animation Loop
  useEffect(() => {
      let animationFrameId: number;
      
      const animate = () => {
          if (autoRotate && !isDragging.current && !selectedNode) {
              setRotation(prev => ({
                  x: prev.x,
                  y: (prev.y + rotationVelocity.current.y) % 360
              }));
          }
          animationFrameId = requestAnimationFrame(animate);
      };
      
      animate();
      
      return () => cancelAnimationFrame(animationFrameId);
  }, [autoRotate, selectedNode]);

  const addUrlField = () => setUrls([...urls, '']);
  const updateUrl = (index: number, val: string) => {
      const newUrls = [...urls];
      newUrls[index] = val;
      setUrls(newUrls);
  };

  const handleAnalysis = async () => {
      const validUrls = urls.filter(u => u.trim());
      if (validUrls.length === 0) return;
      
      setIsAnalysing(true);
      setAnalysis(null);
      setSelectedNode(null);
      setTimeDilation(0);
      setRotation({ x: 20, y: 0 });

      try {
          const result = await generateCareerResonance(validUrls, user?.title || 'Professional');
          setAnalysis(result);
      } catch (e) {
          alert("Analysis failed. Please check your inputs.");
      } finally {
          setIsAnalysing(false);
      }
  };

  // --- MOUSE INTERACTION ---
  const handleMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      setRotation(prev => ({
          x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.5)),
          y: prev.y + deltaX * 0.5
      }));
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
      isDragging.current = false;
      if (!selectedNode) setAutoRotate(true);
  };

  // --- RENDER HELPERS ---
  const getOrbitalStyle = (node: ResonanceOpportunity, index: number) => {
      const driftFactor = timeDilation / 20; 
      const expansion = node.trajectory === 'accelerating' ? 1.5 : node.trajectory === 'collapsing' ? 0.5 : 1.0;
      const futureDrift = driftFactor * 40 * (node.trajectory === 'accelerating' ? 1 : -1);

      const spread = 5; 
      const x = node.coordinates.x * spread * (1 + driftFactor * 0.1 * expansion);
      const y = node.coordinates.y * spread * (1 + driftFactor * 0.1 * expansion);
      const z = node.coordinates.z * 2 + futureDrift;
      
      const scale = Math.max(0.4, 1 + (z / 800)); 
      const opacity = Math.max(0.3, Math.min(1, 1 + (z / 400)));
      const fadeOut = node.trajectory === 'collapsing' && timeDilation > 60 ? (100 - timeDilation) / 40 : 1;

      return {
          transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`,
          opacity: opacity * fadeOut,
          zIndex: Math.floor(z + 500)
      };
  };

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col overflow-hidden relative select-none bg-black rounded-3xl border border-white/10 shadow-2xl">
       {/* 0. GLOBAL BACKGROUNDS */}
       <div className="absolute inset-0 bg-black radial-gradient(circle_at_center,rgba(20,20,35,1),#000) z-0 pointer-events-none"></div>
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0"></div>
       
       {/* 1. HEADER (Z-50) */}
       <div className="relative z-50 flex justify-between items-end p-6 border-b border-white/10 bg-black/80 backdrop-blur-xl">
           <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-barker-gold shadow-[0_0_10px_#E53E3E]"></div>
           <div>
               <h2 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
                   <Radar className="w-8 h-8 text-barker-gold animate-pulse-slow" />
                   Opportunity Discovery
               </h2>
               <p className="text-xs font-mono text-gray-500 uppercase tracking-[0.3em] mt-1 pl-11">
                   Gemini 3.0 • Opportunity Analysis
               </p>
           </div>
           
           {analysis && (
               <div className="flex items-center gap-8 animate-fade-in">
                   <div className="text-right">
                       <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Professional Archetype</p>
                       <p className="text-xl font-bold text-white tracking-widest leading-none">
                           {analysis.coreIdentity}
                       </p>
                   </div>
                   <div className="h-8 w-[1px] bg-white/10"></div>
                   <div className="text-right">
                       <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Market Volatility</p>
                       <p className={`text-xl font-bold font-mono leading-none ${analysis.marketEntropy > 0.7 ? 'text-red-500' : 'text-green-500'}`}>
                           {(analysis.marketEntropy * 100).toFixed(0)}%
                       </p>
                   </div>
               </div>
           )}
       </div>

       {/* 2. MAIN VIEWPORT */}
       <div className="flex-1 relative overflow-hidden">
           
           {/* LAYER A: 3D SCENE (Z-0) - ALWAYS ACTIVE */}
           <div 
              ref={containerRef}
              className="absolute inset-0 perspective-[2000px] overflow-hidden cursor-move group z-0"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
           >
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,62,62,0.05),transparent_60%)] pointer-events-none"></div>
               
               <div 
                  className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-linear"
                  style={{
                      transformStyle: 'preserve-3d',
                      transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
                  }}
               >
                   {/* Deep Space Grid in 3D context */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300vw] h-[300vw] bg-[radial-gradient(white_1px,transparent_1px)] [background-size:100px_100px] opacity-[0.05] transform rotate-x-90 pointer-events-none"></div>

                   {/* Central Core */}
                   <div className="absolute w-24 h-24 rounded-full bg-white/5 shadow-[0_0_80px_rgba(255,255,255,0.4)] z-20 flex items-center justify-center backdrop-blur-md border border-white/20">
                       <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center relative overflow-hidden border border-white/10">
                           <div className="absolute inset-0 bg-gradient-to-tr from-barker-gold via-transparent to-blue-600 opacity-60 animate-[spin_8s_linear_infinite]"></div>
                           <div className="relative z-10 font-bold text-[10px] text-white uppercase tracking-widest">YOU</div>
                       </div>
                   </div>
                   
                   {/* Decorative Rings */}
                   <div className="absolute w-[50vmin] h-[50vmin] rounded-full border border-white/5 transform rotate-x-90 pointer-events-none"></div>
                   <div className="absolute w-[80vmin] h-[80vmin] rounded-full border border-white/5 transform rotate-x-90 pointer-events-none border-dashed opacity-30"></div>
                   
                   {/* Data Nodes */}
                   {analysis?.opportunities.map((node, i) => (
                       <div
                          key={node.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedNode(node); setAutoRotate(false); }}
                          className="absolute w-0 h-0 flex items-center justify-center cursor-pointer transition-all duration-1000 ease-out group/node"
                          style={getOrbitalStyle(node, i)}
                       >
                           <div className={`relative w-6 h-6 rounded-full transition-all duration-300 transform group-hover/node:scale-150 ${selectedNode?.id === node.id ? 'bg-barker-gold shadow-[0_0_30px_#E53E3E]' : 'bg-gray-800 border border-white/30 hover:bg-white'}`}>
                               <div className={`absolute top-1/2 left-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent to-white/30 origin-left transform rotate-[180deg] pointer-events-none ${selectedNode?.id === node.id ? 'opacity-100' : 'opacity-0'}`}></div>
                               <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 text-center opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none z-50">
                                   <span className="text-[9px] text-white bg-black/90 px-2 py-1 rounded border border-white/20 whitespace-nowrap font-bold uppercase tracking-wider">
                                       {node.role}
                                   </span>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>

           {/* LAYER B: INPUT MODAL (Z-50) - Active when NO Analysis */}
           {!analysis && (
               <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                   <div className="w-full max-w-2xl bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-fade-in-up relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-barker-gold to-transparent opacity-50"></div>
                       
                       <div className="text-center mb-8">
                           <div className="w-20 h-20 mx-auto mb-6 bg-barker-gold/10 rounded-full flex items-center justify-center border border-barker-gold/30 shadow-[0_0_30px_rgba(229,62,62,0.15)]">
                               <Database className="w-8 h-8 text-barker-gold" />
                           </div>
                           <h3 className="text-3xl font-display font-bold text-white mb-2">Profile Analysis</h3>
                           <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                               Initialize the engine by providing your digital profiles. We analyze patterns to find roles you may not have considered.
                           </p>
                       </div>

                       <div className="space-y-4 mb-8">
                           {urls.map((url, i) => (
                               <div key={i} className="flex gap-2">
                                   <div className="flex-1 relative group">
                                       <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-barker-gold transition-colors" />
                                       <input 
                                          value={url}
                                          onChange={(e) => updateUrl(i, e.target.value)}
                                          placeholder="https://linkedin.com/in/..."
                                          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-sm text-white focus:border-barker-gold outline-none transition-all placeholder-gray-700 font-mono"
                                       />
                                   </div>
                                   {i === urls.length - 1 && (
                                       <button onClick={addUrlField} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/5">
                                           +
                                       </button>
                                   )}
                               </div>
                           ))}
                       </div>

                       <button 
                          onClick={handleAnalysis}
                          disabled={isAnalysing || !urls[0]}
                          className="btn-barker w-full py-5 text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(229,62,62,0.3)] hover:shadow-[0_0_50px_rgba(229,62,62,0.5)] transition-all"
                       >
                           {isAnalysing ? (
                               <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ANALYZING DATA...
                               </>
                           ) : (
                               <>
                                  <Zap className="w-4 h-4" /> START ANALYSIS
                               </>
                           )}
                       </button>
                   </div>
               </div>
           )}

           {/* LAYER C: SIDEBAR (Z-40) - Active when Analysis Exists */}
           {analysis && (
               <div className="absolute left-0 top-0 bottom-0 w-80 bg-black/90 border-r border-white/10 z-40 flex flex-col backdrop-blur-xl animate-slide-in-left">
                   <div className="p-6 border-b border-white/10">
                       <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                           <Layers className="w-4 h-4 text-barker-gold" /> Matched Roles
                       </h3>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                       {analysis.opportunities.map((node) => (
                           <div 
                              key={node.id}
                              onClick={() => { setSelectedNode(node); setAutoRotate(false); }}
                              className={`p-4 rounded-lg border cursor-pointer transition-all group relative overflow-hidden ${selectedNode?.id === node.id ? 'bg-barker-gold/10 border-barker-gold' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                           >
                               <div className="flex justify-between items-start mb-1">
                                   <span className="text-xs font-bold text-white group-hover:text-barker-gold transition-colors truncate w-3/4">{node.role}</span>
                                   <span className="text-[9px] font-mono text-gray-500">{node.resonanceScore}%</span>
                               </div>
                               <p className="text-[10px] text-gray-500 truncate">{node.industry}</p>
                           </div>
                       ))}
                   </div>
                   <div className="p-4 border-t border-white/10">
                       <button onClick={() => { setAnalysis(null); setSelectedNode(null); }} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                           Reset Analysis
                       </button>
                   </div>
               </div>
           )}

           {/* LAYER D: DETAIL PANEL (Z-50) - Active when Selected */}
           {selectedNode && (
               <div className="absolute right-0 top-0 bottom-0 w-96 bg-black/95 border-l border-white/10 z-50 overflow-y-auto backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col animate-slide-in-right">
                   <div className="p-8 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent flex justify-between items-start">
                       <div>
                           <div className="flex items-center gap-2 mb-4 text-barker-gold">
                               <Hexagon className="w-5 h-5" />
                               <h3 className="text-xs font-bold uppercase tracking-widest">Opportunity Detail</h3>
                           </div>
                           <h2 className="text-2xl font-display font-bold text-white mb-2 leading-tight">{selectedNode.role}</h2>
                           <p className="text-xs text-gray-400 font-mono uppercase tracking-wide">{selectedNode.industry}</p>
                       </div>
                       <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white transition-colors">
                           <X className="w-5 h-5" />
                       </button>
                   </div>

                   <div className="flex-1 p-8 space-y-8">
                       <div className="space-y-4">
                           <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                               <Maximize2 className="w-3 h-3" /> Fit Analysis
                           </h4>
                           <p className="text-sm text-gray-300 leading-relaxed font-sans border-l-2 border-white/20 pl-4">
                               {selectedNode.hiddenPotential}
                           </p>
                       </div>

                       <div>
                           <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <Layers className="w-3 h-3" /> Required Skills
                           </h4>
                           <div className="space-y-2">
                               {selectedNode.skills.map((skill, i) => (
                                   <div key={i} className="flex items-center justify-between text-xs bg-white/5 p-3 rounded border border-white/5 hover:bg-white/10 transition-colors">
                                       <span className="text-gray-200 font-medium">{skill.name}</span>
                                       <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                                           skill.category === 'harmonic' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                           skill.category === 'emergent' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                           'border-red-500/30 text-red-400 bg-red-500/10'
                                       }`}>
                                           {skill.category}
                                       </span>
                                   </div>
                               ))}
                           </div>
                       </div>

                       <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                           <div className="flex items-center justify-between mb-3">
                               <span className="text-[10px] font-bold uppercase text-gray-500">Market Trajectory</span>
                               <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${
                                   selectedNode.trajectory === 'accelerating' ? 'text-green-500' : 
                                   selectedNode.trajectory === 'collapsing' ? 'text-red-500' : 'text-blue-500'
                               }`}>
                                   {selectedNode.trajectory === 'accelerating' ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                   {selectedNode.trajectory}
                               </span>
                           </div>
                           <p className="text-[10px] text-gray-400 leading-tight">
                               {selectedNode.trajectory === 'accelerating' ? 'High growth potential detected. Demand outpacing supply.' : 'Market saturation imminent. Pivot recommended.'}
                           </p>
                       </div>
                   </div>

                   <div className="p-8 border-t border-white/10 bg-black/80">
                       <button className="w-full btn-barker py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-barker-gold/40 transition-all transform hover:-translate-y-1">
                           TRACK THIS OPPORTUNITY <ArrowRight className="w-4 h-4" />
                       </button>
                   </div>
               </div>
           )}

           {/* CONTROLS (Z-30) - Active when Analysis Exists */}
           {analysis && (
               <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-3/4 max-w-xl z-30">
                   <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
                       <div className="flex justify-between items-end">
                           <label className="text-[10px] font-bold uppercase text-barker-gold tracking-[0.2em] flex items-center gap-2">
                               <TrendingUp className="w-3 h-3" /> Future Projection
                           </label>
                           <span className="text-xl font-mono font-bold text-white">
                               +{Math.floor(timeDilation / 20)} <span className="text-xs text-gray-500">YEARS</span>
                           </span>
                       </div>
                       
                       <div className="relative h-6 flex items-center">
                           <div className="absolute inset-0 bg-white/10 rounded-full h-1 my-auto"></div>
                           <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={timeDilation} 
                              onChange={(e) => setTimeDilation(parseInt(e.target.value))}
                              className="w-full h-6 opacity-0 cursor-pointer absolute z-20"
                           />
                           <div 
                              className="absolute h-4 w-4 bg-barker-gold rounded-full shadow-[0_0_15px_#E53E3E] pointer-events-none z-10 transition-all duration-75"
                              style={{ left: `${timeDilation}%` }}
                           ></div>
                       </div>
                       
                       <div className="flex justify-between text-[9px] font-mono text-gray-500 uppercase">
                           <span>Present Day</span>
                           <span>+2.5 Yrs</span>
                           <span>+5.0 Yrs</span>
                       </div>
                   </div>
                   
                   <div className="absolute bottom-full right-0 mb-4 flex gap-2">
                       <button 
                          onClick={() => setRotation({ x: 20, y: 0 })}
                          className="p-3 bg-black/60 rounded-full border border-white/10 hover:bg-white/10 text-white transition-colors backdrop-blur-md"
                          title="Reset View"
                       >
                           <RotateCcw className="w-4 h-4" />
                       </button>
                       <button 
                          onClick={() => setAutoRotate(!autoRotate)}
                          className="p-3 bg-black/60 rounded-full border border-white/10 hover:bg-white/10 text-white transition-colors backdrop-blur-md"
                          title={autoRotate ? "Pause Rotation" : "Resume Rotation"}
                       >
                           {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                       </button>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};

export default CareerResonanceEngine;
