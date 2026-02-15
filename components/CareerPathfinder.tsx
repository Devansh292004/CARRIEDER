
import React, { useState, useRef } from 'react';
import { generateCareerRoadmap } from '../services/geminiService';
import { CareerRoadmap } from '../types';
import { parseFile } from '../services/fileService';
import { FileData } from '../types';
import { Map, Upload, ArrowRight, CheckCircle2, Clock, Sparkles, Navigation, Target } from 'lucide-react';

const CareerPathfinder: React.FC = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [desiredRole, setDesiredRole] = useState('');
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const parsed = await parseFile(file);
        setFileData(parsed);
      } catch (err) {
        alert("Error parsing resume.");
      }
    }
  };

  const handleGenerate = async () => {
    if (!fileData || !desiredRole) return;
    setLoading(true);
    setRoadmap(null);
    try {
      const result = await generateCareerRoadmap(fileData, desiredRole);
      setRoadmap(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
      <div className="flex items-center gap-6 mb-8 border-b border-barker-gold/20 pb-6">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel">
          <Map className="w-8 h-8 text-barker-gold" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">Career Roadmap</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            Map out your strategic career trajectory and identify skill gaps for your next role.
          </p>
        </div>
      </div>

      {!roadmap ? (
        <div className="barker-card p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                <div className="space-y-10">
                    <div className="reveal-on-scroll">
                         <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-barker-gold mb-6 flex items-center gap-2">
                             <span className="w-4 h-[1px] bg-barker-gold"></span> Phase 1: Current State
                         </h3>
                         <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed p-10 flex flex-col items-center justify-center cursor-pointer transition-all h-56 rounded-xl group ${
                                fileData 
                                    ? 'border-barker-gold bg-barker-gold/5' 
                                    : 'border-white/10 hover:border-white/30 bg-black/30'
                            }`}
                         >
                            {fileData ? (
                                <div className="text-center animate-fade-in">
                                    <CheckCircle2 className="w-12 h-12 text-barker-gold mb-4 mx-auto" />
                                    <p className="text-white font-bold text-lg">Resume Locked</p>
                                    <p className="text-xs text-green-500 mt-2 font-mono uppercase">Ready for Analysis</p>
                                </div>
                            ) : (
                                <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                    <Upload className="w-10 h-10 text-gray-500 mb-4 mx-auto group-hover:text-white" />
                                    <p className="text-gray-300 font-bold tracking-wide">Upload Dossier</p>
                                    <p className="text-gray-500 text-xs mt-2 uppercase tracking-wider">PDF / DOCX</p>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx" />
                         </div>
                    </div>

                    <div className="reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
                        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-barker-gold mb-6 flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-barker-gold"></span> Phase 2: Career Goal
                        </h3>
                        <div className="relative group">
                            <Target className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-barker-gold transition-colors" />
                            <input 
                                value={desiredRole}
                                onChange={(e) => setDesiredRole(e.target.value)}
                                placeholder="E.g. Senior Machine Learning Engineer at FAANG"
                                className="w-full bg-black/20 border border-white/10 text-white placeholder-gray-500 rounded-xl p-5 pl-14 focus:outline-none focus:border-barker-gold focus:ring-1 focus:ring-barker-gold transition-all font-sans text-sm"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !fileData || !desiredRole}
                        className="btn-barker w-full py-6 flex items-center justify-center gap-3 mt-8 shadow-xl reveal-on-scroll"
                        style={{ transitionDelay: '200ms' }}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                CALCULATING TRAJECTORY...
                            </>
                        ) : (
                            <>
                                <Navigation className="w-4 h-4" />
                                GENERATE STRATEGIC PLAN
                            </>
                        )}
                    </button>
                </div>

                <div className="hidden md:block relative h-full min-h-[500px] border-l border-white/5 pl-16 reveal-on-scroll" style={{ transitionDelay: '300ms' }}>
                     <div className="absolute top-0 bottom-0 left-[-1px] w-[1px] bg-gradient-to-b from-barker-gold/0 via-barker-gold/50 to-barker-gold/0"></div>
                     <div className="flex flex-col justify-between h-full py-10 opacity-50 space-y-12">
                        {[
                            "Analyze Skill Gap",
                            "Identify Niche Projects", 
                            "Curate Certifications", 
                            "Build Timeline",
                            "Launch Execution"
                        ].map((step, i) => (
                            <div key={i} className="flex items-center gap-6">
                                <div className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 font-bold bg-black shadow-lg z-10">
                                    {i + 1}
                                </div>
                                <p className="text-gray-400 uppercase tracking-widest text-xs font-bold">{step}</p>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
      ) : (
          <div className="grid grid-cols-1 gap-12 animate-fade-in">
             {/* Header Stats */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="barker-card p-6 flex flex-col justify-between border-l-4 border-l-blue-500 reveal-on-scroll">
                     <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Current Status</p>
                     <h3 className="text-xl font-bold text-white">{roadmap.currentLevel}</h3>
                 </div>
                 <div className="barker-card p-6 flex flex-col justify-between border-l-4 border-l-barker-gold reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
                     <p className="text-xs font-bold uppercase tracking-widest text-barker-gold mb-2">Target Lock</p>
                     <h3 className="text-xl font-bold text-white">{roadmap.targetLevel}</h3>
                 </div>
                 <div className="barker-card p-6 flex flex-col justify-between border-l-4 border-l-purple-500 reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
                     <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Est. Velocity</p>
                     <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5" /> {roadmap.estimatedVelocity}
                     </h3>
                 </div>
             </div>

             {/* Timeline */}
             <div className="relative pl-8 md:pl-0">
                 {/* Vertical Line */}
                 <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-barker-gold to-transparent -translate-x-1/2 opacity-20"></div>

                 <div className="space-y-12">
                     {roadmap.phases.map((phase, idx) => (
                         <div key={idx} className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                             <div className="flex-1 w-full">
                                 <div className={`barker-card p-8 border-t-4 border-t-barker-gold relative hover:translate-y-[-4px] transition-transform duration-300 ${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'} reveal-on-scroll`}>
                                     <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-barker-gold/5 to-transparent pointer-events-none"></div>
                                     <div className={`flex flex-col gap-2 mb-6 ${idx % 2 === 0 ? 'md:items-start' : 'md:items-end'}`}>
                                        <h3 className="text-xl font-bold text-white">{phase.title}</h3>
                                        <span className="inline-block px-3 py-1 bg-barker-gold/10 text-barker-gold text-[10px] font-bold uppercase tracking-widest rounded border border-barker-gold/20">
                                            {phase.duration}
                                        </span>
                                     </div>
                                     <p className="text-sm text-gray-400 mb-4 italic">Focus: {phase.focus}</p>
                                     <ul className={`space-y-3 ${idx % 2 === 0 ? 'md:items-start' : 'md:items-end flex flex-col'}`}>
                                         {phase.actions.map((action, i) => (
                                             <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                                 <CheckCircle2 className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                                                 {action}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             </div>
                             
                             {/* Node */}
                             <div className="relative z-10 w-16 h-16 rounded-full bg-black border-4 border-barker-gold flex items-center justify-center shadow-[0_0_20px_rgba(229,62,62,0.4)] flex-shrink-0 reveal-on-scroll" style={{ transitionDelay: '150ms' }}>
                                 <span className="text-xl font-bold text-white">{idx + 1}</span>
                             </div>

                             <div className="flex-1 hidden md:block"></div>
                         </div>
                     ))}
                 </div>
             </div>
             
             <div className="flex justify-center mt-8 reveal-on-scroll">
                 <button 
                    onClick={() => setRoadmap(null)} 
                    className="text-gray-500 hover:text-white text-xs uppercase tracking-widest flex items-center gap-2 transition-colors px-6 py-3 border border-white/10 rounded-lg hover:bg-white/5"
                 >
                     <Navigation className="w-4 h-4 rotate-180" /> Reset Roadmap
                 </button>
             </div>
          </div>
      )}
    </div>
  );
};

export default CareerPathfinder;
