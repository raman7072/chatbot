/**
 * ProfilePage.jsx — User Profile & Mission History for JARVIS
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PERSONAS_META = {
  jarvis:  { name: 'J.A.R.V.I.S.', color: '#38bdf8', badge: 'JV' },
  ultron:  { name: 'ULTRON',        color: '#ef4444', badge: 'UL' },
  friday:  { name: 'F.R.I.D.A.Y.', color: '#10b981', badge: 'FR' },
  edith:   { name: 'E.D.I.T.H.',   color: '#a855f7', badge: 'ED' },
};

const THEMES = [
  { id: 'mark-iv',       name: 'MARK IV',    color: '#00d4ff' },
  { id: 'mark-vii',      name: 'MARK VII',   color: '#ffb800' },
  { id: 'stealth',       name: 'STEALTH',    color: '#00ffaa' },
  { id: 'bleeding-edge', name: 'MARK L',     color: '#c060ff' },
  { id: 'hulkbuster',    name: 'VERONICA',   color: '#ff7700' },
];

export default function ProfilePage() {
  const { user, token, loading, isAuthenticated, login, logout, updateProfile, fetchHistory, deleteSession } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('profile');
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [personaFilter, setPersonaFilter] = useState('all');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    preferred_persona: user?.preferred_persona || 'jarvis',
    preferred_theme: user?.preferred_theme || 'mark-iv',
    avatar_initials: user?.avatar_initials || '',
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        full_name: user.full_name || '',
        preferred_persona: user.preferred_persona || 'jarvis',
        preferred_theme: user.preferred_theme || 'mark-iv',
        avatar_initials: user.avatar_initials || '',
      });
    }
  }, [user]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const data = await fetchHistory();
    setSessions(data);
    setHistoryLoading(false);
  }, [fetchHistory]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  const handleExportSession = async (session, format = 'markdown') => {
    try {
      const url = `${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')}/history/${session.session_id}/export?format=${format}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `jarvis_mission_${session.session_id}.${format === 'json' ? 'json' : 'md'}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // ignore
    }
  };

  const handleClearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear your entire tactical mission archive? This cannot be undone.')) return;
    try {
      await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')}/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions([]);
    } catch {
      // ignore
    }
  };

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = !searchTerm || s.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPersona = personaFilter === 'all' || s.persona?.toLowerCase() === personaFilter.toLowerCase();
    return matchesSearch && matchesPersona;
  });

  const totalMessagesCount = sessions.reduce((acc, s) => acc + (s.message_count || 0), 0);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await updateProfile(editForm);
      setSaveMsg('✓ Profile updated successfully');
    } catch (err) {
      setSaveMsg(`⚠️ ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Delete this session from your tactical archive?')) return;
    await deleteSession(sessionId);
    setSessions(prev => prev.filter(s => s.session_id !== sessionId));
  };

  const handleLoadSession = (session) => {
    // Pass the session_id to the app via navigation state
    navigate('/app', { state: { loadSessionId: session.session_id } });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const personaColor = PERSONAS_META[user?.preferred_persona || 'jarvis']?.color || '#38bdf8';

  if (loading) {
    return (
      <div className="profile-root profile-center-screen">
        <div className="hud-bg" aria-hidden="true">
          <div className="liquid-orb orb-1" />
          <div className="liquid-orb orb-2" />
          <div className="liquid-orb orb-3" />
        </div>
        <div className="vignette" />
        <div className="profile-auth-prompt-card">
          <div className="profile-loading-spinner" />
          <div className="profile-loading-text">DECRYPTING COMMANDER CREDENTIALS...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="profile-root profile-center-screen">
        <div className="hud-bg" aria-hidden="true">
          <div className="liquid-orb orb-1" />
          <div className="liquid-orb orb-2" />
          <div className="liquid-orb orb-3" />
        </div>
        <div className="vignette" />
        <div className="profile-topbar">
          <button className="profile-back-btn" onClick={() => navigate('/app')}>
            ← BACK TO JARVIS
          </button>
          <div className="profile-topbar-title">COMMANDER CLEARANCE</div>
          <button className="profile-back-btn" onClick={() => navigate('/login')}>
            LOG IN
          </button>
        </div>
        <div className="profile-auth-prompt-card">
          <div className="profile-auth-icon">🛡️</div>
          <div className="profile-auth-title">COMMANDER CLEARANCE REQUIRED</div>
          <div className="profile-auth-desc">
            Authenticate to access Division 08 tactical settings, customize AI persona protocols, and review archived missions.
          </div>
          <div className="profile-auth-actions">
            <button
              type="button"
              className="profile-save-btn"
              onClick={async () => {
                try {
                  await login('demo', 'password123');
                } catch {
                  navigate('/login');
                }
              }}
            >
              ⚡ ONE-CLICK DEMO (TONY STARK)
            </button>
            <button
              type="button"
              className="profile-back-btn"
              onClick={() => navigate('/login')}
              style={{ justifyContent: 'center' }}
            >
              LOG IN / CREATE ACCOUNT
            </button>
            <button
              type="button"
              className="profile-ghost-btn"
              onClick={() => navigate('/app')}
            >
              ← RETURN TO JARVIS HUD
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-root">
      <div className="hud-bg" aria-hidden="true">
        <div className="liquid-orb orb-1" />
        <div className="liquid-orb orb-2" />
        <div className="liquid-orb orb-3" />
      </div>
      <div className="vignette" />

      {/* Top nav */}
      <div className="profile-topbar">
        <button className="profile-back-btn" onClick={() => navigate('/app')}>
          ← BACK TO JARVIS
        </button>
        <div className="profile-topbar-title">
          COMMANDER PROFILE
        </div>
        <button className="profile-logout-btn" onClick={handleLogout}>
          LOG OUT
        </button>
      </div>

      <div className="profile-layout">
        {/* Left sidebar */}
        <aside className="profile-sidebar">
          {/* Avatar */}
          <div className="profile-avatar-card">
            <div
              className="profile-avatar"
              style={{ borderColor: personaColor, boxShadow: `0 0 20px ${personaColor}55` }}
            >
              <span style={{ color: personaColor }}>
                {user?.avatar_initials || user?.full_name?.slice(0,2).toUpperCase() || 'SR'}
              </span>
            </div>
            <div className="profile-name">{user?.full_name}</div>
            <div className="profile-username">@{user?.username}</div>
            <div className="profile-email">{user?.email}</div>
            <div className="profile-joined">
              Joined {user?.created_at ? new Date(user.created_at * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>

          {/* Nav tabs */}
          <div className="profile-nav">
            {[
              { id: 'profile', icon: '👤', label: 'Profile Settings' },
              { id: 'history', icon: '📂', label: 'Mission History' },
            ].map(t => (
              <button
                key={t.id}
                className={`profile-nav-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
                style={tab === t.id ? { borderColor: personaColor, color: personaColor } : {}}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="profile-main">
          {/* ── Profile Settings ── */}
          {tab === 'profile' && (
            <div className="profile-panel">
              <div className="profile-panel-title">
                <span style={{ color: personaColor }}>◈</span> COMMANDER SETTINGS
              </div>

              <form className="profile-form" onSubmit={handleSaveProfile}>
                <div className="profile-form-row">
                  <div className="profile-field">
                    <label className="profile-label">FULL NAME</label>
                    <input
                      className="profile-input"
                      type="text"
                      value={editForm.full_name}
                      onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label">AVATAR INITIALS</label>
                    <input
                      className="profile-input"
                      type="text"
                      maxLength={3}
                      value={editForm.avatar_initials}
                      onChange={e => setEditForm(p => ({ ...p, avatar_initials: e.target.value.toUpperCase() }))}
                      placeholder="e.g. SR"
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label">DEFAULT AI PERSONA</label>
                  <div className="profile-persona-grid">
                    {Object.entries(PERSONAS_META).map(([id, p]) => (
                      <button
                        key={id}
                        type="button"
                        className={`profile-persona-option ${editForm.preferred_persona === id ? 'selected' : ''}`}
                        style={editForm.preferred_persona === id ? { borderColor: p.color, boxShadow: `0 0 8px ${p.color}55` } : {}}
                        onClick={() => setEditForm(prev => ({ ...prev, preferred_persona: id }))}
                      >
                        <span
                          className="profile-persona-badge"
                          style={{ color: p.color, borderColor: `${p.color}88` }}
                        >
                          {p.badge}
                        </span>
                        <span style={{ color: editForm.preferred_persona === id ? p.color : undefined }}>
                          {p.name}
                        </span>
                        {editForm.preferred_persona === id && (
                          <span className="profile-persona-active-dot" style={{ background: p.color }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label">DEFAULT ARMOR THEME</label>
                  <div className="profile-theme-grid">
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        className={`profile-theme-option ${editForm.preferred_theme === t.id ? 'selected' : ''}`}
                        style={editForm.preferred_theme === t.id ? { borderColor: t.color } : {}}
                        onClick={() => setEditForm(prev => ({ ...prev, preferred_theme: t.id }))}
                      >
                        <span className="profile-theme-swatch" style={{ background: t.color, boxShadow: `0 0 5px ${t.color}` }} />
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profile-form-actions">
                  {saveMsg && (
                    <span className={`profile-save-msg ${saveMsg.startsWith('✓') ? 'ok' : 'err'}`}>
                      {saveMsg}
                    </span>
                  )}
                  <button type="submit" className="profile-save-btn" disabled={saving}>
                    {saving ? <span className="auth-spinner" /> : '⚡ SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Mission History ── */}
          {tab === 'history' && (
            <div className="profile-panel">
              <div className="profile-panel-title">
                <div>
                  <span style={{ color: personaColor }}>📂</span> TACTICAL ARCHIVE
                  <span className="profile-panel-count">{filteredSessions.length} of {sessions.length} SESSIONS</span>
                </div>
                {sessions.length > 0 && (
                  <button
                    type="button"
                    className="history-clear-btn"
                    onClick={handleClearAllHistory}
                    title="Clear all sessions from tactical archive"
                  >
                    🗑️ CLEAR ARCHIVE
                  </button>
                )}
              </div>

              {/* Tactical Search & Filter Bar */}
              <div className="history-toolbar">
                <div className="history-search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="history-search-input"
                    placeholder="Search mission objectives or queries..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="search-clear-btn" onClick={() => setSearchTerm('')}>✕</button>
                  )}
                </div>

                <div className="history-filter-pills">
                  {['all', 'jarvis', 'ultron', 'friday', 'edith'].map(pKey => (
                    <button
                      key={pKey}
                      type="button"
                      className={`history-filter-pill ${personaFilter === pKey ? 'active' : ''}`}
                      onClick={() => setPersonaFilter(pKey)}
                    >
                      {pKey.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {historyLoading ? (
                <div className="profile-history-empty">
                  <div className="profile-loading-spinner" />
                  <span>Loading tactical archive...</span>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="profile-history-empty">
                  <div className="profile-empty-icon">📭</div>
                  <div>{searchTerm || personaFilter !== 'all' ? 'No matching missions found.' : 'No missions recorded yet.'}</div>
                  <div className="profile-empty-sub">
                    {searchTerm || personaFilter !== 'all' ? 'Try adjusting your search query or persona filter.' : 'Start a conversation with JARVIS to build your archive.'}
                  </div>
                  {(!searchTerm && personaFilter === 'all') && (
                    <button className="profile-save-btn" onClick={() => navigate('/app')}>
                      OPEN JARVIS HUD
                    </button>
                  )}
                </div>
              ) : (
                <div className="history-sessions-list">
                  {filteredSessions.map(session => {
                    const pm = PERSONAS_META[session.persona] || PERSONAS_META.jarvis;
                    const date = new Date(session.updated_at * 1000);
                    return (
                      <div key={session.session_id} className="history-session-card">
                        <div className="history-session-left">
                          <div
                            className="history-session-badge"
                            style={{ color: pm.color, borderColor: `${pm.color}66` }}
                          >
                            {pm.badge}
                          </div>
                        </div>
                        <div className="history-session-body">
                          <div className="history-session-title">{session.title}</div>
                          <div className="history-session-meta">
                            <span style={{ color: pm.color }}>{pm.name}</span>
                            <span>·</span>
                            <span>{session.message_count} messages</span>
                            <span>·</span>
                            <span>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <div className="history-session-actions">
                          <button
                            className="history-action-btn resume"
                            onClick={() => handleLoadSession(session)}
                            title="Resume this session in JARVIS HUD"
                          >
                            ▶ RESUME
                          </button>
                          <button
                            className="history-action-btn export"
                            onClick={() => handleExportSession(session, 'markdown')}
                            title="Download Markdown transcript"
                          >
                            📥 MD
                          </button>
                          <button
                            className="history-action-btn export"
                            onClick={() => handleExportSession(session, 'json')}
                            title="Download JSON telemetry"
                          >
                            📥 JSON
                          </button>
                          <button
                            className="history-action-btn delete"
                            onClick={() => handleDeleteSession(session.session_id)}
                            title="Delete session"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
