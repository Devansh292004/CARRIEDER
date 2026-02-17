
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getSupabase } from '../services/supabaseService';
import { SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  logout: () => void;
  loading: boolean;
  supabase: SupabaseClient | null;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>(undefined!);

const USER_STORAGE_KEY = 'carrieder_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState<SupabaseClient | null>(getSupabase());

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // 1. Try Supabase Session first (Real Auth)
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
           const profile: UserProfile = {
             id: session.user.id,
             email: session.user.email || '',
             name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Operative',
             title: 'Candidate', 
             atsScore: 0,
             clearanceLevel: 'L1',
             currentStage: 'preparation'
           };
           setUser(profile);
           setLoading(false);
           return;
        }
      }

      // 2. Fallback to Local Storage (Legacy/Offline support)
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored && mounted) {
        try {
            const parsed = JSON.parse(stored);
            // Migrate old profiles that lack stage
            if (!parsed.currentStage) parsed.currentStage = 'preparation';
            
            if (parsed.email !== 'local@system') {
                setUser(parsed);
            } else {
                localStorage.removeItem(USER_STORAGE_KEY);
            }
        } catch {
            localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
      
      if (mounted) setLoading(false);
    };

    initAuth();

    // 3. Listen for Auth Changes (Google Redirects, Magic Links)
    const { data: authListener } = supabase?.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && mounted) {
             const profile: UserProfile = {
                 id: session.user.id,
                 email: session.user.email || '',
                 name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Operative',
                 title: 'Candidate',
                 atsScore: 0,
                 clearanceLevel: 'L1',
                 currentStage: 'preparation'
             };
             setUser(profile);
             localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        } else if (event === 'SIGNED_OUT' && mounted) {
             setUser(null);
             localStorage.removeItem(USER_STORAGE_KEY);
        }
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
        mounted = false;
        authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const refreshUser = async () => {
     // Re-check storage or Supabase
     const stored = localStorage.getItem(USER_STORAGE_KEY);
     if (stored) {
         setUser(JSON.parse(stored));
     } else if (supabase) {
         const { data: { session } } = await supabase.auth.getSession();
         if (session?.user) {
             const profile: UserProfile = {
                 id: session.user.id,
                 email: session.user.email || '',
                 name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Operative',
                 title: 'Candidate',
                 atsScore: 0,
                 clearanceLevel: 'L1',
                 currentStage: 'preparation'
             };
             setUser(profile);
         }
     }
  };

  const updateUser = (updates: Partial<UserProfile>) => {
      setUser(prev => {
          if (!prev) return null;
          const updated = { ...prev, ...updates };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
          return updated;
      });
  };

  const logout = async () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout, loading, supabase, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
