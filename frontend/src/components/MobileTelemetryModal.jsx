import { useEffect } from 'react';
import ArcReactor from './ArcReactor';
import SystemMonitor from './SystemMonitor';
import PersonaSelector from './PersonaSelector';
import { PERSONAS } from '../utils/marvelVoice';
import { playClickSound } from '../utils/soundEffects';

export default function MobileTelemetryModal({
  isOpen,
  onClose,
  streaming,
  soundEnabled,
  currentPersona,
  onSelectPersona,
  onRunQuickCommand,
  quickCommands,
}) {
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
          {/* Active AI Core Card */}
          <div className="hud-panel mobile-persona-card" style={{ borderColor: `${persona.color}44` }}>
            <div className="panel-header">
              <div className="panel-header-left">
                <span style={{ color: persona.color }}>◈</span>
                <span>ACTIVE AI PROTOCOL</span>
              </div>
              <span className="panel-tag" style={{ color: persona.color }}>
                {persona.shortName}
              </span>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: persona.color }}>
                    {persona.name}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>
                    {persona.subtitle}
                  </div>
                </div>
                <PersonaSelector
                  currentPersona={currentPersona}
                  onSelectPersona={onSelectPersona}
                  soundEnabled={soundEnabled}
                  compact={true}
                />
              </div>
            </div>
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
