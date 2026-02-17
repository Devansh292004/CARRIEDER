
import React, { useState } from 'react';
import { analyzeNegotiationOffer, sendChatToAI } from '../services/geminiService';
import { NegotiationAnalysis, ChatMessage } from '../types';
import { DollarSign, Briefcase, TrendingUp, MessageSquare, Shield, CheckCircle2, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const NegotiationCoach: React.FC = () => {
  const [step, setStep] = useState<'input' | 'analysis' | 'practice'>('input');
  
  // Input State
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [offerBase, setOfferBase] = useState('');
  const [offerEquity, setOfferEquity] = useState('');
  const [offerSignOn, setOfferSignOn] = useState('');
  const [goalBase, setGoalBase] = useState('');
  const [leverage, setLeverage] = useState('');

  // Analysis State
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<NegotiationAnalysis | null>(null);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleAnalyze = async () => {
      setLoading(true);
      try {
          const result = await analyzeNegotiationOffer(
              company, role, 
              { base: offerBase, equity: offerEquity, signOn: offerSignOn },
              { base: goalBase, equity: '', signOn: '' },
              leverage
          );
          setAnalysis(result);
          setStep('analysis');
          
          // Prime the chat
          setChatHistory([
              { role: 'model', content: `I am simulating the recruiter from ${company}. I've just sent you the offer. What do you think?` }
          ]);
      } catch (e) {
          alert("Analysis failed.");
      } finally {
          setLoading(false);
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput) return;
      
      const newHistory = [...chatHistory, { role: 'user', content: chatInput } as ChatMessage];
      setChatHistory(newHistory);
      setChatInput('');
      setChatLoading(true);

      try {
          const system = `Roleplay as a recruiter/hiring manager at ${company}. You are negotiating with a candidate for ${role}. 
          The candidate wants more. Be tough but fair. The candidate's leverage is: ${leverage}.
          Keep responses short (1-3 sentences).`;
          
          const result = await sendChatToAI(newHistory, system);
          setChatHistory([...newHistory, { role: 'model', content: result.text }]);
      } catch (e) {
          console.error(e);
      } finally {
          setChatLoading(false);
      }
  };

  const renderInput = () => (
      <div className="max-w-2xl mx-auto barker-card p-8 border-l-4 border-l-green-500 animate-fade-in-up">
          <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" /> Offer Parameters
          </h3>
          <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Company</label>
                      <input value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded text-white" placeholder="Google" />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Role</label>
                      <input value={role} onChange={e => setRole(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded text-white" placeholder="Senior L5" />
                  </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-3 block">Current Offer</label>
                  <div className="grid grid-cols-3 gap-4">
                      <input value={offerBase} onChange={e => setOfferBase(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded text-white" placeholder="Base Salary ($)" />
                      <input value={offerEquity} onChange={e => setOfferEquity(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded text-white" placeholder="Equity ($/yr)" />
                      <input value={offerSignOn} onChange={e => setOfferSignOn(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded text-white" placeholder="Sign On ($)" />
                  </div>
              </div>

              <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Target Base Salary</label>
                  <input value={goalBase} onChange={e => setGoalBase(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded text-white" placeholder="$200,000" />
              </div>

              <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Leverage / Context</label>
                  <textarea value={leverage} onChange={e => setLeverage(e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 p-3 rounded text-white resize-none" placeholder="I have a competing offer from Meta for $210k. I am willing to walk away." />
              </div>

              <button 
                  onClick={handleAnalyze} 
                  disabled={loading || !company || !offerBase}
                  className="btn-barker w-full py-4 flex items-center justify-center gap-2"
              >
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  ANALYZE OFFER
              </button>
          </div>
      </div>
  );

  const renderAnalysis = () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-6">
              <div className="barker-card p-6 border-l-4 border-l-green-500">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-green-500 mb-4">Market Analysis</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{analysis?.marketRateAnalysis}</p>
              </div>

              <div className="barker-card p-6 border-l-4 border-l-blue-500">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-4">Strategy & Leverage</h3>
                   <p className="text-sm text-gray-300 mb-4">{analysis?.leverageAssessment}</p>
                   <div className="bg-blue-900/10 p-4 rounded border border-blue-500/20">
                       <p className="text-xs text-blue-300 font-bold uppercase mb-2">Tactical Approach</p>
                       <p className="text-sm text-gray-300">{analysis?.strategy}</p>
                   </div>
              </div>

              <div className="barker-card p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Recommended Counter</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-white/5 rounded">
                          <div className="text-[10px] text-gray-500 uppercase">Base</div>
                          <div className="text-lg font-bold text-white">{analysis?.recommendedCounter.base}</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded">
                          <div className="text-[10px] text-gray-500 uppercase">Equity</div>
                          <div className="text-lg font-bold text-white">{analysis?.recommendedCounter.equity}</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded">
                          <div className="text-[10px] text-gray-500 uppercase">Sign On</div>
                          <div className="text-lg font-bold text-white">{analysis?.recommendedCounter.signOn}</div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex flex-col gap-6">
              <div className="barker-card p-6 flex-1 flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-barker-gold mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Roleplay Simulator
                  </h3>
                  
                  <div className="flex-1 bg-black/40 rounded-xl border border-white/10 p-4 overflow-y-auto space-y-4 mb-4 h-[400px]">
                      {chatHistory.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-barker-gold/20 text-white' : 'bg-white/10 text-gray-300'}`}>
                                  <div className="flex items-center gap-2 mb-1 text-[10px] opacity-50 uppercase font-bold">
                                      {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                      {msg.role === 'user' ? 'You' : 'Recruiter'}
                                  </div>
                                  {msg.content}
                              </div>
                          </div>
                      ))}
                      {chatLoading && (
                          <div className="flex justify-start">
                              <div className="bg-white/5 p-3 rounded-lg flex gap-1">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                              </div>
                          </div>
                      )}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input 
                        value={chatInput} 
                        onChange={e => setChatInput(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 p-3 rounded text-sm text-white focus:border-barker-gold outline-none"
                        placeholder="Type your response..."
                      />
                      <button type="submit" className="p-3 bg-barker-gold text-white rounded hover:bg-red-600 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                      </button>
                  </form>
              </div>
          </div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
       <div className="flex items-center gap-6 mb-8 border-b border-barker-gold/20 pb-6 shrink-0">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel shadow-[0_0_20px_rgba(34,197,94,0.15)]">
          <DollarSign className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">Negotiation Coach</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            AI-driven compensation analysis and roleplay simulation.
          </p>
        </div>
      </div>

      {step === 'input' ? renderInput() : renderAnalysis()}
    </div>
  );
};

export default NegotiationCoach;
