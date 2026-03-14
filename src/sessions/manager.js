class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 30 * 60 * 1000); // 30 mins
  }

  get(sessionId, initialData = {}) {
    const now = new Date().toISOString();
    
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);
      session.lastActive = now;
      return session;
    }

    const { channel = 'unknown', sender = 'unknown', displayName = 'User', model = 'gemini-1.5-pro' } = initialData;

    const newSession = {
      id: sessionId,
      channel,
      sender,
      displayName,
      messageCount: 0,
      model,
      createdAt: now,
      lastActive: now,
      ...initialData
    };

    this.sessions.set(sessionId, newSession);
    return newSession;
  }

  update(sessionId, data) {
    if (!this.sessions.has(sessionId)) {
      this.get(sessionId, data);
      return this.sessions.get(sessionId);
    }
    
    const session = this.sessions.get(sessionId);
    Object.assign(session, data);
    session.lastActive = new Date().toISOString();
    return session;
  }

  delete(sessionId) {
    return this.sessions.delete(sessionId);
  }

  list() {
    return Array.from(this.sessions.values())
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
  }

  clear() {
    this.sessions.clear();
  }

  getStats() {
    const sessions = Array.from(this.sessions.values());
    
    const stats = {
      totalSessions: sessions.length,
      sessionsByChannel: {},
      totalMessages: 0
    };

    for (const session of sessions) {
      // Aggregate by channel count
      if (!stats.sessionsByChannel[session.channel]) {
        stats.sessionsByChannel[session.channel] = 0;
      }
      stats.sessionsByChannel[session.channel]++;
      
      // Sum total messages
      stats.totalMessages += session.messageCount || 0;
    }

    return stats;
  }

  cleanup() {
    const now = new Date().getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    
    for (const [id, session] of this.sessions.entries()) {
      const lastActiveTime = new Date(session.lastActive).getTime();
      if (now - lastActiveTime > twentyFourHoursMs) {
        this.sessions.delete(id);
      }
    }
  }
}

export default SessionManager;
