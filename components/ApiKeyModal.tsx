import React, { useState, useEffect } from 'react';
import { AlertCircle, Key } from 'lucide-react';
import { ensureApiKeySelected } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleSelectKey = async () => {
    setLoading(true);
    try {
      await ensureApiKeySelected();
      onSuccess();
    } catch (e) {
      console.error("Key selection failed", e);
      alert("Please go to Settings to configure your A4F API Key.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 text-indigo-600 mb-4">
          <Key className="w-8 h-8" />
          <h2 className="text-xl font-bold">A4F API Key Required</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          This feature requires a valid A4F API Key to function.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Configuration Needed</p>
            <p>Please ensure your A4F API Key and Endpoint are saved in the Settings panel.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSelectKey}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Checking...' : 'Check Key & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
