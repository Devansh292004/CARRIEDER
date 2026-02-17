
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Application, UserProfile, SavedDocument } from '../types';

const KEY_STORAGE = 'carrieder_supabase_config';

// Provided defaults
const DEFAULT_URL = 'https://iqsbqpsycvizqmapxpse.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxc2JxcHN5Y3ZpenFtYXB4cHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjAwNzcsImV4cCI6MjA4NjQ5NjA3N30.mkbEtibMgObg524WFJmh3cJRXcuoyxcaRYiVRnGBoxQ';

export const getStoredConfig = () => {
    try {
        return JSON.parse(localStorage.getItem(KEY_STORAGE) || '{}');
    } catch { return {}; }
};

export const saveConfig = (url: string, key: string) => {
    localStorage.setItem(KEY_STORAGE, JSON.stringify({ url, key }));
};

export const clearConfig = () => {
    localStorage.removeItem(KEY_STORAGE);
};

export const getSupabase = (): SupabaseClient | null => {
    const envUrl = process.env.REACT_APP_SUPABASE_URL;
    const envKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    const { url, key } = getStoredConfig();

    const finalUrl = envUrl || url || DEFAULT_URL;
    const finalKey = envKey || key || DEFAULT_KEY;

    if (!finalUrl || !finalUrl.startsWith('http') || !finalKey) return null;

    return createClient(finalUrl, finalKey);
};

// --- DATABASE OPERATIONS ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Try catch to handle auth bypass (RLS errors)
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            name: data.full_name,
            email: data.email,
            title: data.title,
            clearanceLevel: data.clearance_level,
            atsScore: data.ats_score,
            currentStage: data.current_stage || 'preparation'
        };
    } catch (e) {
        return null;
    }
};

export const upsertProfile = async (profile: Partial<UserProfile> & { id: string }) => {
    // No-op in guest mode to prevent errors
    console.log("Profile sync skipped in Guest Mode");
};

export const updateUserProfile = async (id: string, updates: { full_name?: string; title?: string }) => {
    console.log("Update profile skipped in Guest Mode");
};

export const updateUserAtsScore = async (id: string, score: number) => {
    console.log("Score update skipped in Guest Mode");
};

// --- DOCUMENT OPERATIONS ---

export const saveDocument = async (title: string, content: string, type: 'resume' | 'cover_letter') => {
    const supabase = getSupabase();
    
    // Check for real user session
    let user = null;
    if (supabase) {
        const { data } = await supabase.auth.getUser();
        user = data.user;
    }

    if (!supabase || !user) {
        console.warn("OFFLINE MODE: Document saved to console/memory only.");
        return { 
            id: `local-${Date.now()}`, 
            title, 
            content, 
            type, 
            createdAt: new Date().toISOString() 
        };
    }

    const { data, error } = await supabase
        .from('documents')
        .insert([{
            user_id: user.id,
            title,
            content,
            type
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const fetchDocuments = async (): Promise<SavedDocument[]> => {
    const supabase = getSupabase();
    
    let user = null;
    if (supabase) {
        const { data } = await supabase.auth.getUser();
        user = data.user;
    }

    if (!supabase || !user) return [];

    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return [];

    return (data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        type: d.type,
        createdAt: d.created_at
    }));
};

export const deleteDocument = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
        await supabase.from('documents').delete().eq('id', id);
    } catch (e) { console.warn("Delete skipped in offline mode"); }
};

// --- APPLICATION OPERATIONS ---

export const fetchApplications = async (): Promise<Application[]> => {
    const supabase = getSupabase();
    
    // In guest mode, return empty array to respect No Mock Data rule
    let user = null;
    if (supabase) {
        const { data } = await supabase.auth.getUser();
        user = data.user;
    }

    if (!supabase || !user) {
        return [];
    }

    const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return [];

    // Map DB snake_case to frontend camelCase
    return (data || []).map((app: any) => ({
        id: app.id,
        company: app.company,
        role: app.role,
        status: app.status,
        dateAdded: app.date_added,
        notes: app.notes
    }));
};

export const createApplication = async (app: Omit<Application, 'id'>) => {
    const supabase = getSupabase();

    let user = null;
    if (supabase) {
        const { data } = await supabase.auth.getUser();
        user = data.user;
    }

    if (!supabase || !user) {
        return {
            id: `local-${Date.now()}`,
            ...app
        };
    }

    const { data, error } = await supabase
        .from('applications')
        .insert([{
            user_id: user.id,
            company: app.company,
            role: app.role,
            status: app.status,
            date_added: app.dateAdded,
            notes: app.notes
        }])
        .select()
        .single();

    if (error) throw error;
    
    return {
        id: data.id,
        company: data.company,
        role: data.role,
        status: data.status,
        dateAdded: data.date_added,
        notes: data.notes
    };
};

export const updateApplicationStatus = async (id: string, status: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
        await supabase
            .from('applications')
            .update({ status })
            .eq('id', id);
    } catch (e) { console.warn("Update skipped in offline mode"); }
};

export const deleteApplicationDB = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
        await supabase
            .from('applications')
            .delete()
            .eq('id', id);
    } catch (e) { console.warn("Delete skipped in offline mode"); }
};