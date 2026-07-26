import React, { useState } from 'react';
import { User } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboards';
import { LearningHub, MyProfile } from './components/Views';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <Layout 
      user={currentUser} 
      onLogout={() => setCurrentUser(null)}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'dashboard' && <Dashboard user={currentUser} />}
      {activeTab === 'learning-hub' && <LearningHub user={currentUser} />}
      {activeTab === 'profile' && <MyProfile user={currentUser} />}
    </Layout>
  );
}
