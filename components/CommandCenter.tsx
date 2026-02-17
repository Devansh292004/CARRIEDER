
import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Command, LayoutDashboard, FileText, Users, Target, Shield, LogOut, Map, Zap, Mic, MicOff, AlertCircle, Hexagon } from 'lucide-react';
import { AppRoute } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { playHover, playClick, playSuccess, playError } from '../services/soundService';

interface CommandItem {
  id: string;
  label: string;
  keywords: string[];
  icon: React.FC<any>;
  action: () => void;
  shortcut?: string;
  group: 'Navigation' | 'Actions';
}

interface CommandCenterProps {
  onNavigate: (route: AppRoute) => void;
  isOpen: boolean;
  onClose: () => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ onNavigate, isOpen, onClose }) => {
  const { logout } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const commands: CommandItem[] = [
    { id: 'nav-dash', label: 'Dashboard', keywords: ['dashboard', 'home', 'main'], icon: LayoutDashboard, action: () => onNavigate(AppRoute.DASHBOARD), group: 'Navigation' },
    { id: 'nav-resume', label: 'Resume Forge', keywords: ['resume', 'builder', 'cv', 'forge'], icon: FileText, action: () => onNavigate(AppRoute.RESUME_FORGE), group: 'Navigation' },
    { id: 'nav-arch', label: 'System Architect', keywords: ['architect', 'system', 'design', 'case study', 'war room'], icon: Hexagon, action: () => onNavigate(AppRoute.SYSTEM_ARCHITECT), group: 'Navigation' },
    { id: 'nav-tracker', label: 'Application Tracker', keywords: ['tracker', 'applications', 'jobs', 'kanban'], icon: Target, action: () => onNavigate(AppRoute.APPLICATION_TRACKER), group: 'Navigation' },
    { id: 'nav-path', label: 'Career Pathfinder', keywords: ['path', 'roadmap', 'career', 'plan'], icon: Map, action: () => onNavigate(AppRoute.CAREER_PATHFINDER), group: 'Navigation' },
    { id: 'nav-net', label: 'Outreach Nexus', keywords: ['network', 'crm', 'contacts', 'outreach'], icon: Users, action: () => onNavigate(AppRoute.OUTREACH_NEXUS), group: 'Navigation' },
    { id: 'nav-trust', label: 'Trust Center', keywords: ['trust', 'security', 'credentials'], icon: Shield, action: () => onNavigate(AppRoute.TRUST_CENTER), group: 'Navigation' },
    
    { id: 'act-logout', label: 'System Logout', keywords: ['logout', 'sign out', 'exit'], icon: LogOut, action: () => logout(), group: 'Actions' },
    { id: 'act-scan', label: 'Quick Market Scan', keywords: ['scan', 'market', 'trends'], icon: Zap, action: () => { onNavigate(AppRoute.DASHBOARD); }, group: 'Actions' },
  ];

  // Ref to hold the latest commands to avoid stale closures in the voice callback
  const commandsRef = useRef(commands);
  useEffect(() => {
      commandsRef.current = commands;
  });

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) || 
    cmd.keywords.some(k => k.includes(query.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      playClick(); // Sound effect on open
      setVoiceError('');
    } else {
        if (isListening) stopVoice();
    }
  }, [isOpen]);

  // Voice Recognition Setup
  useEffect(() => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          
          recognition.onstart = () => {
              setIsListening(true);
              setVoiceError('');
          };

          recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript.toLowerCase().trim();
              setQuery(transcript);
              
              // Access latest commands via ref
              const currentCommands = commandsRef.current;
              const exactMatch = currentCommands.find(c => c.keywords.some(k => transcript.includes(k)));
              
              if (exactMatch) {
                  playSuccess();
                  exactMatch.action();
                  onClose();
              } else {
                  playHover(); // Feedback for input received
              }
              setIsListening(false);
          };

          recognition.onerror = (event: any) => {
              console.error("Speech recognition error", event.error);
              setIsListening(false);
              playError();
              if (event.error === 'not-allowed') {
                  setVoiceError('Mic access denied');
              } else if (event.error === 'no-speech') {
                  setVoiceError('No speech detected');
              } else {
                  setVoiceError('Voice error');
              }
          };
          
          recognition.onend = () => {
              setIsListening(false);
          };

          recognitionRef.current = recognition;
      }
  }, []);

  const startVoice = async () => {
      if (!recognitionRef.current) {
          alert("Voice control not supported in this browser. Try Chrome/Safari.");
          return;
      }
      
      setVoiceError('');
      
      try {
          // Explicitly request mic permission first to ensure 'not-allowed' doesn't fire immediately
          // due to browser policies in iframes/embedded contexts.
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop tracks immediately as we only needed the permission grant
          stream.getTracks().forEach(track => track.stop());
          
          // Now start the actual recognition engine
          recognitionRef.current.start();
          playClick();
      } catch (e) {
          console.error("Failed to start voice or denied permission", e);
          setVoiceError('Check Mic Permissions');
          playError();
      }
  };

  const stopVoice = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsListening(false);
      }
  };

  const toggleVoice = () => {
      if (isListening) {
          stopVoice();
      } else {
          startVoice();
      }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        playHover();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        playHover();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          playSuccess();
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-[#0F0F0F] border border-barker-gold/30 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-fade-in-up transform scale-100 opacity-100">
        
        {/* Search Bar */}
        <div className="flex items-center px-4 py-4 border-b border-white/5 bg-white/5 relative">
          <Search className="w-5 h-5 text-barker-gold mr-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); playHover(); }}
            placeholder={isListening ? "Listening..." : "Type a command or say 'Dashboard'..."}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-mono text-sm h-6"
          />
          <div className="flex items-center gap-2">
             {voiceError && <span className="text-[10px] text-red-500 font-bold uppercase animate-pulse flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {voiceError}</span>}
             <button 
                onClick={toggleVoice}
                className={`p-1.5 rounded transition-all ${isListening ? 'bg-red-600 text-white animate-pulse' : 'text-gray-500 hover:text-white'}`}
                title="Voice Command"
             >
                 {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
             </button>
             <span className="text-[10px] text-gray-500 font-mono border border-white/10 rounded px-1.5 py-0.5 hidden sm:inline">ESC</span>
          </div>
          
          {/* Voice Visualizer Bar */}
          {isListening && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 flex justify-center gap-1">
                  <div className="w-full bg-red-500 animate-[pulse_0.5s_infinite]"></div>
              </div>
          )}
        </div>

        {/* List */}
        <div className="max-h-[300px] overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/10" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-xs font-mono uppercase tracking-widest">
              No matching commands
            </div>
          ) : (
            <>
              {['Navigation', 'Actions'].map(group => {
                const groupCommands = filteredCommands.filter(c => c.group === group);
                if (groupCommands.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="px-4 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest sticky top-0 bg-[#0F0F0F] z-10">
                      {group}
                    </div>
                    {groupCommands.map((cmd) => {
                      const realIndex = filteredCommands.indexOf(cmd);
                      const isSelected = realIndex === selectedIndex;
                      
                      return (
                        <div
                          key={cmd.id}
                          onClick={() => { playSuccess(); cmd.action(); onClose(); }}
                          onMouseEnter={() => { if (!isSelected) { setSelectedIndex(realIndex); playHover(); } }}
                          className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-barker-gold/10 border-l-2 border-barker-gold' : 'border-l-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${isSelected ? 'bg-barker-gold text-white' : 'bg-white/5 text-gray-400'}`}>
                               <cmd.icon className="w-4 h-4" />
                            </div>
                            <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
                              {cmd.label}
                            </span>
                          </div>
                          {isSelected && <ArrowRight className="w-4 h-4 text-barker-gold" />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase">
           <span>Carrieder OS v4.6</span>
           <div className="flex gap-3">
              <span>Voice Ready <Mic className="w-3 h-3 inline ml-1" /></span>
              <span>Select <span className="text-gray-400">↵</span></span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
