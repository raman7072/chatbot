import { useState, useEffect } from 'react';
import ArcReactor from './ArcReactor';
import SystemMonitor from './SystemMonitor';
import PersonaSelector from './PersonaSelector';
import { PERSONAS } from '../utils/marvelVoice';
import { playClickSound, playThemeChangeSound } from '../utils/soundEffects';
import { ARMOR_PROTOCOLS } from './StatusBar';

export default function MobileTelemetryModal({
  isOpen,
  onClose,
  streaming,
  soundEnabled,
  onToggleSound,
  currentPersona,
  onSelectPersona,
  onRunQuickCommand,
  quickCommands,
  onNavigateProfile,
  isAuthenticated,
}) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('jarvis-armor-theme') || 'mark-iv';
  });

  // Prevent body scrolling when modal is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const persona = PERSONAS[currentPersona] || PERSONAS.jarvis;

  const handleSelectTheme = (protoId) => {
    setCurrentTheme(protoId);
    if (protoId === 'mark-iv') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', protoId);
    }
    localStorage.setItem('jarvis-armor-theme', protoId);
    playThemeChangeSound(soundEnabled);
  };

  return (
    <div className="mobile-hud-overlay" onClick={onClose}>
      <div className="mobile-hud-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-hud-header">
          <div className="mobile-hud-header-title">
            <span style={{ color: persona.color }}>⚡</span>
            <span>TACTICAL TELEMETRY & HUD</span>
          </div>
          <button
            className="mobile-hud-close-btn"
            onClick={() => {
              playClickSound(soundEnabled);
              onClose();
            }}
            title="Close Telemetry HUD"
          >
            ✕
          </button>
        </div>

        <div className="mobile-hud-content">
          {/* Active AI Core Card — Direct 2x2 touch selector */}
          <div className="hud-panel mobile-persona-card" style={{ borderColor: `${persona.color}55`, padding: '12px' }}>
            <div className="panel-header-left" style={{ marginBottom: '10px' }}>
              <span style={{ color: persona.color }}>◈</span>
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
                ACTIVE AI PROTOCOL · <span style={{ color: persona.color }}>{persona.name}</span>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {Object.values(PERSONAS).map((p) => {
                const isSelected = p.id === currentPersona;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      playClickSound(soundEnabled);
                      onSelectPersona(p.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isSelected ? `${p.color}22` : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? p.color : 'rgba(255, 255, 255, 0.12)'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 10px ${p.glowColor}` : 'none',
                    }}
                  >
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: `1.5px solid ${p.color}`,
                        color: p.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-hud)',
                        fontSize: '9px',
                        fontWeight: 800,
                        background: isSelected ? `${p.color}33` : 'transparent',
                        flexShrink: 0,
                      }}
                    >
                      {p.avatar}
                    </span>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontFamily: 'var(--font-hud)', fontSize: '10px', fontWeight: 700, color: isSelected ? p.color : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.shortName}
                      </div>
                      <div style={{ fontSize: '8px', opacity: 0.65, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Armor Protocol Theme Selector (Mobile touch-friendly) */}
          <div className="hud-panel" style={{ borderColor: 'rgba(56, 189, 248, 0.25)', padding: '12px' }}>
            <div className="panel-header-left" style={{ marginBottom: '10px' }}>
              <span style={{ color: 'var(--cyan)' }}>🛡️</span>
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
                SINGH ARMOR PROTOCOLS
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {ARMOR_PROTOCOLS.map((proto, index) => {
                const isActive = currentTheme === proto.id;
                const isLastOdd = index === ARMOR_PROTOCOLS.length - 1 && ARMOR_PROTOCOLS.length % 2 === 1;
                return (
                  <button
                    key={proto.id}
                    type="button"
                    onClick={() => handleSelectTheme(proto.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      gridColumn: isLastOdd ? 'span 2' : undefined,
                      background: isActive ? `${proto.color}1c` : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isActive ? proto.color : 'rgba(255, 255, 255, 0.12)'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? `0 0 10px ${proto.color}44` : 'none',
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: proto.color,
                        boxShadow: `0 0 6px ${proto.color}`,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontFamily: 'var(--font-hud)', fontSize: '10px', fontWeight: 700, color: isActive ? proto.color : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {proto.name}
                      </div>
                      <div style={{ fontSize: '8.5px', opacity: 0.6, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {proto.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tactical Quick Toggles & Navigation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {onToggleSound && (
              <button
                type="button"
                className="hud-btn"
                onClick={() => {
                  playClickSound(!soundEnabled);
                  onToggleSound();
                }}
                style={{
                  justifyContent: 'center',
                  minHeight: '40px',
                  borderColor: soundEnabled ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 34, 68, 0.4)',
                  color: soundEnabled ? 'var(--cyan)' : 'var(--red-alert)',
                }}
              >
                <span>{soundEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO MUTED'}</span>
              </button>
            )}

            {onNavigateProfile && (
              <button
                type="button"
                className="hud-btn"
                onClick={() => {
                  playClickSound(soundEnabled);
                  onClose();
                  onNavigateProfile();
                }}
                style={{ justifyContent: 'center', minHeight: '40px' }}
              >
                <span>📜 {isAuthenticated ? 'MISSIONS & PROFILE' : 'LOG IN / MISSIONS'}</span>
              </button>
            )}
          </div>

          {/* Interactive Arc Reactor */}
          <ArcReactor
            streaming={streaming}
            soundEnabled={soundEnabled}
            personaId={currentPersona}
          />

          {/* Live System Diagnostics */}
          <SystemMonitor />
        </div>

        <div className="mobile-hud-footer">
          <span>SINGH ENTERPRISES · MOBILE TACTICAL INTERFACE</span>
        </div>
      </div>
    </div>
  );
}
