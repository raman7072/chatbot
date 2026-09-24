import { useState, useRef, useEffect } from 'react';
import { PERSONAS, previewPersonaVoice, stopSpeaking } from '../utils/marvelVoice';
import { playClickSound, playPersonaChangeSound } from '../utils/soundEffects';

export default function PersonaSelector({
  currentPersona,
  onSelectPersona,
  soundEnabled = true,
  compact = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewingId, setPreviewingId] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        stopSpeaking();
        setPreviewingId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (personaId) => {
    stopSpeaking();
    setPreviewingId(null);
    playPersonaChangeSound(personaId, soundEnabled);
    onSelectPersona(personaId);
    setIsOpen(false);
  };

  const handlePreview = (e, personaId) => {
    e.stopPropagation();
    if (previewingId === personaId) {
      stopSpeaking();
      setPreviewingId(null);
      return;
    }
    stopSpeaking();
    setPreviewingId(personaId);
    previewPersonaVoice(
      personaId,
      () => setPreviewingId(personaId),
      () => setPreviewingId(null)
    );
  };

  const active = PERSONAS[currentPersona] || PERSONAS.jarvis;

  return (
    <div className="persona-selector-container" ref={menuRef}>
      <button
        id="persona-selector-btn"
        className={`hud-btn persona-btn ${isOpen ? 'active' : ''} ${compact ? 'compact' : ''}`}
        onClick={() => {
          playClickSound(soundEnabled);
          setIsOpen(prev => !prev);
        }}
        title={`Active AI Persona: ${active.name} — Click to switch`}
      >
        <span
          className="persona-avatar-badge"
          style={{
            borderColor: active.color,
            color: active.color,
            boxShadow: `0 0 8px ${active.glowColor}`,
          }}
        >
          {active.avatar}
        </span>
        <span className="persona-btn-text">
          <span className="persona-name">{active.shortName}</span>
          {!compact && <span className="persona-indicator-tag">AI CORE</span>}
        </span>
        <span className="persona-caret">▾</span>
      </button>

      {isOpen && (
        <div className="persona-dropdown">
          <div className="persona-dropdown-header">
            <span>MARVEL AI CORES</span>
            <span style={{ fontSize: '9px', opacity: 0.6 }}>SELECT PROTOCOL</span>
          </div>

          <div className="persona-list">
            {Object.values(PERSONAS).map((p) => {
              const isSelected = p.id === active.id;
              const isPreviewing = previewingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`persona-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(p.id)}
                >
                  <div
                    className="persona-option-avatar"
                    style={{
                      borderColor: p.color,
                      color: p.color,
                      background: isSelected ? `${p.color}22` : 'rgba(0,0,0,0.4)',
                      boxShadow: isSelected ? `0 0 10px ${p.glowColor}` : 'none',
                    }}
                  >
                    {p.avatar}
                  </div>

                  <div className="persona-option-info">
                    <div className="persona-option-title-row">
                      <span className="persona-option-name" style={{ color: isSelected ? p.color : '#e2e8f0' }}>
                        {p.name}
                      </span>
                      {isSelected && (
                        <span className="persona-active-badge" style={{ color: p.color }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="persona-option-subtitle">{p.subtitle}</div>
                  </div>

                  <button
                    className={`persona-preview-btn ${isPreviewing ? 'playing' : ''}`}
                    onClick={(e) => handlePreview(e, p.id)}
                    title={isPreviewing ? "Stop audio preview" : `Preview ${p.name}'s voice`}
                    style={{
                      borderColor: isPreviewing ? p.color : 'rgba(56, 189, 248, 0.25)',
                      color: isPreviewing ? p.color : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {isPreviewing ? '⏹ STOP' : '▶ TEST'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="persona-dropdown-footer">
            <span>VOICE: BROWSER NEURAL SYNTHESIS</span>
          </div>
        </div>
      )}
    </div>
  );
}
