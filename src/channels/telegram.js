import { Bot } from 'grammy';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import AgentBridge from '../agent/bridge.js';
import SessionManager from '../sessions/manager.js';
import Config from '../config/index.js';

class TelegramChannel {
  constructor() {
    this.config = new Config().load();
    this.bridge = AgentBridge;
    this.sessionManager = SessionManager;
    this.bot = null;
    this.botInfo = null;
  }

  async start() {
    if (!this.config.channels?.telegram?.enabled) return;
    const token = this.config.channels.telegram.token;
    
    if (!token) {
      console.error(chalk.red('❌ Telegram channel is enabled but no bot token was provided in config.'));
      return;
    }

    try {
      this.bot = new Bot(token);
      
      // Fetch bot info so we know our username to handle @mentions in groups
      this.botInfo = await this.bot.api.getMe();

      this.bot.on('message', async (ctx) => {
        const isPrivate = ctx.chat.type === 'private';
        const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
        
        let text = ctx.message.text || ctx.message.caption || "";
        
        // Check for audio/voice
        const isAudio = ctx.message.voice || ctx.message.audio;

        // Group chats: only respond if @mentioned
        if (isGroup) {
          const requireMention = this.config.channels.telegram?.requireMention !== false;
          const botUsername = this.botInfo.username;
          const isMentioned = text.includes(`@${botUsername}`);
          
          if (requireMention && !isMentioned) return;
          
          if (isMentioned) {
            // Strip the bot mention from the text forwarded to AI
            text = text.replace(`@${botUsername}`, '').trim();
          }
        }

        const sender = ctx.from.username || ctx.from.first_name || 'unknown';
        
        // Security check: allowFrom 
        const allowFrom = this.config.channels.telegram?.allowFrom || [];
        if (isPrivate && allowFrom.length > 0 && !allowFrom.includes(sender) && !allowFrom.includes(String(ctx.from.id))) {
          console.log(chalk.gray(`[Telegram] Dropped unauthorized message from ${sender} (${ctx.from.id})`));
          return;
        }

        if (isAudio && (!text || text.trim() === '')) {
           try {
             ctx.replyWithChatAction('record_voice').catch(() => {});
             const file = await ctx.getFile();
             const tmpFile = path.join(os.tmpdir(), `tg_audio_${crypto.randomUUID()}.ogg`);
             await file.download(tmpFile);
             
             const transcriber = (await import('../agent/transcriber.js')).default;
             const transcript = await transcriber.transcribe(tmpFile);
             if (transcript) {
               text = `[Voice Transcription] ${transcript}`;
             }
           } catch (err) {
             console.error(chalk.red(`[Telegram] Audio processing failed: ${err.message}`));
           }
        }

        // Check for photos
        const isPhoto = ctx.message.photo && ctx.message.photo.length > 0;
        
        if (!text && !isAudio && !isPhoto) return;

        let imageBase64 = null;
        let imageMimeType = 'image/jpeg';
        if (isPhoto) {
          try {
            const photoArr = ctx.message.photo;
            const bestPhoto = photoArr[photoArr.length - 1]; // highest resolution
            const file = await ctx.api.getFile(bestPhoto.file_id);
            const tmpFile = path.join(os.tmpdir(), `tg_img_${crypto.randomUUID()}.jpg`);
            await file.download(tmpFile);
            imageBase64 = fs.readFileSync(tmpFile).toString('base64');
            fs.unlinkSync(tmpFile);
            if (!text) text = ctx.message.caption || 'What is this image?';
            console.log(chalk.blue(`[Telegram] 📷 Image received from ${sender}`));
          } catch (imgErr) {
            console.error(chalk.red(`[Telegram] Image download failed: ${imgErr.message}`));
          }
        }

        const sessionId = `telegram_${ctx.chat.id}`;
        
        console.log(chalk.blue(`[Telegram] ${new Date().toISOString()} | ${sender}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`));

        // Store session data
        this.sessionManager.update(sessionId, {
          channel: 'telegram',
          sender: sender,
          displayName: ctx.from.first_name,
        });

        // Show typing indicator
        let typingInterval = setInterval(() => {
          ctx.replyWithChatAction('typing').catch(() => {});
        }, 4000);

        try {
          ctx.replyWithChatAction('typing').catch(() => {});
          
          // Send to AI bridge
          const response = await this.bridge.send({ 
            sessionId, 
            text, 
            channel: 'telegram', 
            senderId: sender,
            imageBase64,
            imageMimeType
          });
          
          clearInterval(typingInterval);

          // Split response if longer than 4000 chars and send
          const chunks = response.match(/[\s\S]{1,4000}/g) || [];
          for (const chunk of chunks) {
            await ctx.reply(chunk);
          }
        } catch (error) {
          clearInterval(typingInterval);
          console.error(chalk.red(`[Telegram Error] ${error.message}`));
        }
      });

      this.bot.start({
        onStart: (botInfo) => {
          console.log(chalk.green(`✅ Telegram channel started successfully as @${botInfo.username}`));
        }
      });
    } catch (error) {
      console.error(chalk.red(`❌ Failed to start Telegram channel: ${error.message}`));
    }
  }

  async stop() {
    if (this.bot) {
      await this.bot.stop();
      console.log(chalk.yellow('⏸ Telegram channel stopped.'));
    }
  }
}

export default TelegramChannel;
