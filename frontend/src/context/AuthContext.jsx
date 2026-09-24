/**
 * AuthContext.jsx — Global auth state & helpers for JARVIS Singh Enterprises
 * Persists JWT + user profile in localStorage, exposes login/logout/signup.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jarvis-token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // On mount: verify stored token
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setUser(data.user))
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('jarvis-token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  const signup = useCallback(async (username, email, password, fullName) => {
    setAuthError('');
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, full_name: fullName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Signup failed');
    localStorage.setItem('jarvis-token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (usernameOrEmail, password) => {
    setAuthError('');
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    localStorage.setItem('jarvis-token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jarvis-token');
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Update failed');
    setUser(data.user);
    return data.user;
  }, [token]);

  const fetchHistory = useCallback(async () => {
    if (!token) return [];
    const res = await fetch(`${API_BASE}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions || [];
  }, [token]);

  const saveSession = useCallback(async (sessionId, messages, persona) => {
    if (!token) return;
    await fetch(`${API_BASE}/history/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ session_id: sessionId, messages, persona }),
    });
  }, [token]);

  const deleteSession = useCallback(async (sessionId) => {
    if (!token) return;
    await fetch(`${API_BASE}/history/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  const getSessionMessages = useCallback(async (sessionId) => {
    if (!token) return [];
    const res = await fetch(`${API_BASE}/history/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      authError,
      setAuthError,
      isAuthenticated: !!user,
      signup,
      login,
      logout,
      updateProfile,
      fetchHistory,
      saveSession,
      deleteSession,
      getSessionMessages,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
