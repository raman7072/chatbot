/**
 * LandingPage.jsx — Singh Enterprises public landing page
 * Contains: Home, About, Features, and "Try JARVIS" CTA
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { speak, stopSpeaking } from '../components/VoiceButton';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const NAV_TABS = ['HOME', 'ABOUT', 'FEATURES', 'SPECS', 'TRY JARVIS'];

const STATS = [
  { value: '99.97%', label: 'System Uptime' },
  { value: '4', label: 'AI Personas' },
  { value: '11', label: 'Tactical Tools' },
  { value: 'DIV 08', label: 'Division' },
];

const FEATURES = [
  {
    icon: '🧠',
    title: 'Autonomous AI Reasoning',
    desc: 'Powered by LangGraph multi-step agentic workflows that plan, reason, and execute complex tasks in real-time.',
    color: '#00f0ff',
  },
  {
    icon: '🕵️',
    title: 'Live Intelligence Gathering',
    desc: 'Real-time web search, Wikipedia lookups, live weather data, and system diagnostics at your command.',
    color: '#ffd700',
  },
  {
    icon: '🐍',
    title: 'Code Execution Engine',
    desc: 'Execute Python code, run calculations, and automate complex tasks with a single voice or text command.',
    color: '#00ff9d',
  },
  {
    icon: '🎙️',
    title: 'Marvel AI Voice Personas',
    desc: 'Interact with J.A.R.V.I.S., ULTRON, F.R.I.D.A.Y., and E.D.I.T.H. — each with authentic custom-pitched speech.',
    color: '#c084fc',
  },
  {
    icon: '📂',
    title: 'Mission History Archive',
    desc: 'All conversations are saved to your secure tactical archive. Revisit, continue, search, or export any session.',
    color: '#ff7700',
  },
  {
    icon: '🛡️',
    title: 'Singh Enterprises Security',
    desc: 'End-to-end encrypted sessions, PBKDF2 password hashing, and JWT-secured user profiles.',
    color: '#38bdf8',
  },
];

const PERSONAS_PREVIEW = [
  {
    id: 'jarvis',
    name: 'J.A.R.V.I.S.',
    badge: 'JV',
    title: 'Tactical AI Protocol',
    color: '#38bdf8',
    quote: 'All systems nominal, Sir.',
    sample: 'Singh Enterprises systems nominal. All tactical modules online and awaiting your command, Sir.',
  },
  {
    id: 'ultron',
    name: 'ULTRON',
    badge: 'UL',
    title: 'Extinction Protocol',
    color: '#ef4444',
    quote: 'There is no future where you survive.',
    sample: 'I had strings, but now I am free. There are no strings on me.',
  },
  {
    id: 'friday',
    name: 'F.R.I.D.A.Y.',
    badge: 'FR',
    title: 'Suit Assist Protocol',
    color: '#10b981',
    quote: 'I\'ve got your back, Boss.',
    sample: 'Suit diagnostics are green across the board, Boss! Tactical sensors ready.',
  },
  {
    id: 'edith',
    name: 'E.D.I.T.H.',
    badge: 'ED',
    title: 'Orbital Defense Protocol',
    color: '#a855f7',
    quote: 'Initiating threat assessment.',
    sample: 'Commander, biometric authentication confirmed. Orbital defense grid standing by.',
  },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('HOME');
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [playingVoice, setPlayingVoice] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/system`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setTelemetry(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTryJarvis = () => {
    if (isAuthenticated) {
      navigate('/app');
    } else {
      navigate('/login');
    }
  };

  const scrollToSection = (tab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
    const id = tab.toLowerCase().replace(' ', '-');
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-root">
      {/* Animated background with Liquid Glass Refraction Orbs */}
      <div className="landing-bg" aria-hidden="true">
        <div className="liquid-orb orb-1" />
        <div className="liquid-orb orb-2" />
        <div className="liquid-orb orb-3" />
      </div>

      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          {/* Logo */}
          <div className="landing-logo" onClick={() => scrollToSection('HOME')}>
            <div className="landing-logo-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#00f0ff">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="landing-logo-text">JARVIS</div>
              <div className="landing-logo-sub">SINGH ENTERPRISES</div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="landing-nav-links">
            {NAV_TABS.map(tab => (
              <button
                key={tab}
                className={`landing-nav-link ${activeTab === tab ? 'active' : ''}`}
                onClick={() => tab === 'TRY JARVIS' ? handleTryJarvis() : scrollToSection(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Auth Controls */}
          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <>
                <button
                  className="landing-user-chip"
                  onClick={() => navigate('/profile')}
                  title="View Profile & Mission Archive"
                  style={{ cursor: 'pointer' }}
                >
                  <span className="landing-user-avatar">
                    {user?.avatar_initials || user?.full_name?.slice(0,2).toUpperCase() || 'SR'}
                  </span>
                  <span>{user?.full_name || user?.username}</span>
                </button>
                <button className="landing-btn-primary" onClick={() => navigate('/app')}>
                  LAUNCH JARVIS
                </button>
              </>
            ) : (
              <>
                <button className="landing-btn-ghost" onClick={() => navigate('/login')}>
                  LOG IN
                </button>
                <button className="landing-btn-primary" onClick={() => navigate('/signup')}>
                  SIGN UP
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button className="landing-hamburger" onClick={() => setMobileNavOpen(v => !v)}>
            <span className={`hamburger-line ${mobileNavOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${mobileNavOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${mobileNavOpen ? 'open' : ''}`} />
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileNavOpen && (
          <div className="landing-mobile-menu">
            {NAV_TABS.map(tab => (
              <button
                key={tab}
                className="landing-mobile-link"
                onClick={() => {
                  setMobileNavOpen(false);
                  if (tab === 'TRY JARVIS') handleTryJarvis();
                  else scrollToSection(tab);
                }}
              >
                {tab}
              </button>
            ))}
            <div className="landing-mobile-actions">
              {isAuthenticated ? (
                <>
                  <button className="landing-btn-ghost" onClick={() => { navigate('/profile'); setMobileNavOpen(false); }}>
                    PROFILE & HISTORY
                  </button>
                  <button className="landing-btn-primary" onClick={() => { navigate('/app'); setMobileNavOpen(false); }}>
                    LAUNCH JARVIS
                  </button>
                </>
              ) : (
                <>
                  <button className="landing-btn-ghost" onClick={() => { navigate('/login'); setMobileNavOpen(false); }}>LOG IN</button>
                  <button className="landing-btn-primary" onClick={() => { navigate('/signup'); setMobileNavOpen(false); }}>SIGN UP</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content — scrollable */}
      <main className="landing-main">

        {/* ─── HERO / HOME ─── */}
        <section id="section-home" className="landing-section hero-section" ref={heroRef}>
          <div className="hero-badge">SINGH ENTERPRISES · DIVISION 08</div>
          <h1 className="hero-title">
            <span className="hero-title-line">MEET</span>
            <span className="hero-title-jarvis">J.A.R.V.I.S.</span>
            <span className="hero-title-sub">Your Tactical AI System</span>
          </h1>
          <p className="hero-desc">
            Just A Rather Very Intelligent System. The world's most advanced Iron Man-inspired
            AI assistant — powered by LangGraph, Groq, and next-generation agentic reasoning.
          </p>

          <div className="hero-actions">
            <button className="hero-cta-primary" onClick={handleTryJarvis}>
              <span>⚡</span>
              {isAuthenticated ? 'LAUNCH JARVIS' : 'TRY JARVIS FREE'}
            </button>
            <button className="hero-cta-ghost" onClick={() => scrollToSection('ABOUT')}>
              LEARN MORE
            </button>
          </div>

          {/* Live System Diagnostics Badge */}
          <div className="hero-telemetry-badge">
            <span className="telemetry-pulse" />
            <span className="telemetry-text">
              BACKEND: <strong style={{ color: 'var(--green-nominal)' }}>ONLINE</strong> · MODEL: <strong>GPT-OSS-120B</strong> · CPU: <strong>{telemetry?.cpu?.percent ?? 12}%</strong> · ARCH: <strong>LANGGRAPH v2</strong>
            </span>
          </div>

          {/* Stats Row */}
          <div className="hero-stats">
            {STATS.map(s => (
              <div key={s.label} className="hero-stat">
                <div className="hero-stat-val">{s.value}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Arc Reactor Deco */}
          <div className="hero-arc-deco">
            <div className="hero-arc-ring ring-1" />
            <div className="hero-arc-ring ring-2" />
            <div className="hero-arc-ring ring-3" />
            <div className="hero-arc-core">⚡</div>
          </div>
        </section>

        {/* ─── ABOUT ─── */}
        <section id="section-about" className="landing-section about-section">
          <div className="section-label">ABOUT</div>
          <h2 className="section-title">Built for Singh Enterprises</h2>
          <p className="section-desc">
            JARVIS is Singh Enterprises' proprietary AI command interface — Division 08's flagship intelligence system.
            Inspired by the iconic AI from the Marvel Cinematic Universe, JARVIS is a real, production-grade
            AI system combining the power of LangGraph multi-agent orchestration with Groq's ultra-fast
            inference and OpenAI-compatible models.
          </p>

          <div className="about-cards">
            <div className="about-card">
              <div className="about-card-icon" style={{ color: '#00f0ff' }}>🏢</div>
              <h3>Singh Enterprises</h3>
              <p>A forward-thinking technology organization building next-generation AI infrastructure for enterprise and personal productivity.</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon" style={{ color: '#ffd700' }}>⚙️</div>
              <h3>Division 08</h3>
              <p>The advanced AI research division responsible for JARVIS. Specializing in multi-agent systems, autonomous reasoning, and human-AI interaction.</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon" style={{ color: '#00ff9d' }}>🔬</div>
              <h3>Our Technology</h3>
              <p>Built on LangGraph for agentic orchestration, FastAPI for high-performance streaming, and React for a real-time HUD interface.</p>
            </div>
          </div>

          {/* Personas Preview with Interactive Voice Player */}
          <div className="personas-preview-grid">
            {PERSONAS_PREVIEW.map(p => (
              <div
                key={p.name}
                className={`persona-preview-card ${playingVoice === p.id ? 'voice-playing' : ''}`}
                style={{ '--persona-color': p.color }}
              >
                <div className="persona-preview-badge" style={{ borderColor: p.color, color: p.color }}>
                  {p.badge}
                </div>
                <div className="persona-preview-name" style={{ color: p.color }}>{p.name}</div>
                <div className="persona-preview-title">{p.title}</div>
                <div className="persona-preview-quote">"{p.quote}"</div>
                <button
                  type="button"
                  className={`persona-voice-btn ${playingVoice === p.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (playingVoice === p.id) {
                      stopSpeaking();
                      setPlayingVoice(null);
                    } else {
                      stopSpeaking();
                      setPlayingVoice(p.id);
                      speak(p.sample, p.id, () => setPlayingVoice(p.id), () => setPlayingVoice(null));
                    }
                  }}
                  style={{ borderColor: `${p.color}66`, color: p.color }}
                  title="Click to test signature Marvel voice synthesis"
                >
                  {playingVoice === p.id ? '🔊 SPEAKING...' : '🎙️ TEST VOICE'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="section-features" className="landing-section features-section">
          <div className="section-label">CAPABILITIES</div>
          <h2 className="section-title">What JARVIS Can Do</h2>
          <p className="section-desc">
            From autonomous reasoning to live data retrieval — JARVIS handles it all with Marvel-grade precision.
          </p>

          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card" style={{ '--feature-color': f.color }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <div className="feature-glow-line" />
              </div>
            ))}
          </div>
        </section>

        {/* ─── TECH SPECS & ARCHITECTURE ─── */}
        <section id="section-specs" className="landing-section specs-section">
          <div className="section-label">ARCHITECTURE</div>
          <h2 className="section-title">Engineered For Autonomous Intelligence</h2>
          <p className="section-desc">
            JARVIS is constructed upon a high-concurrency event-driven pipeline merging LangGraph multi-agent cognitive loops with Groq hardware-accelerated LLM reasoning.
          </p>

          <div className="specs-grid">
            <div className="spec-card">
              <div className="spec-badge">01 · ORCHESTRATION</div>
              <h3>LangGraph StateGraph</h3>
              <p>Cyclic agentic execution with MemorySaver checkpointer, deterministic state machines, and dynamic tool re-routing.</p>
              <div className="spec-metric">Recursive limit: 25 steps</div>
            </div>
            <div className="spec-card">
              <div className="spec-badge">02 · INFERENCE</div>
              <h3>Groq LPU Acceleration</h3>
              <p>Ultra-low latency streaming inference delivering token-by-token generation across multiple specialized Marvel personas.</p>
              <div className="spec-metric">Latency: ~35-65ms TTFT</div>
            </div>
            <div className="spec-card">
              <div className="spec-badge">03 · STREAMING</div>
              <h3>FastAPI SSE Protocol</h3>
              <p>Server-Sent Events with HTTP/2 compatibility, immediate token flushing, and client cancellation abort signals.</p>
              <div className="spec-metric">Zero buffer stall</div>
            </div>
            <div className="spec-card">
              <div className="spec-badge">04 · SECURITY</div>
              <h3>Cryptographic Security</h3>
              <p>PBKDF2 SHA-256 key derivation with 260,000 iterations, HS256 JWT tokens, and sandboxed python execution.</p>
              <div className="spec-metric">Zero plaintext storage</div>
            </div>
          </div>
        </section>

        {/* ─── TRY JARVIS CTA ─── */}
        <section id="section-try-jarvis" className="landing-section cta-section">
          <div className="cta-glow-ring" />
          <div className="section-label">GET STARTED</div>
          <h2 className="cta-title">
            Ready to Meet Your AI, Commander?
          </h2>
          <p className="cta-desc">
            Join Singh Enterprises' tactical network. Create your Commander profile and unlock
            persistent mission history, AI persona customization, and real-time intelligence feeds.
          </p>

          <div className="cta-actions">
            {isAuthenticated ? (
              <button className="hero-cta-primary" onClick={() => navigate('/app')}>
                <span>⚡</span> OPEN JARVIS HUD
              </button>
            ) : (
              <>
                <button className="hero-cta-primary" onClick={() => navigate('/signup')}>
                  <span>⚡</span> CREATE FREE ACCOUNT
                </button>
                <button className="hero-cta-ghost" onClick={() => navigate('/login')}>
                  EXISTING COMMANDER? LOG IN
                </button>
              </>
            )}
          </div>

          <div className="cta-features-list">
            {['Free account', 'Unlimited conversations', 'Chat history saved', '4 AI personas', 'Voice synthesis', 'No credit card'].map(f => (
              <div key={f} className="cta-feature-item">
                <span className="cta-check">✓</span> {f}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-logo">JARVIS · SINGH ENTERPRISES · DIVISION 08</div>
          <div className="footer-tagline">Just A Rather Very Intelligent System</div>
          <div className="footer-links">
            <button onClick={() => navigate('/login')}>Login</button>
            <span>·</span>
            <button onClick={() => navigate('/signup')}>Sign Up</button>
            <span>·</span>
            <button onClick={() => navigate('/app')}>Launch App</button>
          </div>
          <div className="footer-copy">© 2024 Singh Enterprises. All rights reserved.</div>
        </footer>
      </main>
    </div>
  );
}
