import React, { useEffect, useState } from 'react';
import { User } from './types';
import { USERS } from './data';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboards';
import { LearningHub, MyProfile } from './components/Views';
import { clearGoogleSession, exchangeGoogleCode, isEngineRoomConfigured } from './lib/api';

const SESSION_KEY = 'fes_user_id';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      if (!id) return null;
      return USERS.find((u) => u.id === id) || null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [oauthNotice, setOauthNotice] = useState('');

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

    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, document.title, cleanUrl);

    if (oauthError) {
      setOauthNotice(`Google connection was not completed: ${oauthError}`);
      return;
    }

    const expectedState = localStorage.getItem('fes_google_oauth_state');
    localStorage.removeItem('fes_google_oauth_state');
    if (!returnedState || !expectedState || returnedState !== expectedState) {
      setOauthNotice('Google connection was rejected because its security state did not match.');
      return;
    }

    exchangeGoogleCode(code!)
      .then(() => {
        setOauthNotice('Google Classroom connected. Open Learning Hub to sync.');
        setActiveTab('learning-hub');
      })
      .catch((err) => {
        setOauthNotice(err instanceof Error ? err.message : 'Google connection failed.');
      });
  }, []);

  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem(SESSION_KEY, currentUser.id);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearGoogleSession();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      {oauthNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] max-w-xl w-[calc(100%-2rem)] rounded-2xl border border-[var(--theme-color)]/30 bg-black/95 px-5 py-4 text-sm text-white shadow-2xl flex items-center justify-between gap-4">
          <span>{oauthNotice}</span>
          <button
            type="button"
            onClick={() => setOauthNotice('')}
            className="text-xs font-bold uppercase tracking-wider text-[var(--theme-color)]"
          >
            Close
          </button>
        </div>
      )}
      <Layout
        user={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'dashboard' && <Dashboard user={currentUser} />}
        {activeTab === 'learning-hub' && <LearningHub user={currentUser} />}
        {activeTab === 'profile' && <MyProfile user={currentUser} />}
      </Layout>
    </>
  );
}
