import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function Channels() {
  const [status, setStatus] = useState({
    whatsapp: 'loading...',
    telegram: 'loading...',
    discord: 'loading...'
  });

  useEffect(() => {
    const socket = io();
    socket.on('channel:status', (data) => setStatus(data));
    return () => socket.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Channels</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChannelCard 
          name="WhatsApp" 
          status={status.whatsapp} 
          icon="📱"
          desc="Business or Personal Account"
        />
        <ChannelCard 
          name="Telegram" 
          status={status.telegram} 
          icon="🤖"
          desc="Bot connected via @BotFather"
        />
        <ChannelCard 
          name="Discord" 
          status={status.discord} 
          icon="💬"
          desc="Server Application Bot"
        />
      </div>
    </div>
  );
}

function ChannelCard({ name, status, icon, desc }) {
  const isConnected = status === 'connected';
  const isError = status === 'error';
  
  return (
    <div className="bg-card p-6 rounded-xl border border-gray-800 relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div className="text-4xl">{icon}</div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
          isConnected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
          isError ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          'bg-gray-800 text-gray-400 border-gray-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 
            isError ? 'bg-red-500' : 'bg-gray-500'
          }`}></div>
          <span className="capitalize">{status}</span>
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-1">{name}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}
