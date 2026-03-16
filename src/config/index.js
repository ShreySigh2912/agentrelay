import Conf from 'conf';
import path from 'path';
import os from 'os';
import fs from 'fs';

const DEFAULT_CONFIG = {
  version: "0.2.0",
  port: 18789,
  provider: "gemini",
  apiKey: "",
  openaiKey: "",
  agents: [
    {
      id: "default",
      name: "Default Assistant",
      model: "gemini-1.5-pro",
      systemPrompt: "You are a helpful AI assistant.",
      tools: [], // list of dynamic tools { name, description, url, method, headers }
      mcpServers: [], // list of MCP server configs { name, url/command }
      cronJobs: [] // list of scheduled tasks { schedule, prompt, channel, recipient }
    }
  ],
  channels: {
    whatsapp: { enabled: false, allowFrom: [], requireMention: true },
    telegram: { enabled: false, token: "", allowFrom: [], requireMention: true },
    discord: { enabled: false, token: "", allowFrom: [], requireMention: true },
    mattermost: { enabled: false, url: "", token: "", allowFrom: [], requireMention: true },
    imessage: { enabled: false, allowFrom: [], pollIntervalMs: 3000 }
  }
};

class Config {
  constructor() {
    const configDir = path.join(os.homedir(), '.agentrelay');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    this.store = new Conf({
      projectName: 'agentrelay',
      cwd: configDir,
      configName: 'config',
      defaults: DEFAULT_CONFIG
    });

    this.migrate();
  }

  migrate() {
    let data = this.store.store;
    let needsSave = false;
    
    // Migrate v0.1.x config (single agent) to v0.2.x (multi agent)
    // Only migrate if old keys exist AND agents array is either missing or empty
    if ((data.systemPrompt !== undefined || data.model !== undefined) && (!data.agents || data.agents.length === 0)) {
      if (!data.agents) {
        data.agents = [];
      }
      
      const hasDefault = data.agents.some(a => a.id === 'default');
      if (!hasDefault) {
        data.agents.push({
          id: "default",
          name: "Default Assistant",
          model: data.model || DEFAULT_CONFIG.agents[0].model,
          systemPrompt: data.systemPrompt || DEFAULT_CONFIG.agents[0].systemPrompt
        });
      }
      
      delete data.systemPrompt;
      delete data.model;
      
      data.version = "0.2.0";
      needsSave = true;
    }

    // Ensure version is set if it's missing but agents exist
    if (!data.version && data.agents && data.agents.length > 0) {
      data.version = "0.2.0";
      needsSave = true;
    }

    if (needsSave) {
      this.store.store = data;
    }
  }

  load() {
    return this.store.store;
  }

  save(data) {
    this.store.store = data;
  }

  get(key) {
    return this.store.get(key);
  }

  set(key, value) {
    this.store.set(key, value);
  }

  exists() {
    return fs.existsSync(this.store.path);
  }

  isConfigured() {
    return !!this.get('apiKey');
  }

  reset() {
    if (fs.existsSync(this.store.path)) {
      fs.unlinkSync(this.store.path);
    }
  }
}

export default Config;
