
import React, { useState } from 'react';
import { generateOutreachSequence } from '../services/geminiService';
import { OutreachSequence } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Target, Search, Mail, Copy, Check, ArrowRight, ExternalLink, MessageSquare, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const OutreachNexus: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [targetName, setTargetName] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [tone, setTone] = useState('Professional but Bold');
  
  const [loading, setLoading] = useState(false);
  const [sequence, setSequence] = useState<OutreachSequence | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName || !targetCompany) return;
    
    setLoading(true);
    setSequence(null);
    
    try {
      const result = await generateOutreachSequence(
          targetName,
          targetCompany,
          targetRole,
          { name: user?.name || 'Candidate', title: user?.title || 'Professional' },
          tone
      );
      setSequence(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate sequence. Check API limits.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8 pb-12">
      <div className="flex items-center gap-6 mb-8 border-b border-barker-gold/20 pb-6">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel">
          <Target className="w-8 h-8 text-barker-gold" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">Networking Strategy</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            Generate psychological profiles and multi-channel messaging strategies for targets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
              <div className="barker-card p-6 space-y-5 border-l-4 border-l-barker-gold reveal-on-scroll">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                      <Search className="w-4 h-4" /> Contact Details
                  </h3>
                  
                  <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Target Name</label>
                      <input 
                        value={targetName}
                        onChange={e => setTargetName(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 text-white rounded p-3 text-sm focus:border-barker-gold outline-none"
                        placeholder="e.g. Elena Fisher"
                      />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Company</label>
                      <input 
                        value={targetCompany}
                        onChange={e => setTargetCompany(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 text-white rounded p-3 text-sm focus:border-barker-gold outline-none"
                        placeholder="e.g. Cyberdyne Systems"
                      />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Role (Optional)</label>
                      <input 
                        value={targetRole}
                        onChange={e => setTargetRole(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 text-white rounded p-3 text-sm focus:border-barker-gold outline-none"
                        placeholder="e.g. VP of Engineering"
                      />
                  </div>
                  
                  <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Strategic Tone</label>
                      <div className="grid grid-cols-2 gap-2">
                          {['Direct', 'Witty', 'Value-Add', 'Bold'].map(t => (
                              <button
                                key={t}
                                onClick={() => setTone(t)}
                                className={`py-2 text-[10px] uppercase font-bold border rounded transition-all ${tone === t ? 'bg-barker-gold text-black border-barker-gold' : 'text-gray-500 border-white/10 hover:border-white/30'}`}
                              >
                                  {t}
                              </button>
                          ))}
                      </div>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={loading || !targetName || !targetCompany}
                    className="btn-barker w-full py-4 mt-2 flex items-center justify-center gap-2 text-xs"
                  >
                      {loading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ANALYZING TARGET...
                          </>
                      ) : (
                          <>GENERATE CAMPAIGN <ArrowRight className="w-4 h-4" /></>
                      )}
                  </button>
              </div>

              {/* Tips */}
              <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
                  <p className="text-xs text-blue-300 leading-relaxed">
                      <span className="font-bold">PRO TIP:</span> The system will use Google Search to find recent news about the target to create a "Hook". Ensure the name/company are accurate.
                  </p>
              </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
              {!sequence && !loading && (
                  <div className="h-full min-h-[400px] barker-card flex flex-col items-center justify-center text-gray-600 opacity-50 reveal-on-scroll">
                      <Target className="w-16 h-16 mb-4" />
                      <p className="font-mono text-xs uppercase tracking-[0.2em]">Awaiting Target Data</p>
                  </div>
              )}

              {sequence && (
                  <div className="space-y-6 animate-fade-in">
                      {/* Intel Card */}
                      <div className="bg-black/40 border border-white/10 rounded-lg p-6 backdrop-blur-sm reveal-on-scroll">
                          <h3 className="text-barker-gold text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Search className="w-4 h-4" /> Profile Analysis
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <span className="text-[10px] text-gray-500 uppercase block mb-1">Psychological Profile</span>
                                  <p className="text-sm text-gray-300">{sequence.psychologicalProfile}</p>
                              </div>
                              <div>
                                  <span className="text-[10px] text-gray-500 uppercase block mb-1">Selected Hook</span>
                                  <p className="text-sm text-white font-medium border-l-2 border-barker-gold pl-3">"{sequence.hookStrategy}"</p>
                              </div>
                          </div>
                      </div>

                      {/* Sequence Timeline */}
                      <div className="relative space-y-4">
                          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-barker-gold via-white/10 to-transparent"></div>

                          {sequence.steps.map((step, idx) => (
                              <div key={idx} className="relative pl-14 reveal-on-scroll" style={{ transitionDelay: `${idx * 100}ms` }}>
                                  {/* Step Indicator */}
                                  <div className="absolute left-2 top-0 w-8 h-8 rounded-full bg-black border-2 border-barker-gold flex items-center justify-center z-10 text-barker-gold font-bold text-xs shadow-[0_0_15px_rgba(229,62,62,0.4)]">
                                      {step.step}
                                  </div>

                                  <div className="barker-card p-6 hover:border-barker-gold/50 transition-all group">
                                      <div className="flex justify-between items-start mb-4">
                                          <div className="flex items-center gap-3">
                                              {step.channel === 'LinkedIn' ? <List className="w-4 h-4 text-blue-400" /> : <Mail className="w-4 h-4 text-orange-400" />}
                                              <h4 className="font-bold text-white text-sm uppercase tracking-wide">{step.channel}</h4>
                                          </div>
                                          <div className="flex gap-2">
                                              <button 
                                                onClick={() => copyToClipboard(step.subject ? `Subject: ${step.subject}\n\n${step.content}` : step.content, idx)}
                                                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                                title="Copy"
                                              >
                                                  {copiedIndex === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                              </button>
                                          </div>
                                      </div>

                                      {step.subject && (
                                          <div className="mb-3 pb-3 border-b border-white/5">
                                              <span className="text-[10px] text-gray-500 uppercase mr-2">Subject:</span>
                                              <span className="text-sm text-gray-200 font-medium">{step.subject}</span>
                                          </div>
                                      )}

                                      <div className="bg-black/30 p-4 rounded border border-white/5 mb-4">
                                          <p className="text-sm text-gray-300 whitespace-pre-wrap font-serif leading-relaxed">
                                              {step.content}
                                          </p>
                                      </div>

                                      <div className="flex items-start gap-2 text-xs text-gray-500 bg-white/5 p-2 rounded">
                                          <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                          <span>Strategy: {step.whyItWorks}</span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default OutreachNexus;
