
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { generateCareerResonance } from '../services/geminiService';
import { parseFile } from '../services/fileService';
import { ResonanceAnalysis, ResonanceOpportunity, FileData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
    Radar, Upload, FileText, CheckCircle2, Zap, AlertTriangle, 
    ArrowRight, TrendingUp, DollarSign, Clock, Layers, Maximize2, 
    X, Orbit, Database, ChevronRight, Briefcase
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Stars, Float, Line, Trail } from '@react-three/drei';
import * as THREE from 'three';

// Fix for R3F Intrinsic Elements
const Group: any = 'group';
const Mesh: any = 'mesh';
const SphereGeometry: any = 'sphereGeometry';
const MeshStandardMaterial: any = 'meshStandardMaterial';
const PointLight: any = 'pointLight';
const RingGeometry: any = 'ringGeometry';
const MeshBasicMaterial: any = 'meshBasicMaterial';
const AmbientLight: any = 'ambientLight';
const IcosahedronGeometry: any = 'icosahedronGeometry';

// --- 3D COMPONENTS ---

const StarSystem: React.FC<{ 
    opportunities: ResonanceOpportunity[]; 
    onSelect: (opp: ResonanceOpportunity) => void; 
    selectedId: string | null 
}> = ({ opportunities, onSelect, selectedId }) => {
    return (
        <Group>
            {/* Central Sun (You) */}
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <Mesh>
                    <SphereGeometry args={[1.5, 32, 32]} />
                    <MeshStandardMaterial 
                        color="#FFC000" 
                        emissive="#FFC000"
                        emissiveIntensity={2}
                        toneMapped={false}
                    />
                    <PointLight intensity={2} distance={50} decay={2} color="#FFC000" />
                </Mesh>
                <Html position={[0, -2.5, 0]} center>
                    <div className="text-xs font-bold text-barker-gold uppercase tracking-widest bg-black/80 px-2 py-1 rounded border border-barker-gold/30 backdrop-blur-md whitespace-nowrap">
                        Current Profile
                    </div>
                </Html>
            </Float>

            {/* Orbit Rings */}
            {[10, 18, 26, 34].map((radius, i) => (
                <Mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
                    <RingGeometry args={[radius, radius + 0.1, 64]} />
                    <MeshBasicMaterial color="#ffffff" opacity={0.05} transparent side={THREE.DoubleSide} />
                </Mesh>
            ))}

            {/* Planets (Opportunities) */}
            {opportunities.map((opp, i) => {
                const isSelected = selectedId === opp.id;
                // Color coding based on type
                const color = opp.type === 'Lateral' ? '#4ADE80' : // Green
                              opp.type === 'Promotion' ? '#60A5FA' : // Blue
                              opp.type === 'Pivot' ? '#A78BFA' : // Purple
                              opp.type === 'Moonshot' ? '#F87171' : // Red
                              '#FBBF24'; // Wildcard (Yellow)

                return (
                    <Planet 
                        key={opp.id} 
                        position={[opp.coordinates.x, opp.coordinates.y, opp.coordinates.z]}
                        color={color}
                        label={opp.role}
                        subLabel={opp.type}
                        isSelected={isSelected}
                        onClick={() => onSelect(opp)}
                    />
                );
            })}
        </Group>
    );
};

const Planet: React.FC<{ 
    position: [number, number, number]; 
    color: string; 
    label: string; 
    subLabel: string;
    isSelected: boolean;
    onClick: () => void;
}> = ({ position, color, label, subLabel, isSelected, onClick }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
            // Pulse if selected
            if (isSelected) {
                const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
                meshRef.current.scale.set(scale, scale, scale);
            }
        }
    });

    return (
        <Group position={position}>
            {/* Connection Line to Center */}
            <Line 
                points={[[0, 0, 0], [-position[0], -position[1], -position[2]]]} // Relative to group position
                color={color} 
                opacity={isSelected ? 0.3 : hovered ? 0.1 : 0.02} 
                transparent 
                lineWidth={1} 
            />

            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                <Mesh 
                    ref={meshRef}
                    onClick={(e: any) => { e.stopPropagation(); onClick(); }}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                >
                    <SphereGeometry args={[isSelected ? 1.2 : 0.8, 32, 32]} />
                    <MeshStandardMaterial 
                        color={color} 
                        emissive={color}
                        emissiveIntensity={isSelected || hovered ? 0.8 : 0.2}
                        roughness={0.4}
                        metalness={0.6}
                    />
                    {isSelected && <PointLight distance={10} intensity={2} color={color} />}
                </Mesh>
            </Float>

            {/* Label */}
            <Html position={[0, isSelected ? 2 : 1.5, 0]} center style={{ pointerEvents: 'none' }}>
                <div className={`transition-all duration-300 ${isSelected ? 'scale-110 opacity-100' : hovered ? 'scale-105 opacity-100' : 'opacity-60 grayscale'}`}>
                    <div 
                        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-xl text-center min-w-[120px]"
                        style={{ 
                            backgroundColor: isSelected ? `${color}20` : 'rgba(0,0,0,0.8)',
                            borderColor: color,
                            color: isSelected ? '#fff' : color
                        }}
                    >
                        <div className="leading-tight">{label}</div>
                        <div className="text-[8px] opacity-70 mt-0.5">{subLabel}</div>
                    </div>
                </div>
            </Html>
        </Group>
    );
};

