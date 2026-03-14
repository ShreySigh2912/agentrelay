import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import AgentBridge from '../agent/bridge.js';
import SessionManager from '../sessions/manager.js';
import Config from '../config/index.js';

class WhatsAppChannel {
  constructor() {
    this.config = new Config().load();
    this.bridge = new AgentBridge();
    this.sessionManager = new SessionManager();
    this.sock = null;
  }

  async start() {
    if (!this.config.channels?.whatsapp?.enabled) return;

    const authDir = path.join(os.homedir(), '.agentrelay', 'auth', 'whatsapp');

    try {
      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        generateHighQualityLinkPreview: true,
        // Suppress baileys verbose logs unless requested
        logger: undefined,
        browser: ['AgentRelay', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log(chalk.yellow(`[WhatsApp] Connection closed. Reconnecting: ${shouldReconnect}`));
          if (shouldReconnect) {
            // Reconnect logic
            this.start();
          } else {
            console.log(chalk.red('[WhatsApp] Logged out. Please delete the ~/.agentrelay/auth/whatsapp directory and authenticate again.'));
          }
        } else if (connection === 'open') {
          console.log(chalk.green('✅ WhatsApp channel started globally!'));
        }
      });

      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        for (const msg of messages) {
          if (!msg.message || msg.key.fromMe) continue; // Skip own messages or system events

          const remoteJid = msg.key.remoteJid;
          const isGroup = remoteJid.endsWith('@g.us');
          let text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

          // Handle @mentions in groups
          if (isGroup) {
            // Baileys assigns jid in format "919999999999:1@s.whatsapp.net" potentially
            const botJid = this.sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botNumber = this.sock.user.id.split(':')[0];
            const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            
            const isMentioned = mentionedJids.includes(botJid) || text.includes(`@${botNumber}`);
            if (!isMentioned) continue;
            
            text = text.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();
          }

          // Check allowFrom array specifically for Whatsapp security
          const allowFrom = this.config.channels.whatsapp.allowFrom || [];
          const senderPhone = (msg.key.participant || msg.key.remoteJid).split('@')[0];
          
          if (allowFrom.length > 0 && !allowFrom.includes(senderPhone)) {
            continue; // Not explicitly permitted
          }

          if (!text) continue;

          const sessionId = `whatsapp_${remoteJid}`;
          
          console.log(chalk.cyan(`[WhatsApp] ${new Date().toISOString()} | ${senderPhone}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`));

          // Update generic session manager state
          this.sessionManager.update(sessionId, {
            channel: 'whatsapp',
            sender: senderPhone,
            displayName: msg.pushName || senderPhone,
          });

          try {
            // Mark conversation composing "typing..." presence
            await this.sock.sendPresenceUpdate('composing', remoteJid);
            
            const response = await this.bridge.send({ sessionId, text });
            
            // Revert composing state
            await this.sock.sendPresenceUpdate('paused', remoteJid);

            // Split 4000 char msgs to prevent failures
            const chunks = response.match(/[\s\S]{1,4000}/g) || [];
            for (const chunk of chunks) {
              await this.sock.sendMessage(remoteJid, { text: chunk }, { quoted: msg });
            }

          } catch (error) {
            await this.sock.sendPresenceUpdate('paused', remoteJid);
            console.error(chalk.red(`[WhatsApp Error] ${error.message}`));
          }
        }
      });

    } catch (error) {
      console.error(chalk.red(`❌ Failed to start WhatsApp channel: ${error.message}`));
    }
  }

  async stop() {
    if (this.sock) {
      this.sock.ws.close();
      console.log(chalk.yellow('⏸ WhatsApp channel stopped.'));
    }
  }
}

export default WhatsAppChannel;
