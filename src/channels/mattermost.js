import chalk from 'chalk';
import AgentBridge from '../agent/bridge.js';
import SessionManager from '../sessions/manager.js';
import Config from '../config/index.js';

/**
 * MattermostChannel — connects AgentRelay to a Mattermost server via WebSocket.
 * 
 * Required config keys (under channels.mattermost):
 *   - enabled: true
 *   - url: 'https://your-mattermost-server.com'
 *   - token: 'your-bot-token'        (Personal Access Token with read/write)
 *   - teamId: 'team-id'              (from Mattermost API)
 *   - channelId: 'channel-id'        (optional, for dedicated channel)
 *   - requireMention: true           (if false, responds to all messages)
 *   - allowFrom: []                  (list of allowed usernames)
 */
class MattermostChannel {
  constructor() {
    this.config = new Config().load();
    this.bridge = AgentBridge;
    this.sessionManager = SessionManager;
    this.ws = null;
    this.botUser = null;
  }

  async start() {
    const cfg = this.config.channels?.mattermost;
    if (!cfg?.enabled) return;
    if (!cfg.url || !cfg.token) {
      console.error(chalk.red('❌ Mattermost: url and token are required.'));
      return;
    }

    try {
      // Fetch bot user info
      const baseUrl = cfg.url.replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/v4/users/me`, {
        headers: { Authorization: `Bearer ${cfg.token}` }
      });
      if (!res.ok) throw new Error(`Mattermost auth failed: ${res.status}`);
      this.botUser = await res.json();
      
      console.log(chalk.magenta(`✅ Mattermost connected as @${this.botUser.username}`));

      // Open WebSocket
      const wsUrl = baseUrl.replace(/^https?/, 'wss').replace(/^http/, 'ws');
      const { default: WebSocket } = await import('ws');
      this.ws = new WebSocket(`${wsUrl}/api/v4/websocket`, {
        headers: { Authorization: `Bearer ${cfg.token}` }
      });

      this.ws.on('open', () => {
        // Authenticate the WebSocket session
        this.ws.send(JSON.stringify({
          seq: 1,
          action: 'authentication_challenge',
          data: { token: cfg.token }
        }));
      });

      this.ws.on('message', async (rawData) => {
        let event;
        try { event = JSON.parse(rawData.toString()); } catch { return; }
        
        if (event.event !== 'posted') return;
        
        let post;
        try { post = JSON.parse(event.data.post); } catch { return; }

        // Skip own messages
        if (post.user_id === this.botUser.id) return;

        const text = post.message || '';
        const username = event.data.sender_name?.replace('@', '') || post.user_id;
        const channelId = post.channel_id;

        // requireMention check
        const requireMention = cfg.requireMention !== false;
        const isMentioned = text.includes(`@${this.botUser.username}`);
        if (requireMention && !isMentioned) return;
        
        const cleanText = text.replace(`@${this.botUser.username}`, '').trim();

        // allowFrom check
        const allowFrom = cfg.allowFrom || [];
        if (allowFrom.length > 0 && !allowFrom.includes(username)) {
          console.log(chalk.gray(`[Mattermost] Dropped message from unauthorized user: ${username}`));
          return;
        }
        
        if (!cleanText) return;

        const sessionId = `mattermost_${channelId}`;
        console.log(chalk.magenta(`[Mattermost] ${new Date().toISOString()} | @${username}: ${cleanText.substring(0, 50)}`));

        this.sessionManager.update(sessionId, {
          channel: 'mattermost',
          sender: username,
          displayName: username,
        });

        try {
          const response = await this.bridge.send({
            sessionId,
            text: cleanText,
            channel: 'mattermost',
            senderId: username
          });

          // Post reply
          await fetch(`${baseUrl}/api/v4/posts`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cfg.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              channel_id: channelId,
              message: response,
              root_id: post.id, // Thread reply
            })
          });
        } catch (err) {
          console.error(chalk.red(`[Mattermost Error] ${err.message}`));
        }
      });

      this.ws.on('error', (e) => console.error(chalk.red(`[Mattermost WS Error] ${e.message}`)));
      this.ws.on('close', () => {
        console.log(chalk.yellow('[Mattermost] Connection closed. Reconnecting in 10s...'));
        setTimeout(() => this.start(), 10000);
      });

    } catch (err) {
      console.error(chalk.red(`❌ Failed to start Mattermost: ${err.message}`));
    }
  }

  async stop() {
    if (this.ws) {
      this.ws.close();
      console.log(chalk.yellow('⏸ Mattermost channel stopped.'));
    }
  }
}

export default MattermostChannel;
