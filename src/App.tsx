import React, { useEffect, useState } from 'react';
import { User } from './types';
import { USERS } from './data';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboards';
import { LearningHub, MyProfile } from './components/Views';

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

  useEffect(() => {
    document.documentElement.classList.add('dark');
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
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
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
  );
}
