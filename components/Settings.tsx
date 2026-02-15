
import React, { useState, useEffect } from 'react';
import { Save, Database, Trash2, RefreshCw, Shield, Key, AlertTriangle, Check } from 'lucide-react';
import { saveConfig, getStoredConfig, clearConfig } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { logout } = useAuth();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const config = getStoredConfig();
    if (config.url) setSupabaseUrl(config.url);
    if (config.key) setSupabaseKey(config.key);
  }, []);

  const handleSave = () => {
    saveConfig(supabaseUrl, supabaseKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTimeout(() => window.location.reload(), 500);
  };

  const handleClear = () => {
    if (!confirmReset) {
        setConfirmReset(true);
        // Auto-reset confirmation state after 3 seconds if not clicked
        setTimeout(() => setConfirmReset(false), 3000);
        return;
    }
    clearConfig();
    logout();
  };

  const handleSelectKey = async () => {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
          try {
             await window.aistudio.openSelectKey();
          } catch (e) {
             console.error("Key selection failed", e);
             alert("Error opening billing selector. Check console for details.");
          }
      } else {
          alert("Billing Management is not available in this environment. This feature requires the Google AI Studio wrapper.");
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-6 mb-8 border-b border-barker-gold/20 pb-6">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel">
          <Database className="w-8 h-8 text-barker-gold" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">System Configuration</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            Manage database connections and application preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Database Config */}
          <div className="barker-card p-8 border-l-4 border-l-barker-gold">
              <div className="flex items-center gap-2 mb-6 text-barker-gold">
                  <Database className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Supabase Connection</h3>
              </div>
              
              <div className="space-y-6">
                  <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Project URL</label>
                      <input 
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 text-sm focus:border-barker-gold outline-none"
                        placeholder="https://..."
                      />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Anon Public Key</label>
                      <input 
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 text-sm focus:border-barker-gold outline-none"
                        placeholder="eyJ..."
                        type="password"
                      />
                  </div>

                  <button 
                    onClick={handleSave}
                    className={`btn-barker w-full py-4 flex items-center justify-center gap-2 transition-all duration-300 ${saved ? 'bg-green-600 border-green-500' : ''}`}
                  >
                      {saved ? (
                          <><Check className="w-4 h-4" /> CONFIGURATION SAVED</>
                      ) : (
                          <><Save className="w-4 h-4" /> SAVE CHANGES</>
                      )}
                  </button>
              </div>
          </div>

          {/* Application Controls */}
          <div className="space-y-6">
              <div className="barker-card p-8">
                  <div className="flex items-center gap-2 mb-6 text-white">
                      <Shield className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Session Management</h3>
                  </div>
                  
                  <div className="space-y-4">
                      <button 
                         onClick={handleSelectKey}
                         className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl p-4 flex items-center justify-between group transition-all"
                      >
                          <div className="flex items-center gap-3">
                              <Key className="w-5 h-5 text-gray-400 group-hover:text-white" />
                              <div className="text-left">
                                  <div className="text-sm font-bold">Billing Account</div>
                                  <div className="text-[10px] text-gray-500">Manage Gemini API Billing (Veo)</div>
                              </div>
                          </div>
                      </button>

                      <button 
                         onClick={handleClear}
                         className={`w-full border rounded-xl p-4 flex items-center justify-between group transition-all duration-300 ${
                             confirmReset 
                                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                                : 'bg-red-900/10 hover:bg-red-900/20 text-red-500 border-red-900/30'
                         }`}
                      >
                          <div className="flex items-center gap-3">
                              {confirmReset ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <Trash2 className="w-5 h-5" />}
                              <div className="text-left">
                                  <div className="text-sm font-bold">{confirmReset ? 'CLICK TO CONFIRM RESET' : 'Factory Reset'}</div>
                                  <div className={`text-[10px] ${confirmReset ? 'text-white/80' : 'text-red-400/60'}`}>
                                      {confirmReset ? 'This action cannot be undone.' : 'Clear all local data and configurations'}
                                  </div>
                              </div>
                          </div>
                      </button>
                  </div>
              </div>

              <div className="barker-card p-6 flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-full">
                      <RefreshCw className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                      <h4 className="text-white font-bold text-sm">System Version</h4>
                      <p className="text-xs text-gray-500 font-mono">v4.2.1-stable</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Settings;
