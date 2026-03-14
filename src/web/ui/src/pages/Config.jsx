import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';

export default function Config() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get('/api/config').then(res => setConfig(res.data)).catch(console.error);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await axios.post('/api/config', {
        systemPrompt: config.systemPrompt,
        model: config.model
      });
      setMsg('Settings saved successfully!');
    } catch (err) {
      setMsg('Error saving settings.');
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  if (!config) return <div className="p-8 text-gray-400 animate-pulse">Loading config...</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Configuration</h2>
        <p className="text-gray-400">Manage your AI provider settings.</p>
      </div>

      <div className="bg-card rounded-xl border border-gray-800 p-8">
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <label className="text-sm text-gray-400 font-medium block mb-2">Active Provider</label>
            <div className="bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-800 text-gray-300 font-mono capitalize">
              {config.provider}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 font-medium block mb-2">API Key</label>
            <div className="bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-800 text-gray-500 font-mono">
              {config.maskedApiKey || 'Not configured'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="text-sm text-gray-200 font-medium block mb-2">Model Version</label>
            <input 
              type="text" 
              value={config.model} 
              onChange={e => setConfig({...config, model: e.target.value})}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-sm text-gray-200 font-medium block mb-2">System Prompt</label>
            <textarea 
              rows="6"
              value={config.systemPrompt} 
              onChange={e => setConfig({...config, systemPrompt: e.target.value})}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all resize-y font-mono text-sm leading-relaxed"
            />
          </div>
          
          <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
            <span className={`text-sm ${msg.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {msg}
            </span>
            <button 
              type="submit" 
              disabled={saving}
              className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
