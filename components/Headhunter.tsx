
import React, { useState } from 'react';
import { findKeyPeople } from '../services/geminiService';
import { KeyPerson } from '../types';
import { Users, Search, Building2, Briefcase, UserPlus, Linkedin, Mail } from 'lucide-react';

const Headhunter: React.FC = () => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [people, setPeople] = useState<KeyPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !role) return;
    
    setLoading(true);
    setPeople([]);
    setSearched(true);
    
    try {
      const results = await findKeyPeople(company, role);
      setPeople(results);
    } catch (e) {
      console.error(e);
      alert("Scout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
       <div className="flex items-center gap-6 mb-8 border-b border-barker-gold/20 pb-6">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel">
          <Users className="w-8 h-8 text-barker-gold" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">Headhunter Scout</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            Identify and locate key hiring decision-makers for your target roles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
              <div className="barker-card p-8 border-l-4 border-l-barker-gold h-fit reveal-on-scroll">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                      <Search className="w-4 h-4" /> Mission Parameters
                  </h3>
                  
                  <form onSubmit={handleSearch} className="space-y-6">
                      <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Target Company</label>
                          <div className="relative">
                              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                              <input 
                                value={company}
                                onChange={e => setCompany(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-600 rounded-xl p-4 pl-12 focus:outline-none focus:border-barker-gold focus:ring-1 focus:ring-barker-gold transition-all font-sans text-sm"
                                placeholder="E.g. Netflix"
                                autoFocus
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Role You Want</label>
                          <div className="relative">
                              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                              <input 
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-600 rounded-xl p-4 pl-12 focus:outline-none focus:border-barker-gold focus:ring-1 focus:ring-barker-gold transition-all font-sans text-sm"
                                placeholder="E.g. Senior Backend Engineer"
                              />
                          </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading || !company || !role}
                        className="btn-barker w-full py-5 flex items-center justify-center gap-3 shadow-xl mt-4"
                      >
                        {loading ? (
                            <>
                               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                               SCOUTING LINKEDIN...
                            </>
                        ) : (
                            <>
                               <Users className="w-4 h-4" /> DEPLOY SCOUT
                            </>
                        )}
                      </button>
                  </form>
                  
                  <div className="mt-6 pt-6 border-t border-white/5 text-[10px] text-gray-500 leading-relaxed font-mono">
                      <p>
                          <span className="text-barker-gold font-bold">INTEL TIP:</span> The scout uses live Google Search grounding to find the most relevant decision makers for this specific role.
                      </p>
                  </div>
              </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-2">
              {!searched && !loading && (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-600 opacity-50 border-2 border-dashed border-white/5 rounded-2xl reveal-on-scroll">
                      <UserPlus className="w-16 h-16 mb-4" />
                      <p className="font-mono text-xs uppercase tracking-[0.2em]">Awaiting Target Data</p>
                  </div>
              )}

              {loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(i => (
                          <div key={i} className="barker-card h-32 animate-pulse bg-white/5"></div>
                      ))}
                  </div>
              )}

              {people.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {people.map((person, idx) => (
                          <div key={idx} className="barker-card p-6 group hover:border-blue-500/50 transition-all relative overflow-hidden reveal-on-scroll" style={{ transitionDelay: `${idx * 50}ms` }}>
                              <div className="absolute top-0 right-0 p-16 bg-blue-500 opacity-0 group-hover:opacity-5 rounded-full blur-2xl transition-opacity"></div>
                              
                              <div className="flex items-start justify-between mb-4 relative z-10">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-gray-300 border border-white/5">
                                          {person.name.charAt(0)}
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{person.name}</h4>
                                          <p className="text-xs text-gray-500 uppercase tracking-wide">{person.title}</p>
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-black/40 p-3 rounded-lg border border-white/5 mb-4 relative z-10">
                                  <p className="text-xs text-gray-300 italic">"{person.relevance}"</p>
                              </div>

                              <div className="flex gap-2 relative z-10">
                                  <a 
                                    href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(person.name + " " + company)}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex-1 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded border border-blue-600/20 transition-colors text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-2"
                                  >
                                      <Linkedin className="w-3 h-3" /> Connect
                                  </a>
                                  <button className="flex-1 py-2 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white rounded border border-white/10 transition-colors text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-2">
                                      <Mail className="w-3 h-3" /> Draft Email
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {searched && !loading && people.length === 0 && (
                  <div className="text-center py-12 reveal-on-scroll">
                      <p className="text-gray-500 font-mono text-sm">No specific personnel found. Try broadening the role title.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Headhunter;
