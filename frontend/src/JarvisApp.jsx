/**
 * JarvisApp.jsx — Main JARVIS HUD Application
 * Extracted from App.jsx to work alongside the new routing system.
 * Integrates auth user data for name display and session persistence.
 */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BootSequence from './components/BootSequence';
import StatusBar from './components/StatusBar';
import ChatInterface, { QUICK_COMMANDS } from './components/ChatInterface';
import MobileTelemetryModal from './components/MobileTelemetryModal';
import CommandPalette from './components/CommandPalette';
import { useAuth } from './context/AuthContext';
import { playPersonaChangeSound } from './utils/soundEffects';

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function JarvisApp() {
  const { user, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [booted, setBooted] = useState(() => {
    return !!location.state?.loadSessionId || sessionStorage.getItem('jarvis-hud-booted') === 'true';
  });
  const [sessionId, setSessionId] = useState(() => {
    return location.state?.loadSessionId || generateSessionId();
  });
  const [streaming, setStreaming] = useState(false);
  const [toolInUse, setToolInUse] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mobileTelemetryOpen, setMobileTelemetryOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global Tactical Command Palette keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Active Marvel AI Persona — defaults to user's saved preference
  const [currentPersona, setCurrentPersona] = useState(() => {
    return user?.preferred_persona
      || localStorage.getItem('jarvis-marvel-persona')
      || 'jarvis';
  });

  // Apply user's preferred theme on mount
  useEffect(() => {
    const preferredTheme = user?.preferred_theme || localStorage.getItem('jarvis-armor-theme') || 'mark-iv';
    if (preferredTheme && preferredTheme !== 'mark-iv') {
      document.documentElement.setAttribute('data-theme', preferredTheme);
    }
  }, [user]);

  // Update persona when user changes
  useEffect(() => {
    if (user?.preferred_persona) {
      setCurrentPersona(user.preferred_persona);
    }
  }, [user]);

  // Handle loading a session from ProfilePage navigation state
  useEffect(() => {
    if (location.state?.loadSessionId) {
      setSessionId(location.state.loadSessionId);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const handleSelectPersona = useCallback((personaId) => {
    setCurrentPersona(personaId);
    localStorage.setItem('jarvis-marvel-persona', personaId);
    playPersonaChangeSound(soundEnabled);
  }, [soundEnabled]);

  const handleNewChat = useCallback(() => {
    setSessionId(generateSessionId());
  }, []);

  // Update root attribute when persona changes
  useEffect(() => {
    document.documentElement.setAttribute('data-persona', currentPersona);
  }, [currentPersona]);

  const handleRunQuickCommand = useCallback((cmd) => {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    if (chatInput && sendBtn) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      nativeSetter?.call(chatInput, cmd);
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      setTimeout(() => sendBtn.click(), 50);
    }
  }, []);

  return (
    <>
      {/* Animated HUD background with Liquid Glass Refraction Orbs */}
      <div className="hud-bg" aria-hidden="true">
        <div className="liquid-orb orb-1" />
        <div className="liquid-orb orb-2" />
        <div className="liquid-orb orb-3" />
      </div>
      <div className="vignette" />

      {/* Boot sequence overlay */}
      {!booted && (
        <BootSequence
          onComplete={() => {
            setBooted(true);
            sessionStorage.setItem('jarvis-hud-booted', 'true');
          }}
        />
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
            user={user}
            isAuthenticated={isAuthenticated}
            onNavigateProfile={() => navigate('/profile')}
            onNavigateHome={() => navigate('/')}
            onNavigateLogin={() => navigate('/login')}
            onSelectSession={(newSessId) => setSessionId(newSessId)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          />

          <ChatInterface
            sessionId={sessionId}
            currentPersona={currentPersona}
            onStreamingChange={setStreaming}
            onToolChange={setToolInUse}
            soundEnabled={soundEnabled}
            user={user}
            token={token}
          />

          {/* Tactical Command Palette (Ctrl+K / Cmd+K) */}
          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            currentPersona={currentPersona}
            onSelectPersona={handleSelectPersona}
            onNewChat={handleNewChat}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(prev => !prev)}
            onToggleTelemetry={() => setMobileTelemetryOpen(prev => !prev)}
            onNavigateHome={() => navigate('/')}
            onNavigateProfile={() => navigate('/profile')}
            onRunQuickCommand={handleRunQuickCommand}
          />

          {/* Mobile HUD Drawer / Bottom Sheet */}
          <MobileTelemetryModal
            isOpen={mobileTelemetryOpen}
            onClose={() => setMobileTelemetryOpen(false)}
            streaming={streaming}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(prev => !prev)}
            currentPersona={currentPersona}
            onSelectPersona={handleSelectPersona}
            quickCommands={QUICK_COMMANDS}
            onRunQuickCommand={handleRunQuickCommand}
            onNavigateProfile={() => navigate('/profile')}
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}
    </>
  );
}
