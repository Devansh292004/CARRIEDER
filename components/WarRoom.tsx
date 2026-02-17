
import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { solveCaseStudy } from '../services/geminiService';
import { WarRoomAnalysis } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
    Hexagon, Zap, Command, Layers, 
    Share2, Download, Maximize2, AlertTriangle, 
    CheckCircle2, Box, Cpu, Code, Eye, RefreshCw, ZoomIn, ZoomOut, Terminal
} from 'lucide-react';

const TerminalLoader = () => {
    const [lines, setLines] = useState<string[]>([]);
    const logs = [
        "INITIALIZING STRATEGIC CORE...",
        "ANALYZING PROBLEM CONSTRAINTS...",
        "QUERYING ARCHITECTURAL PATTERNS...",
        "SYNTHESIZING SYSTEM DESIGN...",
        "OPTIMIZING FOR SCALABILITY...",
        "GENERATING VISUAL SCHEMATICS...",
        "RENDERING MERMAID.JS OUTPUT..."
    ];

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < logs.length) {
                setLines(prev => [...prev, logs[currentIndex]]);
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center font-mono text-xs z-50 p-8">
            <div className="w-full max-w-md border border-barker-gold/30 bg-black/50 p-6 rounded-lg shadow-[0_0_50px_rgba(229,62,62,0.1)]">
                <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                    <Terminal className="w-4 h-4 text-barker-gold animate-pulse" />
                    <span className="text-gray-400">TACTICAL LOG</span>
                </div>
                <div className="space-y-2 h-40 overflow-hidden relative">
                    {lines.map((line, i) => (
                        <div key={i} className="text-green-500 animate-fade-in flex items-center gap-2">
                            <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                            {line}
                        </div>
                    ))}
                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black to-transparent"></div>
                </div>
                <div className="mt-4 h-1 bg-gray-800 rounded overflow-hidden">
                    <div className="h-full bg-barker-gold animate-[loading_2s_ease-in-out_infinite] w-full"></div>
                </div>
            </div>
        </div>
    );
};

