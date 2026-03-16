'use client';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Terminal from '../components/Terminal';
import StepIndicator from '../components/StepIndicator';

export default function Home() {
  const [activeTab, setActiveTab] = useState('introduction');

  return (
    <div className="layout-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main className="main-content">
          {activeTab === 'introduction' && (
            <section>
              <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Introduction</h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                AgentRelay is a self-hosted, secure AI gateway that connects your agents to platforms like WhatsApp, Telegram, and Discord.
              </p>
              <p style={{ margin: '24px 0', lineHeight: '1.7', color: 'var(--text-muted)' }}>
                Welcome to the AgentRelay documentation. This guide will help you set up multiple AI agents and route them selectively across various messaging channels.
              </p>
              <div className="callout">
                <strong>v0.2.0 Upgrade:</strong> This version introduces the Multi-Agent Engine, permitting you to run several agents with isolated sessions.
              </div>
            </section>
          )}

          {activeTab === 'quickstart' && (
            <section>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Quickstart</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Get up and running in under 5 minutes.</p>
              
              <StepIndicator number="1" title="Global Installation">
                Install the AgentRelay CLI to manage your gateway from the command line.
                <Terminal command>npm install -g @shrey_singh/agentrelay</Terminal>
              </StepIndicator>

              <StepIndicator number="2" title="Interactive Onboarding">
                Run the onboarding tool to configure your API keys and first channel.
                <Terminal command>agentrelay onboard</Terminal>
              </StepIndicator>

              <StepIndicator number="3" title="Start Gateway">
                Finalize by launching the gateway. Your agents are now live!
                <Terminal command>agentrelay gateway</Terminal>
              </StepIndicator>
            </section>
          )}

          {activeTab === 'onboarding' && (
            <section>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Onboarding</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>The `onboard` command guides you through the initial configuration.</p>
              <p style={{ lineHeight: '1.7', color: 'var(--text-muted)' }}>
                When you run <code>agentrelay onboard</code>, the CLI will ask you for:
              </p>
              <ul style={{ margin: '24px 0', paddingLeft: '20px', color: 'var(--text-muted)' }}>
                <li>Your preferred AI provider (OpenAI, Gemini, Anthropic).</li>
                <li>API Keys for the selected provider.</li>
                <li>The first channel you want to enable (e.g., WhatsApp).</li>
              </ul>
              <Terminal command>agentrelay onboard</Terminal>
              <div className="callout">
                <strong>Tip:</strong> You can always re-run onboarding to add more channels or change your main provider.
              </div>
            </section>
          )}

          {activeTab === 'whatsapp' && (
            <section>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>WhatsApp</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Connect AgentRelay to WhatsApp using the Baileys library.</p>
              <StepIndicator number="1" title="Enable Channel">
                Set <code>channels.whatsapp.enabled</code> to <code>true</code> in your <code>config.json</code>.
              </StepIndicator>
              <StepIndicator number="2" title="Scan QR Code">
                Run the gateway and scan the QR code that appears in your terminal using your phone.
                <Terminal command>agentrelay gateway</Terminal>
              </StepIndicator>
              <div className="callout">
                <strong>Multi-Device:</strong> AgentRelay uses a multi-device connection, so your phone doesn't need to be online once paired.
              </div>
            </section>
          )}

          {activeTab === 'telegram' && (
            <section>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Telegram</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Seamlessly integrate with Telegram bots.</p>
              <StepIndicator number="1" title="Get Bot Token">
                Message @BotFather on Telegram to create a new bot and get your token.
              </StepIndicator>
              <StepIndicator number="2" title="Config">
                Add your token to the <code>channels.telegram.token</code> field in your config.
              </StepIndicator>
              <div className="callout">
                <strong>Voice Support:</strong> Telegram voice notes are automatically transcribed using Whisper if configured.
              </div>
            </section>
          )}

          {activeTab === 'discord' && (
            <section>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Discord</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Bring your agents to your Discord servers.</p>
              <StepIndicator number="1" title="Create App">
                Go to the Discord Developer Portal and create a new application/bot.
              </StepIndicator>
              <StepIndicator number="2" title="Intents">
                Ensure "Message Content Intent" is enabled in the Bot settings.
              </StepIndicator>
            </section>
          )}

          {activeTab === 'agents' && (
            <section>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Agents Roster</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Define multiple personas for different tasks.</p>
              <Terminal>
{`{
  "agents": [
    {
      "id": "researcher",
      "name": "Research Assistant",
      "provider": "gemini",
      "model": "gemini-1.5-pro",
      "systemPrompt": "You are a research expert..."
    }
  ]
}`}
              </Terminal>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                Each agent has its own <code>id</code>, which is used for session management and routing.
              </p>
            </section>
          )}

          {activeTab === 'gateway' && (
            <section>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Node Gateway</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>The bridge between cloud agents and physical devices.</p>
              <p style={{ lineHeight: '1.7', color: 'var(--text-muted)' }}>
                The Node Gateway allows you to pair mobile devices with your agents. Once paired, agents can use tools like:
              </p>
              <ul style={{ margin: '24px 0', paddingLeft: '20px', color: 'var(--text-muted)' }}>
                <li><code>take_photo</code>: Capture a photo from the device camera.</li>
                <li><code>get_location</code>: Get the device's GPS coordinates.</li>
                <li><code>record_screen</code>: Capture the current screen state.</li>
              </ul>
              <Terminal command>agentrelay gateway --node-port 18789</Terminal>
            </section>
          )}

          {activeTab === 'mattermost' && (
            <section>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Mattermost</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Enterprise-grade communication for your agents.</p>
              <StepIndicator number="1" title="Get Credentials">
                Create a Personal Access Token or a Bot Account in your Mattermost workspace.
              </StepIndicator>
              <StepIndicator number="2" title="Server URL">
                Provide your Mattermost instance URL (e.g., <code>https://chat.yourcompany.com</code>).
              </StepIndicator>
              <div className="callout">
                <strong>Real-time:</strong> AgentRelay uses Mattermost WebSockets for instant message processing.
              </div>
            </section>
          )}

          {activeTab === 'imessage' && (
            <section>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>iMessage</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Integrate with iMessage on macOS.</p>
              <div className="callout" style={{ borderLeftColor: '#ffbd2e', background: 'rgba(255, 189, 46, 0.05)' }}>
                <strong>macOS Only:</strong> This channel requires AgentRelay to be running on a Mac with Full Disk Access.
              </div>
              <StepIndicator number="1" title="Full Disk Access">
                Grant your terminal (Terminal.app, iTerm2, etc.) "Full Disk Access" in System Settings &gt; Privacy &amp; Security.
              </StepIndicator>
              <StepIndicator number="2" title="Poll & Reply">
                AgentRelay polls the iMessage database and uses AppleScript to send replies.
              </StepIndicator>
            </section>
          )}

          {activeTab === 'routing' && (
            <section>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Routing Rules</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Control which agents respond to which messages.</p>
              <p style={{ lineHeight: '1.7', color: 'var(--text-muted)' }}>
                You can define specific routing logic to map incoming messages to the correct agent based on the sender or the channel.
              </p>
              <Terminal>
{`{
  "routing": [
    { "from": "+1234567890", "agentId": "personal-assistant" },
    { "channel": "discord", "agentId": "community-mod" }
  ]
}`}
              </Terminal>
              <div className="callout">
                <strong>Default Agent:</strong> If no rule matches, the first agent in your <code>agents</code> array is used as the default.
              </div>
            </section>
          )}

          <footer style={{ marginTop: '100px', borderTop: '1px solid var(--border-light)', paddingTop: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            © 2026 AgentRelay Project. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
