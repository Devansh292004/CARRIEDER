
import React, { useState, useRef, useEffect } from 'react';
import { generateMagnumOpus } from '../services/geminiService';
import { parseFile } from '../services/fileService';
import { ProjectArtifact, FileData } from '../types';
import { 
    Hammer, Code, FileText, Upload, FolderOpen, 
    File, Copy, Check, Download, Layers, Box, Cpu, AlertTriangle,
    ZoomIn, ZoomOut, Maximize, Terminal, ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

const FabricationLog = () => {
    const [lines, setLines] = useState<string[]>([]);
    const logs = [
        "INITIALIZING MAGNUM OPUS PROTOCOL...",
        "DEEP SCAN: RESUME GAPS DETECTED...",
        "ANALYZING TARGET JOB REQUIREMENTS...",
        "SYNTHESIZING BRIDGE ARCHITECTURE...",
        "COMPILING TECH STACK MATRIX...",
        "GENERATING ENTERPRISE-GRADE BLUEPRINTS...",
        "FINALIZING PROJECT ARTIFACTS..."
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
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center font-mono text-xs z-50 p-8">
            <div className="w-full max-w-lg border border-exo-primary/30 bg-black/50 p-8 rounded-xl shadow-[0_0_80px_rgba(255,192,0,0.1)] relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <Terminal className="w-5 h-5 text-exo-primary animate-pulse" />
                    <span className="text-gray-400 tracking-widest uppercase font-bold">System Fabrication</span>
                </div>
                <div className="space-y-3 h-48 overflow-hidden relative">
                    {lines.map((line, i) => (
                        <div key={i} className="text-green-500 animate-fade-in flex items-center gap-3">
                            <ChevronRight className="w-3 h-3 text-exo-primary" />
                            <span className="text-gray-300 tracking-wider">{line}</span>
                        </div>
                    ))}
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/80 to-transparent"></div>
                </div>
                <div className="mt-6 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-exo-primary animate-[loading_2s_ease-in-out_infinite] w-full shadow-[0_0_10px_#FFC000]"></div>
                </div>
            </div>
        </div>
    );
};

const MagnumOpus: React.FC = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  const [project, setProject] = useState<ProjectArtifact | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'readme' | 'code' | 'diagram'>('readme');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      mermaid.initialize({ 
          startOnLoad: false, 
          theme: 'base',
          securityLevel: 'loose',
          fontFamily: '"JetBrains Mono", monospace',
          themeVariables: {
              darkMode: true,
              background: '#02040a',
              primaryColor: '#0f1629', 
              primaryTextColor: '#e2e8f0', 
              primaryBorderColor: '#FFC000', 
              lineColor: '#64748b', 
              secondaryColor: '#0f1629',
              tertiaryColor: '#02040a',
              mainBkg: '#02040a',
              nodeBorder: '#FFC000',
              clusterBkg: 'rgba(255, 192, 0, 0.02)',
              clusterBorder: '#FFC000',
              defaultLinkColor: '#64748b',
              edgeLabelBackground: '#02040a',
              actorBorder: '#FFC000',
              actorBkg: '#0f1629',
              actorTextColor: '#e2e8f0',
              signalColor: '#FFC000',
              signalTextColor: '#e2e8f0'
          }
      });
  }, []);

  useEffect(() => {
      if (activeTab === 'diagram' && project?.architectureDiagram && diagramRef.current) {
          diagramRef.current.innerHTML = '';
          const id = `mermaid-${Date.now()}`;
          
          mermaid.render(id, project.architectureDiagram).then(({ svg }) => {
              if (diagramRef.current) {
                  diagramRef.current.innerHTML = svg;
              }
          }).catch(e => {
              console.error("Mermaid Render Error", e);
              if (diagramRef.current) {
                  diagramRef.current.innerHTML = `<div class="text-red-500 text-xs p-6 border border-red-900/50 rounded bg-red-900/10 font-mono"><p class="mb-2 font-bold">RENDER FAILURE</p>${e.message}<br/><br/>Try regenerating for a simpler structure.</div>`;
              }
          });
      }
  }, [activeTab, project]);

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
      if (!fileData || !jobDesc) return;
      setLoading(true);
      setProject(null);
      setZoom(1);
      try {
          const result = await generateMagnumOpus(fileData, jobDesc);
          setProject(result);
      } catch (e: any) {
          console.error(e);
          alert(`Architect failed: ${e.message || "Unknown Error"}`);
      } finally {
          setLoading(false);
      }
  };

  const copyCode = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1920px] mx-auto h-[calc(100vh-100px)] flex flex-col pb-12">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-6 bg-exo-void/90 backdrop-blur-md sticky top-0 z-20">
            <div className="p-4 border border-exo-primary/30 bg-exo-surface rounded-xl shadow-[0_0_30px_rgba(255,192,0,0.15)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-exo-primary/10 animate-pulse-slow"></div>
                <Hammer className="w-8 h-8 text-exo-primary relative z-10 group-hover:rotate-12 transition-transform" />
            </div>
            <div>
                <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">The Architect</h2>
                <p className="text-gray-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-exo-primary rounded-full animate-pulse"></span>
                    Portfolio Generator • Bridge Experience
                </p>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 relative">
            
            {loading && <FabricationLog />}

            {/* LEFT: INPUTS */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 scrollbar-thin">
                <div className="glass-card p-8 rounded-xl border-l-4 border-l-exo-primary bg-exo-surface/50">
                    <h3 className="text-xs font-bold text-exo-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Data Ingestion
                    </h3>
                    
                    <div className="space-y-6">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed p-6 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group ${fileData ? 'border-exo-primary bg-exo-primary/5' : 'border-white/10 hover:border-white/30 bg-black/40'}`}
                        >
                            {fileData ? (
                                <div className="text-center animate-fade-in">
                                    <div className="w-12 h-12 rounded-full bg-exo-primary/20 flex items-center justify-center mx-auto mb-3 border border-exo-primary/30">
                                        <Check className="w-6 h-6 text-exo-primary" />
                                    </div>
                                    <p className="text-white text-sm font-bold">Resume Locked</p>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-mono">{fileData.inlineData ? 'BINARY_STREAM' : 'TEXT_BUFFER'}</p>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 group-hover:scale-105 transition-transform duration-300">
                                    <FileText className="w-8 h-8 mx-auto mb-2 group-hover:text-white transition-colors" />
                                    <p className="text-xs font-bold uppercase tracking-widest group-hover:text-exo-primary transition-colors">Upload Resume</p>
                                    <p className="text-[10px] mt-2 opacity-50 font-mono">PDF / DOCX / TXT</p>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.txt" />
                        </div>

                        {/* REFACTORED INPUT BLOCK: Centered Label + Distinct Area */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 bg-exo-primary rounded-full animate-pulse"></div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Target Parameters</span>
                                <div className="w-1.5 h-1.5 bg-exo-primary rounded-full animate-pulse"></div>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-exo-primary/0 via-exo-primary/30 to-exo-primary/0 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                                <textarea 
                                    value={jobDesc}
                                    onChange={(e) => setJobDesc(e.target.value)}
                                    placeholder="Paste Job Description here..."
                                    className="relative w-full h-48 bg-black/60 border border-white/10 rounded-xl p-5 text-white text-sm focus:border-exo-primary/50 outline-none resize-none font-mono leading-relaxed transition-all placeholder-gray-700 shadow-inner"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={loading || !fileData || !jobDesc}
                            className="btn-primary w-full py-5 flex items-center justify-center gap-3 shadow-xl text-xs font-bold uppercase tracking-[0.2em] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed group transition-all hover:shadow-exo-primary/40"
                        >
                            <Box className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                            INITIALIZE BUILD
                        </button>
                    </div>
                </div>

                {project && (
                    <div className="glass-card p-6 rounded-xl animate-slide-up border-t-2 border-t-exo-primary">
                        <h4 className="text-white font-bold text-lg mb-2 leading-tight">{project.title}</h4>
                        <p className="text-exo-primary text-xs font-mono mb-4 border-b border-white/10 pb-4">{project.tagline}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {project.techStack?.map((t, i) => (
                                <span key={i} className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-300 border border-white/10 font-mono uppercase tracking-wide hover:border-exo-primary/50 transition-colors">{t}</span>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed font-sans">{project.description}</p>
                    </div>
                )}
            </div>

            {/* RIGHT: OUTPUT */}
            <div className="lg:col-span-8 flex flex-col min-h-0 bg-[#02040a] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-exo-primary/5 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>
                
                {!project ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-50 p-8 text-center relative z-10">
                        <div className="w-32 h-32 border-2 border-dashed border-gray-800 rounded-full flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 bg-exo-primary/5 rounded-full blur-xl"></div>
                            <Cpu className="w-12 h-12 text-gray-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-500 mb-2 font-display">Awaiting Blueprint</h3>
                        <p className="font-mono text-xs uppercase tracking-[0.2em]">Upload required assets to commence architecture</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md relative z-10 px-2">
                            <div className="flex">
                                <button 
                                    onClick={() => setActiveTab('readme')}
                                    className={`px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${activeTab === 'readme' ? 'border-exo-primary text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <FileText className="w-3 h-3" /> Documentation
                                </button>
                                <button 
                                    onClick={() => setActiveTab('code')}
                                    className={`px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${activeTab === 'code' ? 'border-exo-primary text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Code className="w-3 h-3" /> Source
                                </button>
                                <button 
                                    onClick={() => setActiveTab('diagram')}
                                    className={`px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${activeTab === 'diagram' ? 'border-exo-primary text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Layers className="w-3 h-3" /> Blueprint
                                </button>
                            </div>
                            
                            {activeTab === 'diagram' && (
                                <div className="flex items-center gap-2 pr-4">
                                    <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ZoomOut className="w-3 h-3" /></button>
                                        <span className="px-2 text-[10px] font-mono text-gray-500 self-center w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
                                        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ZoomIn className="w-3 h-3" /></button>
                                    </div>
                                    <button onClick={() => setZoom(1)} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white border border-white/10" title="Fit to Screen"><Maximize className="w-3 h-3" /></button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-hidden relative z-10 bg-[#050505]">
                            {activeTab === 'readme' && (
                                <div className="absolute inset-0 overflow-y-auto p-12 bg-[#02040a] text-gray-300 font-sans prose prose-invert prose-sm max-w-none scrollbar-thin">
                                    <ReactMarkdown>{project.readmeContent}</ReactMarkdown>
                                </div>
                            )}

                            {activeTab === 'code' && (
                                <div className="absolute inset-0 flex">
                                    {/* Sidebar */}
                                    <div className="w-64 border-r border-white/10 bg-[#02040a] overflow-y-auto p-0 flex flex-col">
                                        <div className="p-4 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <FolderOpen className="w-3 h-3" /> Explorer
                                        </div>
                                        <div className="flex-1 p-2 space-y-0.5">
                                            {project.codeFiles?.map((file, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => setSelectedFileIndex(idx)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono truncate transition-all flex items-center gap-2 ${selectedFileIndex === idx ? 'bg-exo-primary/10 text-exo-primary border border-exo-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                                                >
                                                    <File className="w-3 h-3 opacity-70" />
                                                    {file.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Editor */}
                                    <div className="flex-1 bg-[#050a14] overflow-y-auto relative flex flex-col">
                                        <div className="absolute top-4 right-4 z-20">
                                            <button 
                                                onClick={() => copyCode(project.codeFiles?.[selectedFileIndex]?.content || '')}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5 backdrop-blur-md"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        
                                        {/* Fake Line Numbers & Code */}
                                        <div className="flex min-h-full">
                                            <div className="w-12 bg-[#02040a] border-r border-white/5 pt-6 text-right pr-3 text-gray-700 font-mono text-xs select-none">
                                                {(project.codeFiles?.[selectedFileIndex]?.content || '').split('\n').map((_, i) => (
                                                    <div key={i} className="leading-6">{i + 1}</div>
                                                ))}
                                            </div>
                                            <pre className="flex-1 p-6 text-sm font-mono text-gray-300 leading-6 tab-4 overflow-auto">
                                                <code>{project.codeFiles?.[selectedFileIndex]?.content || ''}</code>
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'diagram' && (
                                <div className="absolute inset-0 bg-[#050505] flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                                    
                                    <div className="w-full h-full overflow-auto flex items-center justify-center p-12 cursor-grab active:cursor-grabbing">
                                        <div 
                                            ref={diagramRef} 
                                            className="mermaid-output transition-transform duration-200 ease-out origin-center drop-shadow-2xl"
                                            style={{ transform: `scale(${zoom})` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default MagnumOpus;
