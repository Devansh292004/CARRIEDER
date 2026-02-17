import React, { useState, useRef } from 'react';
import { simulateTribunal } from '../services/geminiService';
import { TribunalSession, TribunalMember } from '../types';
import { parseFile } from '../services/fileService';
import { FileData } from '../types';
import { 
    Users, Upload, Eye, Lock, 
    ShieldAlert, Terminal, Gavel
} from 'lucide-react';

interface MemberAvatarProps {
    member: TribunalMember;
    hoveredMember: string | null;
    setHoveredMember: (id: string | null) => void;
}

// Extract component to avoid recreating it on every render and fix key prop issues
const MemberAvatar: React.FC<MemberAvatarProps> = ({ 
    member, 
    hoveredMember, 
    setHoveredMember 
}) => {
    const isHovered = hoveredMember === member.id;
    const colors: Record<string, string> = {
        'Hiring Manager': 'bg-blue-600',
        'Skeptic Peer': 'bg-red-600',
        'Gatekeeper HR': 'bg-yellow-600'
    };
    
    return (
        <div 
          className="relative group cursor-help"
          onMouseEnter={() => setHoveredMember(member.id)}
          onMouseLeave={() => setHoveredMember(null)}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 border-black shadow-lg ${colors[member.role] || 'bg-gray-600'} transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
                {member.avatarInitials}
            </div>
            
            {/* Hidden Agenda Tooltip */}
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-black border border-white/20 rounded p-3 text-[10px] text-gray-300 pointer-events-none transition-all duration-300 z-50 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div className="font-bold text-white mb-1 uppercase tracking-wider">{member.role}</div>
                <div className="text-barker-gold italic">"{member.hiddenAgenda}"</div>
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-black border-r border-b border-white/20 rotate-45"></div>
            </div>
        </div>
    );
};

