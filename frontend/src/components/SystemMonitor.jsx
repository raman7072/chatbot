import { useEffect, useState } from 'react';

function ArcMeter({ label, percent, used, total, unit }) {
  const size = 64;
  const strokeWidth = 5;
  const r = (size - strokeWidth * 2) / 2;
  const circ = Math.PI * r; // half circle
  const offset = circ * (1 - (percent || 0) / 100);
  const colorClass = percent >= 90 ? 'critical' : percent >= 70 ? 'warning' : '';

  // Arc goes from -180deg to 0deg (left to right half-circle)
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="metric-arc">
      <svg className="arc-svg" width={size} height={size / 2 + 8}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth} ${cy} A ${r} ${r} 0 0 1 ${size - strokeWidth} ${cy}`}
          fill="none"
          stroke="rgba(56,189,248,0.1)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={`M ${strokeWidth} ${cy} A ${r} ${r} 0 0 1 ${size - strokeWidth} ${cy}`}
          fill="none"
          stroke={percent >= 90 ? 'var(--red-alert)' : percent >= 70 ? 'var(--gold)' : 'var(--cyan)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 3px ${percent >= 90 ? 'var(--red-alert)' : percent >= 70 ? 'var(--gold)' : 'var(--cyan)'})`,
            transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease',
          }}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill={percent >= 90 ? 'var(--red-alert)' : percent >= 70 ? 'var(--gold)' : 'var(--cyan)'}
          fontSize="10"
          fontFamily="var(--font-mono)"
          fontWeight="bold"
        >
          {Math.round(percent || 0)}%
        </text>
      </svg>
      <div className="arc-label">{label}</div>
      {used !== undefined && (
        <div className="arc-value">{used}/{total}{unit}</div>
      )}
    </div>
  );
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function SystemMonitor() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/system`);
      if (!res.ok) throw new Error('Backend offline');
      const data = await res.json();
      setStats(data);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-panel" style={{ overflow: 'hidden' }}>
      <div className="panel-header">
        <div className="panel-header-left">
          <span>⚙</span>
          <span>SYSTEM DIAGNOSTICS</span>
        </div>
        <span className="panel-tag" style={{ color: error ? 'var(--red-alert)' : 'var(--green-ok)' }}>
          {error ? '● OFFLINE' : '● LIVE'}
        </span>
      </div>

      {error ? (
        <div style={{
          padding: '18px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'rgba(248,113,113,0.65)',
          textAlign: 'center',
          lineHeight: 2,
        }}>
          ● BACKEND OFFLINE<br />
          <span style={{ color: 'rgba(56,189,248,0.28)', fontSize: '9px' }}>Reconnecting...</span>
        </div>
      ) : stats ? (
        <>
          <div className="metric-arc-grid">
            <ArcMeter
              label="CPU"
              percent={stats.cpu?.percent}
            />
            <ArcMeter
              label="RAM"
              percent={stats.memory?.percent}
              used={stats.memory?.used_gb}
              total={stats.memory?.total_gb}
              unit="G"
            />
            <ArcMeter
              label="DISK"
              percent={stats.disk?.percent}
              used={stats.disk?.used_gb}
              total={stats.disk?.total_gb}
              unit="G"
            />
          </div>

          <div className="sys-stats-list">
            <div className="sys-stat-row">
              <span className="stat-label">UPTIME</span>
              <span className="stat-value">{stats.uptime || '—'}</span>
            </div>
            <div className="sys-stat-row">
              <span className="stat-label">NET ↑</span>
              <span className="stat-value">{stats.network?.sent_mb} MB</span>
            </div>
            <div className="sys-stat-row">
              <span className="stat-label">NET ↓</span>
              <span className="stat-value">{stats.network?.recv_mb} MB</span>
            </div>
            {stats.battery && (
              <div className="sys-stat-row">
                <span className="stat-label">BATTERY</span>
                <span className="stat-value" style={{
                  color: stats.battery.percent < 20 ? 'var(--red-alert)' : 'var(--cyan)'
                }}>
                  {stats.battery.percent}% {stats.battery.plugged ? '⚡' : '🔋'}
                </span>
              </div>
            )}
            <div className="sys-stat-row">
              <span className="stat-label">CPU CORES</span>
              <span className="stat-value">{stats.cpu?.cores}</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div className="tool-spinner" style={{ width: 20, height: 20 }} />
        </div>
      )}
    </div>
  );
}
