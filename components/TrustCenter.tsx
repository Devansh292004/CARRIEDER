
import React, { useState } from 'react';
import { verifyCredential } from '../services/geminiService';
import { ShieldCheck, CheckCircle2, Plus, Search, Hexagon, Lock, Link as LinkIcon, Share2 } from 'lucide-react';
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
       <div className="flex items-center gap-6 mb-8 border-b border-barker-gold/20 pb-6">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel">
          <ShieldCheck className="w-8 h-8 text-barker-gold" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">Credential Verification</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            Verify and display your professional certifications on a secure digital ledger.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Add New Credential */}
        <div className="barker-card p-8 h-fit lg:sticky lg:top-8 reveal-on-scroll">
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
    </div>
  );
};

export default TrustCenter;
