
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveConfig } from '../services/supabaseService';
import { 
  ShieldCheck, Cpu, Globe, Key, Terminal, Mail, 
  ArrowRight, Database, AlertCircle, RefreshCw, CheckCircle2, 
  Lock, ChevronRight, Fingerprint, UserPlus, LogIn, User
} from 'lucide-react';

const Login: React.FC = () => {
  const { supabase, refreshUser } = useAuth();
  
  // States
  const [phase, setPhase] = useState<'init' | 'config' | 'login'>('init');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Config States
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');

  useEffect(() => {
    // Check if Supabase is configured
    if (!supabase) {
      setPhase('config');
    } else {
      // Small boot delay for effect
      setTimeout(() => setPhase('login'), 800);
    }
  }, [supabase]);

  // --- Handlers ---

  const handleConfigSave = () => {
    if (!configUrl || !configKey) return;
    saveConfig(configUrl, configKey);
    window.location.reload(); 
  };

  const handleGuestLogin = async () => {
      setLoading(true);
      
      // Create Mock Profile
      const profile = {
         id: 'guest-' + Date.now(),
         email: 'guest@carrieder.ai',
         name: 'Guest User',
         title: 'Candidate',
         atsScore: 75,
         clearanceLevel: 'L1' as const
      };
      
      localStorage.setItem('carrieder_user_profile', JSON.stringify(profile));
      
      // Artificial delay for effect
      setTimeout(async () => {
          await refreshUser();
          setLoading(false);
      }, 1000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!supabase) {
          throw new Error("System Offline. Use Guest Mode.");
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg("Account created successfully! Please log in.");
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
             throw error;
        }

        // Manual profile sync/check
        if (data.user) {
             const profile = {
                 id: data.user.id,
                 email: data.user.email || email,
                 name: email.split('@')[0],
                 title: 'Candidate',
                 atsScore: 0,
                 clearanceLevel: 'L1' as const
             };
             localStorage.setItem('carrieder_user_profile', JSON.stringify(profile));
        }
        await refreshUser(); // Force context update to unlock App
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Authentication Failed. Access Denied.");
      
      // Auto-fallback hint
      if (e.message?.includes('Invalid login') || e.message?.includes('fetch')) {
          setErrorMsg(prev => prev + " (Try Guest Mode if offline)");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Render Components ---

  if (phase === 'init') {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-barker-gold/10 rounded-full flex items-center justify-center animate-pulse">
                    <Fingerprint className="w-8 h-8 text-barker-gold" />
                </div>
                <div className="h-1 w-32 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-barker-gold animate-[loading_1s_ease-in-out_infinite]"></div>
                </div>
            </div>
        </div>
    );
  }

  // --- CONFIG SCREEN (With Bypass) ---
  if (phase === 'config') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono relative overflow-hidden">
          <div className="absolute inset-0 scanlines opacity-20"></div>
          <div className="max-w-md w-full barker-card p-8 border-l-4 border-l-red-600 shadow-2xl relative z-10">
              <div className="flex items-center gap-3 mb-6 text-red-500">
                  <Database className="w-8 h-8 animate-pulse" />
                  <h1 className="text-xl font-bold uppercase tracking-widest">Configuration</h1>
              </div>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                  Real-time tracking requires a Supabase Backend. Enter credentials to initialize.
              </p>
              <div className="space-y-4">
                  <div>
                      <label className="block text-[10px] uppercase text-gray-500 mb-1">Project URL</label>
                      <input 
                          value={configUrl}
                          onChange={e => setConfigUrl(e.target.value)}
                          placeholder="https://xyz.supabase.co"
                          className="w-full bg-black/40 border border-white/10 p-3 rounded text-sm text-white focus:border-red-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="block text-[10px] uppercase text-gray-500 mb-1">Anon Public Key</label>
                      <input 
                          value={configKey}
                          onChange={e => setConfigKey(e.target.value)}
                          placeholder="eyJxh..."
                          className="w-full bg-black/40 border border-white/10 p-3 rounded text-sm text-white focus:border-red-500 outline-none"
                      />
                  </div>
                  <button 
                      onClick={handleConfigSave}
                      disabled={!configUrl || !configKey}
                      className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded mt-2 transition-colors uppercase text-xs tracking-widest"
                  >
                      Configure
                  </button>
                  
                  <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-600 text-[10px] uppercase">Or</span>
                      <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  <button 
                      onClick={handleGuestLogin}
                      disabled={loading}
                      className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded transition-colors uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                  >
                      {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <User className="w-3 h-3" />}
                      Guest Mode
                  </button>
                  
                  <p className="text-[10px] text-gray-600 text-center pt-2">
                      Get free keys at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-gray-400 underline">supabase.com</a>
                  </p>
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-barker-gold selection:text-white">
      {/* Cinematic Background */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="scanlines opacity-5"></div>
          <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-barker-gold/5 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-[480px] relative z-10">
        
        {/* Terminal Header */}
        <div className="text-center mb-10 relative">
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md shadow-2xl mb-6 relative group">
                <div className="absolute inset-0 bg-barker-gold/20 blur-xl group-hover:bg-barker-gold/40 transition-all duration-500"></div>
                <ShieldCheck className="w-10 h-10 text-barker-gold relative z-10" />
                <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse z-20"></div>
            </div>
            <h1 className="text-5xl font-extrabold text-white mb-2 tracking-tight">CARRIEDER</h1>
            <p className="text-barker-gold font-mono text-[10px] uppercase tracking-[0.4em]">Career Optimization Suite v4.0</p>
        </div>

        {/* Card Container */}
        <div className="bg-black/60 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden transition-all duration-500">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-barker-gold/50 to-transparent"></div>
            
            {/* Messages */}
            {errorMsg && (
                <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg mb-6 flex items-start gap-3 text-xs text-red-200 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block mb-1">ERROR</span>
                        {errorMsg}
                    </div>
                </div>
            )}
            {successMsg && (
                <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg mb-6 flex items-start gap-3 text-xs text-green-200 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block mb-1">SUCCESS</span>
                        {successMsg}
                    </div>
                </div>
            )}

            {/* --- PHASE: LOGIN FORM --- */}
            <div className="animate-fade-in-up space-y-6">
                <div className="space-y-2">
                    <h2 className="text-white font-bold text-xl">{isSignUp ? 'Create New Account' : 'Sign In'}</h2>
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Enter Credentials</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    <div className="space-y-2">
                            <label className="text-[10px] font-bold text-barker-gold uppercase tracking-wider block">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-white transition-colors" />
                                <input 
                                type="email" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-sm focus:border-barker-gold transition-colors text-white placeholder-gray-600 outline-none"
                                placeholder="you@example.com"
                                required
                                autoFocus
                                />
                            </div>
                    </div>

                    <div className="space-y-2">
                            <label className="text-[10px] font-bold text-barker-gold uppercase tracking-wider block">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-white transition-colors" />
                                <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-sm focus:border-barker-gold transition-colors text-white placeholder-gray-600 outline-none"
                                placeholder="••••••••"
                                required
                                />
                            </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-barker-gold text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-colors shadow-[0_0_20px_rgba(229,62,62,0.3)] disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading ? (
                            <RefreshCw className="w-5 h-5 animate-spin" /> 
                        ) : (
                            <>
                                {isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'} 
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center space-y-4">
                    <button 
                        type="button" 
                        onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); }}
                        className="text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto font-mono uppercase tracking-wide"
                    >
                        {isSignUp ? (
                            <>Already registered? <LogIn className="w-3 h-3" /> Login</>
                        ) : (
                            <>No account? <UserPlus className="w-3 h-3" /> Create Account</>
                        )}
                    </button>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-600 text-[10px] uppercase">Or</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <button 
                      onClick={handleGuestLogin}
                      disabled={loading}
                      className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-colors uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <User className="w-3 h-3" />}
                      Continue as Guest
                    </button>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> System Active</span>
                <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> v4.2.0</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Encrypted</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
