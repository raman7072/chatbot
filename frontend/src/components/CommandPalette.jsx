import { useState, useEffect, useRef, useMemo } from 'react';
import { PERSONAS } from '../utils/marvelVoice';
import { playClickSound, playPersonaChangeSound, playThemeChangeSound } from '../utils/soundEffects';

const ARMOR_PROTOCOLS = [
  { id: 'mark-iv', name: 'MARK IV', desc: 'Arc Cyan', color: '#00d4ff' },
  { id: 'mark-vii', name: 'MARK VII', desc: 'Gold Titanium & Red', color: '#ffb800' },
  { id: 'stealth', name: 'STEALTH OPS', desc: 'Tactical Emerald', color: '#00ffaa' },
  { id: 'bleeding-edge', name: 'MARK L', desc: 'Nano-Tech Violet', color: '#c060ff' },
  { id: 'hulkbuster', name: 'VERONICA', desc: 'Hulkbuster Amber', color: '#ff7700' },
];

export default function CommandPalette({
  isOpen,
  onClose,
  currentPersona,
  onSelectPersona,
  onNewChat,
  soundEnabled,
  onToggleSound,
  onToggleTelemetry,
  onRunQuickCommand,
  onNavigateHome,
  onNavigateProfile,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command items list
  const commands = useMemo(() => {
    const list = [
      // Actions
      { id: 'act-new', group: 'TACTICAL ACTIONS', icon: '✦', title: 'New Tactical Session', sub: 'Reset session context and start fresh', action: () => { onNewChat(); onClose(); } },
      { id: 'act-telemetry', group: 'TACTICAL ACTIONS', icon: '⚡', title: 'Toggle Arc Telemetry HUD', sub: 'Inspect CPU, memory & agent status', action: () => { onToggleTelemetry?.(); onClose(); } },
      { id: 'act-sound', group: 'TACTICAL ACTIONS', icon: soundEnabled ? '🔇' : '🔊', title: soundEnabled ? 'Mute Tactical Audio' : 'Enable Tactical Audio', sub: 'Toggle speech synthesis & SFX', action: () => { onToggleSound?.(); onClose(); } },
      { id: 'act-profile', group: 'TACTICAL ACTIONS', icon: '👤', title: 'Commander Profile & Mission Archive', sub: 'View past sessions, export transcripts & settings', action: () => { onNavigateProfile?.(); onClose(); } },
      { id: 'act-home', group: 'TACTICAL ACTIONS', icon: '🏢', title: 'Singh Enterprises Portal', sub: 'Return to public overview & specifications', action: () => { onNavigateHome?.(); onClose(); } },

      // Quick Tactical Queries
      { id: 'cmd-calc', group: 'DIRECTIVES', icon: '🔢', title: 'Run Math & Arc Reactor Calibrations', sub: 'Calculate complex mathematical directives', action: () => { onRunQuickCommand?.('Calculate: 2^10 + 15% of 200 - sqrt(144)'); onClose(); } },
      { id: 'cmd-diag', group: 'DIRECTIVES', icon: '💻', title: 'Run Full System Diagnostics', sub: 'Check hardware load and security posture', action: () => { onRunQuickCommand?.('Run a full system diagnostic and report status'); onClose(); } },
      { id: 'cmd-web', group: 'DIRECTIVES', icon: '🌐', title: 'Search Global Intelligence (Web)', sub: 'Query live web telemetry via LangGraph tools', action: () => { onRunQuickCommand?.('Search the web for the latest advancements in AI and robotics'); onClose(); } },
      { id: 'cmd-py', group: 'DIRECTIVES', icon: '🐍', title: 'Execute Sandboxed Python Script', sub: 'Run code in an isolated execution sandbox', action: () => { onRunQuickCommand?.('Write and execute Python code to calculate the first 10 prime numbers'); onClose(); } },
      { id: 'cmd-weather', group: 'DIRECTIVES', icon: '🌤️', title: 'Atmospheric Conditions / Weather', sub: 'Retrieve live meteorological telemetry', action: () => { onRunQuickCommand?.('What is the current weather and forecast for Tokyo?'); onClose(); } },

      // Marvel Persona protocols
      ...Object.entries(PERSONAS).map(([pId, p]) => ({
        id: `persona-${pId}`,
        group: 'MARVEL AI PROTOCOLS',
        icon: '🛡️',
        title: `Protocol: ${p.name}`,
        sub: p.title,
        active: currentPersona === pId,
        action: () => {
          onSelectPersona(pId);
          playPersonaChangeSound(soundEnabled);
          onClose();
        },
      })),

      // Armor protocol themes
      ...ARMOR_PROTOCOLS.map(proto => ({
        id: `theme-${proto.id}`,
        group: 'ARMOR PROTOCOLS (THEME)',
        icon: '🎨',
        title: `Armor: ${proto.name}`,
        sub: proto.desc,
        color: proto.color,
        action: () => {
          if (proto.id === 'mark-iv') {
            document.documentElement.removeAttribute('data-theme');
          } else {
            document.documentElement.setAttribute('data-theme', proto.id);
          }
          localStorage.setItem('jarvis-armor-theme', proto.id);
          playThemeChangeSound(soundEnabled);
          onClose();
        },
      })),
    ];

    if (!query.trim()) return list;

    const q = query.toLowerCase();
    return list.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.sub.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q)
    );
  }, [query, soundEnabled, currentPersona, onNewChat, onToggleTelemetry, onToggleSound, onNavigateProfile, onNavigateHome, onRunQuickCommand, onSelectPersona, onClose]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (commands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + commands.length) % (commands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (commands[selectedIndex]) {
          commands[selectedIndex].action();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, commands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette-card" onClick={e => e.stopPropagation()}>
        <div className="palette-search-wrapper">
          <span style={{ fontSize: '18px', color: 'var(--cyan)' }}>⚡</span>
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a tactical command, switch protocol, or search..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className="palette-esc-badge">ESC</span>
        </div>

        <div className="palette-results">
          {commands.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
              No matching directives found.
            </div>
          ) : (
            commands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  className={`palette-item ${isSelected ? 'active' : ''}`}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="palette-item-left">
                    <span className="palette-item-icon">{cmd.icon}</span>
                    <div>
                      <div className="palette-item-label" style={cmd.color ? { color: cmd.color } : undefined}>
                        {cmd.title}
                        {cmd.active && <span style={{ marginLeft: 8, fontSize: '10px', color: 'var(--cyan)' }}>● ACTIVE</span>}
                      </div>
                      <div className="palette-item-sub">{cmd.sub}</div>
                    </div>
                  </div>
                  <span className="palette-item-tag">{cmd.group}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
