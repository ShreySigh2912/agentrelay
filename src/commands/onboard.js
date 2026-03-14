import boxen from 'boxen';
import gradient from 'gradient-string';
import chalk from 'chalk';
import ora from 'ora';
import { select, checkbox, input, password } from '@inquirer/prompts';
import Config from '../config/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

async function testApiKey(provider, apiKey) {
  try {
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      await model.generateContent('hi');
    } else if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey });
      await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'hi' }]
      });
    } else if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });
      await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5
      });
    }
    return true;
  } catch (error) {
    return false;
  }
}

export default async function onboard() {
  console.clear();

  // STEP 1 — Welcome banner
  const welcomeText = `AgentRelay\n\nSelf-hosted AI agent gateway for WhatsApp, Telegram & Discord`;
  console.log(
    boxen(gradient.pastel(welcomeText), {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      textAlignment: 'center',
    })
  );

  console.log(chalk.gray('Your API keys are stored ONLY on your machine. We never see them.\n'));

  // STEP 2 — Check Node.js version
  const nodeVer = process.versions.node.split('.')[0];
  if (parseInt(nodeVer, 10) < 22) {
    console.error(chalk.red('❌ Error: Node.js version 22 or higher is required.'));
    console.error(chalk.red(`Current version: ${process.versions.node}`));
    process.exit(1);
  } else {
    console.log(chalk.green('✅ Node.js version check passed.') + ` (v${process.versions.node})\n`);
  }

  // STEP 3 — Choose AI provider
  const provider = await select({
    message: 'Choose your preferred AI provider:',
    choices: [
      { name: 'Google Gemini  (free tier — recommended)', value: 'gemini' },
      { name: 'Anthropic Claude', value: 'claude' },
      { name: 'OpenAI', value: 'openai' }
    ]
  });

  // STEP 4 — API Key setup and verification
  const apiKeyUrls = {
    gemini: 'Get your free key at: https://aistudio.google.com',
    claude: 'Get your key at: https://console.anthropic.com',
    openai: 'Get your key at: https://platform.openai.com',
  };

  console.log(chalk.blue(`\nℹ️  ${apiKeyUrls[provider]}`));

  let isKeyValid = false;
  let apiKey = '';

  while (!isKeyValid) {
    apiKey = await password({
      message: `Enter your ${provider.toUpperCase()} API Key:`,
      mask: '*',
    });

    const spinner = ora('Testing your API key...').start();
    isKeyValid = await testApiKey(provider, apiKey);

    if (isKeyValid) {
      spinner.succeed(chalk.green('✅ API key verified!'));
    } else {
      spinner.fail(chalk.red('❌ Key did not work. Please check and try again.'));
    }
  }

  // STEP 5 — Choose channels
  console.log('\n');
  const channels = await checkbox({
    message: 'Which messaging channels do you want to enable?',
    choices: [
      { name: 'WhatsApp (scan QR code — no extra token needed)', value: 'whatsapp' },
      { name: 'Telegram (needs Bot Token from @BotFather)', value: 'telegram' },
      { name: 'Discord (needs Bot Token)', value: 'discord' }
    ]
  });

  const channelConfig = {
    whatsapp: { enabled: false, allowFrom: [] },
    telegram: { enabled: false, token: '' },
    discord: { enabled: false, token: '' }
  };

  // STEP 6 — Collect tokens for selected channels
  if (channels.includes('telegram')) {
    console.log(chalk.cyan('\nTelegram Setup:'));
    console.log('1. Open Telegram');
    console.log('2. Search @BotFather');
    console.log('3. Send /newbot');
    console.log('4. Copy the token');
    const token = await password({
      message: 'Enter your Telegram Bot Token:',
      mask: '*',
    });
    channelConfig.telegram.enabled = true;
    channelConfig.telegram.token = token;
  }

  if (channels.includes('discord')) {
    console.log(chalk.cyan('\nDiscord Setup:'));
    console.log('Visit: https://discord.com/developers/applications');
    console.log('1. Create a New Application');
    console.log('2. Go to Bot section and click Reset Token');
    console.log('3. Copy the token');
    const token = await password({
      message: 'Enter your Discord Bot Token:',
      mask: '*',
    });
    channelConfig.discord.enabled = true;
    channelConfig.discord.token = token;
  }

  if (channels.includes('whatsapp')) {
    console.log(chalk.cyan('\nWhatsApp Setup:'));
    console.log('We will show a QR code to scan after setup when you start the gateway.');
    channelConfig.whatsapp.enabled = true;
  }

  // STEP 7 — Ask port number
  console.log('\n');
  const portStr = await input({
    message: 'What port should the web dashboard run on?',
    default: '18789',
  });
  const port = parseInt(portStr, 10) || 18789;

  // STEP 8 — Save config and show final success box
  const config = new Config();
  const configData = config.load();
  configData.provider = provider;
  configData.apiKey = apiKey;
  configData.channels = channelConfig;
  configData.port = port;
  
  config.save(configData);

  console.log('\n');
  const successBox = `✅  AgentRelay Setup Complete!\n\nStart your gateway:\n› agentrelay gateway\n\nDashboard: http://localhost:${configData.port}`;
  
  console.log(
    boxen(successBox, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'green',
    })
  );
}