const TheTribunal: React.FC = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [session, setSession] = useState<TribunalSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSimulate = async () => {
      if (!fileData || !company || !role) return;
      setLoading(true);
      setSession(null);
      try {
          const resumeText = fileData.text || "Standard Resume";
          const result = await simulateTribunal(resumeText, company, role);
          setSession(result);
      } catch (e) {
          alert("Connection failed. Simulation blocked.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12 h-[calc(100vh-100px)] flex flex-col">
       <div className="flex items-center gap-6 mb-4 border-b border-barker-gold/20 pb-6 shrink-0">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel shadow-[0_0_30px_rgba(229,62,62,0.15)] relative overflow-hidden">
           <div className="absolute inset-0 bg-barker-gold/10 animate-pulse-slow"></div>
           <Gavel className="w-8 h-8 text-barker-gold relative z-10" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">Hiring Committee Simulator</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            Simulated Discussion • Gemini 3 Pro
          </p>
        </div>
      </div>

      {!session && !loading && (
          <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-2xl barker-card p-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-barker-gold/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="text-center mb-10">
                      <h3 className="text-2xl font-bold text-white mb-4">Analyze the Hiring Decision</h3>
                      <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
                          Upload your resume and target role. The AI will simulate the discussion between hiring committee members. Understand the potential objections and strengths of your application.
                      </p>
                  </div>

                  <div className="space-y-6">
                       <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed p-6 flex items-center justify-center gap-4 cursor-pointer transition-all rounded-xl ${fileData ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:border-white/30 bg-black/40'}`}
                        >
                            {fileData ? <div className="w-6 h-6 text-green-500">✓</div> : <Upload className="w-6 h-6 text-gray-500"/>}
                            <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">{fileData ? 'Resume Loaded' : 'Upload Resume'}</span>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <input 
                              value={company}
                              onChange={e => setCompany(e.target.value)}
                              placeholder="Target Company"
                              className="bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-barker-gold outline-none"
                           />
                           <input 
                              value={role}
                              onChange={e => setRole(e.target.value)}
                              placeholder="Target Role"
                              className="bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-barker-gold outline-none"
                           />
                       </div>

                       <button 
                          onClick={handleSimulate}
                          disabled={!fileData || !company || !role}
                          className="btn-barker w-full py-5 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl"
                       >
                           <Eye className="w-4 h-4" /> START SIMULATION
                       </button>
                  </div>
              </div>
          </div>
      )}

      {loading && (
          <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-xs text-green-500 space-y-2">
                  <div className="flex items-center gap-2">
                      <Terminal className="w-3 h-3" />
                      <span>INITIALIZING SIMULATION...</span>
                  </div>
                  <div className="flex items-center gap-2 animate-pulse delay-75">
                      <Terminal className="w-3 h-3" />
                      <span>GENERATING PERSONAS...</span>
                  </div>
                  <div className="flex items-center gap-2 animate-pulse delay-150">
                      <Terminal className="w-3 h-3" />
                      <span>SIMULATING DISCUSSION...</span>
                  </div>
              </div>
          </div>
      )}

      {session && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
              {/* Left: The Members */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="barker-card p-6 border-l-4 border-l-barker-gold">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Committee Members
                      </h3>
                      <div className="flex justify-center gap-4 mb-8">
                          {session.members.map(m => (
                              <MemberAvatar 
                                key={m.id} 
                                member={m} 
                                hoveredMember={hoveredMember}
                                setHoveredMember={setHoveredMember}
                              />
                          ))}
                      </div>
                      <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest">
                          Hover to reveal perspectives
                      </p>
                  </div>

                  <div className={`barker-card p-6 border-l-4 ${session.finalVerdict === 'HIRE' ? 'border-l-green-500' : session.finalVerdict === 'NO_HIRE' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hiring Decision</h3>
                      <div className={`text-4xl font-black uppercase tracking-tighter mb-2 ${session.finalVerdict === 'HIRE' ? 'text-green-500' : session.finalVerdict === 'NO_HIRE' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {session.finalVerdict.replace('_', ' ')}
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed border-t border-white/10 pt-4">
                          "{session.verdictReason}"
                      </p>
                  </div>
              </div>

              {/* Right: The Chat Stream */}
              <div className="lg:col-span-2 barker-card p-0 flex flex-col bg-[#1a1d21] border-gray-800 overflow-hidden relative">
                  {/* Fake Slack Header */}
                  <div className="bg-[#1a1d21] border-b border-gray-700 p-4 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                          <Lock className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-bold text-white">#hiring-committee</span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-400">
                           <div className="flex -space-x-2">
                               {session.members.map(m => (
                                   <div key={m.id} className="w-5 h-5 rounded bg-gray-600 border border-[#1a1d21]"></div>
                               ))}
                           </div>
                           <span className="text-xs">3 members</span>
                      </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/20">
                      {session.transcript.map((msg, i) => {
                          const member = session.members.find(m => m.id === msg.memberId);
                          return (
                              <div key={i} className="flex gap-4 group animate-fade-in-up" style={{ animationDelay: `${i * 300}ms` }}>
                                  <div className="w-10 h-10 rounded bg-gray-700 flex-shrink-0 flex items-center justify-center font-bold text-white text-xs">
                                      {member?.avatarInitials}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex items-baseline gap-2 mb-1">
                                          <span className="font-bold text-white text-sm">{member?.name}</span>
                                          <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                                      </div>
                                      <div className={`text-sm text-gray-300 leading-relaxed ${msg.referencesResume ? 'bg-white/5 p-3 rounded border-l-2 border-barker-gold' : ''}`}>
                                          {msg.text}
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                      
                      {/* Fake Typing Indicator */}
                      <div className="flex gap-4 opacity-50 animate-pulse delay-[2000ms]">
                          <div className="w-10 h-10 rounded bg-transparent"></div>
                          <div className="text-xs text-gray-500 italic">Someone is typing...</div>
                      </div>
                  </div>
                  
                  {/* Fake Input */}
                  <div className="p-4 border-t border-gray-700 bg-[#1a1d21] shrink-0">
                      <div className="w-full bg-[#222529] border border-gray-600 rounded p-3 text-xs text-gray-500 flex justify-between items-center cursor-not-allowed">
                          <span>You do not have permission to post in this channel.</span>
                          <ShieldAlert className="w-3 h-3 text-gray-500" />
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TheTribunal;