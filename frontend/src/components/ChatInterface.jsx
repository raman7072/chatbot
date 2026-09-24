import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import VoiceButton, { speak, stopSpeaking } from './VoiceButton';
import SystemMonitor from './SystemMonitor';
import ArcReactor from './ArcReactor';
import { PERSONAS } from '../utils/marvelVoice';
import { playSendSound, playReceiveSound, playToolSound, playClickSound } from '../utils/soundEffects';

export const QUICK_COMMANDS = [
  { icon: '🔢', label: 'Calculate', cmd: 'Calculate: 2^10 + 15% of 200 - sqrt(144)' },
  { icon: '🌐', label: 'Web search', cmd: 'Search the web for the latest advancements in AI and robotics' },
  { icon: '📖', label: 'Wikipedia', cmd: 'Look up Singh Enterprises and latest AI innovations on Wikipedia' },
  { icon: '💻', label: 'Diagnostics', cmd: 'Run a full system diagnostic and report status' },
  { icon: '🌤️', label: 'Weather', cmd: 'What is the current weather and forecast for Tokyo?' },
  { icon: '🐍', label: 'Run Python', cmd: 'Write and execute Python code to calculate the first 10 prime numbers' },
  { icon: '📝', label: 'Save note', cmd: 'Save a note titled "Arc Reactor Status" with content: Singh Enterprises Division 08 - Output at 100% capacity' },
  { icon: '🗂️', label: 'List files', cmd: 'List all files in the current workspace directory' },
];

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function ChatInterface({
  sessionId,
  currentPersona = 'jarvis',
  onSelectPersona,
  onStreamingChange,
  onToolChange,
  soundEnabled = true,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [toolInUse, setToolInUse] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  const persona = PERSONAS[currentPersona] || PERSONAS.jarvis;

  // Synchronize streaming and tool state changes to parent StatusBar
  const updateStreaming = useCallback((isStream) => {
    setStreaming(isStream);
    onStreamingChange?.(isStream);
  }, [onStreamingChange]);

  const updateToolInUse = useCallback((tool) => {
    setToolInUse(tool);
    onToolChange?.(tool);
  }, [onToolChange]);

  // Initial greeting on session load or persona change
  useEffect(() => {
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      content: persona.greeting,
      timestamp: new Date(),
      personaId: persona.id,
    }]);
  }, [sessionId, currentPersona]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || streaming) return;

    // Stop any ongoing speech
    stopSpeaking();
    setIsSpeaking(false);

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add user message
    const userMsgObj = {
      id: Date.now(),
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsgObj]);

    // Start streaming assistant message
    const assistantMsgId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
      personaId: currentPersona,
      toolsExecuted: [],
    }]);

    updateStreaming(true);
    updateToolInUse(null);

    // Play send chirp
    playSendSound(soundEnabled);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          session_id: sessionId,
          persona: currentPersona,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${res.status} ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';
      let receivedFirstToken = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const chunk = JSON.parse(data);

            if (chunk.type === 'token') {
              if (!receivedFirstToken) {
                receivedFirstToken = true;
                playReceiveSound(soundEnabled);
              }
              fullContent += chunk.content;
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: fullContent, streaming: true }
                  : m
              ));
            } else if (chunk.type === 'tool_start') {
              playToolSound(soundEnabled);
              updateToolInUse(chunk.tool);
              setMessages(prev => prev.map(m => {
                if (m.id !== assistantMsgId) return m;
                const existingTools = m.toolsExecuted || [];
                return {
                  ...m,
                  toolInUse: chunk.tool,
                  toolMsg: chunk.content,
                  toolsExecuted: [
                    ...existingTools,
                    {
                      tool: chunk.tool,
                      input: chunk.input || chunk.content,
                      output: null,
                      status: 'running',
                    },
                  ],
                };
              }));
            } else if (chunk.type === 'tool_end') {
              updateToolInUse(null);
              setMessages(prev => prev.map(m => {
                if (m.id !== assistantMsgId) return m;
                const tools = [...(m.toolsExecuted || [])];
                const lastIdx = tools.map(t => t.tool).lastIndexOf(chunk.tool);
                if (lastIdx !== -1) {
                  tools[lastIdx] = {
                    ...tools[lastIdx],
                    output: chunk.content,
                    status: 'done',
                  };
                }
                return {
                  ...m,
                  toolInUse: null,
                  toolsExecuted: tools,
                };
              }));
            } else if (chunk.type === 'done') {
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, streaming: false }
                  : m
              ));
            } else if (chunk.type === 'error') {
              fullContent += `\n\n⚠️ *Error: ${chunk.content}*`;
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: fullContent, streaming: false }
                  : m
              ));
            }
          } catch {
            // Ignore JSON parse errors on partial chunks
          }
        }
      }

      // Speak the response if sound is enabled using active Marvel persona
      if (fullContent && soundEnabled) {
        speak(
          fullContent,
          currentPersona,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        const errMsg = err.message.includes('fetch')
          ? '⚠️ Cannot connect to JARVIS backend. Please ensure the server is running:\n\n```\ncd backend && uvicorn main:app --reload\n```'
          : `⚠️ Error: ${err.message}`;

        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: errMsg, streaming: false, error: true }
            : m
        ));
      }
    } finally {
      updateStreaming(false);
      updateToolInUse(null);
    }
  }, [input, streaming, sessionId, soundEnabled, currentPersona, updateStreaming, updateToolInUse]);

  const clearChat = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
    playClickSound(soundEnabled);
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      content: persona.greeting,
      timestamp: new Date(),
      personaId: persona.id,
    }]);
  }, [soundEnabled, persona]);

  const exportMissionLog = useCallback(() => {
    playClickSound(soundEnabled);
    let log = `# ⚡ ${persona.name} MISSION TRANSCRIPT\n`;
    log += `**AI Protocol**: ${persona.name} (${persona.title})\n`;
    log += `**Organization**: Singh Enterprises · Division 08\n`;
    log += `**Session ID**: ${sessionId}\n`;
    log += `**Exported At**: ${new Date().toISOString()}\n\n---\n\n`;

    messages.forEach((m) => {
      const sender = m.role === 'assistant' ? persona.name : 'USER / COMMANDER';
      const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '';
      log += `### [${time}] ${sender}\n\n`;
      if (m.toolsExecuted && m.toolsExecuted.length > 0) {
        log += `*Tactical Modules Invoked:*\n`;
        m.toolsExecuted.forEach((t) => {
          log += `- **${t.tool.toUpperCase()}**: ${t.input || ''}\n`;
          if (t.output) log += `  > ${t.output}\n`;
        });
        log += `\n`;
      }
      log += `${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([log], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${persona.id}_mission_log_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sessionId, messages, soundEnabled, persona]);

  const handleToggleSpeak = useCallback((text, targetPersonaId) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speak(
        text,
        targetPersonaId || currentPersona,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  }, [isSpeaking, currentPersona]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="main-content">
      {/* Main chat panel */}
      <div className="hud-panel chat-panel">
        <div className="panel-header">
          <div className="panel-header-left">
            <span style={{ color: persona.color }}>💬</span>
            <span style={{ letterSpacing: '1px' }}>
              COMMUNICATION MATRIX · <span style={{ color: persona.color }}>{persona.name}</span>
            </span>
          </div>
          <div className="panel-header-actions">
            <button
              className="panel-action-btn"
              onClick={exportMissionLog}
              title="Export tactical transcript to markdown"
            >
              📜 <span className="action-btn-label">EXPORT LOG</span>
            </button>
            <button
              className="panel-action-btn"
              onClick={clearChat}
              disabled={streaming}
              title="Clear communication buffer"
            >
              🗑️ <span className="action-btn-label">CLEAR</span>
            </button>
            <span className="panel-tag" style={{ color: streaming ? 'var(--gold)' : persona.color }}>
              {streaming ? '● STREAMING' : '○ STANDBY'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              currentPersona={currentPersona}
              onSpeak={handleToggleSpeak}
              isSpeaking={isSpeaking}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Tactical Shortcuts Toolbar (Single Unified Location) */}
        <div className="quick-chips-wrapper">
          <div className="quick-chips-header">
            <span className="quick-chips-title">
              <span
                className="chips-pulse-dot"
                style={{ background: persona.color, boxShadow: `0 0 6px ${persona.color}` }}
              />
              TACTICAL SHORTCUTS
            </span>
          </div>
          <div className="quick-chips-scroll">
            {QUICK_COMMANDS.map((cmd, i) => (
              <button
                key={i}
                className="quick-chip"
                onClick={() => {
                  playClickSound(soundEnabled);
                  sendMessage(cmd.cmd);
                }}
                disabled={streaming}
                title={cmd.cmd}
                style={{
                  '--chip-accent': persona.color,
                }}
              >
                <span className="quick-chip-icon">{cmd.icon}</span>
                <span className="quick-chip-label">{cmd.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="input-area">
          <div className="input-wrapper">
            <VoiceButton
              onTranscript={sendMessage}
              isSpeaking={isSpeaking}
              disabled={streaming}
            />
            <textarea
              id="chat-input"
              ref={textareaRef}
              className="chat-input"
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Direct command to ${persona.name}... (Enter to send)`}
              rows={1}
              disabled={streaming}
              autoComplete="off"
              autoCorrect="off"
            />
            <button
              id="send-btn"
              className="send-btn"
              onClick={() => {
                playClickSound(soundEnabled);
                sendMessage();
              }}
              disabled={streaming || !input.trim()}
              title="Transmit command"
              style={{
                background: input.trim() && !streaming ? persona.color : undefined,
                color: input.trim() && !streaming ? '#000000' : undefined,
                boxShadow: input.trim() && !streaming ? `0 0 14px ${persona.color}88` : undefined,
              }}
            >
              {streaming ? <SpinnerIcon /> : <SendIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Right sidebar (Desktop view: Persona Core + Arc Reactor + System Diagnostics) */}
      <div className="right-sidebar">
        {/* Active Marvel Persona Widget */}
        <div className="hud-panel persona-side-card" style={{ borderColor: `${persona.color}55` }}>
          <div className="panel-header">
            <div className="panel-header-left">
              <span style={{ color: persona.color }}>◈</span>
              <span>ACTIVE AI CORE</span>
            </div>
            <span
              className="panel-tag"
              style={{ color: persona.color, borderColor: `${persona.color}66` }}
            >
              {persona.shortName}
            </span>
          </div>
          <div className="persona-side-body">
            <div className="persona-side-top">
              <div
                className="persona-side-avatar"
                style={{
                  borderColor: persona.color,
                  color: persona.color,
                  boxShadow: `0 0 14px ${persona.glowColor}`,
                }}
              >
                {persona.avatar}
              </div>
              <div className="persona-side-meta">
                <div className="persona-side-name" style={{ color: persona.color }}>
                  {persona.name}
                </div>
                <div className="persona-side-sub">{persona.subtitle}</div>
              </div>
            </div>
            <div className="persona-side-quote">
              "{persona.samplePhrase}"
            </div>
          </div>
        </div>

        {/* Arc Reactor Visualizer (reactive to active persona) */}
        <ArcReactor
          streaming={streaming}
          soundEnabled={soundEnabled}
          personaId={currentPersona}
        />

        {/* Real-time Hardware System Monitor */}
        <SystemMonitor />
      </div>
    </div>
  );
}

function ToolTrace({ tools }) {
  const [open, setOpen] = useState(false);
  if (!tools || tools.length === 0) return null;

  return (
    <div style={{
      margin: '6px 0 10px 0',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      background: 'rgba(8, 18, 36, 0.6)',
      borderRadius: '8px',
      overflow: 'hidden',
      fontSize: '11px',
      fontFamily: 'var(--font-mono)',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '6px 12px',
          background: 'rgba(56, 189, 248, 0.07)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--cyan)',
          userSelect: 'none',
        }}
      >
        <span>
          ⚡ {tools.length} SYSTEM MODULE{tools.length > 1 ? 'S' : ''} INVOKED
        </span>
        <span style={{ fontSize: '9px', opacity: 0.8 }}>
          {open ? '▲ HIDE' : '▼ VIEW DETAILS'}
        </span>
      </div>
      {open && (
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tools.map((t, idx) => (
            <div key={idx} style={{
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '6px 8px',
              borderLeft: '2px solid var(--cyan)',
              borderRadius: '2px',
            }}>
              <div style={{ color: 'var(--gold)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <span>✦ {t.tool.toUpperCase()}</span>
                <span style={{ fontSize: '10px', color: t.status === 'running' ? 'var(--gold)' : 'var(--green-ok)' }}>
                  {t.status === 'running' ? '⏳ RUNNING' : '✓ COMPLETE'}
                </span>
              </div>
              {t.input && (
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '3px', wordBreak: 'break-word' }}>
                  <span style={{ color: 'var(--cyan)' }}>Input:</span> {t.input}
                </div>
              )}
              {t.output && (
                <div style={{ color: 'rgba(125, 211, 252, 0.8)', marginTop: '3px', wordBreak: 'break-word', maxHeight: '120px', overflowY: 'auto' }}>
                  <span style={{ color: 'var(--cyan)' }}>Output:</span> {t.output}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeText = String(children).replace(/\n$/, '');

  if (inline) {
    return (
      <code className={className} style={{
        background: 'rgba(56, 189, 248, 0.1)',
        padding: '2px 6px',
        borderRadius: '4px',
        fontFamily: 'var(--font-mono)',
        color: '#7dd3fc',
        fontSize: '12.5px',
      }} {...props}>
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'relative',
      margin: '10px 0',
      background: 'rgba(3, 7, 18, 0.85)',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 12px',
        background: 'rgba(56, 189, 248, 0.06)',
        fontSize: '9.5px',
        fontFamily: 'var(--font-mono)',
        color: 'rgba(56, 189, 248, 0.6)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.08)',
      }}>
        <span>{match ? match[1].toUpperCase() : 'CODE'}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? 'var(--green-ok)' : 'var(--cyan)',
            cursor: 'pointer',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '2px 6px',
          }}
        >
          {copied ? '✓ COPIED' : '📋 COPY'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '10px 14px', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

function MessageBubble({ msg, currentPersona, onSpeak, isSpeaking }) {
  const isAssistant = msg.role === 'assistant';
  const personaKey = msg.personaId || currentPersona;
  const persona = PERSONAS[personaKey] || PERSONAS.jarvis;

  const time = msg.timestamp?.toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit',
  });
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!msg.content) return;
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`message ${isAssistant ? 'assistant' : 'user'} persona-${personaKey}`}>
      <div
        className={`msg-avatar ${isAssistant ? 'assistant' : 'user'}`}
        style={isAssistant ? {
          borderColor: persona.color,
          color: persona.color,
          boxShadow: `0 0 8px ${persona.glowColor}`,
        } : undefined}
      >
        {isAssistant ? persona.avatar : 'SR'}
      </div>
      <div className="msg-body">
        <div className="msg-meta">
          <span style={{ color: isAssistant ? persona.color : undefined, fontWeight: 600 }}>
            {isAssistant ? persona.name : 'COMMANDER'}
          </span>
          {' '}· {time}
        </div>
        <div
          className={`msg-bubble ${isAssistant ? 'assistant' : 'user'}`}
          style={isAssistant ? {
            borderColor: `${persona.color}35`,
          } : undefined}
        >
          {/* Active tool indicator during streaming */}
          {msg.toolInUse && (
            <div className="tool-indicator" style={{ marginBottom: 8 }}>
              <div className="tool-spinner" />
              {msg.toolMsg || `Using ${msg.toolInUse}...`}
            </div>
          )}

          {/* Collapsible tool execution trace */}
          {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
            <ToolTrace tools={msg.toolsExecuted} />
          )}

          {/* Message content */}
          {msg.content ? (
            <>
              <ReactMarkdown
                components={{
                  code: CodeBlock,
                }}
              >
                {msg.content}
              </ReactMarkdown>
              {msg.streaming && !msg.toolInUse && (
                <span className="typing-cursor" style={{ background: persona.color }} />
              )}
            </>
          ) : msg.streaming ? (
            <div className="tool-indicator">
              <div className="tool-spinner" />
              <span>Synthesizing response</span>
              <span className="typing-dots">
                <span /><span /><span />
              </span>
            </div>
          ) : null}

          {/* Action toolbar for completed assistant response */}
          {isAssistant && msg.content && !msg.streaming && (
            <div className="msg-actions">
              <button
                className="msg-action-btn"
                onClick={handleCopy}
                title="Copy entire response"
              >
                {copied ? '✓ COPIED' : '📋 COPY'}
              </button>
              {onSpeak && (
                <button
                  className={`msg-action-btn ${isSpeaking ? 'active' : ''}`}
                  onClick={() => onSpeak(msg.content, personaKey)}
                  title={`Vocalize with ${persona.name}'s voice`}
                  style={isSpeaking ? { color: persona.color, borderColor: persona.color } : undefined}
                >
                  {isSpeaking ? '⏹ STOP' : `🔊 VOCALIZE (${persona.shortName})`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
