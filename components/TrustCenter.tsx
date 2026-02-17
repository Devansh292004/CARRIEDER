
import React, { useState } from 'react';
import { verifyCredential } from '../services/geminiService';
import { ShieldCheck, CheckCircle2, Plus, Search, Hexagon, Lock, Link as LinkIcon, Share2, Scale, Eye, FileJson, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Credential {
  id: string;
  name: string;
  issuer: string;
  status: 'verified' | 'pending' | 'unverified';
  details?: string;
  hash?: string;
}

const TrustCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'ethics'>('credentials');
  const [credentials, setCredentials] = useState<Credential[]>([
    { id: '1', name: 'PMP Certification', issuer: 'Project Management Institute', status: 'verified', details: 'Global gold standard for project management professionals.', hash: '0x7f...3a2b' }
  ]);
  const [newName, setNewName] = useState('');
  const [newIssuer, setNewIssuer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newIssuer) return;
    setLoading(true);
    
    try {
      const verificationReport = await verifyCredential(newName, newIssuer);
      
      const newCred: Credential = {
        id: Date.now().toString(),
        name: newName,
        issuer: newIssuer,
        status: 'verified', 
        details: verificationReport,
        hash: `0x${Math.random().toString(16).substr(2, 10)}...`
      };
      
      setCredentials([...credentials, newCred]);
      setNewName('');
      setNewIssuer('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
       <div className="flex items-center justify-between gap-6 mb-8 border-b border-barker-gold/20 pb-6">
        <div className="flex items-center gap-6">
            <div className="p-4 border border-barker-gold/30 bg-barker-panel">
            <ShieldCheck className="w-8 h-8 text-barker-gold" />
            </div>
            <div>
            <h2 className="text-4xl font-display font-bold text-white mb-2">Trust & Safety</h2>
            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                Credential verification ledger and AI ethical guidelines.
            </p>
            </div>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            <button 
                onClick={() => setActiveTab('credentials')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'credentials' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
                Credentials
            </button>
            <button 
                onClick={() => setActiveTab('ethics')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'ethics' ? 'bg-barker-gold text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
                AI Ethics
            </button>
        </div>
      </div>

      {activeTab === 'credentials' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
            {/* Add New Credential */}
            <div className="barker-card p-8 h-fit lg:sticky lg:top-8">
            <div className="flex items-center gap-2 mb-6 text-barker-gold">
                <Plus className="w-4 h-4" />
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase">Add Credential</h3>
            </div>
            
            <form onSubmit={handleVerify} className="space-y-6">
                <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Credential Name</label>
                <input 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-600 rounded-xl p-4 focus:outline-none focus:border-barker-gold focus:ring-1 focus:ring-barker-gold transition-all font-sans text-sm"
                    placeholder="E.G. AWS SOLUTIONS ARCHITECT"
                />
                </div>
                <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Issuing Org</label>
                <input 
                    value={newIssuer}
                    onChange={e => setNewIssuer(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-600 rounded-xl p-4 focus:outline-none focus:border-barker-gold focus:ring-1 focus:ring-barker-gold transition-all font-sans text-sm"
                    placeholder="E.G. AMAZON WEB SERVICES"
                />
                </div>
                <button 
                type="submit" 
                disabled={loading || !newName || !newIssuer}
                className="btn-barker w-full py-5 flex items-center justify-center gap-3 shadow-xl"
                >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        VERIFYING...
                    </>
                ) : (
                    <>
                        <Search className="w-4 h-4" /> VERIFY
                    </>
                )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 text-gray-500 text-xs">
                    <Lock className="w-4 h-4" />
                    <p>Cryptographically secured via local ledger simulation.</p>
                </div>
            </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-6">
            {credentials.map((cred, idx) => (
                <div 
                    key={cred.id} 
                    className="barker-card p-0 flex flex-col md:flex-row overflow-hidden group hover:border-barker-gold/40 transition-all reveal-on-scroll"
                    style={{ transitionDelay: `${idx * 100}ms` }}
                >
                {/* Hash Strip */}
                <div className="h-2 md:h-auto md:w-2 bg-gradient-to-b from-barker-gold to-transparent"></div>
                
                <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-2xl font-display font-bold text-white group-hover:text-barker-gold transition-colors mb-1">{cred.name}</h4>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{cred.issuer}</p>
                        </div>
                        {cred.status === 'verified' && (
                            <div className="flex items-center gap-2 text-green-500 bg-green-900/10 px-3 py-1 rounded-full border border-green-900/30">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                            </div>
                        )}
                    </div>

                    {cred.details && (
                    <div className="text-sm text-gray-400 font-sans leading-relaxed mb-6 bg-black/20 p-4 rounded-lg border border-white/5">
                        <ReactMarkdown>{cred.details}</ReactMarkdown>
                    </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600">
                            <LinkIcon className="w-3 h-3" />
                            HASH: {cred.hash}
                        </div>
                        <button className="text-gray-500 hover:text-white transition-colors">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {/* Badge visual */}
                <div className="md:w-40 bg-black/40 flex items-center justify-center p-6 border-t md:border-t-0 md:border-l border-white/5">
                    <div className="relative group/badge">
                        <div className="absolute inset-0 bg-barker-gold blur-2xl opacity-10 group-hover/badge:opacity-30 transition-opacity"></div>
                        <Hexagon className="w-20 h-20 text-white/5 absolute rotate-12" />
                        <ShieldCheck className="w-10 h-10 text-barker-gold relative z-10" />
                    </div>
                </div>
                </div>
            ))}
            </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <div className="space-y-6">
                  <div className="barker-card p-8 border-l-4 border-l-blue-500">
                      <div className="flex items-center gap-3 mb-4 text-blue-400">
                          <Eye className="w-6 h-6" />
                          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Explainable AI (XAI)</h3>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">
                          We believe in "Glass Box" AI. All recommendations made by our Resume Forge and Career Resonance Engine are accompanied by transparent logic trails. 
                      </p>
                      <div className="bg-white/5 p-4 rounded border border-white/10 text-xs font-mono text-gray-400">
                          "Why this suggestion? This keyword appears in 85% of job descriptions matching your target role of Senior Architect."
                      </div>
                  </div>

                  <div className="barker-card p-8 border-l-4 border-l-green-500">
                      <div className="flex items-center gap-3 mb-4 text-green-400">
                          <Scale className="w-6 h-6" />
                          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Ethical Guidelines</h3>
                      </div>
                      <ul className="space-y-3 text-sm text-gray-300">
                          <li className="flex gap-3">
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span><strong>Human Review Mandatory:</strong> AI content is a draft, not a final submission. Users must review all outputs for authenticity.</span>
                          </li>
                          <li className="flex gap-3">
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span><strong>No False Representation:</strong> Our tools optimize truth, they do not fabricate experience.</span>
                          </li>
                      </ul>
                  </div>
              </div>

              <div className="space-y-6">
                  <div className="barker-card p-8 border-l-4 border-l-purple-500">
                      <div className="flex items-center gap-3 mb-4 text-purple-400">
                          <Users className="w-6 h-6" />
                          <h3 className="text-lg font-bold text-white uppercase tracking-wider">User Agency & Feedback</h3>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">
                          You retain full control. Our "Granular Feedback Loops" allow you to tweak AI models to better understand your unique career narrative over time.
                      </p>
                  </div>

                  <div className="barker-card p-8 border-l-4 border-l-barker-gold">
                      <div className="flex items-center gap-3 mb-4 text-barker-gold">
                          <FileJson className="w-6 h-6" />
                          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Data Sovereignty</h3>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                          Your resume data, application history, and interview recordings are stored locally or in your private cloud instance. We do not use your personal data to train public models without explicit consent.
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TrustCenter;
