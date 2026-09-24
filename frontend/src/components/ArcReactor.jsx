import { useState, useCallback } from 'react';
import { playClickSound } from '../utils/soundEffects';
import { PERSONAS } from '../utils/marvelVoice';

export default function ArcReactor({ streaming = false, soundEnabled = true, personaId = 'jarvis' }) {
  const [pulsing, setPulsing] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  const persona = PERSONAS[personaId] || PERSONAS.jarvis;

  const triggerOverload = useCallback(() => {
    playClickSound(soundEnabled);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([25, 40, 60]);
    }
    setPulsing(true);
    setPulseCount(c => c + 1);
    setTimeout(() => setPulsing(false), 800);
  }, [soundEnabled]);

  const reactorTitle =
    personaId === 'ultron'
      ? 'VIBRANIUM SINGULARITY'
      : personaId === 'friday'
      ? 'TACTICAL SUIT CORE'
      : personaId === 'edith'
      ? 'ORBITAL RELAY CORE'
      : 'ARC REACTOR RT-IV';

  return (
    <div
      className={`hud-panel arc-reactor-widget ${streaming ? 'active-streaming' : ''} ${pulsing ? 'core-discharge' : ''} persona-${personaId}`}
      style={{
        '--active-persona-color': persona.color,
      }}
    >
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="reactor-pulse-icon" style={{ color: persona.color }}>⚡</span>
          <span>{reactorTitle}</span>
        </div>
        <span className="panel-tag" style={{ color: streaming ? 'var(--gold)' : persona.color }}>
          {streaming ? 'DISCHARGING' : 'STABILIZED'}
        </span>
      </div>

      <div
        className="arc-reactor-container"
        onClick={triggerOverload}
        title="Tap / Click core to discharge flux pulse"
      >
        <svg viewBox="0 0 200 200" className="arc-reactor-svg">
          <defs>
            <radialGradient id={`reactorCoreGlow_${personaId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor={persona.color} stopOpacity="0.9" />
              <stop offset="70%" stopColor={persona.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Stator Ring with Ticks */}
          <circle cx="100" cy="100" r="92" className="reactor-stator-ring" style={{ stroke: persona.color }} />
          <circle cx="100" cy="100" r="84" className="reactor-ticks" style={{ stroke: persona.color }} />

          {/* Rotating Coils Ring */}
          <g className={`reactor-rotor ${streaming ? 'rotor-fast' : ''}`}>
            {[...Array(10)].map((_, i) => (
              <rect
                key={i}
                x="94"
                y="16"
                width="12"
                height="14"
                rx="2"
                className="reactor-coil"
                style={{ fill: persona.color, filter: `drop-shadow(0 0 3px ${persona.color})` }}
                transform={`rotate(${i * 36} 100 100)`}
              />
            ))}
          </g>

          {/* Inner Counter-Rotating Ring */}
          <g className={`reactor-counter-rotor ${streaming ? 'counter-fast' : ''}`}>
            <polygon
              points="100,42 148,126 52,126"
              className="reactor-triangle-mount"
              style={{ stroke: persona.color }}
            />
            <polygon
              points="100,158 148,74 52,74"
              className="reactor-triangle-mount-secondary"
              style={{ stroke: persona.color }}
            />
          </g>

          {/* Middle Energy Containment Ring */}
          <circle cx="100" cy="100" r="48" className="reactor-containment" style={{ stroke: persona.color }} />

          {/* Core Unibeam Emitter */}
          <circle
            cx="100"
            cy="100"
            r="34"
            className="reactor-core-field"
            fill={`url(#reactorCoreGlow_${personaId})`}
          />
          <circle cx="100" cy="100" r="22" className="reactor-core-center" />
          <circle cx="100" cy="100" r="10" className="reactor-core-pin" />
        </svg>

        {/* Tactical Overlay telemetry */}
        <div className="reactor-hud-overlay">
          <div className="reactor-telemetry-row">
            <span>CORE FLUX</span>
            <span className="telemetry-highlight" style={{ color: persona.color }}>
              {streaming ? '142.8 GW' : '98.6 GW'}
            </span>
          </div>
          <div className="reactor-telemetry-row">
            <span>RPM</span>
            <span className="telemetry-highlight" style={{ color: persona.color }}>
              {streaming ? '12,450' : '4,800'}
            </span>
          </div>
          <div className="reactor-telemetry-row">
            <span>MODE</span>
            <span className="telemetry-highlight" style={{ color: persona.color }}>
              {persona.shortName}
            </span>
          </div>
        </div>
      </div>

      <div className="reactor-footer-tip" style={{ color: `${persona.color}aa` }}>
        {pulsing ? '⚡ REPULSOR DISCHARGE ACTIVATED' : 'TAP CORE TO INITIATE PULSE'}
      </div>
    </div>
  );
}
