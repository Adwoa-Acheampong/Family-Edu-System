import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Database, Loader2, Target, Zap } from 'lucide-react';
import { User } from '../types';
import { useSystemStatus, useDriveUsage, useAnalytics } from '../hooks/useLiveData';
import { cn } from '../utils';

export function ArchitectDashboard({ user }: { user: User }) {
  const navigate = useNavigate();
  const status = useSystemStatus();
  const drive = useDriveUsage(user.id);
  const analytics = useAnalytics(user.id);

  const latency = status.data?.latencyMs;
  const networkLabel =
    latency == null ? '—' : latency < 80 ? 'OPTIMAL' : latency < 200 ? 'DEGRADED' : 'SLOW';

  const stats = [
    {
      label: 'NETWORK LATENCY',
      value: latency != null ? `${latency} ms` : status.isLoading ? '…' : 'n/a',
      sub: networkLabel,
      icon: Activity,
    },
    {
      label: 'API HEALTH',
      value: status.data?.apiStatus?.toUpperCase() || (status.isError ? 'DOWN' : '…'),
      sub: status.data?.time ? new Date(status.data.time).toLocaleTimeString() : 'polling',
      icon: Database,
    },
    {
      label: 'AI GATEWAY',
      value: status.data?.geminiConfigured || status.data?.openRouterConfigured ? 'ONLINE' : 'OFFLINE',
      sub: status.data?.geminiConfigured ? 'Gemini ready' : status.data?.openRouterConfigured ? 'OpenRouter' : 'No API key',
      icon: Zap,
    },
    {
      label: 'ASSIGNMENTS',
      value: analytics.data
        ? `${analytics.data.completedAssignments}/${analytics.data.completedAssignments + analytics.data.pendingAssignments}`
        : '—',
      sub: analytics.data ? `${analytics.data.pendingAssignments} pending` : 'loading',
      icon: Target,
    },
  ];

  const logs = status.data?.recentEvents || [];
  const curriculum = analytics.data?.curriculumMilestones || [];

  return (
    <div className="p-6 md:p-10 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--theme-color)] uppercase mb-3">
            SYSTEM COMMAND
          </div>
          <h1
            className="text-4xl md:text-5xl font-light text-white tracking-tight"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Enterprise Overview
          </h1>
          <p className="text-sm text-gray-500 mt-2">Live telemetry — no static demo metrics.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="px-5 py-2.5 bg-transparent border border-white/20 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:border-white/40 transition-colors"
          >
            View Analytics
          </button>
          <button
            type="button"
            onClick={() => navigate('/system/config')}
            className="px-5 py-2.5 bg-[var(--theme-color)] text-black rounded-lg text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            System Config
          </button>
        </div>
      </div>

      {(status.isLoading || drive.isLoading) && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
          <Loader2 size={16} className="animate-spin" /> Syncing live status…
        </div>
      )}

      {status.isError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Status API unavailable. Check server health.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--theme-color)]/50 transition-colors"
          >
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 group-hover:text-[var(--theme-color)] transition-all">
              <stat.icon size={32} strokeWidth={1} />
            </div>
            <div className="text-[9px] text-gray-500 font-bold tracking-[0.2em] uppercase mb-3">{stat.label}</div>
            <div className="text-2xl font-light text-white mb-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              {stat.value}
            </div>
            <div className="text-[11px] font-medium text-[var(--theme-color)]">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h2 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">Engine Room Events</h2>
              <button
                type="button"
                onClick={() => void status.refetch()}
                className="text-[11px] font-bold tracking-widest text-[var(--theme-color)] uppercase hover:underline"
              >
                Refresh
              </button>
            </div>

            {logs.length === 0 ? (
              <p className="text-sm text-gray-500">No recent events reported by the API yet.</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-black border border-white/5 font-mono text-xs">
                    <div className="text-gray-500 shrink-0 w-24">{log.time}</div>
                    <div className="text-gray-300 flex-1">{log.event}</div>
                    <div
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] tracking-wider shrink-0',
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : log.status === 'ERROR'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-blue-500/10 text-blue-400'
                      )}
                    >
                      {log.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6">
            <h2 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase mb-4">Drive storage</h2>
            {drive.data ? (
              <>
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>
                    {(drive.data.used / 1e9).toFixed(2)} GB used / {(drive.data.total / 1e9).toFixed(1)} GB
                  </span>
                  <span className="text-[var(--theme-color)]">{drive.data.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-black border border-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[var(--theme-color)]"
                    style={{ width: `${Math.min(100, drive.data.percentage)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest">Source: {drive.data.source || 'api'}</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">{drive.isError ? 'Drive usage unavailable' : 'Loading…'}</p>
            )}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[var(--theme-color)]/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-color)]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 relative z-10">
            <h2 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">Curriculum track</h2>
          </div>
          <div className="space-y-8 relative z-10">
            {curriculum.length === 0 ? (
              <p className="text-sm text-gray-500">No milestones from analytics API yet.</p>
            ) : (
              curriculum.map((m, i) => (
                <div
                  key={m.title + i}
                  className={cn('relative pl-6 border-l', i === 0 ? 'border-[var(--theme-color)]' : 'border-white/10')}
                >
                  <div
                    className={cn(
                      'absolute w-3 h-3 rounded-full bg-black border-2 -left-[6.5px] top-0',
                      i === 0 ? 'border-[var(--theme-color)] shadow-[0_0_10px_var(--theme-color)]' : 'border-white/30'
                    )}
                  />
                  <div className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1.5">{m.phase}</div>
                  <div className="text-sm font-medium text-white mb-2">{m.title}</div>
                  <div className="text-[11px] text-gray-400 leading-relaxed">{m.description}</div>
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="mt-8 text-[11px] font-bold uppercase tracking-widest text-[var(--theme-color)] relative z-10"
          >
            Open full analytics →
          </button>
        </div>
      </div>
    </div>
  );
}
