export default function Docs() {
  return (
    <section className="section-container" id="docs">
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Getting Started</h2>
        <p style={{ color: 'var(--text-dim)', maxWidth: '600px', margin: '0 auto' }}>
          Follow these steps to deploy your own AI gateway in minutes.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
        
        <div className="glass" style={{ padding: '40px' }}>
          <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '20px' }}>1. Installation</h3>
          <p style={{ marginBottom: '20px' }}>Install AgentRelay globally via npm. Node.js 22+ is recommended.</p>
          <pre><code>npm install -g @shrey_singh/agentrelay</code></pre>
        </div>

        <div className="glass" style={{ padding: '40px' }}>
          <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '20px' }}>2. Onboarding</h3>
          <p style={{ marginBottom: '20px' }}>Run the interactive onboarding to set up your primary AI provider and first channel.</p>
          <pre><code>agentrelay onboard</code></pre>
        </div>

        <div className="glass" style={{ padding: '40px' }}>
          <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '20px' }}>3. Advanced Multi-Agent Config</h3>
          <p style={{ marginBottom: '20px' }}>AgentRelay v0.2.0 supports multiple agents. Edit your <code>config.json</code> (usually in <code>~/.agentrelay/</code>) to define your roster:</p>
          <pre><code>{`{
  "agents": [
    {
      "id": "researcher",
      "name": "Research Pro",
      "systemPrompt": "You are a research assistant...",
      "provider": "gemini",
      "model": "gemini-1.5-pro"
    },
    {
      "id": "coder",
      "name": "Code Buddy",
      "systemPrompt": "You are an expert programmer...",
      "provider": "openai",
      "model": "gpt-4o"
    }
  ]
}`}</code></pre>
        </div>

        <div className="glass" style={{ padding: '40px' }}>
          <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '20px' }}>4. Launch the Gateway</h3>
          <p style={{ marginBottom: '20px' }}>Start the gateway to listen for incoming messages across all enabled channels.</p>
          <pre><code>agentrelay gateway</code></pre>
          <p style={{ marginTop: '20px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            A web dashboard will be available at <code>http://localhost:18789</code> once the gateway is running.
          </p>
        </div>

      </div>
    </section>
  );
}
