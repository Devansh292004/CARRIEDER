
import React, { useState, useEffect, useRef } from 'react';
import { createInterviewContext, sendChatToAI, transcribeAudio, generateSpeech, decodeAudioData } from '../services/geminiService';
import { parseFile } from '../services/fileService';
import { ChatMessage, FileData } from '../types';
import { Send, User, Bot, Briefcase, Play, FileType, Upload, Mic, Volume2, VolumeX, BarChart3, Activity, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const InterviewCoach: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [jobContext, setJobContext] = useState('');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true); // Default ON for voice app
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
      // Init Audio Context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      return () => { audioContextRef.current?.close(); }
  }, []);

  const playResponse = async (text: string) => {
      if (!soundEnabled) return;
      try {
          const audioBase64 = await generateSpeech(text);
          if (audioContextRef.current && audioBase64) {
              const buffer = decodeAudioData(audioBase64, audioContextRef.current);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              source.start(0);
          }
      } catch (e) {
          console.error("TTS Failed", e);
      }
  };

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

  const startSession = async () => {
    if (!jobContext.trim()) return;
    setLoading(true);
    try {
      const instruction = createInterviewContext(jobContext, fileData || undefined);
      setSystemInstruction(instruction);
      setStarted(true);
      
      const history: ChatMessage[] = [{ role: 'user', content: "I am ready. Start the interview." }];
      const result = await sendChatToAI(history, instruction);
      
      if (result?.text) {
         setMessages([{ role: 'model', content: result.text }]);
         playResponse(result.text);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to start Gemini session.");
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                  const base64Audio = (reader.result as string).split(',')[1];
                  setLoading(true);
                  try {
                      // Transcribe
                      const transcript = await transcribeAudio(base64Audio, 'audio/webm');
                      // Add to chat as user
                      const userMsg: ChatMessage = { role: 'user', content: transcript };
                      const newHistory = [...messages, userMsg];
                      setMessages(newHistory);
                      
                      // Get AI Response
                      const result = await sendChatToAI(newHistory, systemInstruction);
                      const modelMsg: ChatMessage = { role: 'model', content: result.text || "..." };
                      setMessages(prev => [...prev, modelMsg]);
                      
                      // Play TTS
                      if (result.text) playResponse(result.text);

                  } catch (e) {
                      console.error(e);
                      alert("Voice processing failed.");
                  } finally {
                      setLoading(false);
                  }
              };
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (e) {
          alert("Microphone access denied.");
      }
  };

  const stopRecording = () => {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Stop audio if playing
    audioContextRef.current?.suspend();
    audioContextRef.current?.resume();

    const userMsg: ChatMessage = { role: 'user', content: input };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const result = await sendChatToAI(newHistory, systemInstruction);
      const modelMsg: ChatMessage = { role: 'model', content: result.text || "..." };
      setMessages(prev => [...prev, modelMsg]);
      if (result.text) playResponse(result.text);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "Connection interrupted." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!started) {
    return (
      <div className="max-w-4xl mx-auto barker-card p-16 space-y-12 my-8">
        <div className="text-center space-y-6">
          <div className="inline-block p-6 border border-barker-gold rounded-full mb-4 bg-barker-gold/10 shadow-[0_0_30px_rgba(229,62,62,0.2)]">
            <Briefcase className="w-10 h-10 text-barker-gold" />
          </div>
          <h2 className="text-5xl font-display font-bold text-white tracking-wide mb-4">Interview Practice</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
            Practice high-stakes interviews with a voice-enabled AI that learns from your resume.
          </p>
        </div>

        <div className="space-y-8 max-w-2xl mx-auto">
          <div 
             onClick={() => fileInputRef.current?.click()}
             className={`border-2 border-white/10 p-8 flex items-center justify-between cursor-pointer hover:bg-white/5 hover:border-barker-gold transition-all group rounded-xl ${fileData ? 'bg-barker-gold/5 border-barker-gold' : ''}`}
          >
             <div className="flex items-center gap-6">
               <div className="p-3 bg-white/5 rounded-lg group-hover:bg-barker-gold/20 transition-colors">
                  <Upload className="w-6 h-6 text-gray-500 group-hover:text-barker-gold transition-colors" />
               </div>
               <div>
                   <span className="block text-sm font-bold text-gray-200 tracking-wider uppercase mb-1">{fileData ? 'Credentials Loaded' : 'Upload Resume'}</span>
                   <span className="text-xs text-gray-500">PDF or DOCX required for personalization</span>
               </div>
             </div>
             {fileData && <FileType className="w-6 h-6 text-barker-gold animate-pulse" />}
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.txt" />
          </div>

          <div className="relative">
              <textarea 
                className="w-full h-48 bg-black/40 border border-white/10 text-white placeholder-gray-600 rounded-xl p-6 focus:outline-none focus:border-barker-gold focus:ring-1 focus:ring-barker-gold transition-all font-sans text-sm resize-none leading-relaxed"
                placeholder="Paste Job Description to initialize context parameters..."
                value={jobContext}
                onChange={(e) => setJobContext(e.target.value)}
              />
              <div className="absolute bottom-4 right-4 text-[10px] text-gray-600 font-mono uppercase">
                  Context Window: Active
              </div>
          </div>

          <button
            onClick={startSession}
            disabled={!jobContext || loading}
            className="btn-barker w-full py-6 flex justify-center items-center gap-4 text-sm tracking-widest shadow-xl"
          >
            {loading ? 'INITIALIZING COACH...' : (
              <>
                START COACH <Play className="w-4 h-4 fill-current" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-[800px] flex flex-col barker-card overflow-hidden border border-barker-gold/20 shadow-2xl relative my-8">
      {/* Visualizer Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0 flex items-center justify-center gap-1">
          {soundEnabled && loading && (
             <>
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-2 bg-barker-gold animate-flicker rounded-full" style={{
                        height: `${Math.random() * 100 + 20}px`,
                        animationDuration: `${Math.random() * 0.5 + 0.2}s`
                    }}></div>
                ))}
             </>
          )}
      </div>

      <div className="p-6 bg-black/90 border-b border-white/10 flex items-center justify-between z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
           <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'} shadow-[0_0_10px_rgba(239,68,68,0.6)]`}></div>
           <div>
               <h2 className="font-mono font-bold tracking-[0.2em] text-sm text-white uppercase">Live Simulation</h2>
               <p className="text-[10px] text-barker-gold uppercase tracking-wider">{isRecording ? 'RECORDING INPUT' : 'Gemini 3 Pro + Voice'}</p>
           </div>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-lg border border-white/5">
            <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-md transition-colors ${soundEnabled ? 'text-barker-gold bg-barker-gold/10' : 'text-gray-600 hover:text-gray-400'}`}
            >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div className="w-[1px] h-6 bg-white/10"></div>
            <button onClick={() => setStarted(false)} className="px-3 text-[10px] text-gray-500 hover:text-red-400 uppercase tracking-widest font-bold transition-colors">Abort</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-black/20 relative z-10 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
            <div className={`flex gap-6 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-lg transition-transform duration-300 group-hover:scale-110 ${msg.role === 'user' ? 'bg-white/5 border-white/10' : 'bg-barker-gold/10 border-barker-gold/30'}`}>
                {msg.role === 'user' ? <User className="w-6 h-6 text-gray-300" /> : <Bot className="w-6 h-6 text-barker-gold" />}
              </div>
              
              <div className="space-y-2">
                <div className={`p-8 text-sm leading-relaxed shadow-xl backdrop-blur-sm border relative ${
                  msg.role === 'user' 
                    ? 'bg-white/5 border-white/10 text-gray-200 rounded-2xl rounded-tr-sm' 
                    : 'bg-black/60 border-barker-gold/30 text-gray-300 rounded-2xl rounded-tl-sm'
                }`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <p className={`text-[10px] text-gray-600 uppercase tracking-widest font-mono ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.role === 'user' ? 'CANDIDATE // [YOU]' : 'INTERVIEWER_AI'}
                </p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
             <div className="flex gap-6 max-w-[80%]">
               <div className="w-12 h-12 bg-barker-gold/10 border border-barker-gold/30 rounded-xl flex items-center justify-center">
                 <Activity className="w-6 h-6 text-barker-gold animate-pulse" />
               </div>
               <div className="bg-black/40 p-8 border border-barker-gold/20 rounded-2xl rounded-tl-sm flex items-center gap-3 h-[80px]">
                 <div className="w-2 h-2 bg-barker-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                 <div className="w-2 h-2 bg-barker-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                 <div className="w-2 h-2 bg-barker-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-8 bg-black/80 border-t border-white/10 flex gap-6 backdrop-blur-md relative z-20">
        <div className="flex-1 relative">
            <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? "Listening..." : "Type your response..."}
            className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-xl p-5 pl-6 pr-14 focus:outline-none focus:border-barker-gold focus:ring-1 focus:ring-barker-gold transition-all font-sans text-sm"
            autoFocus
            disabled={isRecording}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <button 
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 hover:text-red-400 bg-red-900/20' : 'text-gray-500 hover:text-white'}`}
                >
                    {isRecording ? <StopCircle className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                </button>
            </div>
        </div>
        <button 
          type="submit"
          disabled={(!input.trim() && !isRecording) || loading}
          className="px-8 bg-barker-gold text-black font-bold hover:bg-white transition-colors disabled:opacity-50 rounded-xl shadow-[0_0_20px_rgba(229,62,62,0.3)] hover:shadow-[0_0_30px_rgba(229,62,62,0.5)]"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default InterviewCoach;
