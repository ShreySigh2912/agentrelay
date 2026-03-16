export default function StepIndicator({ number, title, children }) {
  return (
    <div className="step-container">
      <div className="step-number">{number}</div>
      <div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{title}</h3>
        <div style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
