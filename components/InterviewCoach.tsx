
import React, { useState, useEffect, useRef } from 'react';
import { createInterviewContext, sendChatToAI, transcribeAudio, generateSpeech, decodeAudioData, analyzeBehavioralCues } from '../services/geminiService';
import { parseFile } from '../services/fileService';
import { ChatMessage, FileData, BehaviorMetrics } from '../types';
import { Send, User, Bot, Briefcase, Play, FileType, Upload, Mic, Volume2, VolumeX, BarChart3, Activity, StopCircle, Video as VideoIcon, VideoOff, Eye, ScanFace } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const InterviewCoach: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [jobContext, setJobContext] = useState('');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [behaviorMetrics, setBehaviorMetrics] = useState<BehaviorMetrics | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      return () => { 
          audioContextRef.current?.close(); 
          if (analysisInterval.current) clearInterval(analysisInterval.current);
      }
  }, []);

  // --- VIDEO ANALYSIS LOOP ---
  useEffect(() => {
      if (started && videoEnabled && !analysisInterval.current) {
          analysisInterval.current = setInterval(captureAndAnalyze, 4000); // Analyze every 4s
      } else if (!videoEnabled && analysisInterval.current) {
          clearInterval(analysisInterval.current);
          analysisInterval.current = null;
      }
  }, [started, videoEnabled]);

  const captureAndAnalyze = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
          canvas.width = 300; // Low res for speed
          canvas.height = 200;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Image = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
          
          try {
              const metrics = await analyzeBehavioralCues(base64Image);
              setBehaviorMetrics(metrics);
          } catch (e) {
              console.warn("Visual analysis skip", e);
          }
      }
  };

  const enableVideo = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setVideoEnabled(true);
          }
      } catch (e) {
          alert("Camera access denied.");
      }
  };

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
      
      // Auto-start video
      await enableVideo();

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
                      const transcript = await transcribeAudio(base64Audio, 'audio/webm');
                      const userMsg: ChatMessage = { role: 'user', content: transcript };
                      const newHistory = [...messages, userMsg];
                      setMessages(newHistory);
                      
                      const result = await sendChatToAI(newHistory, systemInstruction);
                      const modelMsg: ChatMessage = { role: 'model', content: result.text || "..." };
                      setMessages(prev => [...prev, modelMsg]);
                      
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
          <h2 className="text-5xl font-display font-bold text-white tracking-wide mb-4">Multimodal Interview Coach</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
            Practice high-stakes interviews with real-time video analysis of your body language and vocal delivery.
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
    <div className="max-w-7xl mx-auto h-[85vh] flex flex-col lg:flex-row gap-6 my-4 animate-fade-in">
      
      {/* LEFT: AI & Chat */}
      <div className="flex-1 flex flex-col barker-card overflow-hidden relative">
          <div className="p-6 bg-black/90 border-b border-white/10 flex items-center justify-between z-10 backdrop-blur-md">
            <div className="flex items-center gap-4">
               <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'} shadow-[0_0_10px_rgba(239,68,68,0.6)]`}></div>
               <div>
                   <h2 className="font-mono font-bold tracking-[0.2em] text-sm text-white uppercase">Live Interview</h2>
                   <p className="text-[10px] text-barker-gold uppercase tracking-wider">{isRecording ? 'LISTENING...' : 'INTERVIEWER ACTIVE'}</p>
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

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/20 relative z-10 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
                <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-lg transition-transform duration-300 group-hover:scale-110 ${msg.role === 'user' ? 'bg-white/5 border-white/10' : 'bg-barker-gold/10 border-barker-gold/30'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-gray-300" /> : <Bot className="w-5 h-5 text-barker-gold" />}
                  </div>
                  
                  <div className="space-y-1">
                    <div className={`p-4 text-sm leading-relaxed shadow-xl backdrop-blur-sm border relative ${
                      msg.role === 'user' 
                        ? 'bg-white/5 border-white/10 text-gray-200 rounded-2xl rounded-tr-sm' 
                        : 'bg-black/60 border-barker-gold/30 text-gray-300 rounded-2xl rounded-tl-sm'
                    }`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                 <div className="flex gap-4 max-w-[80%]">
                   <div className="w-10 h-10 bg-barker-gold/10 border border-barker-gold/30 rounded-xl flex items-center justify-center">
                     <Activity className="w-5 h-5 text-barker-gold animate-pulse" />
                   </div>
                   <div className="bg-black/40 p-4 border border-barker-gold/20 rounded-2xl rounded-tl-sm flex items-center gap-3">
                     <div className="w-2 h-2 bg-barker-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                     <div className="w-2 h-2 bg-barker-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                     <div className="w-2 h-2 bg-barker-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                   </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 bg-black/80 border-t border-white/10 flex gap-4 backdrop-blur-md relative z-20">
            <div className="flex-1 relative">
                <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Listening..." : "Type response..."}
                className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-xl p-4 pl-6 pr-14 focus:outline-none focus:border-barker-gold focus:ring-1 focus:ring-barker-gold transition-all font-sans text-sm"
                autoFocus
                disabled={isRecording}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
              className="px-6 bg-barker-gold text-black font-bold hover:bg-white transition-colors disabled:opacity-50 rounded-xl shadow-lg"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
      </div>

      {/* RIGHT: Video & Metrics */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4">
          
          {/* User Cam */}
          <div className="barker-card p-1 bg-black overflow-hidden relative aspect-video flex items-center justify-center border-white/20">
              <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover rounded-lg opacity-80"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {!videoEnabled && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-black/80 z-20">
                      <VideoOff className="w-12 h-12 mb-2" />
                      <p className="text-xs uppercase font-bold">Camera Disabled</p>
                  </div>
              )}

              {/* HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none p-4 z-30 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                          <span className="text-[10px] font-mono text-white/70 bg-black/50 px-2 rounded">REC</span>
                      </div>
                      <div className="flex items-center gap-2 text-barker-gold text-[10px] font-bold uppercase bg-black/60 px-2 py-1 rounded border border-barker-gold/30">
                          <ScanFace className="w-3 h-3" /> Live Analysis
                      </div>
                  </div>
                  
                  {/* Real-time Feedback Toast */}
                  {behaviorMetrics && (
                      <div className="bg-black/70 backdrop-blur-md border-l-4 border-barker-gold p-3 rounded-r-lg max-w-[80%] animate-slide-in-right">
                          <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-1">AI Observation</p>
                          <p className="text-xs text-gray-200">{behaviorMetrics.feedback}</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Metrics Panel */}
          <div className="barker-card p-6 flex-1 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-4">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white">Non-Verbal Metrics</h3>
              </div>

              <div className="space-y-6">
                  {/* Confidence Meter */}
                  <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">
                          <span>Projected Confidence</span>
                          <span className="text-white">{behaviorMetrics?.confidence || 0}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                             className="h-full bg-gradient-to-r from-blue-600 to-green-400 transition-all duration-1000" 
                             style={{ width: `${behaviorMetrics?.confidence || 0}%` }}
                          ></div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Eye Contact</p>
                          <div className={`text-lg font-bold ${
                              behaviorMetrics?.eyeContact === 'Good' ? 'text-green-400' : 
                              behaviorMetrics?.eyeContact === 'Fair' ? 'text-yellow-400' : 'text-gray-400'
                          }`}>
                              {behaviorMetrics?.eyeContact || '--'}
                          </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Posture</p>
                          <div className={`text-lg font-bold ${
                              behaviorMetrics?.posture === 'Open' ? 'text-blue-400' : 
                              behaviorMetrics?.posture === 'Neutral' ? 'text-gray-300' : 'text-red-400'
                          }`}>
                              {behaviorMetrics?.posture || '--'}
                          </div>
                      </div>
                  </div>
              </div>
              
              <div className="mt-auto pt-6 border-t border-white/10 text-[10px] text-gray-500 font-mono leading-relaxed">
                  NOTE: Analysis is performed by Gemini 2.5 Flash on captured video frames. Feedback is estimated.
              </div>
          </div>
      </div>
    </div>
  );
};

export default InterviewCoach;