export default function Footer() {
  return (
    <footer className="section-container" style={{ textAlign: 'center', borderTop: '1px solid var(--border-glass)', marginTop: '80px' }}>
      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '40px' }}>
        <a href="https://github.com/ShreySigh2912/agentrelay" target="_blank" style={{ color: 'var(--text-dim)', transition: 'color 0.3s' }}>GitHub</a>
        <a href="https://www.npmjs.com/package/@shrey_singh/agentrelay" target="_blank" style={{ color: 'var(--text-dim)', transition: 'color 0.3s' }}>NPM Registry</a>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
        Built with ❤️ for the AI Community. Released under MIT License.
      </p>
    </footer>
  );
}
