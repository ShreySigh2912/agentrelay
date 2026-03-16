export default function Navbar() {
  return (
    <nav style={{
      height: '64px',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      position: 'sticky',
      top: 0,
      backgroundColor: 'var(--bg-main)',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--primary)' }}>AgentRelay Docs</div>
        <div style={{ padding: '6px 12px', background: 'var(--bg-sidebar)', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Search... <span style={{ marginLeft: '8px', opacity: 0.5 }}>⌘K</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', fontWeight: '500' }}>
        <a href="https://github.com/ShreySigh2912/agentrelay" target="_blank" style={{ color: 'var(--text-main)' }}>GitHub</a>
        <a href="https://www.npmjs.com/package/@shrey_singh/agentrelay" target="_blank" style={{ color: 'var(--text-main)' }}>NPM</a>
      </div>
    </nav>
  );
}
