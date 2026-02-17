
import React, { useState } from 'react';
import { generateWorkChallenge, gradeWorkChallenge } from '../services/geminiService';
import { WorkChallenge, WorkSubmission } from '../types';
import { 
    Briefcase, Code, Clock, CheckCircle2, 
    AlertTriangle, Share2, Copy, Zap, 
    Terminal, Play, RotateCcw, Cpu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ProofOfWork: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'challenge' | 'submission'>('setup');
  
  // Inputs
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  
  // Data
  const [challenge, setChallenge] = useState<WorkChallenge | null>(null);
  const [submission, setSubmission] = useState('');
  const [result, setResult] = useState<WorkSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
  const [timerActive, setTimerActive] = useState(false);

  // Timer Logic
  React.useEffect(() => {
      let interval: any;
      if (timerActive && timeLeft > 0) {
          interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      }
      return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleGenerate = async () => {
      if (!targetCompany || !targetRole) return;
      setLoading(true);
      try {
          const data = await generateWorkChallenge(targetCompany, targetRole);
          setChallenge(data);
          setStep('challenge');
          setTimeLeft(1800);
          setTimerActive(true);
      } catch (e) {
          alert("Could not generate challenge.");
      } finally {
          setLoading(false);
      }
  };

  const handleSubmit = async () => {
      if (!challenge || !submission) return;
      setLoading(true);
      setTimerActive(false);
      try {
          const data = await gradeWorkChallenge(challenge, submission);
          setResult(data);
          setStep('submission');
      } catch (e) {
          alert("Grading failed.");
      } finally {
          setLoading(false);
      }
  };

  const copyEmail = () => {
      if (result?.emailHook) {
          navigator.clipboard.writeText(result.emailHook);
          alert("Email hook copied to clipboard!");
      }
  };

  const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-exo-glass pb-6">
          <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl glass-panel shadow-[0_0_30px_rgba(99,102,241,0.2)] relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-exo-primary/20 to-exo-accent/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Cpu className="w-8 h-8 text-exo-primary relative z-10" />
              </div>
              <div>
                  <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">Proof of Work Protocol</h2>
                  <p className="text-gray-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-exo-success rounded-full animate-pulse"></span>
                      Demonstrate Competence • Bypass Filters
                  </p>
              </div>
          </div>
      </div>

      <div className="flex-1 min-h-0 relative">
          
          {/* STEP 1: SETUP */}
          {step === 'setup' && (
              <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                  <div className="w-full max-w-2xl glass-card p-10 rounded-3xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-exo-primary to-exo-accent"></div>
                      
                      <div className="text-center mb-8">
                          <h3 className="text-2xl font-bold text-white mb-2">Initialize Simulation</h3>
                          <p className="text-gray-400 text-sm">
                              Generate a role-specific micro-challenge to prove your skills to recruiters.
                          </p>
                      </div>

                      <div className="space-y-6">
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">Target Organization</label>
                              <input 
                                value={targetCompany}
                                onChange={e => setTargetCompany(e.target.value)}
                                className="w-full p-4 rounded-xl text-lg font-mono"
                                placeholder="E.g. Airbnb"
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">Target Role</label>
                              <input 
                                value={targetRole}
                                onChange={e => setTargetRole(e.target.value)}
                                className="w-full p-4 rounded-xl text-lg font-mono"
                                placeholder="E.g. Senior Product Designer"
                              />
                          </div>

                          <button 
                              onClick={handleGenerate}
                              disabled={loading || !targetCompany || !targetRole}
                              className="btn-primary w-full py-5 rounded-xl font-bold text-white uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:shadow-indigo-500/30"
                          >
                              {loading ? (
                                  <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ANALYZING TECH STACK...
                                  </>
                              ) : (
                                  <>
                                      <Zap className="w-5 h-5" /> GENERATE CHALLENGE
                                  </>
                              )}
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 2: CHALLENGE */}
          {step === 'challenge' && challenge && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-slide-up">
                  {/* Briefing */}
                  <div className="flex flex-col gap-6 h-full">
                      <div className="glass-card p-8 rounded-3xl border-l-4 border-l-exo-accent flex-1 overflow-y-auto">
                          <div className="flex justify-between items-start mb-6">
                              <div>
                                  <div className="text-[10px] font-bold uppercase text-exo-accent mb-1 tracking-widest">Mission Brief</div>
                                  <h3 className="text-3xl font-display font-bold text-white">{challenge.title}</h3>
                              </div>
                              <div className="text-right">
                                  <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">Time Remaining</div>
                                  <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-exo-error animate-pulse' : 'text-white'}`}>
                                      {formatTime(timeLeft)}
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-6 text-sm text-gray-300 leading-relaxed font-sans">
                              <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                  <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-exo-primary" /> Context</h4>
                                  <p>{challenge.context}</p>
                              </div>

                              <div>
                                  <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Terminal className="w-4 h-4 text-exo-success" /> Directives</h4>
                                  <div className="prose prose-invert prose-sm max-w-none">
                                      <ReactMarkdown>{challenge.taskDescription}</ReactMarkdown>
                                  </div>
                              </div>

                              <div className="bg-exo-warning/10 p-4 rounded-lg border border-exo-warning/20 text-exo-warning flex items-start gap-3">
                                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                  <div className="text-xs">
                                      <strong>Deliverable:</strong> {challenge.deliverableFormat}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Workspace */}
                  <div className="flex flex-col gap-6 h-full">
                      <div className="glass-card p-1 rounded-3xl flex-1 flex flex-col bg-black/40">
                          <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between">
                              <div className="flex gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
                              </div>
                              <span className="text-[10px] font-mono text-gray-500 uppercase">SOLUTION_EDITOR.md</span>
                          </div>
                          <textarea 
                              value={submission}
                              onChange={e => setSubmission(e.target.value)}
                              className="flex-1 w-full bg-transparent border-none p-6 text-sm font-mono text-gray-300 resize-none focus:ring-0 focus:shadow-none"
                              placeholder="// Type your solution here..."
                              spellCheck={false}
                          />
                      </div>

                      <button 
                          onClick={handleSubmit}
                          disabled={loading || !submission}
                          className="btn-primary py-4 rounded-xl font-bold text-white uppercase tracking-widest shadow-lg"
                      >
                          {loading ? 'GRADING SUBMISSION...' : 'SUBMIT WORK'}
                      </button>
                  </div>
              </div>
          )}

          {/* STEP 3: RESULTS */}
          {step === 'submission' && result && (
              <div className="h-full flex flex-col items-center animate-slide-up overflow-y-auto">
                  <div className="w-full max-w-4xl space-y-8 pb-12">
                      
                      {/* Score Header */}
                      <div className="glass-card p-8 rounded-3xl flex items-center justify-between bg-gradient-to-r from-exo-primary/10 to-transparent border-l-4 border-l-exo-primary">
                          <div>
                              <h3 className="text-2xl font-bold text-white mb-1">Challenge Complete</h3>
                              <p className="text-gray-400 text-sm">Review your assessment and deployment strategy.</p>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="text-right">
                                  <div className="text-[10px] uppercase font-bold text-gray-500">Proficiency Score</div>
                                  <div className={`text-4xl font-display font-bold ${result.grade >= 80 ? 'text-exo-success' : 'text-exo-warning'}`}>
                                      {result.grade}/100
                                  </div>
                              </div>
                              <div className="w-16 h-16 rounded-full border-4 border-white/10 flex items-center justify-center bg-white/5">
                                  <CheckCircle2 className={`w-8 h-8 ${result.grade >= 80 ? 'text-exo-success' : 'text-exo-warning'}`} />
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Feedback */}
                          <div className="glass-card p-8 rounded-3xl">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">AI Assessment</h4>
                              <div className="space-y-4">
                                  <div className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl">
                                      <ReactMarkdown>{result.feedback}</ReactMarkdown>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <div className="text-[10px] font-bold text-exo-success uppercase mb-2">Strengths</div>
                                          <ul className="text-xs text-gray-400 space-y-1">
                                              {result.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                                          </ul>
                                      </div>
                                      <div>
                                          <div className="text-[10px] font-bold text-exo-error uppercase mb-2">Areas to Improve</div>
                                          <ul className="text-xs text-gray-400 space-y-1">
                                              {result.weaknesses.map((s, i) => <li key={i}>• {s}</li>)}
                                          </ul>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Email Hook */}
                          <div className="flex flex-col gap-6">
                              <div className="glass-card p-8 rounded-3xl border-t-4 border-t-exo-accent bg-black/40 flex-1 relative group">
                                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={copyEmail} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white">
                                          <Copy className="w-4 h-4" />
                                      </button>
                                  </div>
                                  <h4 className="text-sm font-bold uppercase tracking-widest text-exo-accent mb-6 flex items-center gap-2">
                                      <Share2 className="w-4 h-4" /> Cold Outreach Hook
                                  </h4>
                                  <p className="text-sm text-gray-300 font-serif leading-relaxed italic">
                                      "{result.emailHook}"
                                  </p>
                                  <div className="mt-6 pt-6 border-t border-white/10">
                                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Strategy</p>
                                      <p className="text-xs text-gray-400">
                                          Attach your solution as a PDF. Use this text in your email body or LinkedIn DM. It proves you can do the job before you even interview.
                                      </p>
                                  </div>
                              </div>

                              <button 
                                onClick={() => setStep('setup')}
                                className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest flex items-center justify-center gap-2"
                              >
                                  <RotateCcw className="w-4 h-4" /> Run New Simulation
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default ProofOfWork;
