import { useState, useEffect, useRef } from 'react';
import { playClickSound, playThemeChangeSound } from '../utils/soundEffects';
import PersonaSelector from './PersonaSelector';
import { PERSONAS } from '../utils/marvelVoice';
import { useAuth } from '../context/AuthContext';

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
  currentPersona,
  onSelectPersona,
  onToggleTelemetry,
  user,
  isAuthenticated,
  onNavigateProfile,
  onNavigateHome,
  onNavigateLogin,
  onSelectSession,
  onOpenCommandPalette,
}) {
  const { fetchHistory } = useAuth();
  const [time, setTime] = useState(new Date());
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('jarvis-armor-theme') || 'mark-iv';
  });
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [missionsMenuOpen, setMissionsMenuOpen] = useState(false);
  const [missionsList, setMissionsList] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const themeRef = useRef(null);
  const missionsRef = useRef(null);

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
      if (missionsRef.current && !missionsRef.current.contains(e.target)) {
        setMissionsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const toggleMissions = async () => {
    playClickSound(soundEnabled);
    if (!missionsMenuOpen) {
      setMissionsMenuOpen(true);
      if (isAuthenticated) {
        setMissionsLoading(true);
        try {
          const list = await fetchHistory();
          setMissionsList(list.slice(0, 7));
        } catch {
          setMissionsList([]);
        } finally {
          setMissionsLoading(false);
        }
      }
    } else {
      setMissionsMenuOpen(false);
    }
  };

  const selectTheme = (themeId) => {
    setCurrentTheme(themeId);
    setThemeMenuOpen(false);
    playThemeChangeSound(soundEnabled);
  };

  const handleSoundToggle = () => {
    playClickSound(!soundEnabled);
    onToggleSound();
  };

  const handleNewChatClick = () => {
    playClickSound(soundEnabled);
    onNewChat();
  };

  const activeProto = ARMOR_PROTOCOLS.find(p => p.id === currentTheme) || ARMOR_PROTOCOLS[0];
  const persona = PERSONAS[currentPersona] || PERSONAS.jarvis;

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
      {/* Left: Brand Logo & Persona indicator */}
      <div
        className="jarvis-logo"
        onClick={onNavigateHome}
        style={{ cursor: 'pointer' }}
        title="Singh Enterprises · Return to Home"
      >
        <div
          className="logo-icon"
          style={{
            borderColor: `${persona.color}77`,
            boxShadow: `0 0 10px ${persona.glowColor}`,
          }}
        >
          <svg viewBox="0 0 24 24" style={{ fill: persona.color }}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div className="logo-text-group">
          <div className="logo-text">
            <span>JARVIS</span>
            <span
              className="persona-inline-tag"
              style={{
                color: persona.color,
                borderColor: `${persona.color}66`,
                background: `${persona.color}18`,
              }}
            >
              {persona.shortName}
            </span>
          </div>
          <div className="logo-subtitle">Singh Enterprises · Division 08</div>
        </div>
      </div>

      {/* Center status (Desktop / Tablet) */}
      <div className="topbar-center">
        {streaming ? (
          <div className="status-indicator" style={{ color: 'var(--gold)' }}>
            <div className="status-dot" style={{ background: 'var(--gold)', boxShadow: '0 0 6px var(--gold)' }} />
            <span>{toolInUse ? `EXECUTING: ${toolInUse.toUpperCase()}` : 'PROCESSING STREAM...'}</span>
          </div>
        ) : (
          <div className="status-indicator" style={{ color: persona.color }}>
            <div className="status-dot" style={{ background: persona.color, boxShadow: `0 0 6px ${persona.color}` }} />
            <span>ONLINE · {persona.title.toUpperCase()}</span>
          </div>
        )}
        <div className="topbar-time">{timeStr} · {dateStr}</div>
        <div className="topbar-session">
          SESSION: {sessionId?.slice(0, 8).toUpperCase()}
        </div>
      </div>

      {/* Right actions */}
      <div className="topbar-right">
        {/* Mobile HUD Telemetry Button (Visible on screens <960px) */}
        <button
          id="mobile-hud-btn"
          className="hud-btn mobile-hud-toggle-btn"
          onClick={() => {
            playClickSound(soundEnabled);
            onToggleTelemetry?.();
          }}
          title="Open Tactical Telemetry & Arc Reactor"
          style={{ borderColor: `${persona.color}55`, color: persona.color }}
        >
          <span className="mobile-btn-icon">⚡</span>
          <span className="mobile-btn-text">HUD</span>
        </button>

        {/* Marvel AI Persona Selector */}
        <PersonaSelector
          currentPersona={currentPersona}
          onSelectPersona={onSelectPersona}
          soundEnabled={soundEnabled}
        />

        {/* Armor Protocol Theme Selector */}
        <div className="theme-selector-container" ref={themeRef}>
          <button
            id="armor-theme-btn"
            className="hud-btn theme-btn"
            onClick={() => {
              playClickSound(soundEnabled);
              setThemeMenuOpen(prev => !prev);
            }}
            title="Singh Armor Protocols (Theme Switcher)"
          >
            <span
              className="theme-indicator-dot"
              style={{ background: activeProto.color, boxShadow: `0 0 6px ${activeProto.color}` }}
            />
            <span className="theme-name-label">{activeProto.name}</span>
            <span style={{ fontSize: '9px', opacity: 0.7 }}>▾</span>
          </button>

          {themeMenuOpen && (
            <div className="theme-dropdown">
              <div className="theme-dropdown-header">SINGH ARMOR PROTOCOLS</div>
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

        {/* Tactical Missions Switcher Dropdown */}
        <div className="missions-selector-container" ref={missionsRef}>
          <button
            id="missions-switcher-btn"
            className="hud-btn missions-btn"
            onClick={toggleMissions}
            title="Recent Tactical Mission Archives"
          >
            <span>📜</span>
            <span className="sound-btn-desktop">MISSIONS</span>
            <span style={{ fontSize: '9px', opacity: 0.7 }}>▾</span>
          </button>

          {missionsMenuOpen && (
            <div className="missions-dropdown">
              <div className="missions-dropdown-header">
                <span>TACTICAL MISSION ARCHIVE</span>
                {isAuthenticated && (
                  <span style={{ color: 'var(--green-nominal, #00ff9d)', fontSize: '8px' }}>● SYNCED</span>
                )}
              </div>

              {missionsLoading ? (
                <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  Accessing Singh Archive...
                </div>
              ) : !isAuthenticated ? (
                <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: 8 }}>
                    Sign in to access and resume saved mission archives.
                  </div>
                  <button
                    type="button"
                    className="missions-view-all"
                    onClick={() => { setMissionsMenuOpen(false); onNavigateLogin(); }}
                  >
                    LOG IN / SIGN UP →
                  </button>
                </div>
              ) : missionsList.length === 0 ? (
                <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                  No recorded missions yet.
                </div>
              ) : (
                <div className="missions-list">
                  {missionsList.map(sess => {
                    const pm = PERSONAS[sess.persona] || PERSONAS.jarvis;
                    const isCurrent = sess.session_id === sessionId;
                    const date = new Date(sess.updated_at * 1000);
                    const timeDisp = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <button
                        key={sess.session_id}
                        type="button"
                        className={`mission-item ${isCurrent ? 'active' : ''}`}
                        onClick={() => {
                          setMissionsMenuOpen(false);
                          playClickSound(soundEnabled);
                          onSelectSession?.(sess.session_id);
                        }}
                      >
                        <div
                          className="mission-badge"
                          style={{ color: pm.color, borderColor: `${pm.color}66` }}
                        >
                          {pm.shortName}
                        </div>
                        <div className="mission-info">
                          <div className="mission-title">{sess.title}</div>
                          <div className="mission-meta">
                            {sess.message_count} msgs · {timeDisp} {isCurrent && ' · [CURRENT]'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {isAuthenticated && (
                <button
                  type="button"
                  className="missions-view-all"
                  onClick={() => {
                    setMissionsMenuOpen(false);
                    onNavigateProfile();
                  }}
                >
                  VIEW FULL ARCHIVE & EXPORTS →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Command Palette Trigger (Ctrl+K / ⌘K) */}
        <button
          id="cmd-palette-btn"
          className="hud-btn"
          onClick={() => {
            playClickSound(soundEnabled);
            onOpenCommandPalette?.();
          }}
          title="Open Tactical Command Palette (Ctrl+K or ⌘K)"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '0 8px' }}
        >
          <span style={{ color: 'var(--cyan)' }}>⌘K</span>
        </button>

        {/* Audio Toggle */}
        <button
          id="sound-toggle-btn"
          className="hud-btn sound-btn"
          onClick={handleSoundToggle}
          title={soundEnabled ? "Mute Voice & SFX (Audio ON)" : "Unmute Voice & SFX (Audio MUTED)"}
          style={{
            borderColor: soundEnabled ? 'rgba(56,189,248,0.4)' : 'rgba(255,34,68,0.4)',
            color: soundEnabled ? 'var(--cyan)' : 'var(--red-alert)',
          }}
          aria-label={soundEnabled ? "Audio On" : "Audio Muted"}
        >
          <span className="sound-btn-desktop">{soundEnabled ? '🔊 AUDIO: ON' : '🔇 AUDIO: OFF'}</span>
          <span className="sound-btn-mobile">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>

        {/* User Profile Chip (when authenticated) */}
        {isAuthenticated && user ? (
          <button
            id="profile-btn"
            className="hud-btn profile-chip-btn"
            onClick={onNavigateProfile}
            title={`Commander: ${user.full_name || user.username}`}
            style={{ borderColor: `${persona.color}55`, gap: '7px' }}
          >
            <span
              className="topbar-user-avatar"
              style={{ background: `${persona.color}22`, borderColor: `${persona.color}77`, color: persona.color }}
            >
              {user.avatar_initials || (user.full_name || user.username).slice(0,2).toUpperCase()}
            </span>
            <span className="topbar-user-name">{user.full_name || user.username}</span>
          </button>
        ) : (
          <button
            id="topbar-login-btn"
            className="hud-btn"
            onClick={onNavigateLogin}
            title="Sign in to save mission history and customize profile"
            style={{
              borderColor: `${persona.color}55`,
              color: persona.color,
              fontSize: '11px',
              fontWeight: 600,
              gap: '5px',
            }}
          >
            <span>🛡️</span>
            <span className="topbar-login-text">LOG IN</span>
          </button>
        )}

        {/* New Chat */}
        <button
          id="new-chat-btn"
          className="hud-btn new-chat-btn"
          onClick={handleNewChatClick}
          title="Start a new tactical session"
        >
          <span className="new-chat-desktop">✦ NEW CHAT</span>
          <span className="new-chat-mobile">✦ NEW</span>
        </button>
      </div>
    </div>
  );
}
