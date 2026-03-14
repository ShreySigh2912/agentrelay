import Config from '../config/index.js';
import TelegramChannel from '../channels/telegram.js';
import DiscordChannel from '../channels/discord.js';
import WhatsAppChannel from '../channels/whatsapp.js';
import chalk from 'chalk';

class GatewayController {
  constructor() {
    this.configManager = new Config();
    this.activeChannels = new Map(); // 'whatsapp' | 'telegram' | 'discord' -> instance
  }

  async startAll() {
    const config = this.configManager.load();
    
    if (config.channels?.telegram?.enabled) await this.startChannel('telegram');
    if (config.channels?.discord?.enabled) await this.startChannel('discord');
    if (config.channels?.whatsapp?.enabled) await this.startChannel('whatsapp');
  }

  async startChannel(name) {
    if (this.activeChannels.has(name)) return { success: true, message: `${name} already running` };

    try {
      let channel;
      if (name === 'telegram') channel = new TelegramChannel();
      else if (name === 'discord') channel = new DiscordChannel();
      else if (name === 'whatsapp') channel = new WhatsAppChannel();

      await channel.start();
      this.activeChannels.set(name, channel);
      return { success: true, message: `${name} started successfully` };
    } catch (error) {
      return { success: false, message: `Failed to start ${name}: ${error.message}` };
    }
  }

  async stopChannel(name) {
    const channel = this.activeChannels.get(name);
    if (!channel) return { success: true, message: `${name} not running` };

    try {
      await channel.stop();
      this.activeChannels.delete(name);
      return { success: true, message: `${name} stopped successfully` };
    } catch (error) {
      return { success: false, message: `Failed to stop ${name}: ${error.message}` };
    }
  }

  async toggleChannel(name, enabled) {
    const config = this.configManager.load();
    if (!config.channels) config.channels = {};
    if (!config.channels[name]) config.channels[name] = {};
    
    config.channels[name].enabled = enabled;
    this.configManager.save(config);

    if (enabled) {
      return await this.startChannel(name);
    } else {
      return await this.stopChannel(name);
    }
  }

  getStatus() {
    const config = this.configManager.load();
    return {
      whatsapp: {
        enabled: !!config.channels?.whatsapp?.enabled,
        running: this.activeChannels.has('whatsapp')
      },
      telegram: {
        enabled: !!config.channels?.telegram?.enabled,
        running: this.activeChannels.has('telegram')
      },
      discord: {
        enabled: !!config.channels?.discord?.enabled,
        running: this.activeChannels.has('discord')
      }
    };
  }

  async updateSystemPrompt(prompt) {
    const config = this.configManager.load();
    config.systemPrompt = prompt;
    this.configManager.save(config);
    return { success: true, message: 'System prompt updated' };
  }
}

// Singleton instance for the gateway process
const gatewayController = new GatewayController();
export default gatewayController;
