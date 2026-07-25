import React, { useState } from 'react';
import { User } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboards';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <Layout user={currentUser} onLogout={() => setCurrentUser(null)}>
      <Dashboard user={currentUser} />
    </Layout>
  );
}
