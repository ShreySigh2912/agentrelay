import { Client, GatewayIntentBits, Partials } from 'discord.js';
import chalk from 'chalk';
import AgentBridge from '../agent/bridge.js';
import SessionManager from '../sessions/manager.js';
import Config from '../config/index.js';

class DiscordChannel {
  constructor() {
    this.config = new Config().load();
    this.bridge = AgentBridge;
    this.sessionManager = SessionManager;
    this.client = null;
  }

  async start() {
    if (!this.config.channels?.discord?.enabled) return;
    const token = this.config.channels.discord.token;
    
    if (!token) {
      console.error(chalk.red('❌ Discord channel enabled but no bot token provided.'));
      return;
    }

    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.DirectMessages,
        ],
        partials: [Partials.Channel]
      });

      this.client.on('ready', () => {
        console.log(chalk.green(`✅ Discord channel started as ${this.client.user.tag}`));
      });

      this.client.on('messageCreate', async (message) => {
        if (message.author.bot) return; // Prevent bot loops

        const isDM = !message.guild;
        const botMention = `<@${this.client.user.id}>`;
        let text = message.content;
        
        // Servers: only respond when bot is @mentioned
        if (!isDM) {
          const requireMention = this.config.channels.discord?.requireMention !== false;
          const isMentioned = text.includes(botMention);
          
          if (requireMention && !isMentioned) return;
          
          if (isMentioned) {
            text = text.replace(botMention, '').trim();
          }
        }
        
        if (!text) return;

        const serverName = isDM ? 'DM' : message.guild.name;
        const sender = message.author.username;
        
        // Security check: allowFrom
        const allowFrom = this.config.channels.discord?.allowFrom || [];
        if (isDM && allowFrom.length > 0 && !allowFrom.includes(sender) && !allowFrom.includes(message.author.id)) {
          console.log(chalk.gray(`[Discord] Dropped unauthorized DM from ${sender} (${message.author.id})`));
          return;
        }
        const sessionId = isDM ? `discord_dm_${message.author.id}` : `discord_${message.channel.id}`;

        console.log(chalk.magenta(`[Discord] ${new Date().toISOString()} | Server: ${serverName} | ${sender}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`));

        // Store session metadata
        this.sessionManager.update(sessionId, {
          channel: 'discord',
          sender: sender,
          displayName: message.author.globalName || sender,
        });

        // Typing indicator loop
        message.channel.sendTyping().catch(() => {});
        let typingInterval = setInterval(() => {
          message.channel.sendTyping().catch(() => {});
        }, 9000);

        try {
          const response = await this.bridge.send({ 
            sessionId, 
            text, 
            channel: 'discord', 
            senderId: sender 
          });
          clearInterval(typingInterval);

          // Split response > 2000 chars for Discord
          const chunks = response.match(/[\s\S]{1,2000}/g) || [];
          for (const chunk of chunks) {
            await message.reply(chunk);
          }
        } catch (error) {
          clearInterval(typingInterval);
          console.error(chalk.red(`[Discord Error] ${error.message}`));
        }
      });

      await this.client.login(token);
    } catch (error) {
      console.error(chalk.red(`❌ Failed to start Discord channel: ${error.message}`));
    }
  }

  async stop() {
    if (this.client) {
      this.client.destroy();
      console.log(chalk.yellow('⏸ Discord channel stopped.'));
    }
  }
}

export default DiscordChannel;
