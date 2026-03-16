import Config from '../config/index.js';

class AgentRouter {
  constructor() {
    this.configManager = new Config();
  }

  /**
   * Determine which agent should handle an incoming message
   * @param {string} channel - e.g., 'whatsapp', 'telegram'
   * @param {string} senderId - the user's phone number or ID
   * @returns {string} agentId -> ID of the matched agent
   */
  match(channel, senderId) {
    const config = this.configManager.load();
    const rules = config.routing?.rules || [];

    // Evaluate rules top-to-bottom
    for (const rule of rules) {
      const channelMatch = !rule.channel || rule.channel === channel;
      const senderMatch = !rule.senderMatch || new RegExp(rule.senderMatch).test(senderId);

      if (channelMatch && senderMatch) {
         return rule.agentId;
      }
    }

    // Default fallback
    return 'default';
  }
}

export default new AgentRouter();
