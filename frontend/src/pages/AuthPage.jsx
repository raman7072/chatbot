/**
 * AuthPage.jsx — Login & Signup page for JARVIS Singh Enterprises
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bootLine, setBootLine] = useState(0);
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const BOOT_LINES = [
    '> Initializing Singh Enterprises Auth Protocol...',
    '> Connecting to Division 08 Secure Network...',
    '> Validating Commander Credentials...',
    '> JARVIS Authentication Module Online.',
  ];

  useEffect(() => {
    if (isAuthenticated) navigate('/app');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBootLine(prev => prev < BOOT_LINES.length - 1 ? prev + 1 : prev);
    }, 500);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!isLogin && form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(form.username, form.password);
      } else {
        await signup(form.username, form.email, form.password, form.fullName);
      }
      sessionStorage.removeItem('jarvis-guest-mode');
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login('demo', 'password123');
      sessionStorage.removeItem('jarvis-guest-mode');
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1: return { score: 25, label: 'Weak', color: '#ff2244' };
      case 2: return { score: 50, label: 'Moderate', color: '#ffd700' };
      case 3: return { score: 75, label: 'Strong', color: '#00f0ff' };
      case 4: return { score: 100, label: 'Tactical (Commander Grade)', color: '#00ff9d' };
      default: return { score: 0, label: '', color: 'transparent' };
    }
  };

  const pwStrength = getPasswordStrength(form.password);

  const toggleMode = () => {
    setIsLogin(v => !v);
    setError('');
    setForm({ username: '', email: '', password: '', fullName: '', confirm: '' });
  };

  return (
    <div className="auth-root">
      <div className="auth-bg" aria-hidden="true">
        <div className="liquid-orb orb-1" />
        <div className="liquid-orb orb-2" />
        <div className="liquid-orb orb-3" />
      </div>
      <div className="auth-vignette" />

      {/* Back to Home */}
      <Link to="/" className="auth-back-link">
        ← SINGH ENTERPRISES HOME
      </Link>

      <div className="auth-container">
        {/* Left Panel — Branding */}
        <div className="auth-brand-panel">
          <div className="auth-brand-arc">
            <div className="auth-arc-ring r1" />
            <div className="auth-arc-ring r2" />
            <div className="auth-arc-ring r3" />
            <div className="auth-arc-core">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="#00f0ff">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>

          <div className="auth-brand-text">
            <div className="auth-brand-jarvis">JARVIS</div>
            <div className="auth-brand-company">SINGH ENTERPRISES</div>
            <div className="auth-brand-division">DIVISION 08 · TACTICAL AI SYSTEM</div>
          </div>

          <div className="auth-boot-log">
            {BOOT_LINES.slice(0, bootLine + 1).map((line, i) => (
              <div key={i} className="auth-boot-line">
                <span className="auth-boot-ok">{i < BOOT_LINES.length - 1 ? '[OK]' : '[READY]'}</span>
                {line}
              </div>
            ))}
          </div>

          <div className="auth-brand-quote">
            "Good day. How may I assist you, Commander?"
            <span className="auth-brand-attr">— J.A.R.V.I.S.</span>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="auth-form-panel">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <div className="auth-form-icon">
                {isLogin ? '🔐' : '🛡️'}
              </div>
              <h1 className="auth-form-title">
                {isLogin ? 'Commander Login' : 'Create Account'}
              </h1>
              <p className="auth-form-subtitle">
                {isLogin
                  ? 'Access your tactical command interface'
                  : 'Join Singh Enterprises Division 08'}
              </p>
            </div>

            {error && (
              <div className="auth-error-alert">
                <span>⚠️</span> {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {!isLogin && (
                <div className="auth-field">
                  <label className="auth-label">FULL NAME</label>
                  <input
                    className="auth-input"
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Commander's full name"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">
                  {isLogin ? 'USERNAME OR EMAIL' : 'USERNAME'}
                </label>
                <input
                  className="auth-input"
                  type={isLogin ? 'text' : 'text'}
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder={isLogin ? 'Username or email' : 'Choose a username'}
                  autoComplete={isLogin ? 'username' : 'username'}
                  required
                />
              </div>

              {!isLogin && (
                <div className="auth-field">
                  <label className="auth-label">EMAIL</label>
                  <input
                    className="auth-input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="commander@singh-enterprises.com"
                    autoComplete="email"
                    required
                  />
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">PASSWORD</label>
                <div className="auth-password-wrapper">
                  <input
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={isLogin ? 'Enter password' : 'Minimum 6 characters'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                  />
                  <button
                    type="button"
                    className="auth-show-pass"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                {!isLogin && form.password && (
                  <div className="auth-strength-container">
                    <div className="auth-strength-track">
                      <div
                        className="auth-strength-bar"
                        style={{ width: `${pwStrength.score}%`, background: pwStrength.color }}
                      />
                    </div>
                    <span className="auth-strength-label" style={{ color: pwStrength.color }}>
                      {pwStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="auth-field">
                  <label className="auth-label">CONFIRM PASSWORD</label>
                  <div className="auth-password-wrapper">
                    <input
                      className="auth-input"
                      type={showPassword ? 'text' : 'password'}
                      name="confirm"
                      value={form.confirm}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <span>{isLogin ? '⚡' : '🛡️'}</span>
                    {isLogin ? 'ACCESS TACTICAL HUD' : 'INITIALIZE COMMANDER PROFILE'}
                  </>
                )}
              </button>
            </form>

            <div className="auth-toggle">
              {isLogin ? "New to Singh Enterprises?" : 'Already a Commander?'}
              <button className="auth-toggle-link" onClick={toggleMode}>
                {isLogin ? 'Create Account' : 'Log In'}
              </button>
            </div>

            <div className="auth-divider">
              <span>or quick access</span>
            </div>

            <div className="auth-alt-actions">
              <button
                type="button"
                className="auth-demo-btn"
                onClick={handleDemoLogin}
                disabled={loading}
                title="Log in immediately as Commander Tony Stark with pre-loaded demo account"
              >
                <span>⚡</span>
                <span>ONE-CLICK DEMO ACCESS (Tony Stark)</span>
              </button>

              <button
                type="button"
                className="auth-guest-btn"
                onClick={() => {
                  sessionStorage.setItem('jarvis-guest-mode', 'true');
                  navigate('/app');
                }}
              >
                CONTINUE AS GUEST (No History)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
