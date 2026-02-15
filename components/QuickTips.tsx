import React, { useState } from 'react';
import { getQuickTip } from '../services/geminiService';
import { Zap, ChevronRight, Terminal } from 'lucide-react';

const QuickTips: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const result = await getQuickTip(question);
      setAnswer(result || "No intel found.");
    } catch (e) {
      setAnswer("Transmission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="barker-card p-6">
      <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
        <Terminal className="w-4 h-4 text-barker-gold" />
        <h3 className="font-display font-bold text-sm tracking-widest text-white uppercase">Tactical Advice</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="relative mb-4">
        <input 
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Query the database..."
          className="w-full bg-black/20 border border-white/10 text-white placeholder-gray-500 rounded-lg p-3 pr-10 focus:outline-none focus:border-barker-gold focus:ring-1 focus:ring-barker-gold transition-all font-sans text-xs"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-barker-gold transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>

      {answer && (
        <div className="p-4 bg-white/5 border-l-2 border-barker-gold text-xs leading-relaxed animate-fade-in text-gray-300 font-sans">
          {answer}
        </div>
      )}
      
      {!answer && (
         <div className="text-[10px] text-gray-700 font-mono uppercase">
            Waiting for query input...
         </div>
      )}
    </div>
  );
};

export default QuickTips;