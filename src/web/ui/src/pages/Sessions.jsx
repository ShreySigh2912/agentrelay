import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/sessions');
      setSessions(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Delete this session?')) {
      await axios.delete(`/api/sessions/${id}`);
      fetchSessions();
    }
  };

  const clearAll = async () => {
    if (confirm('Delete ALL sessions? This cannot be undone.')) {
      for (const s of sessions) {
        await axios.delete(`/api/sessions/${s.id}`);
      }
      fetchSessions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Active Sessions</h2>
        <button 
          onClick={clearAll}
          className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-400">Channel</th>
              <th className="p-4 text-sm font-semibold text-gray-400">Sender</th>
              <th className="p-4 text-sm font-semibold text-gray-400">Messages</th>
              <th className="p-4 text-sm font-semibold text-gray-400">Last Active</th>
              <th className="p-4 text-sm font-semibold text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4 capitalize text-gray-300">{session.channel}</td>
                <td className="p-4">
                  <div className="font-medium">{session.displayName}</div>
                  <div className="text-xs text-gray-500">{session.sender}</div>
                </td>
                <td className="p-4">{session.messageCount}</td>
                <td className="p-4 text-sm text-gray-400">
                  {new Date(session.lastActive).toLocaleString()}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDelete(session.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  No active sessions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
