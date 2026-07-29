import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowLeft, Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../hooks/useLiveData';

export function AnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } = useAnalytics(user!.id);

  const xpSeries = useMemo(() => data?.xpByDay || [], [data]);
  const subjectSeries = useMemo(() => data?.bySubject || [], [data]);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto animate-fade-in pb-24">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--theme-color)] mb-2">
            Analytics
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Live performance</h1>
          <p className="text-sm text-gray-500 mt-2">
            Sourced from Engine Room / Node API — not static demo numbers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white disabled:opacity-50"
        >
          {isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-24 text-gray-500 gap-3">
          <Loader2 className="animate-spin" /> Loading analytics…
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300 text-sm">
          {(error as Error)?.message || 'Failed to load analytics'}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Assignments done', value: data.completedAssignments },
              { label: 'Pending', value: data.pendingAssignments },
              { label: 'Total XP (7d)', value: data.xpLast7Days },
              { label: 'Active streak', value: data.currentStreak },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5"
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  {s.label}
                </div>
                <div className="text-2xl font-light text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-[var(--theme-color)]" />
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-6">XP (7 days)</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={xpSeries}>
                    <defs>
                      <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--theme-color)" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="var(--theme-color)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="day" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: '#000', border: '1px solid #333', borderRadius: 8 }}
                    />
                    <Area type="monotone" dataKey="xp" stroke="var(--theme-color)" fill="url(#xpFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-6">By subject</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectSeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="subject" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: '#000', border: '1px solid #333', borderRadius: 8 }}
                    />
                    <Bar dataKey="count" fill="var(--theme-color)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {data.source && (
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-6">
              Source: {data.source}
            </p>
          )}
        </>
      )}
    </div>
  );
}
