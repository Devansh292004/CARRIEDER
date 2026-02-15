
import React, { useState, useRef } from 'react';
import { Palette, PenTool, Download, Layers, LayoutGrid, Wand2, RefreshCw, Hexagon, Maximize2, Image as ImageIcon, Film, Crop, Sliders, Zap } from 'lucide-react';
import { generateProAsset, enhanceImagePrompt, editImageWithNano, generateVeoVideo } from '../services/geminiService';

interface AssetHistoryItem {
    id: string;
    url: string;
    prompt: string;
    type: 'Image' | 'Video';
    timestamp: number;
}

const HoloGrid = () => (
    <div className="absolute inset-0 bg-[linear-gradient(rgba(229,62,62,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(229,62,62,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 pointer-events-none"></div>
);

const BrandAssets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'animate'>('create');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inputs
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState('1K');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedMime, setUploadedMime] = useState<string>('');
  
  // States
  const [currentAsset, setCurrentAsset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [history, setHistory] = useState<AssetHistoryItem[]>([]);

  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  const resolutions = ['1K', '2K', '4K']; // Veo is 720p/1080p, Images are 1K/2K/4K

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setUploadedImage(reader.result as string);
              setUploadedMime(file.type);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleEnhance = async () => {
      if (!prompt) return;
      setEnhancing(true);
      try {
          const enhanced = await enhanceImagePrompt(prompt);
          setPrompt(enhanced);
      } catch (e) {
          alert("Enhancement failed.");
      } finally {
          setEnhancing(false);
      }
  };

  const executeAction = async () => {
      if (!prompt && activeTab !== 'animate') return; // Animate might take image only? Prompt is mandated for Veo
      if (activeTab === 'animate' && !prompt) return;

      setLoading(true);
      setCurrentAsset(null);
      
      try {
          let result = '';
          if (activeTab === 'create') {
              result = await generateProAsset(prompt, aspectRatio, resolution);
          } else if (activeTab === 'edit') {
              if (!uploadedImage) throw new Error("Upload an image to edit.");
              const b64 = uploadedImage.split(',')[1];
              result = await editImageWithNano(b64, uploadedMime, prompt);
          } else if (activeTab === 'animate') {
              const b64 = uploadedImage ? uploadedImage.split(',')[1] : undefined;
              result = await generateVeoVideo(prompt, b64, uploadedMime, aspectRatio);
          }

          if (result) {
              setCurrentAsset(result);
              setHistory(prev => [{
                  id: Date.now().toString(),
                  url: result,
                  prompt: prompt,
                  type: activeTab === 'animate' ? 'Video' : 'Image',
                  timestamp: Date.now()
              }, ...prev]);
          }
      } catch (e: any) {
          alert(`Operation failed: ${e.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleHistoryClick = (item: AssetHistoryItem) => {
      setCurrentAsset(item.url);
      setPrompt(item.prompt);
      
      // Smart tab switching based on asset type
      if (item.type === 'Video') {
          setActiveTab('animate');
      } else {
          // If it's an image, switch to 'create' if we are currently in 'animate'. 
          // If in 'edit', we stay there as the user might want to edit this history item (though logic for using result as source isn't here yet).
          if (activeTab === 'animate') setActiveTab('create');
      }
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 lg:space-y-8 h-full flex flex-col pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-end justify-between border-b border-barker-gold/20 pb-6">
        <div className="flex items-center gap-6">
            <div className="p-4 border border-barker-gold/30 bg-barker-panel rounded-xl shadow-[0_0_20px_rgba(229,62,62,0.15)] relative overflow-hidden group">
                <HoloGrid />
                <Palette className="w-8 h-8 text-barker-gold relative z-10 group-hover:rotate-12 transition-transform duration-500" />
            </div>
            <div>
                <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">Personal Branding Assets</h2>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Gemini Pro Vision & Veo Active
                </p>
            </div>
        </div>
        
        {/* Module Switcher */}
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 backdrop-blur-md">
            {[
                { id: 'create', label: 'Creator', icon: ImageIcon },
                { id: 'edit', label: 'Nano Editor', icon: PenTool },
                { id: 'animate', label: 'Veo Animator', icon: Film }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setUploadedImage(null); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-barker-gold text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                    <tab.icon className="w-3 h-3" /> {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          
          {/* LEFT COLUMN: Controls */}
          <div className="lg:col-span-4 space-y-6">
              
              {/* Image Uploader (Visible for Edit/Animate) */}
              {(activeTab === 'edit' || activeTab === 'animate') && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group ${uploadedImage ? 'border-barker-gold bg-barker-gold/5' : 'border-white/10 hover:border-white/30 bg-black/40'}`}
                  >
                      {uploadedImage ? (
                          <div className="relative w-full aspect-video rounded overflow-hidden">
                              <img src={uploadedImage} className="object-cover w-full h-full" alt="Source" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                                      <RefreshCw className="w-4 h-4" /> Change Source
                                  </span>
                              </div>
                          </div>
                      ) : (
                          <>
                              <Layers className="w-8 h-8 text-gray-500 mb-2 group-hover:text-white transition-colors" />
                              <p className="text-xs text-gray-400 uppercase font-bold group-hover:text-barker-gold transition-colors">Upload Source Asset</p>
                          </>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
                  </div>
              )}

              {/* Params */}
              <div className="barker-card p-6 space-y-6">
                  <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Crop className="w-4 h-4" /> Aspect Ratio
                      </h3>
                      <div className="grid grid-cols-5 gap-2">
                          {ratios.map(r => (
                              <button
                                key={r}
                                onClick={() => setAspectRatio(r)}
                                className={`px-1 py-1.5 text-[10px] font-bold rounded border transition-all ${aspectRatio === r ? 'bg-white text-black border-white shadow-md' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                              >
                                  {r}
                              </button>
                          ))}
                      </div>
                  </div>

                  {activeTab !== 'edit' && (
                      <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Maximize2 className="w-4 h-4" /> Resolution
                          </h3>
                          <div className="flex gap-2">
                              {resolutions.map(r => (
                                  <button
                                    key={r}
                                    onClick={() => setResolution(r)}
                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded border transition-all ${resolution === r ? 'bg-white text-black border-white shadow-md' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                                  >
                                      {r}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
              </div>

              {/* Prompt Engine */}
              <div className="barker-card p-6 flex flex-col h-[300px]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <PenTool className="w-4 h-4 text-barker-gold" /> Command Input
                      </h3>
                      <button 
                         onClick={handleEnhance}
                         disabled={enhancing || !prompt}
                         className="text-[10px] text-barker-gold hover:text-white transition-colors flex items-center gap-1 font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-barker-gold/10 px-2 py-1 rounded"
                      >
                         <Wand2 className={`w-3 h-3 ${enhancing ? 'animate-spin' : ''}`} /> 
                         {enhancing ? 'Enhancing...' : 'AI Enhance'}
                      </button>
                  </div>
                  
                  <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="flex-1 w-full bg-black/40 border border-white/10 rounded-lg p-4 text-sm resize-none focus:border-barker-gold outline-none font-sans leading-relaxed text-gray-300"
                      placeholder={activeTab === 'edit' ? "e.g. 'Add a cyberpunk neon sign'" : "Describe your vision..."}
                  />

                  <button 
                    onClick={executeAction}
                    disabled={loading || (!prompt && activeTab !== 'animate')}
                    className="btn-barker w-full py-4 mt-4 flex items-center justify-center gap-2 shadow-xl group hover:ring-2 hover:ring-barker-gold/50 transition-all"
                  >
                      {loading ? (
                          <>
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                             PROCESSING...
                          </>
                      ) : (
                          <>
                             <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> 
                             {activeTab === 'create' ? 'GENERATE ASSET' : activeTab === 'edit' ? 'APPLY EDIT' : 'RENDER VEO VIDEO'}
                          </>
                      )}
                  </button>
              </div>
          </div>

          {/* RIGHT COLUMN: Output */}
          <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex-1 barker-card p-1 bg-black/60 relative overflow-hidden flex flex-col min-h-[500px]">
                   <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px]"></div>
                   
                   <div className="absolute top-4 left-6 z-20 flex gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-black/60 rounded border border-white/10 backdrop-blur-sm">
                            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : currentAsset ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                                {loading ? 'RENDER IN PROGRESS' : currentAsset ? 'ASSET LOCKED' : 'STANDBY'}
                            </span>
                        </div>
                   </div>

                   <div className="flex-1 flex items-center justify-center relative p-12">
                       {loading && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
                               <div className="w-24 h-24 border-4 border-barker-gold/30 border-t-barker-gold rounded-full animate-spin mb-6"></div>
                               <p className="text-barker-gold font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Asset Generation...</p>
                           </div>
                       )}

                       {currentAsset ? (
                          <div className="relative group shadow-2xl transition-all duration-500 hover:scale-[1.01] max-h-full">
                              {activeTab === 'animate' ? (
                                  <video src={currentAsset} controls autoPlay loop className="rounded-lg border border-white/10 shadow-2xl max-h-[500px] object-contain bg-black" />
                              ) : (
                                  <img 
                                    src={currentAsset} 
                                    alt="Generated Asset" 
                                    className="rounded-lg border border-white/10 shadow-2xl max-h-[500px] object-contain bg-black"
                                  />
                              )}
                              
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                  <a 
                                    href={currentAsset} 
                                    download={`forge-${Date.now()}.${activeTab === 'animate' ? 'mp4' : 'png'}`}
                                    className="p-2 bg-white text-black rounded-full hover:bg-barker-gold hover:text-white transition-colors shadow-lg"
                                  >
                                      <Download className="w-4 h-4" />
                                  </a>
                              </div>
                          </div>
                       ) : (
                          <div className="text-center opacity-20 select-none">
                              <Layers className="w-32 h-32 mx-auto mb-6 text-white" />
                              <h2 className="text-4xl font-display font-bold text-white uppercase tracking-tight">Identity Forge</h2>
                              <p className="text-sm font-mono mt-2 tracking-[0.5em] text-white">ASSET GENERATION</p>
                          </div>
                       )}
                   </div>
              </div>

              {history.length > 0 && (
                  <div className="h-36 barker-card p-4 overflow-x-auto">
                      <div className="flex gap-4 h-full">
                          {history.map(item => (
                              <div 
                                key={item.id}
                                onClick={() => handleHistoryClick(item)}
                                className="min-w-[140px] w-[140px] h-full relative rounded-lg overflow-hidden border border-white/10 cursor-pointer group hover:border-barker-gold transition-all hover:scale-105 hover:shadow-lg hover:z-10"
                              >
                                  {item.type === 'Video' ? (
                                      <video src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                  ) : (
                                      <img src={item.url} alt="History" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                  )}
                                  
                                  {/* Prompt Overlay */}
                                  <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-center justify-center">
                                      <p className="text-[10px] text-gray-300 line-clamp-4 font-mono text-center leading-tight">
                                          {item.prompt}
                                      </p>
                                  </div>

                                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 text-[8px] font-mono text-center text-gray-400 uppercase truncate group-hover:opacity-0 transition-opacity">
                                      {item.type}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default BrandAssets;
