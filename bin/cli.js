#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

import Config from '../src/config/index.js';
import onboardCmd from '../src/commands/onboard.js';
import gatewayCmd from '../src/commands/gateway.js';
import { sessionsList, sessionsClear } from '../src/commands/sessions.js';
import { channelsStatus } from '../src/commands/channels.js';
import { serviceInstall, serviceUninstall, serviceStatus } from '../src/commands/service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '..', 'package.json');
let version = '0.1.0';

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.version) {
    version = packageJson.version;
  }
} catch (error) {
  // Ignore error if package.json not found
}

const program = new Command();
const config = new Config();

// Check config helper
function checkConfig() {
  if (!config.exists()) {
    console.error(chalk.red('❌ AgentRelay is not set up yet.'));
    console.log(chalk.yellow('Run: agentrelay onboard'));
    process.exit(1);
  }
}

program
  .name('agentrelay')
  .description('Self-hosted AI agent gateway for WhatsApp, Telegram & Discord')
  .version(version);

program
  .command('onboard')
  .description('Run the setup wizard to configure API keys and channels')
  .action(async () => {
    await onboardCmd();
  });

program
  .command('gateway')
  .description('Start the main gateway server')
  .option('-p, --port <number>', 'Port to run the gateway dashboard on')
  .action(async (options) => {
    checkConfig();
    
    // Override port if provided via CLI argument
    if (options.port) {
      const data = config.load();
      data.port = parseInt(options.port, 10);
      config.save(data);
    }
    
    await gatewayCmd();
  });

// SESSIONS Subcommands
const sessionsCmd = program
  .command('sessions')
  .description('Manage active user sessions');

sessionsCmd
  .command('list')
  .description('List all active conversations')
  .action(() => {
    checkConfig();
    sessionsList();
  });

sessionsCmd
  .command('clear')
  .description('Clear all saved conversations')
  .action(async () => {
    checkConfig();
    await sessionsClear();
  });

// CHANNELS Subcommands
const channelsCmdGroup = program
  .command('channels')
  .description('Manage messaging channels');

channelsCmdGroup
  .command('status')
  .description('Show connected channel states')
  .action(() => {
    checkConfig();
    channelsStatus();
  });

// CONFIG Subcommands
const configCmdGroup = program
  .command('config')
  .description('Manage agent settings directly');

configCmdGroup
  .command('show')
  .description('Print current configuration state')
  .action(() => {
    checkConfig();
    const data = config.load();
    const { apiKey, ...safeData } = data;
    console.log(chalk.cyan('AgentRelay Configuration:\n'));
    console.log({
      ...safeData,
      apiKey: apiKey ? `***${apiKey.slice(-4)}` : null
    });
  });

configCmdGroup
  .command('set <key> <value>')
  .description('Set a root config value (e.g. systemPrompt, model)')
  .action((key, value) => {
    checkConfig();
    const data = config.load();
    if (key === 'apiKey') {
        console.error(chalk.red('Cannot set apiKey manually via CLI. Rerun onboard.'));
        process.exit(1);
    }
    data[key] = value;
    config.save(data);
    console.log(chalk.green(`✅ Set ${key} successfully.`));
  });

// SERVICE Subcommands
const serviceCmdGroup = program
  .command('service')
  .description('Manage auto-starting system daemons');

serviceCmdGroup
  .command('install')
  .description('Install gateway daemon to run on boot via systemd/launchd')
  .action(async () => {
    checkConfig();
    await serviceInstall();
  });

serviceCmdGroup
  .command('uninstall')
  .description('Remove the auto-start gateway daemon')
  .action(async () => {
    checkConfig();
    await serviceUninstall();
  });

serviceCmdGroup
  .command('status')
  .description('Check daemon process status')
  .action(async () => {
    checkConfig();
    await serviceStatus();
  });

// ── Default action: if no command given and no config → auto-onboard ──────────
program.action(async () => {
  if (!config.exists()) {
    console.log(chalk.cyan('\n  Welcome to AgentRelay! Let\'s get you set up.\n'));
    await onboardCmd();
  } else {
    program.help();
  }
});

program.parse(process.argv);
