export default function Features() {
  const features = [
    {
      title: "Multi-Agent Engine",
      description: "Match specific users or channels to dedicated AI personas with isolated memories.",
      icon: "🎭"
    },
    {
      title: "Omnichannel Reach",
      description: "Native support for WhatsApp, Telegram, Discord, Mattermost & iMessage.",
      icon: "🌍"
    },
    {
      title: "Voice & Vision",
      description: "Auto-transcribe voice notes via Whisper and process images with multimodal models.",
      icon: "👁️"
    },
    {
      title: "Node Gateway",
      description: "Secure WebSocket RPC for companion apps. Remotely take photos or get GPS location.",
      icon: "🛰️"
    },
    {
      title: "Advanced Security",
      description: "Granular access control with allowFrom lists and mention-only group filtering.",
      icon: "🛡️"
    },
    {
      title: "Self-Hosted",
      description: "Full control over your data. Deploy locally or on a VPS in minutes.",
      icon: "🏠"
    }
  ];

  return (
    <section className="section-container" id="features">
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Powerhouse Features</h2>
        <p style={{ color: 'var(--text-dim)', maxWidth: '600px', margin: '0 auto' }}>
          AgentRelay brings professional-grade AI capabilities to the apps you use every day.
        </p>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {features.map((f, i) => (
          <div key={i} className="glass" style={{ padding: '32px', transition: 'transform 0.3s ease' }}>
            <div style={{ fontSize: '2rem', marginBottom: '20px' }}>{f.icon}</div>
            <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>{f.title}</h3>
            <p style={{ color: 'var(--text-dim)', lineHeight: '1.5' }}>{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
