import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Inject some startup info
    setLogs([{ type: 'info', msg: 'Log console initialized. Waiting for events...', time: new Date() }]);

    const socket = io();
    
    socket.on('channel:status', (status) => {
      setLogs(prev => [...prev, { 
        type: 'info', 
        msg: `Channel statuses updated: ${JSON.stringify(status)}`, 
        time: new Date() 
      }]);
    });

    socket.on('message:new', (msg) => {
      setLogs(prev => [...prev, { 
        type: 'info', 
        msg: `Received prompt from ${msg.sender} on ${msg.channel}`, 
        time: new Date() 
      }]);
    });

    socket.on('session:update', (id, status) => {
      setLogs(prev => [...prev, { 
        type: 'warning', 
        msg: `Session ${id} ${status || 'updated'}!`, 
        time: new Date() 
      }]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="space-y-6 h-[85vh] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-3xl font-bold">System Logs</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-medium text-gray-400">Live Connection</span>
        </div>
      </div>

      <div className="bg-black/80 rounded-xl border border-gray-800 flex-1 overflow-hidden flex flex-col font-mono text-sm leading-relaxed p-4">
        <div className="overflow-y-auto flex-1 pr-2 space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-4 border-b border-gray-800/30 pb-2 mb-2 break-all">
              <span className="text-gray-500 shrink-0 select-none">
                [{log.time.toLocaleTimeString()}]
              </span>
              <span className={`${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'warning' ? 'text-yellow-400' : 'text-green-400'
              } shrink-0 w-16 uppercase font-bold select-none`}>
                {log.type}
              </span>
              <span className="text-gray-300 w-full">{log.msg}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
