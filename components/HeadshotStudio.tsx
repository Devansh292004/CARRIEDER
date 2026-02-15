
import React, { useState, useRef } from 'react';
import { Camera, Sparkles, Upload, Image as ImageIcon, Download, RefreshCw, Wand2 } from 'lucide-react';
import { editHeadshot } from '../services/geminiService';

const HeadshotStudio: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const presets = [
    "Corporate Executive, Navy Suit, Studio Grey Background",
    "Modern Tech Startup, Casual Polo, Bokeh Office Background",
    "Creative Director, Black Turtleneck, Dramatic Lighting",
    "Friendly Professional, Bright Natural Light, Outdoor Park"
  ];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        setImage(res); 
        setMimeType(file.type);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    try {
      const base64Data = image.split(',')[1];
      const newImage = await editHeadshot(base64Data, mimeType, prompt);
      setResultImage(newImage);
    } catch (e) {
      alert("Image generation failed. Ensure your API key supports Imagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
      <div className="flex items-center gap-6 mb-8 border-b border-barker-gold/20 pb-6">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel">
          <Camera className="w-8 h-8 text-barker-gold" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">AI Headshot Generator</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            Transform casual photos into professional studio-quality headshots using AI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Input Panel */}
        <div className="space-y-8">
            <div className="barker-card p-8">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-barker-gold"></span> Source Material
                     </h3>
                     {image && <button onClick={() => setImage(null)} className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-widest font-bold">Remove</button>}
                </div>
                
                <div 
                    onClick={() => fileRef.current?.click()}
                    className={`aspect-[4/5] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${image ? 'border-barker-gold p-0' : 'border-white/10 hover:border-white/30 p-8'}`}
                >
                    {image ? (
                        <div className="w-full h-full relative">
                           <img src={image} alt="Original" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="flex items-center gap-2 text-white font-bold uppercase tracking-widest text-xs border border-white/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                                   <RefreshCw className="w-4 h-4" /> Change Source
                               </span>
                           </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 group-hover:scale-105 transition-transform duration-300">
                            <Upload className="w-12 h-12 mx-auto mb-4 group-hover:text-white transition-colors" />
                            <span className="text-xs uppercase tracking-widest font-bold">Upload Selfie</span>
                            <p className="text-[10px] mt-2 opacity-60">High Resolution Recommended</p>
                        </div>
                    )}
                    <input type="file" ref={fileRef} onChange={handleUpload} className="hidden" accept="image/*" />
                </div>
            </div>

            <div className="barker-card p-8 space-y-6">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                     <Wand2 className="w-4 h-4 text-barker-gold" /> Prompt Engineering
                 </h3>
                 
                 <div className="flex flex-wrap gap-2">
                     {presets.map((preset, i) => (
                         <button 
                            key={i}
                            onClick={() => setPrompt(preset)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] text-gray-400 hover:text-white transition-all text-left truncate max-w-full"
                         >
                             {preset}
                         </button>
                     ))}
                 </div>

                 <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe desired outcome..."
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:border-barker-gold focus:outline-none resize-none"
                 />

                 <button 
                    onClick={handleGenerate}
                    disabled={!image || !prompt || loading}
                    className="btn-barker w-full py-5 flex items-center justify-center gap-3 shadow-xl"
                 >
                    {loading ? (
                        <>
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           GENERATING IMAGE...
                        </>
                    ) : (
                        <>
                           <Sparkles className="w-4 h-4" /> GENERATE PROFESSIONAL HEADSHOT
                        </>
                    )}
                 </button>
            </div>
        </div>

        {/* Output Panel */}
        <div className="barker-card p-8 flex flex-col h-full min-h-[600px] border-l-4 border-l-barker-gold">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Generated Output</h3>
                <span className="text-[10px] bg-barker-gold/20 text-barker-gold px-2 py-1 rounded font-mono">v3.0.1</span>
             </div>

             <div className="flex-1 flex items-center justify-center bg-black/40 rounded-xl border border-white/5 relative overflow-hidden">
                 {/* Grid Background */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                 
                 {resultImage ? (
                    <div className="relative group w-full h-full p-4">
                        <img src={resultImage} alt="Generated" className="w-full h-full object-contain rounded-lg shadow-2xl relative z-10" />
                        <a 
                            href={resultImage} 
                            download="headshot-forge.png"
                            className="absolute bottom-8 right-8 p-4 bg-barker-gold text-white rounded-full shadow-lg hover:bg-white hover:text-black transition-colors z-20 group-hover:scale-110 duration-200"
                        >
                            <Download className="w-6 h-6" />
                        </a>
                    </div>
                ) : (
                    <div className="text-center opacity-30 relative z-10">
                        <div className="w-24 h-24 border-2 border-dashed border-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ImageIcon className="w-10 h-10 text-gray-500" />
                        </div>
                        <p className="font-mono text-xs uppercase tracking-[0.2em]">Awaiting Generation</p>
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default HeadshotStudio;
