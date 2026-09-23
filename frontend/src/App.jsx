import { useState, useCallback } from 'react';
import BootSequence from './components/BootSequence';
import StatusBar from './components/StatusBar';
import ChatInterface from './components/ChatInterface';
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

  const handleNewChat = useCallback(() => {
    setSessionId(generateSessionId());
  }, []);

  return (
    <>
      {/* Animated HUD background */}
      <div className="hud-bg" />
      <div className="vignette" />

      {/* Boot sequence overlay */}
      {!booted && (
        <BootSequence onComplete={() => setBooted(true)} />
      )}

      {/* Main app */}
      {booted && (
        <div className="app-layout">
          <StatusBar
            streaming={streaming}
            toolInUse={toolInUse}
            sessionId={sessionId}
            onNewChat={handleNewChat}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(prev => !prev)}
          />
          <ChatInterface
            sessionId={sessionId}
            onStreamingChange={setStreaming}
            onToolChange={setToolInUse}
            soundEnabled={soundEnabled}
          />
        </div>
      )}
    </>
  );
}
