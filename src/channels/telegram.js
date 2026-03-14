import { Bot } from 'grammy';
import chalk from 'chalk';
import AgentBridge from '../agent/bridge.js';
import SessionManager from '../sessions/manager.js';
import Config from '../config/index.js';

class TelegramChannel {
  constructor() {
    this.config = new Config().load();
    this.bridge = AgentBridge;
    this.sessionManager = new SessionManager();
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

      this.bot.on('message:text', async (ctx) => {
        const isPrivate = ctx.chat.type === 'private';
        const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
        
        let text = ctx.message.text;
        
        // Group chats: only respond if @mentioned
        if (isGroup) {
          const botUsername = this.botInfo.username;
          if (!text.includes(`@${botUsername}`)) return;
          // Strip the bot mention from the text forwarded to AI
          text = text.replace(`@${botUsername}`, '').trim();
        }

        const sender = ctx.from.username || ctx.from.first_name || 'unknown';
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
          const response = await this.bridge.send({ sessionId, text });
          
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
