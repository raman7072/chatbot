import { useState, useCallback, useEffect } from 'react';
import BootSequence from './components/BootSequence';
import StatusBar from './components/StatusBar';
import ChatInterface, { QUICK_COMMANDS } from './components/ChatInterface';
import MobileTelemetryModal from './components/MobileTelemetryModal';
import { PERSONAS } from './utils/marvelVoice';
import { playPersonaChangeSound } from './utils/soundEffects';
import './index.css';

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [sessionId, setSessionId] = useState(generateSessionId());
  const [streaming, setStreaming] = useState(false);
  const [toolInUse, setToolInUse] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mobileTelemetryOpen, setMobileTelemetryOpen] = useState(false);

  // Active Marvel AI Persona ('jarvis' | 'ultron' | 'friday' | 'edith')
  const [currentPersona, setCurrentPersona] = useState(() => {
    return localStorage.getItem('jarvis-marvel-persona') || 'jarvis';
  });

  const handleSelectPersona = useCallback((personaId) => {
    setCurrentPersona(personaId);
    localStorage.setItem('jarvis-marvel-persona', personaId);
  }, []);

  const handleNewChat = useCallback(() => {
    setSessionId(generateSessionId());
  }, []);

  // Update root attribute when persona changes to allow persona-specific styling
  useEffect(() => {
    document.documentElement.setAttribute('data-persona', currentPersona);
  }, [currentPersona]);

  return (
    <>
      {/* Animated HUD background */}
      <div className="hud-bg" />
      <div className="vignette" />

      {/* Boot sequence overlay */}
      {!booted && (
        <BootSequence onComplete={() => setBooted(true)} />
      )}

      {/* Main tactical interface */}
      {booted && (
        <div className={`app-layout persona-mode-${currentPersona}`}>
          <StatusBar
            streaming={streaming}
            toolInUse={toolInUse}
            sessionId={sessionId}
            onNewChat={handleNewChat}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(prev => !prev)}
            currentPersona={currentPersona}
            onSelectPersona={handleSelectPersona}
            onToggleTelemetry={() => setMobileTelemetryOpen(prev => !prev)}
          />

          <ChatInterface
            sessionId={sessionId}
            currentPersona={currentPersona}
            onSelectPersona={handleSelectPersona}
            onStreamingChange={setStreaming}
            onToolChange={setToolInUse}
            soundEnabled={soundEnabled}
          />

          {/* Mobile HUD Drawer / Bottom Sheet */}
          <MobileTelemetryModal
            isOpen={mobileTelemetryOpen}
            onClose={() => setMobileTelemetryOpen(false)}
            streaming={streaming}
            soundEnabled={soundEnabled}
            currentPersona={currentPersona}
            onSelectPersona={handleSelectPersona}
            quickCommands={QUICK_COMMANDS}
            onRunQuickCommand={(cmd) => {
              // Quick command execution on mobile
              const chatInput = document.getElementById('chat-input');
              const sendBtn = document.getElementById('send-btn');
              if (chatInput && sendBtn) {
                // Set input value and trigger synthetic event
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                nativeInputValueSetter.call(chatInput, cmd);
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                setTimeout(() => sendBtn.click(), 50);
              }
            }}
          />
        </div>
      )}
    </>
  );
}
