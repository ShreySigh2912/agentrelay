import Conf from 'conf';
import path from 'path';
import os from 'os';
import fs from 'fs';

const DEFAULT_CONFIG = {
  version: "0.1.0",
  port: 18789,
  provider: "gemini",
  apiKey: "",
  model: "gemini-1.5-pro",
  systemPrompt: "You are a helpful AI assistant.",
  channels: {
    whatsapp: { enabled: false, allowFrom: [] },
    telegram: { enabled: false, token: "" },
    discord: { enabled: false, token: "" }
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
