import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Terminal from '../components/Terminal';
import StepIndicator from '../components/StepIndicator';

export default function Home() {
  return (
    <div className="layout-container">
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main className="main-content">
          <header style={{ marginBottom: '60px' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Documentation</h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              AgentRelay is a self-hosted, secure AI gateway that connects your agents to platforms like WhatsApp, Telegram, and Discord.
            </p>
          </header>

          <section id="introduction">
            <h2 style={{ fontSize: '1.75rem', marginTop: '40px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>Introduction</h2>
            <p style={{ margin: '24px 0', lineHeight: '1.7', color: 'var(--text-muted)' }}>
              Welcome to the AgentRelay documentation. This guide will help you set up multiple AI agents and route them selectively across various messaging channels.
            </p>
            <div className="callout">
              <strong>v0.2.0 Upgrade:</strong> This version introduces the Multi-Agent Engine, permitting you to run several agents with isolated sessions.
            </div>
          </section>

          <section id="quickstart">
            <h2 style={{ fontSize: '1.75rem', marginTop: '60px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>Quickstart</h2>
            <div style={{ marginTop: '32px' }}>
              <StepIndicator number="1" title="Global Installation">
                Install the AgentRelay CLI to manage your gateway from the command line.
                <Terminal command>npm install -g @shrey_singh/agentrelay</Terminal>
              </StepIndicator>

              <StepIndicator number="2" title="Interactive Onboarding">
                Run the onboarding tool to configure your API keys and first channel.
                <Terminal command>agentrelay onboard</Terminal>
              </StepIndicator>

              <StepIndicator number="3" title="Define Agents">
                Add your agent roster to the configuration file. You can define distinct personas for different tasks.
                <Terminal>
{`{
  "agents": [
    { "id": "support", "name": "Support Bot", "provider": "openai" },
    { "id": "creative", "name": "Writer bot", "provider": "gemini" }
  ]
}`}
                </Terminal>
              </StepIndicator>

              <StepIndicator number="4" title="Start Gateway">
                Finalize by launching the gateway. Your agents are now live!
                <Terminal command>agentrelay gateway</Terminal>
              </StepIndicator>
            </div>
          </section>

          <section id="channels" style={{ marginTop: '80px' }}>
            <h2 style={{ fontSize: '1.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>Channels</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginTop: '24px'
            }}>
              {['WhatsApp', 'Telegram', 'Discord', 'Mattermost', 'iMessage'].map(c => (
                <div key={c} style={{ 
                  padding: '20px', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-sidebar)',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  {c}
                </div>
              ))}
            </div>
          </section>

          <footer style={{ marginTop: '100px', borderTop: '1px solid var(--border-light)', paddingTop: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            © 2026 AgentRelay Project. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
