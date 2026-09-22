import { useEffect, useRef, useState } from 'react';
import { playBootSound } from '../utils/soundEffects';

const BOOT_LINES = [
  { text: '[ INIT ] JARVIS v5.0 — Initializing core systems...', type: '' },
  { text: '[ OK   ] Neural network loaded: llama-3.3-70b-versatile', type: 'ok' },
  { text: '[ OK   ] LangGraph agent compiled — 11 tools registered', type: 'ok' },
  { text: '[ OK   ] Memory subsystem: MemorySaver online', type: 'ok' },
  { text: '[ OK   ] Web search module: DuckDuckGo connected', type: 'ok' },
  { text: '[ OK   ] System diagnostics: psutil active', type: 'ok' },
  { text: '[ OK   ] Weather service: Open-Meteo linked', type: 'ok' },
  { text: '[ OK   ] Code execution sandbox: Secured', type: 'ok' },
  { text: '[ OK   ] File system access: Initialized', type: 'ok' },
  { text: '[ OK   ] Voice interface: Web Speech API ready', type: 'ok' },
  { text: '[ OK   ] Streaming SSE channel: Established', type: 'ok' },
  { text: '[ BOOT ] All systems nominal. Good day, Sir.', type: 'ok' },
];

export default function BootSequence({ onComplete }) {
  const [lines, setLines] = useState([]);
  const [progress, setProgress] = useState(0);

  // Keep refs so the interval closure never captures stale values.
  // indexRef makes this StrictMode-safe: when StrictMode double-mounts
  // the component, the effect cleanup fires, the interval is cleared,
  // and on re-mount indexRef.current resets to 0 before the new interval
  // starts — so we never push BOOT_LINES[undefined] into state.
  const onCompleteRef = useRef(onComplete);
  const indexRef = useRef(0);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset on every (re-)mount so StrictMode double-invoke works cleanly.
    indexRef.current = 0;
    setLines([]);
    setProgress(0);

    // Play Arc Reactor initialization sound
    playBootSound(true);

    const interval = setInterval(() => {
      const i = indexRef.current;
      if (i < BOOT_LINES.length) {
        setLines(prev => [...prev, BOOT_LINES[i]]);
        setProgress(Math.round(((i + 1) / BOOT_LINES.length) * 100));
        indexRef.current = i + 1;
      } else {
        clearInterval(interval);
        setTimeout(() => onCompleteRef.current?.(), 800);
      }
    }, 160);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="boot-screen">
      <div className="boot-logo">JARVIS</div>
      <div className="boot-subtitle">Just A Rather Very Intelligent System</div>

      <div className="boot-log">
        {lines.map((line, idx) =>
          line ? (
            <div key={idx} className={`boot-log-line ${line.type ?? ''}`}>
              {line.text}
            </div>
          ) : null
        )}
      </div>

      <div className="boot-progress-bar">
        <div className="boot-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'rgba(0,212,255,0.4)',
        letterSpacing: '3px',
      }}>
        STARK INDUSTRIES · SYSTEM BOOT · {progress}%
      </div>
    </div>
  );
}
