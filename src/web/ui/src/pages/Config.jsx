import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2, Wrench, Clock, Share2, Box } from 'lucide-react';

export default function Config() {
  const [config, setConfig] = useState(null);
  const [agents, setAgents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get('/api/config')
      .then(res => {
        setConfig(res.data);
        setAgents(res.data.agents || []);
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await axios.post('/api/config', { agents });
      setMsg('Agents saved successfully!');
    } catch (err) {
      setMsg('Error saving settings.');
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const addAgent = () => {
    const newId = `agent_${Date.now()}`;
    setAgents([
      ...agents, 
      { 
        id: newId, 
        name: 'New Assistant', 
        model: config.model || 'gemini-1.5-pro', 
        systemPrompt: 'You are a helpful AI assistant.',
        tools: [],
        mcpServers: [],
        cronJobs: []
      }
    ]);
  };

  const removeAgent = (index) => {
    const newAgents = [...agents];
    newAgents.splice(index, 1);
    // Enforce at least one fallback agent named default if they delete everything
    if (newAgents.length === 0) {
       newAgents.push({ id: 'default', name: 'Default Assistant', model: 'gemini-1.5-pro', systemPrompt: 'You are an AI.' });
    }
    setAgents(newAgents);
  };

  const updateAgent = (index, field, value) => {
    const newAgents = [...agents];
    newAgents[index][field] = value;
    setAgents(newAgents);
  };

  if (!config) return <div className="p-8 text-gray-400 animate-pulse">Loading config...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Agent Roster</h2>
          <p className="text-gray-400">Manage multiple AI personas and their system prompts.</p>
        </div>
        <button 
          onClick={addAgent}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-gray-700"
        >
          <Plus className="w-4 h-4" /> Add Agent
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-xl border border-gray-800 p-6">
          <label className="text-sm text-gray-400 font-medium block mb-2">Active Provider</label>
          <div className="bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-800 text-gray-300 font-mono capitalize">
            {config.provider}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-gray-800 p-6">
          <label className="text-sm text-gray-400 font-medium block mb-2">API Key</label>
          <div className="bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-800 text-gray-500 font-mono">
            {config.maskedApiKey || 'Not configured'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {agents.map((agent, index) => (
          <div key={agent.id} className="bg-card rounded-xl border border-gray-800 p-6 space-y-4 relative group">
            
            {agent.id !== 'default' && (
              <button 
                type="button"
                onClick={() => removeAgent(index)}
                className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                title="Remove Agent"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-200 font-medium block mb-2">Agent Name</label>
                <input 
                  type="text" 
                  value={agent.name} 
                  onChange={e => updateAgent(index, 'name', e.target.value)}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-gray-200 font-medium block mb-2">Model ID</label>
                <input 
                  type="text" 
                  value={agent.model} 
                  onChange={e => updateAgent(index, 'model', e.target.value)}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-200 font-medium block mb-2">System Prompt</label>
              <textarea 
                rows="4"
                value={agent.systemPrompt} 
                onChange={e => updateAgent(index, 'systemPrompt', e.target.value)}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all resize-y font-mono text-sm leading-relaxed"
              />
            </div>

            {/* Advanced Settings */}
            <div className="pt-4 border-t border-gray-800 space-y-4">
               <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <Share2 className="w-4 h-4" /> Capabilities
               </h4>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Dynamic Tools Section */}
                 <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                       <Wrench className="w-3 h-3" /> Webhook Tools
                     </label>
                     <button 
                        type="button"
                        onClick={() => {
                          const newer = [...agents];
                          newer[index].tools = [...(newer[index].tools || []), { name: 'get_data', description: 'Fetch data from api', url: 'https://api.example.com', method: 'POST' }];
                          setAgents(newer);
                        }}
                        className="text-xs text-accent hover:underline"
                     >
                       + Add
                     </button>
                   </div>
                   {(agent.tools || []).map((tool, tIdx) => (
                      <div key={tIdx} className="bg-gray-900/40 p-3 rounded border border-gray-800 text-[10px] space-y-2 relative">
                        <button type="button" className="absolute top-1 right-1 text-gray-600 hover:text-red-400" onClick={() => {
                             const newer = [...agents];
                             newer[index].tools.splice(tIdx, 1);
                             setAgents(newer);
                        }}><Trash2 className="w-3 h-3"/></button>
                        <input 
                          type="text" 
                          placeholder="Tool Name"
                          value={tool.name}
                          onChange={e => {
                            const newer = [...agents];
                            newer[index] = { ...newer[index], tools: [...(newer[index].tools || [])] };
                            newer[index].tools[tIdx] = { ...newer[index].tools[tIdx], name: e.target.value };
                            setAgents(newer);
                          }}
                          className="w-full bg-transparent border-b border-gray-700 focus:border-accent outline-none font-bold text-gray-300 pb-1"
                        />
                        <input 
                          type="text" 
                          placeholder="Endpoint URL"
                          value={tool.url}
                          onChange={e => {
                            const newer = [...agents];
                            newer[index] = { ...newer[index], tools: [...(newer[index].tools || [])] };
                            newer[index].tools[tIdx] = { ...newer[index].tools[tIdx], url: e.target.value };
                            setAgents(newer);
                          }}
                          className="w-full bg-transparent border-b border-gray-700 focus:border-accent outline-none text-gray-500 pb-1"
                        />
                      </div>
                   ))}
                 </div>

                 {/* MCP Section */}
                 <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                       <Box className="w-3 h-3" /> MCP Servers
                     </label>
                     <button 
                        type="button"
                        onClick={() => {
                          const newer = [...agents];
                          newer[index].mcpServers = [...(newer[index].mcpServers || []), { name: 'mcp-server', command: 'npx', args: ['-y', '@modelcontextprotocol/server-everything'] }];
                          setAgents(newer);
                        }}
                        className="text-xs text-accent hover:underline"
                     >
                       + Add
                     </button>
                   </div>
                   {(agent.mcpServers || []).map((mcp, mIdx) => (
                      <div key={mIdx} className="bg-gray-900/40 p-3 rounded border border-gray-800 text-[10px] space-y-2 relative">
                        <button type="button" className="absolute top-1 right-1 text-gray-600 hover:text-red-400" onClick={() => {
                             const newer = [...agents];
                             newer[index].mcpServers.splice(mIdx, 1);
                             setAgents(newer);
                        }}><Trash2 className="w-3 h-3"/></button>
                        <input 
                          type="text" 
                          placeholder="Server Name"
                          value={mcp.name}
                          onChange={e => {
                            const newer = [...agents];
                            newer[index] = { ...newer[index], mcpServers: [...(newer[index].mcpServers || [])] };
                            newer[index].mcpServers[mIdx] = { ...newer[index].mcpServers[mIdx], name: e.target.value };
                            setAgents(newer);
                          }}
                          className="w-full bg-transparent border-b border-gray-700 focus:border-accent outline-none font-bold text-gray-300 pb-1"
                        />
                        <input 
                          type="text" 
                          placeholder="Command (e.g. npx)"
                          value={mcp.command}
                          onChange={e => {
                            const newer = [...agents];
                            newer[index] = { ...newer[index], mcpServers: [...(newer[index].mcpServers || [])] };
                            newer[index].mcpServers[mIdx] = { ...newer[index].mcpServers[mIdx], command: e.target.value };
                            setAgents(newer);
                          }}
                          className="w-full bg-transparent border-b border-gray-700 focus:border-accent outline-none text-gray-500 pb-1"
                        />
                      </div>
                   ))}
                 </div>

                 {/* Cron Section */}
                 <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                       <Clock className="w-3 h-3" /> Cron Jobs
                     </label>
                     <button 
                        type="button"
                        onClick={() => {
                          const newer = [...agents];
                          newer[index].cronJobs = [...(newer[index].cronJobs || []), { schedule: '0 9 * * *', prompt: 'Summarize my news' }];
                          setAgents(newer);
                        }}
                        className="text-xs text-accent hover:underline"
                     >
                       + Add
                     </button>
                   </div>
                   {(agent.cronJobs || []).map((cron, cIdx) => (
                      <div key={cIdx} className="bg-gray-900/40 p-3 rounded border border-gray-800 text-[10px] space-y-2 relative">
                        <button type="button" className="absolute top-1 right-1 text-gray-600 hover:text-red-400" onClick={() => {
                             const newer = [...agents];
                             newer[index].cronJobs.splice(cIdx, 1);
                             setAgents(newer);
                        }}><Trash2 className="w-3 h-3"/></button>
                        <input 
                          type="text" 
                          placeholder="Schedule (cron)"
                          value={cron.schedule}
                          onChange={e => {
                            const newer = [...agents];
                            newer[index] = { ...newer[index], cronJobs: [...(newer[index].cronJobs || [])] };
                            newer[index].cronJobs[cIdx] = { ...newer[index].cronJobs[cIdx], schedule: e.target.value };
                            setAgents(newer);
                          }}
                          className="w-full bg-transparent border-b border-gray-700 focus:border-accent outline-none font-bold text-gray-300 pb-1"
                        />
                        <input 
                          type="text" 
                          placeholder="Agent Prompt"
                          value={cron.prompt}
                          onChange={e => {
                            const newer = [...agents];
                            newer[index] = { ...newer[index], cronJobs: [...(newer[index].cronJobs || [])] };
                            newer[index].cronJobs[cIdx] = { ...newer[index].cronJobs[cIdx], prompt: e.target.value };
                            setAgents(newer);
                          }}
                          className="w-full bg-transparent border-b border-gray-700 focus:border-accent outline-none text-gray-500 pb-1"
                        />
                      </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        ))}
        
        <div className="pt-4 flex items-center gap-4">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save All Agents'}
          </button>
          <span className={`text-sm ${msg.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {msg}
          </span>
        </div>
      </form>
    </div>
  );
}
