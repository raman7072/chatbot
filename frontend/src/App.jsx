import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import JarvisApp from './JarvisApp';
import './index.css';
import './pages.css';

// ── Routing with Auth ─────────────────────────────────────────────

function RequireAuthOrGuest({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const guestAllowed = typeof window !== 'undefined' && sessionStorage.getItem('jarvis-guest-mode') === 'true';

  if (loading) {
    return (
      <div className="auth-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (!isAuthenticated && !guestAllowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Pages */}
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />

      {/* Main JARVIS App (Requires login/signup first, or guest mode choice) */}
      <Route
        path="/app"
        element={
          <RequireAuthOrGuest>
            <JarvisApp />
          </RequireAuthOrGuest>
        }
      />

      {/* Commander Profile & History Archive */}
      <Route path="/profile" element={<ProfilePage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── Root App with Providers ───────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
