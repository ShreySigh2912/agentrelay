import boxen from 'boxen';
import gradient from 'gradient-string';
import chalk from 'chalk';
import ora from 'ora';
import { createRequire } from 'module';
import { exec } from 'child_process';
import Config from '../config/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const require = createRequire(import.meta.url);
const inquirer = require('inquirer');

// ─── Model catalogues ───────────────────────────────────────────────────────
const MODELS = {
  gemini: [
    { name: 'gemini-2.0-flash  (fastest, free tier)', value: 'gemini-2.0-flash' },
    { name: 'gemini-1.5-pro    (most capable, free tier)', value: 'gemini-1.5-pro' },
    { name: 'gemini-1.5-flash  (balanced)', value: 'gemini-1.5-flash' },
  ],
  claude: [
    { name: 'claude-3-5-sonnet-20241022  (best)', value: 'claude-3-5-sonnet-20241022' },
    { name: 'claude-3-haiku-20240307     (fastest / cheapest)', value: 'claude-3-haiku-20240307' },
    { name: 'claude-3-opus-20240229      (most powerful)', value: 'claude-3-opus-20240229' },
  ],
  openai: [
    { name: 'gpt-4o          (best multimodal)', value: 'gpt-4o' },
    { name: 'gpt-4o-mini     (fast + cheap)', value: 'gpt-4o-mini' },
    { name: 'gpt-3.5-turbo   (fastest / cheapest)', value: 'gpt-3.5-turbo' },
  ],
};

// ─── API Key URL hints ───────────────────────────────────────────────────────
const API_KEY_URLS = {
  gemini: 'https://aistudio.google.com  (free tier available)',
  claude: 'https://console.anthropic.com',
  openai: 'https://platform.openai.com/api-keys',
};

// ─── Test the API key by sending a real request ──────────────────────────────
async function testApiKey(provider, apiKey, model) {
  try {
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const m = genAI.getGenerativeModel({ model });
      await m.generateContent('hi');
    } else if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey });
      await anthropic.messages.create({
        model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'hi' }],
      });
    } else if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });
      await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
      });
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Open a URL in the default browser ───────────────────────────────────────
function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? `open "${url}"` :
              process.platform === 'win32' ? `start "" "${url}"` :
              `xdg-open "${url}"`;
  exec(cmd, () => {});
}

// ─── Pretty section divider ───────────────────────────────────────────────────
function section(title) {
  console.log('\n' + chalk.bold.cyan(`── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`));
}

