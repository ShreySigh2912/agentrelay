export default function Terminal({ children, command = false }) {
  return (
    <div className="terminal">
      <div className="terminal-header">
        <div className="dot dot-red"></div>
        <div className="dot dot-yellow"></div>
        <div className="dot dot-green"></div>
      </div>
      <div className="terminal-body">
        {command && <span style={{ marginRight: '8px', opacity: 0.5 }}>$</span>}
        <span className={command ? "command-text" : ""}>{children}</span>
      </div>
    </div>
  );
}
