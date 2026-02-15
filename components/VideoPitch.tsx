
import React, { useState } from 'react';
import { Video, Film, Play, Loader2, Mic, Clapperboard, MonitorPlay } from 'lucide-react';
import { generateVideoPitch } from '../services/geminiService';

const VideoPitch: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [script, setScript] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const url = await generateVideoPitch(prompt);
      setVideoUrl(url);
    } catch (e) {
      alert("Video generation failed. This feature requires a specific paid tier key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
       <div className="flex items-center gap-6 mb-8 border-b border-barker-gold/20 pb-6">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel">
          <Video className="w-8 h-8 text-barker-gold" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">Video Pitch Creator</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
             Create professional video intros with AI-generated backgrounds and teleprompter.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
              <div className="barker-card p-6 space-y-6">
                  <div className="flex items-center gap-2 mb-2 text-barker-gold">
                      <Clapperboard className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Scene Configuration</h3>
                  </div>
                  
                  <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-2">Background Prompt</label>
                      <textarea 
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="E.g. A modern, minimalist home office with soft depth of field and warm lighting..."
                          className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:border-barker-gold focus:outline-none resize-none"
                      />
                  </div>

                  <button 
                      onClick={handleGenerate}
                      disabled={loading || !prompt}
                      className="btn-barker w-full py-4 flex items-center justify-center gap-2"
                  >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                      GENERATE VIDEO
                  </button>
              </div>

              <div className="barker-card p-6 flex-1">
                   <div className="flex items-center gap-2 mb-4 text-blue-400">
                      <Mic className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Teleprompter Script</h3>
                  </div>
                  <textarea 
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder="Paste your pitch script here..."
                      className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-lg font-serif leading-relaxed text-gray-300 focus:border-blue-500/50 focus:outline-none resize-none"
                  />
              </div>
          </div>

          {/* Monitor */}
          <div className="lg:col-span-2">
              <div className="barker-card p-1 border-white/10 bg-[#1a1a1a]">
                  <div className="bg-black aspect-video rounded-lg overflow-hidden relative border border-white/5">
                      {loading ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="w-16 h-16 border-4 border-barker-gold border-t-transparent rounded-full animate-spin mb-6"></div>
                              <p className="text-barker-gold font-mono text-xs uppercase tracking-widest animate-pulse">Rendering Frame Sequence...</p>
                              <div className="mt-4 font-mono text-[10px] text-gray-600">ETA: ~30 SECONDS</div>
                          </div>
                      ) : videoUrl ? (
                          <>
                             <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                             {script && (
                                 <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none px-12">
                                     <p className="text-2xl font-bold text-white drop-shadow-lg bg-black/50 inline-block px-4 py-2 rounded">{script}</p>
                                 </div>
                             )}
                          </>
                      ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 opacity-50">
                              <MonitorPlay className="w-24 h-24 mb-4" />
                              <p className="font-mono text-xs uppercase tracking-widest">No Signal Input</p>
                          </div>
                      )}
                      
                      {/* Overlays */}
                      <div className="absolute top-4 left-4 flex gap-2">
                          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">REC</span>
                          <span className="bg-black/50 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/10">1080p 60fps</span>
                      </div>
                      <div className="absolute top-4 right-4">
                           <span className="text-white/50 font-mono text-xs">BAT 84%</span>
                      </div>
                      <div className="absolute inset-0 border-[1px] border-white/5 pointer-events-none m-4 rounded">
                          <div className="absolute top-1/2 left-1/2 w-4 h-4 border-t border-l border-white/30 -translate-x-1/2 -translate-y-1/2"></div>
                          <div className="absolute top-1/2 left-1/2 w-4 h-4 border-b border-r border-white/30 -translate-x-1/2 -translate-y-1/2"></div>
                      </div>
                  </div>
              </div>
              
              <div className="mt-6 flex justify-between items-center px-4">
                  <div className="text-xs font-mono text-gray-500">
                      OUTPUT FORMAT: MP4 (H.264)
                  </div>
                  <button className="text-xs font-bold uppercase tracking-widest text-barker-gold hover:text-white transition-colors">
                      Download Raw Footage
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default VideoPitch;
