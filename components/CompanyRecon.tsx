
import React, { useState } from 'react';
import { generateCompanyDossier, getLocationIntel } from '../services/geminiService';
import { CompanyDossier, MapLocation } from '../types';
import { 
    Globe, ArrowRight, Building2, Crosshair, Users, 
    TrendingUp, ShieldAlert, BarChart3, Newspaper, Sparkles, Search, Target, Radar, MapPin
} from 'lucide-react';

const CompanyRecon: React.FC = () => {
  const [query, setQuery] = useState('');
  const [dossier, setDossier] = useState<CompanyDossier | null>(null);
  const [hqIntel, setHqIntel] = useState<{text: string, locations: MapLocation[]} | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setDossier(null);
    setHqIntel(null);
    try {
      // Parallel execution for max speed
      const [data, locData] = await Promise.all([
          generateCompanyDossier(query),
          getLocationIntel(query)
      ]);
      setDossier(data);
      setHqIntel(locData);
    } catch (error) {
      console.error(error);
      alert("Intel gathering failed. Check connection or try again.");
    } finally {
      setLoading(false);
    }
  };

  const SentimentBadge = ({ sentiment }: { sentiment: 'positive' | 'negative' | 'neutral' }) => {
      const colors = {
          positive: 'bg-green-500/10 text-green-500 border-green-500/20',
          negative: 'bg-red-500/10 text-red-500 border-red-500/20',
          neutral: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      };
      return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colors[sentiment]}`}>
              {sentiment}
          </span>
      );
  };

  if (!dossier && !loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-barker-gold/5 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20"></div>
            </div>

            <div className="relative z-10 w-full max-w-3xl px-6">
                <div className="text-center mb-16">
                     <div className="inline-flex items-center justify-center p-5 border border-barker-gold/30 bg-barker-panel/80 backdrop-blur-md mb-10 rounded-2xl shadow-[0_0_40px_rgba(229,62,62,0.15)] ring-1 ring-white/5 reveal-on-scroll">
                        <Globe className="w-12 h-12 text-barker-gold" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight mb-6 drop-shadow-2xl reveal-on-scroll" style={{transitionDelay: '100ms'}}>Company Intelligence</h1>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-widest reveal-on-scroll" style={{transitionDelay: '200ms'}}>
                        Deep intelligence gathering with Map Grounding and Sentiment Analysis.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="relative group mb-20 max-w-2xl mx-auto reveal-on-scroll" style={{transitionDelay: '300ms'}}>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-barker-gold/0 via-barker-gold/40 to-barker-gold/0 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-black/80 border border-white/10 rounded-xl overflow-hidden transition-all shadow-2xl group-focus-within:border-barker-gold/50 group-focus-within:bg-black/90">
                        <div className="pl-8 pr-4 flex items-center justify-center">
                            <Crosshair className="w-6 h-6 text-gray-500 group-focus-within:text-barker-gold transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="ENTER TARGET ENTITY (E.G. NVIDIA)..."
                            className="w-full bg-transparent border-none text-white text-lg px-4 py-8 focus:ring-0 placeholder-gray-700 font-mono tracking-wide uppercase outline-none"
                            autoFocus
                        />
                        <div className="pr-3">
                            <button 
                                type="submit"
                                className="px-8 py-4 bg-barker-gold hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-lg hover:shadow-barker-gold/20 flex-shrink-0"
                            >
                                Search Company
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
      );
  }

  if (loading) {
      return (
          <div className="h-full flex flex-col items-center justify-center min-h-[70vh]">
              <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-barker-gold rounded-full animate-spin"></div>
                  <Globe className="absolute inset-0 m-auto w-8 h-8 text-barker-gold animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 tracking-widest uppercase">Gathering Data</h2>
              <div className="font-mono text-xs text-barker-gold">
                  <span className="inline-block animate-pulse">ESTABLISHING SECURE CONNECTION...</span>
              </div>
          </div>
      );
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 lg:space-y-8 pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-barker-gold/20 pb-6 mb-8">
        <div className="flex items-center gap-6">
            <div className="p-4 border border-barker-gold/30 bg-barker-panel">
                 <Globe className="w-8 h-8 text-barker-gold" />
            </div>
            <div>
                <h2 className="text-4xl font-display font-bold text-white mb-1">{dossier?.companyName}</h2>
                <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-gray-500">
                    <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-green-500" /> SECURE CONNECTION</span>
                    <span>•</span>
                    <span>SOURCE: {dossier?.sources.length} NODES</span>
                </div>
            </div>
        </div>
        
        <form onSubmit={handleSearch} className="flex items-center bg-black/40 border border-white/10 rounded-lg px-2 w-full md:w-auto focus-within:border-white/30 transition-colors">
            <Search className="w-4 h-4 text-gray-500 ml-2" />
            <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="NEW SEARCH..."
                className="bg-transparent border-none text-white text-xs px-3 py-3 focus:ring-0 w-full md:w-48 placeholder-gray-600 outline-none"
            />
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left: Summary & Financials */}
              <div className="lg:col-span-1 space-y-6 reveal-on-scroll" style={{transitionDelay: '0ms'}}>
                  <div className="barker-card p-6 border-t-4 border-t-barker-gold">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Executive Summary</h3>
                      <p className="text-sm text-gray-300 leading-relaxed font-sans">{dossier?.summary}</p>
                  </div>

                  <div className="barker-card p-0 overflow-hidden">
                      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-barker-gold" />
                          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Financial Matrix</h4>
                      </div>
                      <div className="divide-y divide-white/5">
                          {dossier?.financials.map((metric, i) => (
                              <div key={i} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                                  <span className="text-xs text-gray-500 uppercase font-bold">{metric.label}</span>
                                  <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-white font-mono">{metric.value}</span>
                                      {metric.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                                      {metric.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Middle: Map Intel & SWOT */}
              <div className="lg:col-span-1 flex flex-col gap-6 reveal-on-scroll" style={{transitionDelay: '100ms'}}>
                  {hqIntel && (
                      <div className="barker-card p-6 border-l-4 border-l-blue-500">
                          <div className="flex items-center gap-2 mb-4 text-blue-400">
                              <MapPin className="w-4 h-4" />
                              <h4 className="text-xs font-bold uppercase tracking-widest">Satellite Recon</h4>
                          </div>
                          <p className="text-xs text-gray-300 mb-4">{hqIntel.text}</p>
                          <div className="space-y-2">
                              {hqIntel.locations.map((loc, i) => (
                                  <a key={i} href={loc.uri} target="_blank" rel="noreferrer" className="block p-2 bg-white/5 rounded border border-white/10 hover:border-blue-500 transition-colors text-xs text-gray-400 hover:text-white truncate">
                                      <span className="font-bold mr-2 text-blue-400">LOC-{i+1}</span> {loc.title}
                                  </a>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="barker-card p-0 h-full flex flex-col border border-white/10">
                      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                          <Radar className="w-4 h-4 text-barker-gold" />
                          <h4 className="text-xs font-bold uppercase tracking-widest text-white">S.W.O.T. Analysis</h4>
                      </div>
                      <div className="flex-1 p-4 space-y-4">
                          <div className="text-xs">
                              <span className="text-green-500 font-bold block mb-1">STRENGTHS</span>
                              {dossier?.swot.strengths.slice(0,2).join(', ')}
                          </div>
                          <div className="text-xs">
                              <span className="text-red-500 font-bold block mb-1">WEAKNESSES</span>
                              {dossier?.swot.weaknesses.slice(0,2).join(', ')}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Right: Culture & News */}
              <div className="lg:col-span-1 space-y-6 reveal-on-scroll" style={{transitionDelay: '200ms'}}>
                   <div className="barker-card p-6 bg-gradient-to-br from-black/60 to-purple-900/10 border-l-4 border-l-purple-500 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
                      <div className="flex items-center gap-2 mb-3 text-purple-400 relative z-10">
                          <Sparkles className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-widest">Culture Decoder</h4>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed relative z-10">{dossier?.cultureDecoder}</p>
                   </div>

                   <div className="barker-card p-0">
                      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                          <Newspaper className="w-4 h-4 text-barker-gold" />
                          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Latest Intelligence</h4>
                      </div>
                      <div className="divide-y divide-white/5">
                          {dossier?.recentNews.map((news, i) => (
                              <div key={i} className="p-4 hover:bg-white/5 transition-colors group">
                                  <div className="flex justify-between items-start mb-2">
                                      <SentimentBadge sentiment={news.sentiment} />
                                      {news.url && <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-white transition-colors" />}
                                  </div>
                                  <a href={news.url || '#'} target="_blank" rel="noreferrer" className="block">
                                      <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors line-clamp-2">{news.headline}</p>
                                  </a>
                              </div>
                          ))}
                      </div>
                   </div>
              </div>
          </div>
    </div>
  );
};

export default CompanyRecon;
