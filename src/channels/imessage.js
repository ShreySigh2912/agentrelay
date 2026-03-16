import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import AgentBridge from '../agent/bridge.js';
import SessionManager from '../sessions/manager.js';
import Config from '../config/index.js';

const execAsync = promisify(exec);

/**
 * iMessageChannel — macOS-only. Reads iMessages from a SQLite DB
 * and replies via osascript AppleScript.
 *
 * Requirements:
 *   - macOS only
 *   - Terminal/Node must have Full Disk Access to ~/Library/Messages/chat.db
 *   - config.channels.imessage.enabled: true
 *   - config.channels.imessage.myHandle: 'your@email.com' or phone '+1...'
 *   - config.channels.imessage.allowFrom: [] (optional list of contact handles)
 *   - config.channels.imessage.pollIntervalMs: 3000 (default 3 seconds)
 */
class iMessageChannel {
  constructor() {
    this.config = new Config().load();
    this.bridge = AgentBridge;
    this.sessionManager = SessionManager;
    this.poller = null;
    this.lastSeenRowId = 0;
  }

  async start() {
    const cfg = this.config.channels?.imessage;
    if (!cfg?.enabled) return;

    if (process.platform !== 'darwin') {
      console.error(chalk.red('❌ iMessage channel only works on macOS.'));
      return;
    }

    // Verify SQLite DB exists
    const dbPath = `${process.env.HOME}/Library/Messages/chat.db`;
    try {
      execSync(`test -r "${dbPath}"`, { stdio: 'ignore' });
    } catch {
      console.error(chalk.red(`❌ iMessage: Cannot read ${dbPath}. Grant Full Disk Access to Terminal.`));
      return;
    }

    // Get the current max rowid to only process new messages
    try {
      const { stdout } = await execAsync(`sqlite3 "${dbPath}" "SELECT MAX(ROWID) FROM message;"`);
      this.lastSeenRowId = parseInt(stdout.trim()) || 0;
    } catch (err) {
      console.error(chalk.red(`[iMessage] DB read error: ${err.message}`));
      return;
    }

    const pollInterval = cfg.pollIntervalMs || 3000;
    console.log(chalk.green(`✅ iMessage channel started (polling every ${pollInterval}ms)`));

    this.poller = setInterval(() => this._poll(cfg), pollInterval);
  }

  async _poll(cfg) {
    const dbPath = `${process.env.HOME}/Library/Messages/chat.db`;
    const allowFrom = cfg.allowFrom || [];

    try {
      // Query new incoming messages (is_from_me=0) since last check
      const query = `
        SELECT 
          m.ROWID,
          m.text,
          m.handle_id,
          h.id AS sender,
          c.chat_identifier
        FROM message m
        JOIN handle h ON m.handle_id = h.ROWID
        JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
        JOIN chat c ON cmj.chat_id = c.ROWID
        WHERE m.ROWID > ${this.lastSeenRowId}
          AND m.is_from_me = 0
          AND m.text IS NOT NULL
        ORDER BY m.ROWID ASC;
      `;

      const { stdout } = await execAsync(`sqlite3 "${dbPath}" "${query.replace(/\n\s*/g, ' ').replace(/"/g, '\\"')}"`);
      
      if (!stdout.trim()) return;

      const rows = stdout.trim().split('\n');
      
      for (const row of rows) {
        const parts = row.split('|');
        if (parts.length < 5) continue;

        const [rowid, text, , sender, chatId] = parts;
        const rowId = parseInt(rowid);
        if (rowId > this.lastSeenRowId) this.lastSeenRowId = rowId;

        if (!text?.trim()) continue;

        // allowFrom check
        if (allowFrom.length > 0 && !allowFrom.includes(sender)) {
          continue;
        }

        const sessionId = `imessage_${chatId}`;
        console.log(chalk.white(`[iMessage] ${sender}: ${text.substring(0, 50)}`));

        this.sessionManager.update(sessionId, {
          channel: 'imessage',
          sender: sender,
          displayName: sender,
        });

        try {
          const response = await this.bridge.send({
            sessionId,
            text: text.trim(),
            channel: 'imessage',
            senderId: sender
          });

          // Reply via osascript
          await this._sendReply(chatId, response);
        } catch (err) {
          console.error(chalk.red(`[iMessage Error] ${err.message}`));
        }
      }
    } catch (err) {
      // Silently skip poll errors (common on DB lock)
      if (!err.message.includes('database is locked')) {
        console.error(chalk.red(`[iMessage Poll Error] ${err.message}`));
      }
    }
  }

  async _sendReply(chatIdentifier, text) {
    // Escape quotes for AppleScript
    const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const script = `tell application "Messages"
      set targetService to 1st service whose service type = iMessage
      set targetBuddy to buddy "${chatIdentifier}" of targetService
      send "${escapedText}" to targetBuddy
    end tell`;
    
    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  }

  async stop() {
    if (this.poller) {
      clearInterval(this.poller);
      this.poller = null;
      console.log(chalk.yellow('⏸ iMessage channel stopped.'));
    }
  }
}

export default iMessageChannel;
