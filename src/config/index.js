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
      systemPrompt: "You are a helpful AI assistant."
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
    if (data.systemPrompt !== undefined || data.model !== undefined) {
      if (!data.agents) {
        data.agents = [];
      }
      
      data.agents.push({
        id: "default",
        name: "Default Assistant",
        model: data.model || DEFAULT_CONFIG.agents[0].model,
        systemPrompt: data.systemPrompt || DEFAULT_CONFIG.agents[0].systemPrompt
      });
      
      delete data.systemPrompt;
      delete data.model;
      
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
