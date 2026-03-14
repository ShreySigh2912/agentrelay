import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';
import process from 'process';
import { fileURLToPath } from 'url';

import Config from '../config/index.js';
import SessionManager from '../sessions/manager.js';
import AgentBridge from '../agent/bridge.js';
import gatewayController from '../services/gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function startGateway() {
  console.clear();

  // STEP 1 — Check config exists
  const configManager = new Config();
  
  if (!configManager.exists()) {
    console.error(chalk.red('❌ Error: Configuration not found.'));
    console.error(chalk.yellow('Please run "agentrelay onboard" first to set up your gateway.'));
    process.exit(1);
  }

  const baseConfig = configManager.load();
  const sessionManager = new SessionManager();
  
  // STEP 2 — Start all enabled channels via the controller
  console.log(chalk.cyan('Starting AgentRelay Gateway...\n'));
  await gatewayController.startAll();

  // Map for status reporting to Socket.IO
  const getStatus = () => {
    const s = gatewayController.getStatus();
    return {
      whatsapp: s.whatsapp.running ? 'connected' : (s.whatsapp.enabled ? 'error' : 'disabled'),
      telegram: s.telegram.running ? 'connected' : (s.telegram.enabled ? 'error' : 'disabled'),
      discord: s.discord.running ? 'connected' : (s.discord.enabled ? 'error' : 'disabled')
    };
  };

  // STEP 3 — Start Express HTTP server & Socket.IO
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  app.use(express.json());

  // Serve the web dashboard
  const uiPath = path.join(__dirname, '../web/ui/dist');
  app.use(express.static(uiPath));


  io.on('connection', (socket) => {
    // Send initial statuses immediately upon connect
    socket.emit('channel:status', getStatus());
  });

  // STEP 4 — REST API endpoints
  
  // Return all active sessions
  app.get('/api/sessions', (req, res) => {
    res.json(sessionManager.list());
  });

  // Delete a session
  app.delete('/api/sessions/:id', (req, res) => {
    sessionManager.delete(req.params.id);
    AgentBridge.clearSession(req.params.id);
    io.emit('session:update', req.params.id, 'deleted');
    res.json({ success: true });
  });

  // Return chat history for a session
  app.get('/api/sessions/:id/history', (req, res) => {
    res.json(AgentBridge.getSessionHistory(req.params.id));
  });

  // Return config but with API key masked
  app.get('/api/config', (req, res) => {
    const { apiKey, ...safeConfig } = configManager.load();
    const maskedKey = apiKey ? `***${apiKey.slice(-4)}` : '';
    res.json({ ...safeConfig, maskedApiKey: maskedKey });
  });

  // Update prompt and model settings logically
  app.post('/api/config', (req, res) => {
    const { systemPrompt, model } = req.body;
    let data = configManager.load();
    
    if (systemPrompt) data.systemPrompt = systemPrompt;
    if (model) data.model = model;
    
    configManager.save(data);
    res.json({ success: true });
  });

  app.get('/api/stats', (req, res) => {
    res.json(sessionManager.getStats());
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Catch-all: serve index.html for all non-API routes (React SPA client-side routing)
  // Note: Express 5 requires /{*path} for catch-alls
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/ui/dist/index.html'));
  });

  // STEP 5 — Show startup success message
  const port = baseConfig.port || 18789;
  
  server.listen(port, () => {
    const waStatus = channelStatus.whatsapp === 'connected' ? 'connected' : channelStatus.whatsapp === 'error' ? 'error' : 'disabled';
    const tgStatus = channelStatus.telegram === 'connected' ? 'connected' : channelStatus.telegram === 'error' ? 'error' : 'disabled';
    const dcStatus = channelStatus.discord === 'connected' ? 'connected' : channelStatus.discord === 'error' ? 'error' : 'disabled';

    const successMsg = `✅ AgentRelay is running!\n\n📱 WhatsApp: ${waStatus}\n🤖 Telegram: ${tgStatus}\n💬 Discord: ${dcStatus}\n\n🌐 Dashboard: http://localhost:${port}`;
    
    console.log('\n' + boxen(successMsg, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'green'
    }));
  });

  // STEP 6 — Handle graceful shutdown
  const shutdown = async () => {
    console.log(chalk.yellow('\nShutting down safely...'));
    
    // Stop all listening channels via controller
    const status = gatewayController.getStatus();
    if (status.whatsapp.running) await gatewayController.stopChannel('whatsapp');
    if (status.telegram.running) await gatewayController.stopChannel('telegram');
    if (status.discord.running) await gatewayController.stopChannel('discord');

    server.close(() => {
      console.log(chalk.green('AgentRelay stopped.'));
      process.exit(0);
    });

    // Fallback if it hangs
    setTimeout(() => {
      console.error(chalk.red('Forced shutdown due to timeout.'));
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
