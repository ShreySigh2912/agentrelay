import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import chalk from 'chalk';
import AgentBridge from '../agent/bridge.js';
import SessionManager from '../sessions/manager.js';
import Config from '../config/index.js';
import transcriber from '../agent/transcriber.js';

class WhatsAppChannel {
  constructor() {
    this.config = new Config().load();
    this.bridge = AgentBridge;
    this.sessionManager = SessionManager;
    this.sock = null;
  }

  async start() {
    if (!this.config.channels?.whatsapp?.enabled) return;

    const authDir = path.join(os.homedir(), '.agentrelay', 'auth', 'whatsapp');

    try {
      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      this.sock = makeWASocket({
        auth: state,
        // Removed printQRInTerminal: true (deprecated) 
        // Baileys will still output QR if it needs to, but we avoid the direct flag warning
        generateHighQualityLinkPreview: true,
        // Standard Baileys practice: use a silent pino logger to avoid internal 'child' of undefined errors
        logger: pino({ level: 'silent' }),
        browser: ['AgentRelay', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          console.log(chalk.yellow('[WhatsApp] New QR Code generated. Please scan it in the terminal or dashboard.'));
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          console.log(chalk.yellow(`[WhatsApp] Connection closed (Reason: ${statusCode}). Reconnecting: ${shouldReconnect}`));
          
          if (shouldReconnect) {
            // Reconnect logic with 5s delay to avoid hammers
            setTimeout(() => this.start(), 5000);
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

          // Check for audio
          const isAudio = msg.message.audioMessage || msg.message.documentMessage?.mimetype?.startsWith('audio/');

          // Handle @mentions in groups
          if (isGroup) {
            const requireMention = this.config.channels.whatsapp.requireMention !== false; // Default true
            // Baileys assigns jid in format "919999999999:1@s.whatsapp.net" potentially
            const botJid = this.sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botNumber = this.sock.user.id.split(':')[0];
            
            const contextInfo = msg.message.extendedTextMessage?.contextInfo || msg.message.audioMessage?.contextInfo || msg.message.videoMessage?.contextInfo || msg.message.imageMessage?.contextInfo;
            const mentionedJids = contextInfo?.mentionedJid || [];
            
            const isMentioned = mentionedJids.includes(botJid) || text.includes(`@${botNumber}`);
            
            if (requireMention && !isMentioned) continue;
            
            if (isMentioned) {
              text = text.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();
            }
          }

          // Check allowFrom array specifically for Whatsapp security
          const allowFrom = this.config.channels.whatsapp.allowFrom || [];
          const senderPhone = (msg.key.participant || msg.key.remoteJid).split('@')[0];
          
          if (allowFrom.length > 0 && !allowFrom.includes(senderPhone)) {
            continue; // Not explicitly permitted
          }

          if (isAudio && (!text || text.trim() === '')) {
             try {
               await this.sock.sendPresenceUpdate('recording', remoteJid);
               const buffer = await downloadMediaMessage(msg, 'buffer', { }, { 
                  logger: pino({ level: 'silent' }),
                  reuploadRequest: this.sock.updateMediaMessage
               });
               const tmpFile = path.join(os.tmpdir(), `wa_audio_${crypto.randomUUID()}.ogg`);
               fs.writeFileSync(tmpFile, buffer);
               const transcript = await transcriber.transcribe(tmpFile);
               if (transcript) {
                 text = `[Voice Transcription] ${transcript}`;
               }
               await this.sock.sendPresenceUpdate('paused', remoteJid);
             } catch (err) {
               console.error(chalk.red(`[WhatsApp] Audio processing failed: ${err.message}`));
               await this.sock.sendPresenceUpdate('paused', remoteJid);
             }
          }

          if (!text && !isAudio && !msg.message.imageMessage) continue;

          const sessionId = `whatsapp_${remoteJid}`;
          
          // Download image if present
          let imageBase64 = null;
          let imageMimeType = 'image/jpeg';
          if (msg.message.imageMessage) {
            try {
              const buffer = await downloadMediaMessage(msg, 'buffer', {}, {
                logger: pino({ level: 'silent' }),
                reuploadRequest: this.sock.updateMediaMessage
              });
              imageBase64 = buffer.toString('base64');
              imageMimeType = msg.message.imageMessage.mimetype || 'image/jpeg';
              if (!text) text = msg.message.imageMessage.caption || 'What is this image?';
              console.log(chalk.cyan(`[WhatsApp] 📷 Image received from ${senderPhone}`));
            } catch (imgErr) {
              console.error(chalk.red(`[WhatsApp] Image download failed: ${imgErr.message}`));
            }
          }

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
            
            const response = await this.bridge.send({ 
              sessionId, 
              text, 
              channel: 'whatsapp', 
              senderId: senderPhone,
              imageBase64,
              imageMimeType
            });
            
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
