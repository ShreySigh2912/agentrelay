import chalk from 'chalk';
import inquirer from 'inquirer';
import SessionManager from '../sessions/manager.js';

export function sessionsList() {
  const manager = SessionManager;
  const sessions = manager.list();

  if (sessions.length === 0) {
    console.log(chalk.gray('No active sessions found.'));
    return;
  }

  console.log(chalk.cyan.bold('\nActive Sessions:\n'));
  
  // Quick manual table using tabs
  console.log(chalk.gray('ID'.padEnd(30)) + chalk.gray('Channel'.padEnd(15)) + chalk.gray('Messages'.padEnd(10)) + chalk.gray('Last Active'));
  console.log('-'.repeat(80));

  sessions.forEach(s => {
    console.log(
      s.id.padEnd(30) + 
      s.channel.padEnd(15) + 
      String(s.messageCount).padEnd(10) + 
      new Date(s.lastActive).toLocaleString()
    );
  });
  console.log();
}

export async function sessionsClear() {
  const manager = SessionManager;
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.red('Are you sure you want to delete ALL sessions? This cannot be undone.'),
      default: false
    }
  ]);

  if (confirm) {
    manager.clear();
    console.log(chalk.green('✅ All sessions have been cleared.'));
  } else {
    console.log(chalk.yellow('Aborted.'));
  }
}