const WarRoom: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [problem, setProblem] = useState('');
  const [analysis, setAnalysis] = useState<WarRoomAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [zoom, setZoom] = useState(1);
  const [rawCode, setRawCode] = useState('');
  
  // Refs
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      mermaid.initialize({ 
          startOnLoad: false, // Important: manual render
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'Inter',
          themeVariables: {
              darkMode: true,
              primaryColor: '#E53E3E',
              lineColor: '#555',
              mainBkg: '#0F0F0F',
              nodeBorder: '#E53E3E',
              textColor: '#fff'
          }
      });
  }, []);

  const renderDiagram = async (code: string) => {
      if (!diagramRef.current) return;
      
      try {
          // Reset
          diagramRef.current.innerHTML = '';
          const id = `mermaid-${Date.now()}`;
          
          // Attempt render
          const { svg } = await mermaid.render(id, code);
          if (diagramRef.current) {
              diagramRef.current.innerHTML = svg;
              setError('');
          }
      } catch (e) {
          console.error("Mermaid Render Error", e);
          setError("Visual syntax error. Switch to Code View to debug.");
          // Fallback to error UI handled in JSX
      }
  };

  useEffect(() => {
      if (analysis) {
          setRawCode(analysis.diagramCode);
          if (viewMode === 'visual') {
              renderDiagram(analysis.diagramCode);
          }
      }
  }, [analysis, viewMode]);

  const handleSolve = async () => {
      if (!problem.trim()) return;
      setLoading(true);
      setError('');
      setAnalysis(null);
      setZoom(1);
      
      try {
          const result = await solveCaseStudy(problem, user?.title || 'Architect');
          setAnalysis(result);
          // Auto-fix common model errors in mermaid code
          const cleanCode = result.diagramCode.replace(/```mermaid/g, '').replace(/```/g, '').trim();
          setRawCode(cleanCode);
          setViewMode('visual');
      } catch (e: any) {
          setError(e.message || "Strategic uplinking failed.");
      } finally {
          setLoading(false);
      }
  };

  const handleManualCodeUpdate = () => {
      if (analysis) {
          setAnalysis({ ...analysis, diagramCode: rawCode });
          setViewMode('visual');
      }
  };

  const handleDownload = () => {
      if (!diagramRef.current) return;
      const svgData = diagramRef.current.innerHTML;
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `war_room_schematic_${Date.now()}.svg`;
      link.click();
  };

  return (
    <div className="max-w-[1800px] mx-auto space-y-6 lg:space-y-8 pb-12 h-[calc(100vh-100px)] flex flex-col">
       {/* Header */}
       <div className="flex items-center gap-6 mb-4 border-b border-barker-gold/20 pb-6 shrink-0">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel shadow-[0_0_30px_rgba(229,62,62,0.15)] relative overflow-hidden">
           <div className="absolute inset-0 bg-barker-gold/10 animate-pulse-slow"></div>
           <Hexagon className="w-8 h-8 text-barker-gold relative z-10" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">The War Room</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            Visual Case Study Architect & System Design Solver.
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
          
          {/* LEFT: Command Console */}
          <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="barker-card p-6 flex flex-col h-full border-l-4 border-l-barker-gold bg-black/40">
                  <div className="flex items-center gap-2 mb-6 text-barker-gold">
                      <Command className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Mission Parameters</h3>
                  </div>

                  <div className="flex-1 space-y-4">
                      <textarea 
                          value={problem}
                          onChange={(e) => setProblem(e.target.value)}
                          placeholder="E.g. Design a scalable notification system for 50M users. Focus on latency and reliability."
                          className="w-full h-48 bg-black/60 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-barker-gold outline-none resize-none font-mono leading-relaxed placeholder-gray-600"
                      />
                      
                      <div className="bg-white/5 p-4 rounded-lg border border-white/5 text-[10px] text-gray-400 font-mono">
                          <p className="mb-2 uppercase font-bold text-gray-500">Supported Directives:</p>
                          <ul className="list-disc pl-4 space-y-1">
                              <li>System Architecture (Graph)</li>
                              <li>API Sequence Flows</li>
                              <li>Product Gantt Charts</li>
                              <li>User Journey Maps</li>
                          </ul>
                      </div>
                  </div>

                  <button 
                      onClick={handleSolve}
                      disabled={loading || !problem}
                      className="btn-barker w-full py-5 mt-6 flex items-center justify-center gap-2 shadow-xl hover:shadow-barker-gold/30 transition-all"
                  >
                      <Zap className="w-4 h-4" /> GENERATE SCHEMATIC
                  </button>
              </div>
          </div>

          {/* RIGHT: Visualization Deck */}
          <div className="lg:col-span-8 flex flex-col min-h-0 relative">
              {loading && <TerminalLoader />}
              
              {analysis ? (
                  <div className="barker-card p-0 flex flex-col h-full overflow-hidden bg-[#0F0F0F] relative border border-white/10">
                      {/* Toolbar */}
                      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md z-10">
                          <div className="flex items-center gap-4">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-blue-500" />
                                  {analysis.diagramType}
                              </span>
                              
                              <div className="h-4 w-[1px] bg-white/10"></div>
                              
                              <div className="flex bg-black/50 rounded p-0.5 border border-white/10">
                                  <button 
                                    onClick={() => setViewMode('visual')}
                                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded flex items-center gap-1 ${viewMode === 'visual' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                                  >
                                      <Eye className="w-3 h-3" /> Visual
                                  </button>
                                  <button 
                                    onClick={() => setViewMode('code')}
                                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded flex items-center gap-1 ${viewMode === 'code' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                                  >
                                      <Code className="w-3 h-3" /> Code
                                  </button>
                              </div>
                          </div>
                          
                          <div className="flex gap-2">
                              {viewMode === 'visual' && (
                                  <>
                                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs text-gray-500 self-center font-mono w-8 text-center">{Math.round(zoom * 100)}%</span>
                                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <div className="h-4 w-[1px] bg-white/10 self-center mx-1"></div>
                                  </>
                              )}
                              <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors" title="Export SVG">
                                  <Download className="w-4 h-4" />
                              </button>
                          </div>
                      </div>

                      {/* Main Workspace */}
                      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
                          
                          {/* VIEW: VISUAL */}
                          {viewMode === 'visual' && (
                              <div className="flex-1 overflow-hidden relative bg-[#0a0a0a]">
                                  <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px]"></div>
                                  
                                  {error ? (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-8 text-center">
                                          <AlertTriangle className="w-12 h-12 mb-4" />
                                          <h3 className="font-bold mb-2">Rendering Failed</h3>
                                          <p className="text-sm text-gray-500 mb-4">{error}</p>
                                          <button onClick={() => setViewMode('code')} className="px-4 py-2 bg-white/10 rounded text-xs uppercase font-bold text-white hover:bg-white/20">
                                              Open Code Editor to Fix
                                          </button>
                                      </div>
                                  ) : (
                                      <div 
                                        className="w-full h-full overflow-auto flex items-center justify-center p-8 transition-transform duration-200"
                                        
                                      >
                                          <div 
                                            ref={diagramRef} 
                                            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                                            className="mermaid-output"
                                          ></div>
                                      </div>
                                  )}
                              </div>
                          )}

                          {/* VIEW: CODE */}
                          {viewMode === 'code' && (
                              <div className="flex-1 flex flex-col bg-[#0a0a0a]">
                                  <div className="bg-black border-b border-white/10 px-4 py-2 text-[10px] text-gray-500 font-mono flex justify-between items-center">
                                      <span>MERMAID.JS EDITOR</span>
                                      <button onClick={handleManualCodeUpdate} className="text-barker-gold hover:text-white font-bold flex items-center gap-1">
                                          <RefreshCw className="w-3 h-3" /> RENDER CHANGES
                                      </button>
                                  </div>
                                  <textarea 
                                      value={rawCode}
                                      onChange={(e) => setRawCode(e.target.value)}
                                      className="flex-1 w-full bg-[#0a0a0a] text-gray-300 font-mono text-sm p-4 outline-none resize-none"
                                      spellCheck={false}
                                  />
                              </div>
                          )}

                          {/* Analysis Sidebar */}
                          <div className="w-full md:w-80 border-l border-white/10 bg-black/40 backdrop-blur-sm overflow-y-auto p-6 border-t md:border-t-0 shrink-0">
                              <h4 className="text-xs font-bold text-barker-gold uppercase tracking-widest mb-4">Strategic Breakdown</h4>
                              
                              <p className="text-sm text-gray-300 mb-6 leading-relaxed border-l-2 border-white/10 pl-3">
                                  {analysis.summary}
                              </p>

                              <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Key Considerations</h5>
                              <ul className="space-y-3">
                                  {analysis.keyConsiderations.map((item, i) => (
                                      <li key={i} className="flex gap-3 text-xs text-gray-400">
                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                          {item}
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="barker-card h-full flex flex-col items-center justify-center text-gray-600 opacity-50 border-2 border-dashed border-white/5 relative overflow-hidden bg-black/20">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_5s_infinite]"></div>
                      <Cpu className="w-24 h-24 mb-6 text-gray-700" />
                      <h3 className="text-xl font-display font-bold text-gray-500 mb-2">Awaiting Schematic Data</h3>
                      <p className="font-mono text-xs uppercase tracking-[0.2em]">Enter parameters to begin architecture</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default WarRoom;
