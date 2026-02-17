
import React, { useState } from 'react';
import { generateOutreachSequence } from '../services/geminiService';
import { OutreachSequence, NetworkContact, ContactInteraction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Target, Search, Mail, Copy, Check, ArrowRight, UserPlus, Phone, Calendar, MessageSquare, Linkedin, Trash2, Plus, Users, Clock } from 'lucide-react';

const OutreachNexus: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [contacts, setContacts] = useState<NetworkContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<NetworkContact | null>(null);
  
  // Add Contact Form
  const [isAdding, setIsAdding] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactCompany, setNewContactCompany] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactStatus, setNewContactStatus] = useState<'Cold' | 'Warm' | 'Hot' | 'Advocate'>('Cold');

  // Generator State
  const [tone, setTone] = useState('Professional but Bold');
  const [loading, setLoading] = useState(false);
  const [sequence, setSequence] = useState<OutreachSequence | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const addContact = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newContactName || !newContactCompany) return;
      
      const newContact: NetworkContact = {
          id: Date.now().toString(),
          name: newContactName,
          company: newContactCompany,
          role: newContactRole,
          status: newContactStatus,
          lastContactDate: new Date().toLocaleDateString(),
          interactions: []
      };
      
      setContacts([newContact, ...contacts]);
      setIsAdding(false);
      setNewContactName('');
      setNewContactCompany('');
      setNewContactRole('');
      setSelectedContact(newContact);
  };

  const deleteContact = (id: string) => {
      setContacts(contacts.filter(c => c.id !== id));
      if (selectedContact?.id === id) setSelectedContact(null);
  };

  const handleGenerate = async () => {
    if (!selectedContact) return;
    
    setLoading(true);
    setSequence(null);
    
    try {
      const result = await generateOutreachSequence(
          selectedContact.name,
          selectedContact.company,
          selectedContact.role,
          { name: user?.name || 'Candidate', title: user?.title || 'Professional' },
          tone
      );
      setSequence(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate sequence. Check API limits.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Cold': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
          case 'Warm': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
          case 'Hot': return 'text-red-500 bg-red-500/10 border-red-500/20';
          case 'Advocate': return 'text-green-500 bg-green-500/10 border-green-500/20';
          default: return 'text-gray-400';
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center gap-6 mb-4 border-b border-barker-gold/20 pb-6 shrink-0">
        <div className="p-4 border border-barker-gold/30 bg-barker-panel">
          <Users className="w-8 h-8 text-barker-gold" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">Networking CRM</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
            Manage professional relationships and generate AI interaction strategies.
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* LEFT: Contact List */}
          <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">My Network ({contacts.length})</h3>
                  <button onClick={() => setIsAdding(!isAdding)} className="p-2 bg-barker-gold text-white rounded hover:bg-red-600 transition-colors">
                      <Plus className="w-4 h-4" />
                  </button>
              </div>

              {isAdding && (
                  <form onSubmit={addContact} className="barker-card p-4 space-y-3 animate-fade-in-up">
                      <input 
                        value={newContactName} onChange={e => setNewContactName(e.target.value)}
                        placeholder="Name" className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm text-white"
                        autoFocus
                      />
                      <input 
                        value={newContactCompany} onChange={e => setNewContactCompany(e.target.value)}
                        placeholder="Company" className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm text-white"
                      />
                      <input 
                        value={newContactRole} onChange={e => setNewContactRole(e.target.value)}
                        placeholder="Role" className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm text-white"
                      />
                      <select 
                         value={newContactStatus} onChange={e => setNewContactStatus(e.target.value as any)}
                         className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm text-white"
                      >
                          <option value="Cold">Cold</option>
                          <option value="Warm">Warm</option>
                          <option value="Hot">Hot</option>
                          <option value="Advocate">Advocate</option>
                      </select>
                      <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded text-xs uppercase tracking-widest">
                          Save Contact
                      </button>
                  </form>
              )}

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                  {contacts.length === 0 && !isAdding && (
                      <div className="text-center py-10 text-gray-600 border border-dashed border-white/10 rounded-lg">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs uppercase">No Contacts</p>
                      </div>
                  )}
                  {contacts.map(contact => (
                      <div 
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all group relative ${selectedContact?.id === contact.id ? 'bg-white/10 border-barker-gold' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                      >
                          <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-white text-sm">{contact.name}</h4>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold ${getStatusColor(contact.status)}`}>{contact.status}</span>
                          </div>
                          <p className="text-xs text-gray-400">{contact.role} at {contact.company}</p>
                          <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Last: {contact.lastContactDate}
                          </p>
                          <button 
                             onClick={(e) => { e.stopPropagation(); deleteContact(contact.id); }}
                             className="absolute right-2 bottom-2 p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <Trash2 className="w-3 h-3" />
                          </button>
                      </div>
                  ))}
              </div>
          </div>

          {/* RIGHT: Detail View */}
          <div className="lg:col-span-8 barker-card flex flex-col min-h-0 overflow-hidden">
              {selectedContact ? (
                  <div className="flex flex-col h-full">
                      {/* Contact Header */}
                      <div className="p-6 border-b border-white/10 flex justify-between items-start bg-black/20">
                          <div>
                              <h2 className="text-2xl font-bold text-white mb-1">{selectedContact.name}</h2>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <span>{selectedContact.role}</span>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-barker-gold font-bold">{selectedContact.company}</span>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button className="p-2 bg-blue-600/10 text-blue-400 rounded border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-colors">
                                  <Linkedin className="w-4 h-4" />
                              </button>
                              <button className="p-2 bg-white/5 text-gray-400 rounded border border-white/10 hover:bg-white/10 hover:text-white transition-colors">
                                  <Mail className="w-4 h-4" />
                              </button>
                          </div>
                      </div>

                      {/* Workspace */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-8">
                          {/* Strategy Generator */}
                          <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                  <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                                      <Target className="w-4 h-4 text-barker-gold" /> AI Strategy Engine
                                  </h3>
                                  <select 
                                     value={tone} onChange={e => setTone(e.target.value)}
                                     className="bg-black/40 border border-white/10 text-xs text-white rounded p-1 px-2"
                                  >
                                      <option>Professional but Bold</option>
                                      <option>Casual & Direct</option>
                                      <option>Value-Add & Helpful</option>
                                      <option>Humble & Curious</option>
                                  </select>
                              </div>

                              {!sequence ? (
                                  <div className="bg-black/20 border border-white/5 rounded-xl p-8 text-center">
                                      <p className="text-gray-500 text-sm mb-4">Generate a personalized multi-channel outreach campaign for {selectedContact.name}.</p>
                                      <button 
                                          onClick={handleGenerate}
                                          disabled={loading}
                                          className="btn-barker px-6 py-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2"
                                      >
                                          {loading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                                          Generate Campaign
                                      </button>
                                  </div>
                              ) : (
                                  <div className="space-y-4 animate-fade-in">
                                      <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                                          <div className="text-xs text-blue-300 font-bold uppercase mb-1">Psychological Profile</div>
                                          <p className="text-sm text-gray-300 leading-relaxed">{sequence.psychologicalProfile}</p>
                                          <div className="mt-2 pt-2 border-t border-blue-500/20 text-xs text-gray-400">
                                              <span className="text-blue-400 font-bold uppercase">Hook:</span> "{sequence.hookStrategy}"
                                          </div>
                                      </div>

                                      <div className="space-y-4">
                                          {sequence.steps.map((step, idx) => (
                                              <div key={idx} className="bg-black/40 border border-white/10 rounded-lg p-4 hover:border-barker-gold/30 transition-colors">
                                                  <div className="flex justify-between items-center mb-3">
                                                      <div className="flex items-center gap-2">
                                                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                                                              {step.step}
                                                          </div>
                                                          <span className="text-xs font-bold uppercase text-gray-400">{step.channel}</span>
                                                      </div>
                                                      <button 
                                                        onClick={() => copyToClipboard(step.subject ? `Subject: ${step.subject}\n\n${step.content}` : step.content, idx)}
                                                        className="text-gray-500 hover:text-white"
                                                      >
                                                          {copiedIndex === idx ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                      </button>
                                                  </div>
                                                  {step.subject && <div className="text-xs text-white font-bold mb-2">Subject: {step.subject}</div>}
                                                  <p className="text-sm text-gray-300 whitespace-pre-wrap font-serif bg-black/20 p-3 rounded border border-white/5">{step.content}</p>
                                                  <p className="text-[10px] text-gray-500 mt-2 italic">Why: {step.whyItWorks}</p>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-50">
                      <UserPlus className="w-16 h-16 mb-4" />
                      <p className="font-mono text-xs uppercase tracking-[0.2em]">Select a Contact</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default OutreachNexus;
