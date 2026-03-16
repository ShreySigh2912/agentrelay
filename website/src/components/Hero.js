export default function Hero() {
  return (
    <section className="section-container animate-in" style={{ textAlign: 'center', paddingTop: '120px' }}>
      <div className="hero-gradient" />
      <span className="font-display" style={{ color: 'var(--accent-primary)', textTransform: 'uppercase', tracking: '0.1em', fontSize: '0.8rem' }}>
        v0.2.0 Now Available
      </span>
      <h1 className="glow-text" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', marginTop: '20px', lineHeight: '1.1' }}>
        Your AI Agents.<br />Everywhere you are.
      </h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', maxWidth: '600px', margin: '24px auto', lineHeight: '1.6' }}>
        AgentRelay is the secure, self-hosted gateway connecting your custom AI agents to WhatsApp, Telegram, Discord, Mattermost, and iMessage.
      </p>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px' }}>
        <a href="#docs" className="glow-btn">Get Started</a>
        <a href="https://github.com/ShreySigh2912/agentrelay" target="_blank" className="glass" style={{ padding: '12px 24px', borderRadius: '9999px', fontWeight: '600' }}>
          GitHub
        </a>
      </div>
    </section>
  );
}
