
import React, { useState, useRef } from 'react';
import { generateDeepResumeAnalysis, generateTailoredResume } from '../services/geminiService';
import { updateUserAtsScore, saveDocument } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { parseFile } from '../services/fileService';
import { 
    FileText, Sparkles, BrainCircuit, Upload, FileType, CheckCircle2, 
    Printer, PenTool, LayoutTemplate, Plus, Trash2, Wand2, AlertTriangle,
    Target, Search, ArrowRight, Gauge, Save, Download, Edit3, Grid3X3, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FileData, DeepResumeAnalysis } from '../types';

// HOLOGRAPHIC UI COMPONENTS
const HoloGrid = () => (
    <div className="absolute inset-0 bg-[linear-gradient(rgba(229,62,62,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(229,62,62,0.1)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none"></div>
);

const ScanLaser = () => (
    <div className="absolute top-0 left-0 w-full h-[2px] bg-barker-gold shadow-[0_0_15px_#E53E3E] animate-scan-vertical pointer-events-none opacity-50 z-10"></div>
);

const ResumeForge: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'tailor'>('upload');
  
  // Data State
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [fileName, setFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  
  // Analysis & Gen State
  const [analysis, setAnalysis] = useState<DeepResumeAnalysis | null>(null);
  const [tailoredResume, setTailoredResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  
  // UI State
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      try {
        const parsed = await parseFile(file);
        setFileData(parsed);
        setResumeText(''); 
      } catch (err) {
        alert("Could not parse file.");
      }
    }
  };

  const executeAudit = async () => {
    if ((!fileData && !resumeText) || !jobDesc) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const input = fileData || resumeText;
      const result = await generateDeepResumeAnalysis(input, jobDesc);
      setAnalysis(result);
      setActiveTab('analysis');
      setIsEditingSummary(false); // Reset edit state

      // Save score for Dashboard and DB
      if (user) {
          try {
              await updateUserAtsScore(user.id, result.score);
              await refreshUser();
          } catch (err) {
              console.error("Failed to save score to DB", err);
          }
      }
      localStorage.setItem('carrieder_ats_score', result.score.toString());
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Analysis failed. Ensure job description is provided.");
    } finally {
      setLoading(false);
    }
  };

  const executeTailor = async () => {
      if (!analysis || ((!fileData && !resumeText) || !jobDesc)) return;
      setLoading(true);
      try {
          const input = fileData || resumeText;
          const result = await generateTailoredResume(input, jobDesc, analysis);
          setTailoredResume(result);
          setActiveTab('tailor');
      } catch (e) {
          alert("Generation failed");
      } finally {
          setLoading(false);
      }
  };

  const initiateSave = () => {
      setSaveTitle(`Tailored Resume - ${new Date().toLocaleDateString()}`);
      setShowSaveModal(true);
  };

  const confirmSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tailoredResume || !user || !saveTitle.trim()) return;
      
      setSaveStatus('saving');
      setShowSaveModal(false);
      
      try {
          await saveDocument(saveTitle, tailoredResume, 'resume');
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (e) {
          alert("Failed to save to cloud");
          setSaveStatus('idle');
      }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
    if (score >= 60) return 'text-yellow-500 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
    return 'text-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
  };

  const renderUploadTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 perspective-[2000px]">
        {/* Left Column - Resume Input */}
        <div className="space-y-6 reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-barker-gold flex items-center gap-2">
                <span className="w-4 h-[1px] bg-barker-gold"></span> 1. Upload Resume
            </h3>
            
            <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed transition-all duration-500 cursor-pointer p-8 flex flex-col items-center justify-center h-64 relative overflow-hidden group rounded-xl hover:shadow-[0_0_40px_rgba(229,62,62,0.15)] transform hover:scale-[1.01] ${
                fileData 
                    ? 'border-barker-gold bg-barker-gold/5' 
                    : 'border-white/10 hover:border-white/30 bg-black/20'
            }`}
            >
                <HoloGrid />
                <ScanLaser />

                {fileData ? (
                    <div className="relative z-20 text-center animate-fade-in backdrop-blur-sm p-4 rounded-xl border border-white/5 bg-black/40">
                        <div className="w-16 h-16 mx-auto bg-barker-gold/20 rounded-full flex items-center justify-center mb-4 border border-barker-gold/30">
                            <FileType className="w-8 h-8 text-barker-gold" />
                        </div>
                        <p className="font-bold text-white text-lg font-mono tracking-tight">{fileName}</p>
                        <div className="flex items-center gap-2 justify-center mt-2 text-green-500 text-xs font-mono uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> File Ready
                        </div>
                    </div>
                ) : (
                    <div className="relative z-20 text-center">
                        <Upload className="w-10 h-10 text-gray-500 mb-4 mx-auto group-hover:text-white transition-colors duration-300 transform group-hover:-translate-y-1" />
                        <p className="text-gray-300 font-bold tracking-wide group-hover:text-barker-gold transition-colors">Select File</p>
                        <p className="text-[10px] text-gray-600 mt-2 font-mono uppercase">PDF / DOCX Supported</p>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,.docx,.txt"
                />
            </div>

            <div className="relative group">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#050505] px-2 text-gray-600 font-mono tracking-widest">Or Manual Entry</span>
                </div>
            </div>

            <textarea 
            className="w-full h-32 bg-black/20 border border-white/10 text-white placeholder-gray-600 rounded-lg p-4 focus:border-barker-gold outline-none transition-all font-mono text-xs resize-none shadow-inner"
            placeholder="Paste your resume text here..."
            value={resumeText}
            onChange={(e) => { setResumeText(e.target.value); setFileData(null); setFileName(''); }}
            />
        </div>

        {/* Right Column - Job Desc */}
        <div className="space-y-6 reveal-on-scroll" style={{ transitionDelay: '300ms' }}>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-barker-gold flex items-center gap-2">
                <span className="w-4 h-[1px] bg-barker-gold"></span> 2. Job Description
            </h3>
            <div className="relative h-full pb-20 group">
                <HoloGrid />
                <textarea 
                className="w-full h-[450px] bg-black/20 border border-white/10 text-white placeholder-gray-600 rounded-lg p-6 focus:border-barker-gold outline-none transition-all font-sans text-sm leading-relaxed resize-none relative z-10 backdrop-blur-sm shadow-inner"
                placeholder="Paste the job description you are targeting..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                />
                
                <div className="absolute bottom-0 right-0 left-0 pt-4 bg-gradient-to-t from-[#050505] to-transparent z-20">
                     <button
                        onClick={executeAudit}
                        disabled={loading || ((!fileData && !resumeText) || !jobDesc)}
                        className="btn-barker w-full py-5 flex items-center justify-center gap-3 text-sm shadow-[0_0_30px_rgba(229,62,62,0.3)] hover:shadow-[0_0_50px_rgba(229,62,62,0.5)] border border-white/10 relative overflow-hidden group/btn"
                    >
                        {loading ? (
                        <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                            ANALYZING DATA...
                        </>
                        ) : (
                        <>
                            <Gauge className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                            START ANALYSIS
                        </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );

  const renderAnalysisTab = () => {
      if (!analysis) return null;

      return (
        <div className="space-y-8 perspective-[2000px]">
            {/* HUD Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div 
                    className="md:col-span-1 barker-card p-6 flex flex-col items-center justify-center relative overflow-hidden reveal-on-scroll" 
                    style={{ transitionDelay: '0ms' }}
                >
                     <div className="absolute inset-0 bg-barker-gold/5 animate-pulse-slow"></div>
                     <HoloGrid />
                     <div className={`relative z-10 w-32 h-32 rounded-full border-8 flex items-center justify-center text-5xl font-bold bg-black/50 ${getScoreColor(analysis.score)} transition-all duration-1000 transform hover:scale-110`}>
                         {analysis.score}
                     </div>
                     <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">ATS Score</p>
                </div>
                
                <div 
                    className="md:col-span-3 barker-card p-6 flex flex-col justify-between reveal-on-scroll" 
                    style={{ transitionDelay: '100ms' }}
                >
                     <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2">
                             <Target className="w-5 h-5 text-barker-gold animate-pulse" />
                             <h3 className="text-sm font-bold uppercase tracking-widest text-white">Optimization Opportunities</h3>
                         </div>
                         <button 
                            onClick={executeTailor}
                            className="btn-barker px-6 py-3 text-xs flex items-center gap-2 shadow-lg"
                            disabled={loading}
                         >
                            {loading ? 'GENERATING...' : <><Wand2 className="w-4 h-4" /> REWRITE RESUME</>}
                         </button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                         {analysis.missingKeywords.map((kw, i) => (
                             <span 
                                key={i} 
                                className="px-3 py-1.5 bg-red-900/10 border border-red-900/50 text-red-400 text-xs font-mono uppercase rounded animate-fade-in-up"
                                style={{ animationDelay: `${i * 50}ms` }}
                             >
                                 {kw}
                             </span>
                         ))}
                     </div>
                     <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-gray-500 font-mono">
                         <AlertTriangle className="w-4 h-4" />
                         <span>FILTER PROBABILITY: <span className={analysis.score < 70 ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>{analysis.score < 70 ? 'HIGH' : 'LOW'}</span></span>
                     </div>
                </div>
            </div>

            {/* Main Report */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Summary Section */}
                 <div className="barker-card p-6 border-l-4 border-l-blue-500 reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">Professional Summary</h3>
                         <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 uppercase tracking-wider">AI Review</span>
                     </div>
                     <div className="text-sm text-gray-400 leading-relaxed mb-6 prose prose-sm prose-invert max-w-none">
                         <ReactMarkdown>{analysis.summaryCritique}</ReactMarkdown>
                     </div>
                     
                     <div className="bg-black/30 p-4 rounded-lg border border-white/5 relative group hover:border-barker-gold/30 transition-colors">
                         <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2 text-barker-gold">
                                 <Sparkles className="w-4 h-4" />
                                 <span className="text-xs font-bold uppercase tracking-widest">Suggested Rewrite</span>
                             </div>
                             <button 
                                onClick={() => setIsEditingSummary(!isEditingSummary)}
                                className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded ${isEditingSummary ? 'bg-green-900/20 text-green-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                             >
                                {isEditingSummary ? (
                                    <><CheckCircle2 className="w-3 h-3" /> Done</>
                                ) : (
                                    <><Edit3 className="w-3 h-3" /> Edit</>
                                )}
                             </button>
                         </div>
                         
                         {isEditingSummary ? (
                             <textarea
                                value={analysis.tailoredSummary}
                                onChange={(e) => setAnalysis({...analysis, tailoredSummary: e.target.value})}
                                className="w-full h-48 bg-black/40 border border-white/10 rounded p-3 text-sm text-white focus:border-barker-gold outline-none resize-y font-sans leading-relaxed"
                                placeholder="Edit your summary..."
                             />
                         ) : (
                             <div className="prose prose-sm prose-invert max-w-none text-gray-200 font-sans leading-relaxed">
                                  <ReactMarkdown>{analysis.tailoredSummary}</ReactMarkdown>
                             </div>
                         )}
                     </div>
                 </div>

                 {/* Sections Breakdown */}
                 <div className="space-y-6">
                     {analysis.sections.map((section, idx) => (
                         <div 
                            key={idx} 
                            className="barker-card p-6 border-l-4 border-l-barker-gold reveal-on-scroll"
                            style={{ transitionDelay: `${300 + (idx * 100)}ms` }}
                         >
                             <div className="flex justify-between items-center mb-2">
                                 <h3 className="text-lg font-bold text-white font-display uppercase">{section.name}</h3>
                                 <div className={`text-xs font-bold px-2 py-1 rounded border ${getScoreColor(section.score)} bg-opacity-10`}>
                                     Score: {section.score}/100
                                 </div>
                             </div>
                             <p className="text-sm text-gray-400 mb-4">{section.feedback}</p>
                             
                             <div className="relative group pl-4">
                                 <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-barker-gold to-transparent opacity-50"></div>
                                 <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Improvement Strategy</h4>
                                 <div className="text-sm text-white font-mono bg-white/5 p-3 rounded border border-white/10 prose prose-invert prose-sm max-w-none shadow-inner">
                                     <ReactMarkdown>{section.suggestion}</ReactMarkdown>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
      );
  };

  const renderTailorTab = () => (
      <div className="h-full flex flex-col perspective-[2000px] relative">
          <div className="flex items-center justify-between mb-4 reveal-on-scroll" style={{ transitionDelay: '0ms' }}>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Optimized Document
              </h3>
              <div className="flex gap-2">
                  <button 
                    onClick={initiateSave}
                    disabled={saveStatus !== 'idle'}
                    className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-barker-gold text-white hover:bg-red-600'}`}
                  >
                      {saveStatus === 'saving' ? 'SAVING...' : saveStatus === 'saved' ? 'SAVED TO CLOUD' : <><Save className="w-4 h-4" /> SAVE DOCUMENT</>}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10"
                  >
                      <Printer className="w-4 h-4" /> PRINT / PDF
                  </button>
              </div>
          </div>
          
          {/* Floating Holographic Document */}
          <div 
             className="flex-1 max-w-[850px] mx-auto w-full relative group reveal-on-scroll" 
             style={{ transitionDelay: '200ms', transformStyle: 'preserve-3d' }}
          >
               {/* 3D Glow/Shadow below */}
               <div className="absolute -bottom-12 left-10 right-10 h-10 bg-barker-gold/20 blur-3xl rounded-[100%] pointer-events-none animate-pulse-slow"></div>

              <div className="bg-white text-black p-12 rounded shadow-[0_0_100px_rgba(255,255,255,0.1)] overflow-y-auto font-sans text-sm leading-relaxed w-full h-full border-t-8 border-t-barker-gold relative z-10">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>
                        {tailoredResume}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Watermark */}
                  <div className="absolute bottom-8 right-8 opacity-10 flex flex-col items-end pointer-events-none">
                      <BrainCircuit className="w-16 h-16 text-black" />
                      <span className="text-xs font-bold uppercase tracking-[0.3em]">Carrieder Optimized</span>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 lg:space-y-8 pb-12 h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-barker-gold/20 pb-6 print:hidden gap-6 mb-8">
        <div className="flex items-center gap-6">
            <div className="p-4 border border-barker-gold/30 bg-barker-panel shadow-[0_0_20px_rgba(229,62,62,0.15)] rounded-xl relative overflow-hidden group">
                <HoloGrid />
                <BrainCircuit className="w-8 h-8 text-barker-gold relative z-10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
                <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">Resume Builder</h2>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Ready for analysis
                </p>
            </div>
        </div>
        
        {analysis && (
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 backdrop-blur-md">
                <button 
                    onClick={() => setActiveTab('upload')}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'upload' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-white'}`}
                >
                    Input
                </button>
                <button 
                    onClick={() => setActiveTab('analysis')}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'analysis' ? 'bg-barker-gold text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                    Analysis
                </button>
                {tailoredResume && (
                    <button 
                        onClick={() => setActiveTab('tailor')}
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'tailor' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Result
                    </button>
                )}
            </div>
        )}
      </div>

      {activeTab === 'upload' && renderUploadTab()}
      {activeTab === 'analysis' && renderAnalysisTab()}
      {activeTab === 'tailor' && renderTailorTab()}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-barker-panel border border-white/10 w-full max-w-md rounded-2xl p-8 shadow-2xl relative">
                <button onClick={() => setShowSaveModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Save className="w-5 h-5 text-barker-gold" /> Save Document
                </h3>
                
                <form onSubmit={confirmSave} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Document Title</label>
                        <input 
                            value={saveTitle}
                            onChange={(e) => setSaveTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-600 rounded-xl p-4 focus:outline-none focus:border-barker-gold focus:ring-1 focus:ring-barker-gold transition-all font-sans text-sm"
                            placeholder="e.g. Resume - Senior Engineer"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setShowSaveModal(false)}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!saveTitle.trim()}
                            className="flex-1 bg-barker-gold text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors uppercase text-xs tracking-widest shadow-lg disabled:opacity-50 disabled:shadow-none"
                        >
                            Confirm Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResumeForge;
