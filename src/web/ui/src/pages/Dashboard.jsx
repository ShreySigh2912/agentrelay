import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Activity, MessageSquare, Link, Zap } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalSessions: 0, totalMessages: 0 });
  const [channelStatus, setChannelStatus] = useState({});
  const [recentMessages, setRecentMessages] = useState([]);
  const [config, setConfig] = useState({});

  useEffect(() => {
    // Initial fetch
    axios.get('/api/stats').then(res => setStats(res.data)).catch(console.error);
    axios.get('/api/config').then(res => setConfig(res.data)).catch(console.error);

    // Socket listeners
    const socket = io();
    
    socket.on('channel:status', (status) => setChannelStatus(status));
    
    socket.on('message:new', (msg) => {
      setRecentMessages(prev => [msg, ...prev].slice(0, 20));
      setStats(s => ({ ...s, totalMessages: s.totalMessages + 1 }));
    });

    socket.on('message:reply', (msg) => {
      setRecentMessages(prev => [msg, ...prev].slice(0, 20));
      setStats(s => ({ ...s, totalMessages: s.totalMessages + 1 }));
    });

    socket.on('session:update', () => {
       axios.get('/api/stats').then(res => setStats(res.data)).catch(console.error);
    });

    return () => socket.disconnect();
  }, []);

  const connectedChannels = Object.values(channelStatus).filter(s => s === 'connected').length;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Sessions" value={stats.totalSessions} icon={<Activity />} />
        <StatCard title="Messages Handled" value={stats.totalMessages} icon={<MessageSquare />} />
        <StatCard title="Connected Channels" value={`${connectedChannels}/3`} icon={<Link />} />
        <StatCard title="AI Provider" value={config.provider || 'Loading...'} icon={<Zap />} />
      </div>

      {/* Live Feed */}
      <div className="bg-card rounded-xl border border-gray-800 p-6 mt-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live Activity Feed
        </h3>
        
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {recentMessages.length === 0 ? (
             <div className="text-gray-500 text-center py-8">Waiting for messages...</div>
          ) : (
            recentMessages.map((msg, i) => (
              <div key={i} className="flex flex-col p-4 bg-gray-900/50 rounded-lg border border-gray-800/50">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                     <span className={`text-xs px-2 py-1 rounded uppercase tracking-wider font-bold 
                        ${msg.channel === 'whatsapp' ? 'bg-green-500/20 text-green-400' :
                        msg.channel === 'telegram' ? 'bg-blue-500/20 text-blue-400' :
                        msg.channel === 'discord' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-700 text-gray-300'}`}>
                       {msg.channel}
                     </span>
                     <span className="font-medium text-gray-300">{msg.sender}</span>
                   </div>
                   <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-gray-400 text-sm line-clamp-3">{msg.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-card p-6 rounded-xl border border-gray-800 flex items-center gap-4">
      <div className="p-3 bg-accent/20 text-accent rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}
