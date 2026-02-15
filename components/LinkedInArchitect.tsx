
import React, { useState } from 'react';
import { Linkedin, LayoutTemplate, PenTool, Sparkles, Image as ImageIcon, Copy, Check, MessageSquare, Briefcase, ThumbsUp, MoreHorizontal, Globe, User, TrendingUp, Zap, Target } from 'lucide-react';
import { generateLinkedInStrategy, generateLinkedInPost, generateBrandAsset } from '../services/geminiService';
import { LinkedInProfileStrategy, LinkedInPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

const LinkedInArchitect: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'content'>('profile');
  const [loading, setLoading] = useState(false);

  // Profile State
  const [targetRole, setTargetRole] = useState('');
  const [expertise, setExpertise] = useState('');
  const [strategy, setStrategy] = useState<LinkedInProfileStrategy | null>(null);

  // Content State
  const [topic, setTopic] = useState('');
  const [postTone, setPostTone] = useState('Contrarian');
  const [postFormat, setPostFormat] = useState('Hook-Story-Lesson');
  const [post, setPost] = useState<LinkedInPost | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- PRESETS ---
  const profilePresets = [
      { label: "Executive Leader", role: "VP of Engineering", exp: "Strategic leadership, scaling teams from 10 to 100, M&A due diligence." },
      { label: "Startup Founder", role: "Tech Founder / CEO", exp: "Zero to one product building, fundraising, disruptive innovation." },
      { label: "Thought Leader", role: "AI Consultant", exp: "Generative AI implementation, ethics in AI, future of work trends." }
  ];

  const contentTemplates = [
      { label: "The 'Hot Take'", topic: "Why standard hiring practices are broken", tone: "Contrarian", format: "PAS (Problem-Agitate-Solution)" },
      { label: "Career Lesson", topic: "My biggest mistake as a junior dev", tone: "Personal Story", format: "Hook-Story-Lesson" },
      { label: "Industry Analysis", topic: "The state of React in 2024", tone: "Data-Driven", format: "Listicle" }
  ];

  // --- HANDLERS ---

  const handleProfileGen = async () => {
      if (!targetRole || !expertise) return;
      setLoading(true);
      setStrategy(null);
      try {
          const res = await generateLinkedInStrategy(user?.title || 'Professional', targetRole, expertise);
          setStrategy(res);
      } catch (e) {
          alert("Strategy generation failed.");
      } finally {
          setLoading(false);
      }
  };

  const handlePostGen = async () => {
      if (!topic) return;
      setLoading(true);
      setPost(null);
      setGeneratedImage(null);
      try {
          const res = await generateLinkedInPost(topic, postTone, postFormat);
          setPost(res);
      } catch (e) {
          alert("Post generation failed.");
      } finally {
          setLoading(false);
      }
  };

  const handleImageGen = async () => {
      if (!post?.imagePrompt) return;
      setImgLoading(true);
      try {
          const res = await generateBrandAsset(post.imagePrompt);
          setGeneratedImage(res);
      } catch (e) {
          alert("Image gen failed.");
      } finally {
          setImgLoading(false);
      }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // --- COMPONENTS ---

  const ProfileWireframe = () => (
      <div className="border-2 border-dashed border-white/10 rounded-xl p-8 h-full min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden bg-white/5 opacity-50">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
          
          <div className="w-full max-w-sm space-y-6 opacity-50 blur-[1px]">
              <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/10"></div>
                  <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  </div>
              </div>
              <div className="space-y-2">
                  <div className="h-20 bg-white/10 rounded w-full"></div>
                  <div className="h-40 bg-white/10 rounded w-full"></div>
              </div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="p-4 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl flex flex-col items-center gap-3">
                  <User className="w-8 h-8 text-gray-500" />
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Awaiting Profile Data</p>
              </div>
          </div>
      </div>
  );

  // --- RENDER FUNCTIONS ---

  const renderProfileView = () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-6">
              <div className="barker-card p-8 border-l-4 border-l-blue-500 h-fit reveal-on-scroll">
                  <div className="flex items-center gap-2 mb-6 text-blue-400">
                      <LayoutTemplate className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Profile Diagnostics</h3>
                  </div>
                  
                  <div className="space-y-6">
                      <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Target Role / Goal</label>
                          <input 
                              value={targetRole}
                              onChange={e => setTargetRole(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition-colors"
                              placeholder="E.g. Chief Technology Officer"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Core Expertise / USP</label>
                          <textarea 
                              value={expertise}
                              onChange={e => setExpertise(e.target.value)}
                              className="w-full h-32 bg-black/40 border border-white/10 text-white rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition-colors resize-none"
                              placeholder="E.g. Scaling distributed systems, leading 50+ person teams, AI integration..."
                          />
                      </div>
                      <button 
                          onClick={handleProfileGen}
                          disabled={loading || !targetRole}
                          className="btn-barker w-full py-4 flex items-center justify-center gap-2 shadow-xl bg-blue-600 hover:bg-blue-500"
                      >
                          {loading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ANALYZING...
                              </>
                          ) : (
                              'ARCHITECT PROFILE'
                          )}
                      </button>
                  </div>
              </div>

              {/* Quick Start Presets */}
              <div className="barker-card p-6 reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-barker-gold" /> Quick Load Persona
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                      {profilePresets.map((preset, i) => (
                          <button 
                            key={i}
                            onClick={() => { setTargetRole(preset.role); setExpertise(preset.exp); }}
                            className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:border-blue-500/30 transition-all group text-left"
                          >
                              <div>
                                  <span className="text-sm font-bold text-gray-300 group-hover:text-white block">{preset.label}</span>
                                  <span className="text-[10px] text-gray-500">{preset.role}</span>
                              </div>
                              <ArrowIcon className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                          </button>
                      ))}
                  </div>
              </div>
          </div>

          <div className="flex flex-col h-full">
              {strategy ? (
                  <div className="space-y-6 animate-fade-in-up">
                       {/* Score Card */}
                       <div className="barker-card p-6 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-transparent border-blue-500/30 reveal-on-scroll">
                           <div>
                               <p className="text-xs font-bold uppercase text-blue-400 mb-1">Brand Strength</p>
                               <h3 className="text-3xl font-bold text-white">{strategy.score}/100</h3>
                           </div>
                           <div className="w-20 h-20 rounded-full border-4 border-blue-500 flex items-center justify-center text-blue-400 font-bold bg-blue-500/10 text-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                               {strategy.score}
                           </div>
                       </div>

                       {/* Headlines */}
                       <div className="barker-card p-6 border-t-2 border-t-barker-gold reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
                           <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                               <Sparkles className="w-4 h-4 text-barker-gold" /> Viral Headlines
                           </h4>
                           <div className="space-y-3">
                               {strategy.headlineOptions.map((opt, i) => (
                                   <div key={i} className="p-4 bg-black/40 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:border-barker-gold/30 transition-all cursor-pointer group relative overflow-hidden" onClick={() => copyToClipboard(opt)}>
                                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-barker-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                       {opt}
                                       <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[10px] text-barker-gold font-bold uppercase tracking-wider flex items-center gap-1 bg-black/80 px-2 py-1 rounded">
                                           <Copy className="w-3 h-3" /> Copy
                                       </span>
                                   </div>
                               ))}
                           </div>
                       </div>

                       {/* About */}
                       <div className="barker-card p-6 relative group border-t-2 border-t-purple-500 reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-purple-500" /> Optimized About Section
                            </h4>
                            <div className="prose prose-sm prose-invert max-w-none text-gray-400 bg-black/40 p-6 rounded-lg border border-white/5 font-sans leading-relaxed">
                                <ReactMarkdown>{strategy.aboutSection}</ReactMarkdown>
                            </div>
                            <button 
                                onClick={() => copyToClipboard(strategy.aboutSection)}
                                className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors bg-black/50 rounded-lg border border-white/10"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                       </div>
                  </div>
              ) : (
                  <ProfileWireframe />
              )}
          </div>
      </div>
  );

  const renderContentView = () => (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in">
          {/* Editor Column */}
          <div className="space-y-6">
              <div className="barker-card p-8 h-fit border-l-4 border-l-barker-gold reveal-on-scroll">
                  <div className="flex items-center gap-2 mb-6 text-barker-gold">
                      <PenTool className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Content Engine</h3>
                  </div>
                  
                  <div className="space-y-6">
                      <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Topic / Idea</label>
                          <input 
                              value={topic}
                              onChange={e => setTopic(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 text-sm focus:border-barker-gold outline-none transition-colors"
                              placeholder="E.g. Why remote work is failing junior devs"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Tone</label>
                              <select 
                                value={postTone}
                                onChange={e => setPostTone(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 text-sm focus:border-barker-gold outline-none transition-colors appearance-none"
                              >
                                  {['Contrarian', 'Educational', 'Personal Story', 'Data-Driven', 'Inspirational'].map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Framework</label>
                              <select 
                                value={postFormat}
                                onChange={e => setPostFormat(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 text-sm focus:border-barker-gold outline-none transition-colors appearance-none"
                              >
                                  {['Hook-Story-Lesson', 'AIDA (Attention-Interest-Desire-Action)', 'PAS (Problem-Agitate-Solution)', 'Listicle'].map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                      </div>

                      <button 
                          onClick={handlePostGen}
                          disabled={loading || !topic}
                          className="btn-barker w-full py-4 flex items-center justify-center gap-2 shadow-xl"
                      >
                          {loading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                WRITING...
                              </>
                          ) : (
                              'GENERATE POST'
                          )}
                      </button>
                  </div>
              </div>

              {/* Viral Templates */}
              <div className="barker-card p-6 reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-green-500" /> Viral Blueprints
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                      {contentTemplates.map((template, i) => (
                          <button 
                            key={i}
                            onClick={() => { setTopic(template.topic); setPostTone(template.tone); setPostFormat(template.format); }}
                            className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:border-green-500/30 transition-all group text-left"
                          >
                              <div>
                                  <span className="text-sm font-bold text-gray-300 group-hover:text-white block">{template.label}</span>
                                  <div className="flex gap-2 mt-1">
                                      <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded text-gray-500">{template.tone}</span>
                                      <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded text-gray-500">{template.format.split(' ')[0]}</span>
                                  </div>
                              </div>
                              <PlusIcon className="opacity-0 group-hover:opacity-100 transition-opacity text-green-400" />
                          </button>
                      ))}
                  </div>
              </div>
          </div>

          {/* Simulator Column */}
          <div className="flex justify-center items-start pt-4 reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
              <div className="w-full max-w-[480px] bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200 transform transition-all duration-500">
                  {/* LinkedIn Header Sim */}
                  <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100">
                          <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">{user?.name?.charAt(0) || 'U'}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate hover:text-blue-600 cursor-pointer">{user?.name || 'Your Name'}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.title || 'Your Headline'}</p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1"><Globe className="w-3 h-3" /> 1h • Edited</p>
                      </div>
                      <MoreHorizontal className="w-5 h-5 text-gray-500 cursor-pointer" />
                  </div>

                  {/* Body */}
                  <div className="p-4 min-h-[300px] text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {post ? (
                          <>
                            <p className="font-bold mb-3 text-gray-900">{post.hook}</p>
                            <p className="mb-3 text-gray-800">{post.body}</p>
                            <p className="text-blue-600 font-medium mb-3 cursor-pointer hover:underline">{post.cta}</p>
                            <p className="text-blue-600 font-bold cursor-pointer hover:underline">{post.hashtags.join(' ')}</p>
                          </>
                      ) : (
                          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-gray-400 opacity-40">
                              <MessageSquare className="w-16 h-16 mb-4" />
                              <p className="text-xs uppercase font-bold tracking-widest">Preview Mode Active</p>
                              <p className="text-[10px] mt-2">Generated content will appear here</p>
                          </div>
                      )}
                  </div>

                  {/* Image Area */}
                  <div className="w-full bg-gray-100 border-t border-gray-100 relative min-h-[250px] flex items-center justify-center group overflow-hidden">
                      {generatedImage ? (
                          <img src={generatedImage} alt="Post Visual" className="w-full h-auto object-cover" />
                      ) : (
                          <div className="text-center p-6">
                              {post?.imagePrompt ? (
                                  <button 
                                    onClick={handleImageGen}
                                    disabled={imgLoading}
                                    className="px-6 py-3 bg-white shadow-xl rounded-full text-xs font-bold text-blue-600 flex items-center gap-2 hover:bg-blue-50 transition-all transform hover:scale-105"
                                  >
                                      {imgLoading ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/> : <ImageIcon className="w-4 h-4" />}
                                      GENERATE AI VISUAL
                                  </button>
                              ) : (
                                  <div className="text-gray-300 flex flex-col items-center">
                                      <ImageIcon className="w-12 h-12 mb-2" />
                                      <span className="text-xs uppercase font-bold">Visual Asset Slot</span>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>

                  {/* Footer Actions */}
                  <div className="border-t border-gray-100 p-2 flex justify-between px-8 bg-white">
                      <div className="flex flex-col items-center gap-1 text-gray-500 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors flex-1">
                          <ThumbsUp className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Like</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-gray-500 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors flex-1">
                          <MessageSquare className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Comment</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-gray-500 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors flex-1">
                          <Briefcase className="w-5 h-5" />
                          <span className="text-[10px] font-bold">Repost</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const ArrowIcon = ({ className }: { className?: string }) => (
      <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
  );

  const PlusIcon = ({ className }: { className?: string }) => (
      <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
      <div className="flex items-center gap-6 mb-8 border-b border-barker-gold/20 pb-6">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel shadow-[0_0_20px_rgba(229,62,62,0.15)] rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-barker-gold/10 animate-pulse-slow"></div>
          <Linkedin className="w-8 h-8 text-barker-gold relative z-10" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">LinkedIn Architect</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            Profile Optimization & Content Engine
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 bg-black/20 p-1 rounded-xl w-fit border border-white/5">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
              <LayoutTemplate className="w-4 h-4" /> Profile Architect
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'content' ? 'bg-barker-gold text-white shadow-lg' : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
              <PenTool className="w-4 h-4" /> Content Engine
          </button>
      </div>

      {activeTab === 'profile' ? renderProfileView() : renderContentView()}
    </div>
  );
};

export default LinkedInArchitect;
