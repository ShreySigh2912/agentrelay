export default function Sidebar() {
  const groups = [
    {
      title: "Get Started",
      items: [
        { name: "Introduction", active: true },
        { name: "Quickstart", active: false },
        { name: "Onboarding", active: false }
      ]
    },
    {
      title: "Channels",
      items: [
        { name: "WhatsApp", active: false },
        { name: "Telegram", active: false },
        { name: "Discord", active: false },
        { name: "Mattermost", active: false },
        { name: "iMessage", active: false }
      ]
    },
    {
      title: "Core Concepts",
      items: [
        { name: "Agents Roster", active: false },
        { name: "Routing Rules", active: false },
        { name: "Node Gateway", active: false }
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
            <a key={i} href="#" className={`nav-item ${item.active ? 'active' : ''}`}>
              {item.name}
            </a>
          ))}
        </div>
      ))}
    </aside>
  );
}
