'use client';

export default function Sidebar({ activeTab, setActiveTab }) {
  const groups = [
    {
      title: "Get Started",
      items: [
        { id: "introduction", name: "Introduction" },
        { id: "quickstart", name: "Quickstart" },
        { id: "onboarding", name: "Onboarding" }
      ]
    },
    {
      title: "Channels",
      items: [
        { id: "whatsapp", name: "WhatsApp" },
        { id: "telegram", name: "Telegram" },
        { id: "discord", name: "Discord" },
        { id: "mattermost", name: "Mattermost" },
        { id: "imessage", name: "iMessage" }
      ]
    },
    {
      title: "Core Concepts",
      items: [
        { id: "agents", name: "Agents Roster" },
        { id: "routing", name: "Routing Rules" },
        { id: "gateway", name: "Node Gateway" }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '4px' }}>AgentRelay</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Documentation v0.2.0</p>
      </div>
      
      {groups.map((group, idx) => (
        <div key={idx} className="nav-group">
          <div className="nav-title">{group.title}</div>
          {group.items.map((item, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              {item.name}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}