// --- MAIN COMPONENT ---

const CareerResonanceEngine: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [step, setStep] = useState<'input' | 'analysis'>('input');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [preferences, setPreferences] = useState('');
  const [analysis, setAnalysis] = useState<ResonanceAnalysis | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<ResonanceOpportunity | null>(null);
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

  const handleAnalysis = async () => {
      if (!fileData && !preferences) return;
      setLoading(true);
      
      try {
          const resumeText = fileData?.text || "User provided context only.";
          const result = await generateCareerResonance(resumeText, preferences);
          setAnalysis(result);
          setStep('analysis');
      } catch (e) {
          alert("Analysis failed. Try again.");
      } finally {
          setLoading(false);
      }
  };

  const getTypeColor = (type: string) => {
      switch(type) {
          case 'Lateral': return 'text-green-400 border-green-500';
          case 'Promotion': return 'text-blue-400 border-blue-500';
          case 'Pivot': return 'text-purple-400 border-purple-500';
          case 'Moonshot': return 'text-red-400 border-red-500';
          case 'Wildcard': return 'text-yellow-400 border-yellow-500';
          default: return 'text-gray-400 border-gray-500';
      }
  };

  return (
    <div className="w-full h-[calc(100vh-100px)] flex flex-col relative overflow-hidden bg-black border border-white/10 rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
            <div className="pointer-events-auto">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-barker-gold/10 border border-barker-gold/30 rounded-lg">
                        <Radar className="w-6 h-6 text-barker-gold animate-pulse-slow" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-display font-bold text-white tracking-tight">Career Discovery</h2>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">
                            Gemini 3.0 Pro • Market Analysis
                        </p>
                    </div>
                </div>
            </div>
            
            {step === 'analysis' && (
                <button 
                    onClick={() => { setStep('input'); setAnalysis(null); setSelectedOpp(null); }}
                    className="pointer-events-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors backdrop-blur-md"
                >
                    New Search
                </button>
            )}
        </div>

        {/* --- INPUT PHASE --- */}
        {step === 'input' && (
            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    
                    {/* Visual Side */}
                    <div className="relative h-[400px] hidden lg:block">
                        <div className="absolute inset-0 bg-barker-gold/5 rounded-full blur-[100px] animate-pulse-slow"></div>
                        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                            <AmbientLight intensity={0.5} />
                            <PointLight position={[10, 10, 10]} />
                            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
                            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                                <Mesh>
                                    <IcosahedronGeometry args={[2, 1]} />
                                    <MeshStandardMaterial color="#FFC000" wireframe />
                                </Mesh>
                            </Float>
                            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                        </Canvas>
                    </div>

                    {/* Form Side */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-display font-bold text-white mb-4">Explore Your Career Path</h1>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Upload your resume to get started. Our AI will analyze your skills and current market trends to identify the best career opportunities for you.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-6 border-2 border-dashed rounded-xl flex items-center gap-4 cursor-pointer transition-all group ${fileData ? 'border-green-500 bg-green-500/5' : 'border-white/10 hover:border-barker-gold/50 bg-black/40'}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${fileData ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
                                    {fileData ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm uppercase tracking-wider ${fileData ? 'text-green-500' : 'text-white'}`}>
                                        {fileData ? 'Resume Loaded' : 'Upload Resume'}
                                    </h4>
                                    <p className="text-xs text-gray-500 font-mono">PDF / DOCX Supported</p>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.txt" />
                            </div>

                            <div className="relative">
                                <textarea 
                                    value={preferences}
                                    onChange={(e) => setPreferences(e.target.value)}
                                    placeholder="Briefly describe your ideal role, salary expectations, or any preferences (e.g., 'Remote only, looking for Series B startups, minimum $150k')..."
                                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-barker-gold outline-none resize-none font-sans leading-relaxed"
                                />
                            </div>

                            <button 
                                onClick={handleAnalysis}
                                disabled={loading || (!fileData && !preferences)}
                                className="btn-barker w-full py-5 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(229,62,62,0.3)] hover:shadow-[0_0_50px_rgba(229,62,62,0.5)] transition-all"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ANALYZING MARKET...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5" /> FIND OPPORTUNITIES
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- ANALYSIS PHASE --- */}
        {step === 'analysis' && analysis && (
            <div className="flex-1 relative">
                {/* 3D SCENE */}
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,#1a1a2e_0%,#000000_100%)]">
                    <Canvas camera={{ position: [0, 20, 25], fov: 45 }}>
                        <AmbientLight intensity={0.2} />
                        <PointLight position={[0, 0, 0]} intensity={2} color="#FFC000" />
                        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
                        
                        <StarSystem 
                            opportunities={analysis.opportunities} 
                            onSelect={setSelectedOpp}
                            selectedId={selectedOpp?.id || null}
                        />
                        
                        <OrbitControls 
                            enablePan={false} 
                            minDistance={10} 
                            maxDistance={50}
                            autoRotate={!selectedOpp}
                            autoRotateSpeed={0.5}
                        />
                    </Canvas>
                </div>

                {/* HUD: Archetype Stats (Top Right) */}
                <div className="absolute top-24 right-6 z-10 w-64 pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md border-l-2 border-barker-gold p-4 rounded-r-lg animate-slide-in-right">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Your Profile</div>
                        <div className="text-xl font-display font-bold text-white leading-none mb-4">{analysis.archetype}</div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">Market Value</span>
                                <span className="text-green-400 font-mono font-bold">{analysis.marketValue}</span>
                            </div>
                            <div className="h-[1px] bg-white/10 my-2"></div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Top Skills</div>
                            <div className="flex flex-wrap gap-1">
                                {analysis.keyStrengths.map((s, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] text-gray-300">{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* HUD: Opportunity Detail (Bottom / Side) */}
                {selectedOpp && (
                    <div className="absolute top-0 right-0 bottom-0 w-full md:w-[480px] bg-black/90 backdrop-blur-xl border-l border-white/10 z-20 flex flex-col animate-slide-in-right overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="p-8 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent relative">
                            <button 
                                onClick={() => setSelectedOpp(null)}
                                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider mb-4 ${getTypeColor(selectedOpp.type)} bg-opacity-10`}>
                                <Orbit className="w-3 h-3" /> {selectedOpp.type}
                            </div>
                            
                            <h2 className="text-3xl font-display font-bold text-white mb-2 leading-tight">{selectedOpp.role}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                                <Briefcase className="w-4 h-4" />
                                <span>{selectedOpp.companyType}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase mb-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Match Score
                                    </div>
                                    <div className="text-2xl font-bold text-white">{selectedOpp.matchScore}%</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase mb-1">
                                        <DollarSign className="w-3 h-3 text-green-500" /> Salary Range
                                    </div>
                                    <div className="text-lg font-bold text-white truncate">{selectedOpp.salaryRange}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase mb-1">
                                        <TrendingUp className="w-3 h-3 text-blue-500" /> Demand
                                    </div>
                                    <div className="text-lg font-bold text-white">{selectedOpp.marketDemand}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase mb-1">
                                        <Clock className="w-3 h-3 text-purple-500" /> Timeline
                                    </div>
                                    <div className="text-lg font-bold text-white">{selectedOpp.timeToRole}</div>
                                </div>
                            </div>

                            {/* Rationale */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Maximize2 className="w-3 h-3" /> Why this fits
                                </h4>
                                <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-white/20 pl-4 italic">
                                    "{selectedOpp.rationale}"
                                </p>
                            </div>

                            {/* Skills Gap Analysis */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Layers className="w-3 h-3" /> Skills Analysis
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedOpp.skillsMatch.map((s, i) => (
                                            <span key={i} className="px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded font-medium">
                                                ✓ {s}
                                            </span>
                                        ))}
                                    </div>
                                    {selectedOpp.skillsGap.length > 0 && (
                                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                                            <div className="text-[10px] text-red-400 font-bold uppercase mb-2">Gaps to Bridge</div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedOpp.skillsGap.map((s, i) => (
                                                    <span key={i} className="px-2 py-1 bg-red-500/10 text-red-300 text-xs rounded border border-red-500/20">
                                                        ⚠ {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Plan */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-barker-gold" /> Recommended Actions
                                </h4>
                                <ul className="space-y-3">
                                    {selectedOpp.actionPlan.map((step, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-gray-300 group">
                                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 group-hover:bg-barker-gold group-hover:text-black transition-colors shrink-0">
                                                {i + 1}
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Footer CTA */}
                        <div className="p-6 border-t border-white/10 bg-black/60">
                            <button className="btn-barker w-full py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg">
                                Save Opportunity <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default CareerResonanceEngine;
