import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Smartphone, Settings, List } from 'lucide-react';
import { io } from 'socket.io-client';

import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Channels from './pages/Channels';
import Config from './pages/Config';
import Logs from './pages/Logs';

// Connect to gateway
export const socket = io('http://localhost:18789');

function App() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Sessions', path: '/sessions', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Channels', path: '/channels', icon: <Smartphone className="w-5 h-5" /> },
    { name: 'Config', path: '/config', icon: <Settings className="w-5 h-5" /> },
    { name: 'Logs', path: '/logs', icon: <List className="w-5 h-5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-background text-gray-100 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-gray-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent">
            AgentRelay
          </h1>
          <p className="text-sm text-gray-400 mt-1">AI Gateway</p>
        </div>
        
        <nav className="flex-1 px-4 mt-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-accent/10 text-accent font-medium' 
                        : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/config" element={<Config />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </div>
      </main>
      
    </div>
  );
}

export default App;