// ═════════════════════════════════════════════════════════════════════════════
export default async function onboard() {
  console.clear();

  // ── Welcome ────────────────────────────────────────────────────────────────
  console.log(
    boxen(
      gradient.pastel('AgentRelay') + '\n\n' +
      chalk.white('Self-hosted AI agent gateway for\nWhatsApp · Telegram · Discord'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        textAlignment: 'center',
      }
    )
  );

  console.log(chalk.gray('  🔒 Your API keys are stored ONLY on your machine. We never see them.\n'));

  // ── Node.js Version ────────────────────────────────────────────────────────
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major < 22) {
    console.error(chalk.red(`❌ Node.js ≥ 22 required. You have v${process.versions.node}.`));
    process.exit(1);
  }
  console.log(chalk.green(`  ✅ Node.js v${process.versions.node} — OK\n`));

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1  — Choose AI provider
  // ══════════════════════════════════════════════════════════════════════════
  section('Step 1 of 4 — AI Provider');

  const { provider } = await inquirer.prompt([{
    type: 'list',
    name: 'provider',
    message: 'Which AI provider do you want to use?',
    choices: [
      { name: '🟢 Google Gemini    (free tier available — recommended)', value: 'gemini' },
      { name: '🟣 Anthropic Claude', value: 'claude' },
      { name: '🔵 OpenAI', value: 'openai' },
    ],
  }]);

  // ── Choose a model within that provider ──────────────────────────────────
  const { model } = await inquirer.prompt([{
    type: 'list',
    name: 'model',
    message: `Choose a ${provider.charAt(0).toUpperCase() + provider.slice(1)} model:`,
    choices: MODELS[provider],
  }]);

  // ── API Key ───────────────────────────────────────────────────────────────
  section('Step 2 of 4 — API Key');
  console.log(chalk.blue(`  ℹ  Get your key at: ${API_KEY_URLS[provider]}\n`));

  let apiKey = '';
  let keyValid = false;

  while (!keyValid) {
    const { key } = await inquirer.prompt([{
      type: 'password',
      name: 'key',
      message: `Paste your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key:`,
      mask: '●',
    }]);

    if (!key || key.trim().length < 10) {
      console.log(chalk.red('  ❌ That looks too short. Please paste the full key.'));
      continue;
    }

    const spinner = ora('  Verifying your API key…').start();
    keyValid = await testApiKey(provider, key.trim(), model);

    if (keyValid) {
      spinner.succeed(chalk.green('  ✅ API key verified!'));
      apiKey = key.trim();
    } else {
      spinner.fail(chalk.red('  ❌ Key didn\'t work. Double-check it and try again.'));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3  — Connect Channels
  // ══════════════════════════════════════════════════════════════════════════
  section('Step 3 of 4 — Connect Messaging Tools');
  console.log(chalk.gray('  Enable the platforms you want your AI agent to listen on.\n'));

  const channelConfig = {
    whatsapp: { enabled: false, allowFrom: [] },
    telegram: { enabled: false, token: '' },
    discord:  { enabled: false, token: '' },
  };

  // ── WhatsApp setup ────────────────────────────────────────────────────────
  const { connectWhatsApp } = await inquirer.prompt([{
    type: 'confirm',
    name: 'connectWhatsApp',
    message: '📱 Connect WhatsApp? (scan QR code later)',
    default: true,
  }]);

  if (connectWhatsApp) {
    console.log('\n' + chalk.bold.blue('  📖 WhatsApp Setup:'));
    console.log(chalk.gray('  When the gateway starts, a QR code will appear.'));
    console.log(chalk.gray('  Simply scan it with your phone to link your account.\n'));
    channelConfig.whatsapp.enabled = true;
    console.log(chalk.green('  ✅ WhatsApp enabled.'));
  }

  // ── Telegram setup ────────────────────────────────────────────────────────
  const { connectTelegram } = await inquirer.prompt([{
    type: 'confirm',
    name: 'connectTelegram',
    message: '🤖 Connect Telegram? (needs account from @BotFather)',
    default: false,
  }]);

  if (connectTelegram) {
    console.log('\n' + chalk.bold.blue('  📖 Telegram Setup Guide:'));
    console.log(chalk.gray('  1. Open Telegram and search for @BotFather'));
    console.log(chalk.gray('  2. Send /newbot and follow the prompts'));
    console.log(chalk.gray('  3. Copy the token provided (e.g., 123456:ABC...)'));
    console.log('');

    const { token } = await inquirer.prompt([{
      type: 'password',
      name: 'token',
      message: '  Paste your Telegram Bot Token:',
      mask: '●',
      validate: v => v.trim().length > 10 ? true : 'Token looks too short.',
    }]);

    channelConfig.telegram.enabled = true;
    channelConfig.telegram.token = token.trim();
    console.log(chalk.green('  ✅ Telegram setup complete.'));
  }

  // ── Discord setup ─────────────────────────────────────────────────────────
  const { connectDiscord } = await inquirer.prompt([{
    type: 'confirm',
    name: 'connectDiscord',
    message: '💬 Connect Discord? (needs Bot Token)',
    default: false,
  }]);

  if (connectDiscord) {
    console.log('\n' + chalk.bold.blue('  📖 Discord Setup Guide:'));
    console.log(chalk.gray('  1. Visit: https://discord.com/developers/applications'));
    console.log(chalk.gray('  2. Create a "New Application"'));
    console.log(chalk.gray('  3. In the "Bot" section, click "Reset Token" and copy it'));
    console.log(chalk.gray('  4. Enable all "Privileged Gateway Intents" (Members, Presence, Content)'));
    console.log('');

    const { token } = await inquirer.prompt([{
      type: 'password',
      name: 'token',
      message: '  Paste your Discord Bot Token:',
      mask: '●',
      validate: v => v.trim().length > 10 ? true : 'Token looks too short.',
    }]);

    channelConfig.discord.enabled = true;
    channelConfig.discord.token = token.trim();
    console.log(chalk.green('  ✅ Discord setup complete.'));
  }

  const channels = [];
  if (channelConfig.whatsapp.enabled) channels.push('whatsapp');
  if (channelConfig.telegram.enabled) channels.push('telegram');
  if (channelConfig.discord.enabled) channels.push('discord');

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4  — Final settings
  // ══════════════════════════════════════════════════════════════════════════
  section('Step 4 of 4 — Dashboard Settings');

  const { portStr } = await inquirer.prompt([{
    type: 'input',
    name: 'portStr',
    message: 'Dashboard port:',
    default: '18789',
    validate: v => !isNaN(parseInt(v)) ? true : 'Enter a valid port number.',
  }]);

  const { systemPrompt } = await inquirer.prompt([{
    type: 'input',
    name: 'systemPrompt',
    message: 'System prompt for AI (or press Enter to keep default):',
    default: 'You are a helpful AI assistant.',
  }]);

  // ── Save everything ────────────────────────────────────────────────────────
  const config = new Config();
  const data = config.load();
  data.provider     = provider;
  data.apiKey       = apiKey;
  data.port         = parseInt(portStr, 10) || 18789;
  data.channels     = channelConfig;
  
  data.agents = [{
    id: 'default',
    name: 'Default Assistant',
    model: model,
    systemPrompt: systemPrompt
  }];
  
  config.save(data);

  // ── Success banner ─────────────────────────────────────────────────────────
  const enabledList = channels.length
    ? channels.map(c => `  ✅ ${c.charAt(0).toUpperCase() + c.slice(1)}`).join('\n')
    : '  ⚠  None (add later)';

  console.log('\n' + boxen(
    chalk.bold.green('🎉 AgentRelay is configured!\n\n') +
    chalk.white(`Provider : ${provider}  (${model})\n`) +
    chalk.white(`Port     : ${data.port}\n`) +
    chalk.white(`Channels :\n${enabledList}`),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'green' }
  ));


  // ── Offer to launch gateway + open browser ────────────────────────────────
  const { launch } = await inquirer.prompt([{
    type: 'confirm',
    name: 'launch',
    message: `🚀 Start the gateway and open the dashboard at http://localhost:${data.port}?`,
    default: true,
  }]);

  if (launch) {
    console.log(chalk.cyan('\n  Starting AgentRelay Gateway…\n'));
    // Dynamically import and run the gateway in-process
    const { default: startGateway } = await import('./gateway.js');
    // Open browser after 2s to give server time to bind
    setTimeout(() => openBrowser(`http://localhost:${data.port}`), 2000);
    await startGateway();
  } else {
    console.log(chalk.gray('\n  Run `agentrelay gateway` whenever you\'re ready.\n'));
  }
}
