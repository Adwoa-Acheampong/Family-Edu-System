import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider, useUI } from './context/UIContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/DashboardRouter';
import { LearningHub, MyProfile } from './components/Views';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SystemConfigPage } from './pages/SystemConfigPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { exchangeGoogleCode, isEngineRoomConfigured } from './lib/api';
import { appConfig } from './config/env';

function ProtectedShell() {
  const { user, isAuthenticated } = useAuth();
  const { notice, clearNotice } = useUI();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      {notice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] max-w-xl w-[calc(100%-2rem)] rounded-2xl border border-[var(--theme-color)]/30 bg-black/95 px-5 py-4 text-sm text-white shadow-2xl flex items-center justify-between gap-4">
          <span>{notice}</span>
          <button type="button" onClick={clearNotice} className="text-xs font-bold uppercase tracking-wider text-[var(--theme-color)]">
            Close
          </button>
        </div>
      )}
      <Layout user={user}>
        <Outlet />
      </Layout>
    </>
  );
}

function LoginRoute() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  if (isAuthenticated) return <Navigate to={from} replace />;

  return (
    <Login
      onLogin={(user) => {
        login(user);
        navigate('/dashboard', { replace: true });
      }}
    />
  );
}

function OAuthBootstrap() {
  const { setNotice } = useUI();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (!isEngineRoomConfigured) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    const oauthError = params.get('error');
    if (!code && !oauthError) return;

    window.history.replaceState({}, document.title, window.location.pathname);

    if (oauthError) {
      setNotice(`Google connection was not completed: ${oauthError}`);
      return;
    }

    const expectedState = localStorage.getItem(appConfig.oauthStateKey);
    localStorage.removeItem(appConfig.oauthStateKey);
    if (!returnedState || !expectedState || returnedState !== expectedState) {
      setNotice('Google connection was rejected because its security state did not match.');
      return;
    }

    exchangeGoogleCode(code!)
      .then(() => {
        setNotice('Google Classroom connected. Open Learning Hub to sync.');
        navigate('/learning-hub');
      })
      .catch((err) => {
        setNotice(err instanceof Error ? err.message : 'Google connection failed.');
      });
  }, [navigate, setNotice]);

  return null;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-4xl font-black text-white mb-2">404</h1>
      <p className="text-gray-500 mb-6">This route does not exist.</p>
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="text-[var(--theme-color)] font-bold text-sm uppercase tracking-wider"
      >
        Go to dashboard
      </button>
    </div>
  );
}

function DashboardGate() {
  const { user } = useAuth();
  return <Dashboard user={user!} />;
}
function LearningHubGate() {
  const { user } = useAuth();
  return <LearningHub user={user!} />;
}
function ProfileGate() {
  const { user } = useAuth();
  return <MyProfile user={user!} />;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIProvider>
          <BrowserRouter>
            <OAuthBootstrap />
            <Routes>
              <Route path="/login" element={<LoginRoute />} />
              <Route element={<ProtectedShell />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardGate />} />
                <Route path="/learning-hub" element={<LearningHubGate />} />
                <Route path="/profile" element={<ProfileGate />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/system/config" element={<AdminOnly><SystemConfigPage /></AdminOnly>} />
                <Route path="/system/settings" element={<AdminOnly><SystemSettingsPage /></AdminOnly>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
