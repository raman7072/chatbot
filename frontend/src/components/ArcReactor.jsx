import { useState, useCallback } from 'react';
import { playClickSound } from '../utils/soundEffects';

export default function ArcReactor({ streaming = false, soundEnabled = true }) {
  const [pulsing, setPulsing] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  const triggerOverload = useCallback(() => {
    playClickSound(soundEnabled);
    setPulsing(true);
    setPulseCount(c => c + 1);
    setTimeout(() => setPulsing(false), 800);
  }, [soundEnabled]);

  return (
    <div className={`hud-panel arc-reactor-widget ${streaming ? 'active-streaming' : ''} ${pulsing ? 'core-discharge' : ''}`}>
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="reactor-pulse-icon">⚡</span>
          <span>ARC REACTOR RT-IV</span>
        </div>
        <span className="panel-tag" style={{ color: streaming ? 'var(--gold)' : 'var(--cyan)' }}>
          {streaming ? 'DISCHARGING' : 'STABILIZED'}
        </span>
      </div>

      <div className="arc-reactor-container" onClick={triggerOverload} title="Click to discharge core flux">
        <svg viewBox="0 0 200 200" className="arc-reactor-svg">
          <defs>
            <radialGradient id="reactorCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor="var(--cyan)" stopOpacity="0.9" />
              <stop offset="70%" stopColor="var(--cyan-dim)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Stator Ring with Ticks */}
          <circle cx="100" cy="100" r="92" className="reactor-stator-ring" />
          <circle cx="100" cy="100" r="84" className="reactor-ticks" />

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
                transform={`rotate(${i * 36} 100 100)`}
              />
            ))}
          </g>

          {/* Inner Counter-Rotating Ring */}
          <g className={`reactor-counter-rotor ${streaming ? 'counter-fast' : ''}`}>
            <polygon
              points="100,42 148,126 52,126"
              className="reactor-triangle-mount"
            />
            <polygon
              points="100,158 148,74 52,74"
              className="reactor-triangle-mount-secondary"
            />
          </g>

          {/* Middle Energy Containment Ring */}
          <circle cx="100" cy="100" r="48" className="reactor-containment" />

          {/* Core Unibeam Emitter */}
          <circle cx="100" cy="100" r="34" className="reactor-core-field" fill="url(#reactorCoreGlow)" />
          <circle cx="100" cy="100" r="22" className="reactor-core-center" />
          <circle cx="100" cy="100" r="10" className="reactor-core-pin" />
        </svg>

        {/* Tactical Overlay telemetry */}
        <div className="reactor-hud-overlay">
          <div className="reactor-telemetry-row">
            <span>CORE FLUX</span>
            <span className="telemetry-highlight">{streaming ? '142.8 GW' : '98.6 GW'}</span>
          </div>
          <div className="reactor-telemetry-row">
            <span>RPM</span>
            <span className="telemetry-highlight">{streaming ? '12,450' : '4,800'}</span>
          </div>
          <div className="reactor-telemetry-row">
            <span>HARMONIC</span>
            <span className="telemetry-highlight">MK-85 PURE</span>
          </div>
        </div>
      </div>

      <div className="reactor-footer-tip">
        {pulsing ? '⚡ REPULSOR DISCHARGE ACTIVATED' : 'CLICK CORE TO INITIATE PULSE'}
      </div>
    </div>
  );
}
