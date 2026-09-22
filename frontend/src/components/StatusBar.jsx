import { useState, useEffect, useRef } from 'react';
import { playClickSound, playThemeChangeSound } from '../utils/soundEffects';

const ARMOR_PROTOCOLS = [
  { id: 'mark-iv', name: 'MARK IV', desc: 'Arc Cyan', color: '#00d4ff' },
  { id: 'mark-vii', name: 'MARK VII', desc: 'Gold Titanium & Red', color: '#ffb800' },
  { id: 'stealth', name: 'STEALTH OPS', desc: 'Tactical Emerald', color: '#00ffaa' },
  { id: 'bleeding-edge', name: 'MARK L', desc: 'Nano-Tech Violet', color: '#c060ff' },
  { id: 'hulkbuster', name: 'VERONICA', desc: 'Hulkbuster Amber', color: '#ff7700' },
];

export default function StatusBar({
  streaming,
  toolInUse,
  sessionId,
  onNewChat,
  soundEnabled,
  onToggleSound,
}) {
  const [time, setTime] = useState(new Date());
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('jarvis-armor-theme') || 'mark-iv';
  });
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Apply theme to document root
  useEffect(() => {
    if (currentTheme === 'mark-iv') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
    localStorage.setItem('jarvis-armor-theme', currentTheme);

    // Update browser theme-color meta tag
    const active = ARMOR_PROTOCOLS.find(p => p.id === currentTheme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme && active) {
      metaTheme.setAttribute('content', active.color);
    }
  }, [currentTheme]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectTheme = (themeId) => {
    setCurrentTheme(themeId);
    setThemeMenuOpen(false);
    playThemeChangeSound(soundEnabled);
  };

  const handleSoundToggle = () => {
    playClickSound(!soundEnabled); // Play click if turning on
    onToggleSound();
  };

  const handleNewChatClick = () => {
    playClickSound(soundEnabled);
    onNewChat();
  };

  const activeProto = ARMOR_PROTOCOLS.find(p => p.id === currentTheme) || ARMOR_PROTOCOLS[0];

  const timeStr = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateStr = time.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).toUpperCase();

  return (
    <div className="topbar">
      {/* Logo */}
      <div className="jarvis-logo">
        <div className="logo-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <div className="logo-text">JARVIS</div>
          <div className="logo-subtitle">Stark Industries · v5.0</div>
        </div>
      </div>

      {/* Center status */}
      <div className="topbar-center">
        {streaming ? (
          <div className="status-indicator" style={{ color: 'var(--gold)' }}>
            <div className="status-dot" style={{ background: 'var(--gold)', boxShadow: '0 0 6px var(--gold)' }} />
            {toolInUse ? `EXECUTING: ${toolInUse.toUpperCase()}` : 'PROCESSING...'}
          </div>
        ) : (
          <div className="status-indicator">
            <div className="status-dot" />
            SYSTEMS OPERATIONAL
          </div>
        )}
        <div className="topbar-time">{timeStr} · {dateStr}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(0,212,255,0.4)' }}>
          SESSION: {sessionId?.slice(0, 8).toUpperCase()}
        </div>
      </div>

      {/* Right actions */}
      <div className="topbar-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Armor Protocol Theme Selector */}
        <div className="theme-selector-container" ref={themeRef}>
          <button
            id="armor-theme-btn"
            className="hud-btn theme-btn"
            onClick={() => {
              playClickSound(soundEnabled);
              setThemeMenuOpen(prev => !prev);
            }}
            title="Stark Armor Protocols (Theme Switcher)"
          >
            <span className="theme-indicator-dot" style={{ background: activeProto.color, boxShadow: `0 0 6px ${activeProto.color}` }} />
            {activeProto.name}
            <span style={{ fontSize: '9px', opacity: 0.7 }}>▾</span>
          </button>

          {themeMenuOpen && (
            <div className="theme-dropdown">
              <div className="theme-dropdown-header">STARK ARMOR PROTOCOLS</div>
              {ARMOR_PROTOCOLS.map(proto => (
                <button
                  key={proto.id}
                  className={`theme-dropdown-item ${currentTheme === proto.id ? 'active' : ''}`}
                  onClick={() => selectTheme(proto.id)}
                >
                  <span
                    className="theme-swatch"
                    style={{ background: proto.color, boxShadow: `0 0 5px ${proto.color}` }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '12px' }}>{proto.name}</div>
                    <div style={{ fontSize: '10px', opacity: 0.6 }}>{proto.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Audio Toggle */}
        <button
          id="sound-toggle-btn"
          className="hud-btn"
          onClick={handleSoundToggle}
          title={soundEnabled ? "Mute Voice & SFX (Audio ON)" : "Unmute Voice & SFX (Audio MUTED)"}
          style={{
            borderColor: soundEnabled ? 'rgba(0,212,255,0.4)' : 'rgba(255,34,68,0.4)',
            color: soundEnabled ? 'var(--cyan)' : 'var(--red-alert)',
          }}
        >
          {soundEnabled ? '🔊 AUDIO: ON' : '🔇 AUDIO: MUTED'}
        </button>

        {/* New Chat */}
        <button
          id="new-chat-btn"
          className="hud-btn"
          onClick={handleNewChatClick}
          title="Start a new conversation"
        >
          ✦ NEW CHAT
        </button>
      </div>
    </div>
  );
}
