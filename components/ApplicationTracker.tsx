
import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, ArrowRight, Briefcase, ChevronRight, 
    TrendingUp, Calendar, Users, Search, X, 
    AlertCircle, Clock, Target, Zap, CheckCircle, Layout, Loader2
} from 'lucide-react';
import { Application, ApplicationStatus, KeyPerson } from '../types';
import { findKeyPeople } from '../services/geminiService';
import { fetchApplications, createApplication, updateApplicationStatus, deleteApplicationDB } from '../services/supabaseService';

const ApplicationTracker: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Detail Modal State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [keyPeople, setKeyPeople] = useState<KeyPerson[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);

  // Initial Load from DB
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      setLoading(true);
      const data = await fetchApplications();
      setApplications(data);
      setLoading(false);
  };

  // --- METRICS CALCULATION ---
  const activeApps = applications.filter(a => a.status !== 'archived');
  const interviews = applications.filter(a => a.status === 'interview');
  const offers = applications.filter(a => a.status === 'offer');
  const applied = applications.filter(a => a.status === 'applied');
  
  const interviewRate = activeApps.length > 0 
    ? Math.round(((interviews.length + offers.length) / activeApps.length) * 100) 
    : 0;

  const addApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany || !newRole) return;
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    const tempApp: Application = {
      id: tempId,
      company: newCompany,
      role: newRole,
      status: 'target',
      dateAdded: new Date().toLocaleDateString()
    };
    
    setApplications(prev => [tempApp, ...prev]);
    setNewCompany('');
    setNewRole('');
    setIsAdding(false);

    try {
        const savedApp = await createApplication(tempApp);
        // Replace temp ID with real DB ID
        setApplications(prev => prev.map(a => a.id === tempId ? savedApp : a));
    } catch (err) {
        console.error("Failed to save", err);
        // Revert on failure
        setApplications(prev => prev.filter(a => a.id !== tempId));
        alert("Failed to save application to database.");
    }
  };

  const moveApplication = async (id: string, newStatus: ApplicationStatus) => {
    // Optimistic Update
    setApplications(apps => apps.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));

    try {
        await updateApplicationStatus(id, newStatus);
    } catch (err) {
        console.error("Failed to update status", err);
        // Revert (could be improved with previous state tracking)
        alert("Sync failed");
    }
  };

  const deleteApplication = async (id: string) => {
    // Optimistic
    setApplications(apps => apps.filter(app => app.id !== id));
    if (selectedApp?.id === id) setSelectedApp(null);

    try {
        await deleteApplicationDB(id);
    } catch (err) {
        console.error("Failed to delete", err);
        alert("Failed to delete from database");
    }
  };

  const handleCardClick = (app: Application) => {
      setSelectedApp(app);
      setKeyPeople([]); 
  };

  const handleFindPeople = async () => {
      if (!selectedApp) return;
      setLoadingPeople(true);
      try {
          const people = await findKeyPeople(selectedApp.company, selectedApp.role);
          setKeyPeople(people);
      } catch (e) {
          alert("Could not scout team.");
      } finally {
          setLoadingPeople(false);
      }
  };

  const columns: { id: ApplicationStatus; label: string; color: string; bg: string }[] = [
    { id: 'target', label: 'Target', color: 'border-gray-500', bg: 'bg-gray-500/10' },
    { id: 'applied', label: 'Applied', color: 'border-blue-500', bg: 'bg-blue-500/10' },
    { id: 'interview', label: 'Interview', color: 'border-barker-gold', bg: 'bg-barker-gold/10' },
    { id: 'offer', label: 'Offer', color: 'border-green-500', bg: 'bg-green-500/10' },
    { id: 'archived', label: 'Archive', color: 'border-red-900', bg: 'bg-red-900/10' }
  ];

  if (loading) {
      return (
          <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-barker-gold animate-spin mb-4" />
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Loading Applications...</p>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col space-y-6 lg:space-y-8 pb-6 relative w-full max-w-[1920px] mx-auto animate-fade-in">
      
      {/* --- HEADER & METRICS --- */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1">
             <h2 className="text-3xl font-display font-bold text-white mb-2">Application Tracker</h2>
             <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-2">
                Visualize and manage your entire job application lifecycle.
             </p>
             <div className="flex items-center gap-2 text-gray-600 text-[10px] font-mono uppercase tracking-widest">
                <Layout className="w-3 h-3 text-barker-gold" />
                <span>Active Campaign: Q4_Hiring</span>
             </div>
          </div>

          <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Metric 1 */}
              <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col justify-between hover:border-barker-gold/30 transition-colors group animate-fade-in-up">
                  <div className="flex justify-between items-start">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Active Pursuits</span>
                      <Briefcase className="w-4 h-4 text-blue-400 opacity-50 group-hover:opacity-100" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{activeApps.length}</div>
              </div>
              {/* Metric 2 */}
              <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col justify-between hover:border-barker-gold/30 transition-colors group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <div className="flex justify-between items-start">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Interview Rate</span>
                      <TrendingUp className="w-4 h-4 text-barker-gold opacity-50 group-hover:opacity-100" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{interviewRate}%</div>
              </div>
              {/* Metric 3 */}
              <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col justify-between hover:border-barker-gold/30 transition-colors group animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="flex justify-between items-start">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Offers Secured</span>
                      <CheckCircle className="w-4 h-4 text-green-500 opacity-50 group-hover:opacity-100" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{offers.length}</div>
              </div>
              {/* Action Button */}
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-barker-gold hover:bg-red-600 text-white rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(229,62,62,0.2)] hover:shadow-[0_0_30px_rgba(229,62,62,0.4)] animate-fade-in-up"
                style={{ transitionDelay: '300ms' }}
              >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-widest">New Application</span>
              </button>
          </div>
      </div>

      {/* --- ADD MODAL --- */}
      {isAdding && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-barker-panel border border-white/10 w-full max-w-lg rounded-2xl p-8 shadow-2xl relative">
                 <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                 
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                     <Target className="w-5 h-5 text-barker-gold" /> New Opportunity
                 </h3>
                 
                 <form onSubmit={addApplication} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Company Name</label>
                        <input 
                        value={newCompany}
                        onChange={e => setNewCompany(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-600 rounded-xl p-4 focus:outline-none focus:border-barker-gold transition-all font-sans text-sm"
                        placeholder="e.g. Acme Corp"
                        autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Role Title</label>
                        <input 
                        value={newRole}
                        onChange={e => setNewRole(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-600 rounded-xl p-4 focus:outline-none focus:border-barker-gold transition-all font-sans text-sm"
                        placeholder="e.g. Senior Product Designer"
                        />
                    </div>
                    <button type="submit" className="w-full bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors uppercase text-xs tracking-widest">
                        Initialize Tracking
                    </button>
                 </form>
             </div>
         </div>
      )}

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 flex gap-6 min-h-0">
          
          {/* LEFT: Kanban Board */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-4 h-full min-w-[1200px]">
              {columns.map((col, idx) => (
                <div 
                    key={col.id} 
                    className="flex-1 flex flex-col min-w-[240px] bg-black/20 border border-white/5 rounded-xl h-full animate-fade-in-up"
                    style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div className={`p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${col.id === 'interview' ? 'bg-barker-gold animate-pulse' : 'bg-gray-600'}`}></div>
                        <span className="uppercase tracking-widest text-[10px] font-bold text-gray-300">{col.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-600">
                        {applications.filter(a => a.status === col.id).length}
                    </span>
                  </div>
                  
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin">
                    {applications.filter(a => a.status === col.id).map(app => (
                      <div 
                        key={app.id} 
                        onClick={() => handleCardClick(app)}
                        className="bg-barker-panel border border-white/5 p-4 rounded-lg group hover:border-barker-gold/40 hover:translate-y-[-2px] transition-all shadow-lg relative flex flex-col gap-2 cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-200 text-sm leading-tight">{app.company}</h4>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteApplication(app.id); }} 
                                className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                        
                        <p className="text-xs text-gray-500 truncate">{app.role}</p>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                            <span className="text-[9px] text-gray-600 font-mono">{app.dateAdded}</span>
                            
                            {/* Drag Controls */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                {col.id !== 'target' && (
                                    <button 
                                        onClick={() => {
                                            const prevIdx = columns.findIndex(c => c.id === col.id) - 1;
                                            if (prevIdx >= 0) moveApplication(app.id, columns[prevIdx].id);
                                        }} 
                                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                                    >
                                        <ChevronRight className="w-3 h-3 rotate-180" />
                                    </button>
                                )}
                                {col.id !== 'archived' && (
                                    <button 
                                        onClick={() => {
                                            const nextIdx = columns.findIndex(c => c.id === col.id) + 1;
                                            if (nextIdx < columns.length) moveApplication(app.id, columns[nextIdx].id);
                                        }} 
                                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                                    >
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Tactical Sidebar */}
          <div className="w-80 hidden 2xl:flex flex-col gap-6">
              {/* Priority Focus */}
              <div className="barker-card p-5 border-l-2 border-l-barker-gold animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-4 text-barker-gold">
                      <Zap className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Priority Focus</h3>
                  </div>
                  {interviews.length > 0 ? (
                      <div className="space-y-3">
                          {interviews.slice(0, 3).map(app => (
                              <div key={app.id} className="bg-white/5 p-3 rounded border border-white/5">
                                  <div className="font-bold text-white text-sm">{app.company}</div>
                                  <div className="text-[10px] text-gray-500 uppercase mt-1">Status: Active Interview</div>
                                  <button onClick={() => handleCardClick(app)} className="mt-2 text-[10px] text-barker-gold hover:text-white flex items-center gap-1 font-bold">
                                      VIEW DETAILS <ArrowRight className="w-3 h-3" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-4 text-gray-600 text-xs">
                          No active interviews.<br/>Keep pushing.
                      </div>
                  )}
              </div>

              {/* Follow Up Radar */}
              <div className="barker-card p-5 border-l-2 border-l-blue-500 animate-fade-in-up" style={{ transitionDelay: '100ms' }}>
                  <div className="flex items-center gap-2 mb-4 text-blue-400">
                      <Clock className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Action Required</h3>
                  </div>
                  {applied.length > 0 ? (
                      <div className="space-y-3">
                          <p className="text-[10px] text-gray-400 mb-2">Applications pending response:</p>
                          {applied.slice(0, 3).map(app => (
                              <div key={app.id} className="flex justify-between items-center text-xs text-gray-300 border-b border-white/5 pb-2 last:border-0">
                                  <span>{app.company}</span>
                                  <span className="text-[10px] text-gray-600">{app.dateAdded}</span>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-4 text-gray-600 text-xs">All caught up.</div>
                  )}
              </div>

              {/* Velocity Tracker */}
              <div className="barker-card p-5 animate-fade-in-up" style={{ transitionDelay: '200ms' }}>
                   <div className="flex items-center gap-2 mb-2 text-gray-400">
                      <Target className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Weekly Velocity</h3>
                   </div>
                   <div className="flex items-end gap-2 mb-2">
                       <span className="text-2xl font-bold text-white">{activeApps.length}</span>
                       <span className="text-xs text-gray-600 mb-1">/ 15 Goal</span>
                   </div>
                   <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-gradient-to-r from-barker-gold to-purple-500 rounded-full"
                         style={{ width: `${Math.min((activeApps.length / 15) * 100, 100)}%`}}
                       ></div>
                   </div>
              </div>
          </div>

      </div>

      {/* --- DETAIL MODAL --- */}
      {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-barker-panel border border-white/10 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                  {/* Header */}
                  <div className="p-8 border-b border-white/5 flex justify-between items-start bg-black/40">
                      <div>
                          <h2 className="text-3xl font-bold text-white mb-1">{selectedApp.company}</h2>
                          <p className="text-barker-gold font-mono text-sm tracking-widest uppercase">{selectedApp.role}</p>
                      </div>
                      <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-white transition-colors">
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  {/* Body */}
                  <div className="p-8 overflow-y-auto space-y-8">
                      {/* Status Timeline */}
                      <div>
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Application Status</h3>
                          <div className="flex items-center gap-2">
                              {columns.map(col => (
                                  <div key={col.id} className={`flex-1 h-2 rounded-full ${col.id === selectedApp.status ? 'bg-barker-gold' : 'bg-white/5'}`}></div>
                              ))}
                          </div>
                          <div className="mt-2 text-right text-xs font-mono text-gray-400">CURRENT STAGE: {selectedApp.status.toUpperCase()}</div>
                      </div>

                      {/* HR Scout Section */}
                      <div className="barker-card p-6 border-l-4 border-l-blue-500">
                          <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-500/10 rounded-lg">
                                      <Users className="w-5 h-5 text-blue-400" />
                                  </div>
                                  <div>
                                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recruiter Finder</h3>
                                      <p className="text-xs text-gray-500">Find Hiring Managers & Recruiters</p>
                                  </div>
                              </div>
                              <button 
                                onClick={handleFindPeople}
                                disabled={loadingPeople}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                              >
                                  {loadingPeople ? (
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : <Search className="w-3 h-3" />}
                                  Run Scout
                              </button>
                          </div>

                          {keyPeople.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {keyPeople.map((person, i) => (
                                      <div key={i} className="bg-black/30 p-4 rounded border border-white/5 hover:border-blue-500/30 transition-colors">
                                          <div className="flex items-center gap-3 mb-2">
                                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-gray-400">
                                                  {person.name.charAt(0)}
                                              </div>
                                              <div className="overflow-hidden">
                                                  <h4 className="font-bold text-white text-sm truncate">{person.name}</h4>
                                                  <p className="text-[10px] text-gray-500 uppercase truncate">{person.title}</p>
                                              </div>
                                          </div>
                                          <div className="text-[10px] text-blue-400 bg-blue-900/10 p-2 rounded border border-blue-900/20">
                                              {person.relevance}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : !loadingPeople && (
                              <div className="text-center py-8 text-gray-600 text-xs font-mono uppercase tracking-widest border border-dashed border-white/10 rounded">
                                  No Personnel Data Loaded
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ApplicationTracker;
