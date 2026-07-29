import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Database, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useHealth, useSystemStatus } from '../hooks/useLiveData';
import { clearGoogleSession } from '../lib/api';
import { appConfig } from '../config/env';

export function SystemSettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { setNotice, isDarkMode, toggleDarkMode } = useUI();
  const health = useHealth();
  const status = useSystemStatus();
  const [confirmWipe, setConfirmWipe] = useState(false);

  const wipeLocal = () => {
    try {
      localStorage.clear();
      clearGoogleSession();
      setNotice('Local session data cleared.');
      setConfirmWipe(false);
      logout();
      navigate('/login', { replace: true });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Clear failed');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto animate-fade-in pb-24">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--theme-color)] mb-2">
        System Settings
      </div>
      <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-8">Workspace controls</h1>

      <section className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 mb-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <Shield size={14} className="text-[var(--theme-color)]" /> Security & session
        </div>
        <p className="text-sm text-gray-400">
          Signed in as <span className="text-white font-semibold">{user?.name}</span> ({user?.role}).
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-white/5"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={() => navigate('/system/config')}
            className="px-4 py-2 rounded-xl bg-[var(--theme-color)]/15 text-[var(--theme-color)] border border-[var(--theme-color)]/30 text-xs font-bold uppercase tracking-wider"
          >
            Open system config
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 mb-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <Bell size={14} className="text-[var(--theme-color)]" /> Appearance
        </div>
        <label className="flex items-center justify-between gap-4 text-sm text-gray-300">
          <span>Dark mode</span>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold uppercase"
          >
            {isDarkMode ? 'On' : 'Off'}
          </button>
        </label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 mb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <Database size={14} className="text-[var(--theme-color)]" /> Live connectivity
        </div>
        <Row label="Node / API health" value={health.data?.status || (health.isError ? 'error' : '…')} />
        <Row label="Engine Room URL" value={appConfig.engineRoomUrl || 'not set'} />
        <Row label="Gemini configured" value={String(status.data?.geminiConfigured ?? '…')} />
        <Row label="Google OAuth configured" value={String(status.data?.googleOAuthConfigured ?? '…')} />
        <Row label="Latency sample" value={status.data?.latencyMs != null ? `${status.data.latencyMs} ms` : '…'} />
        <button
          type="button"
          onClick={() => {
            void health.refetch();
            void status.refetch();
            setNotice('Connectivity refreshed.');
          }}
          className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--theme-color)]"
        >
          Re-check now
        </button>
      </section>

      <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
          <Trash2 size={14} /> Danger zone
        </div>
        <p className="text-sm text-gray-400">Clears local tokens and profile session on this device only.</p>
        {!confirmWipe ? (
          <button
            type="button"
            onClick={() => setConfirmWipe(true)}
            className="px-4 py-2 rounded-xl border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider"
          >
            Clear local data
          </button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={wipeLocal}
              className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider"
            >
              Confirm wipe
            </button>
            <button
              type="button"
              onClick={() => setConfirmWipe(false)}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm border-b border-white/5 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 font-mono text-xs text-right break-all">{value}</span>
    </div>
  );
}
