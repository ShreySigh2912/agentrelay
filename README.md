# AgentRelay

Self-hosted AI agent gateway for WhatsApp, Telegram, and Discord. Point one process at your messaging accounts and your model provider, and every chat becomes a conversation with an agent you control.

```bash
npm install -g @shrey_singh/agentrelay
agentrelay onboard     # guided setup: API keys, channels, port
agentrelay gateway     # start the gateway
```

## Why

Most "chat with an AI" bots are tied to one platform, one model vendor, and someone else's server. AgentRelay runs on your machine or your VPS, talks to whichever provider you prefer, and treats each messaging channel as a plug-in. Your API keys and your conversation history never leave your infrastructure.

## What it does

- **Channels.** WhatsApp (via Baileys, QR-code pairing), Telegram (grammY), Discord (discord.js), with Mattermost and iMessage adapters in the tree.
- **Providers.** Google Gemini, Anthropic Claude, and OpenAI, switchable per deployment.
- **Sessions.** Per-user conversation memory that persists across restarts, with CLI commands to list and clear.
- **Voice notes.** Incoming audio is transcribed before it reaches the agent.
- **Tools and MCP.** The agent can call tools, including servers exposed over the Model Context Protocol.
- **Scheduling.** Built-in cron so the agent can run recurring jobs and message you proactively.
- **Web UI.** A small local dashboard for status and configuration.
- **Runs as a service.** One command installs a systemd or launchd daemon so the gateway comes back after a reboot.

## CLI

| Command | Purpose |
|---|---|
| `agentrelay onboard` | Interactive wizard for API keys and channel tokens |
| `agentrelay gateway` | Start the gateway server |
| `agentrelay channels status` | Show which channels are connected |
| `agentrelay sessions list` | List active conversations |
| `agentrelay sessions clear` | Wipe saved conversation history |
| `agentrelay config show` | Print current configuration |
| `agentrelay config set <key> <value>` | Change a setting such as `port` |
| `agentrelay service install` | Install the auto-start daemon (systemd / launchd) |
| `agentrelay service status` | Check the daemon |
| `agentrelay service uninstall` | Remove the daemon |

## Configuration

`agentrelay onboard` writes everything for you. If you prefer environment variables, copy `.env.example` and fill in what you use:

```
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
TELEGRAM_BOT_TOKEN=
DISCORD_BOT_TOKEN=
```

WhatsApp does not use a token. On first start the gateway prints a QR code in the terminal; scan it from WhatsApp on your phone under Linked Devices.

## Project layout

```
bin/cli.js         Command-line entry point
src/agent/         Provider bridge, message router, audio transcriber
src/channels/      One adapter per messaging platform
src/commands/      CLI command implementations
src/services/      Gateway server, MCP client, tools, cron, daemon install
src/sessions/      Conversation persistence
src/web/ui         Local dashboard
```

## Requirements

Node 18 or newer. A machine that stays on if you want the gateway available around the clock: a Raspberry Pi, a cheap VPS, or a spare laptop all work.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and pull requests are welcome, especially new channel adapters.

## License

See [LICENSE](./LICENSE).
