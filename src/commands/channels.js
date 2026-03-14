import chalk from 'chalk';
import Config from '../config/index.js';

export function channelsStatus() {
  const config = new Config().load();
  const channels = config.channels || {};

  console.log(chalk.cyan.bold('\nChannel Statuses:\n'));

  // WhatsApp
  const wa = channels.whatsapp || { enabled: false };
  console.log(
    chalk.bold('📱 WhatsApp: ') +
    (wa.enabled ? chalk.green('Enabled') : chalk.gray('Disabled'))
  );
  if (wa.enabled) {
    console.log(chalk.gray(`   Allowed lists: ${wa.allowFrom.length > 0 ? wa.allowFrom.join(', ') : 'Everyone'}`));
  }

  // Telegram
  const tg = channels.telegram || { enabled: false };
  console.log(
    chalk.bold('\n🤖 Telegram: ') +
    (tg.enabled ? chalk.green('Enabled') : chalk.gray('Disabled'))
  );
  if (tg.enabled && tg.token) {
    console.log(chalk.gray(`   Token configured: ✅`));
  }

  // Discord
  const dc = channels.discord || { enabled: false };
  console.log(
    chalk.bold('\n💬 Discord:  ') +
    (dc.enabled ? chalk.green('Enabled') : chalk.gray('Disabled'))
  );
  if (dc.enabled && dc.token) {
    console.log(chalk.gray(`   Token configured: ✅`));
  }

  console.log();
}
