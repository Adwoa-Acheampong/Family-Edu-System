import React, { useCallback, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Activity,
  BarChart2,
  BookOpen,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { User } from '../types';
import { ClassroomCard, Assignment } from './ClassroomCard';
import { SubmissionWidget } from './SubmissionWidget';
import { getAssignments, submitAssignment, suggestGoals } from '../lib/api';
import { useAnalytics } from '../hooks/useLiveData';
import { cn } from '../utils';

export function AnalystDashboard({ user }: { user: User }) {
  const [quests, setQuests] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isSuggesterOpen, setIsSuggesterOpen] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<
    { title: string; desc: string; xp: number; type?: string }[]
  >([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [leaderboardView, setLeaderboardView] = useState<'daily' | 'weekly'>('daily');
  const [submissionModal, setSubmissionModal] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
  }>({ isOpen: false, id: '', title: '' });

  const analytics = useAnalytics(user.id);

  const loadQuests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAssignments(user.id);
      const list: Assignment[] = (data.assignments || []).map((a: any) => ({
        id: a.id,
        courseId: a.courseId,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        points: a.points,
        status: a.status || 'PENDING',
      }));
      setQuests(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quests');
      setQuests([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    void loadQuests();
  }, [loadQuests]);

  const completedCount = quests.filter((q) => q.status !== 'PENDING').length;
  const pendingCount = quests.length - completedCount;
  const totalProgress =
    quests.length === 0 ? 0 : Math.round((completedCount / quests.length) * 100);
  const totalXp = quests
    .filter((q) => q.status !== 'PENDING')
    .reduce((s, q) => s + (q.points || 0), 0);

  useEffect(() => {
    if (pendingCount > 0 && !loading) {
      const t = setTimeout(() => setShowToast(true), 1200);
      return () => clearTimeout(t);
    }
  }, [pendingCount, loading]);

  useEffect(() => {
    if (totalProgress === 100 && quests.length > 0) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: [user.themeHex, '#ffffff', '#000000'],
      });
    }
  }, [totalProgress, quests.length, user.themeHex]);

  const chartData = useMemo(() => {
    if (analytics.data?.xpByDay?.length) return analytics.data.xpByDay;
    return [
      { day: 'Mon', xp: 0 },
      { day: 'Tue', xp: 0 },
      { day: 'Wed', xp: 0 },
      { day: 'Thu', xp: 0 },
      { day: 'Fri', xp: 0 },
      { day: 'Sat', xp: 0 },
      { day: 'Sun', xp: totalXp },
    ];
  }, [analytics.data, totalXp]);

  const handleSubmission = async (
    id: string,
    data: { textResponse?: string; file?: File; fileName?: string }
  ) => {
    const quest = quests.find((q) => q.id === id);
    await submitAssignment(quest?.courseId || 'course_coding', id, {
      ...data,
      userId: user.id,
    });
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'SUBMITTED' as const } : q))
    );
    void analytics.refetch();
  };

  const generateGoals = async () => {
    setIsSuggesterOpen(true);
    setIsLoadingGoals(true);
    try {
      const data = await suggestGoals(user);
      setSuggestedGoals(data.suggestions || []);
    } catch (e) {
      console.error(e);
      setSuggestedGoals([]);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const activeStreak = analytics.data?.currentStreak ?? (pendingCount > 0 ? 3 : 5);

  return (
    <div className="p-4 md:p-10 font-mono relative">
      {showToast && pendingCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[var(--theme-color)]/30 rounded-2xl p-4 shadow-2xl flex items-start gap-4 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-[var(--theme-color)]/10 text-[var(--theme-color)] flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Incoming Signal</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                You have {pendingCount} pending quest{pendingCount === 1 ? '' : 's'} left today.
              </p>
            </div>
            <button type="button" onClick={() => setShowToast(false)} className="text-gray-400">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[var(--theme-color)]/30 rounded-3xl p-5 md:p-8 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--theme-color)]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8 relative z-10 w-full md:w-auto">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-xl md:rounded-2xl border-2 border-[var(--theme-color)] flex items-center justify-center text-2xl md:text-4xl font-bold bg-gray-100 dark:bg-black text-gray-900 dark:text-white shrink-0">
            L{Math.max(1, Math.floor(totalXp / 500) + 1)}
          </div>
          <div className="flex-1 min-w-0 w-full">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider truncate">
              {user.name}'s Terminal
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3">
              <div className="flex-1 min-w-[120px] sm:w-48 md:w-64 h-3 md:h-4 bg-gray-200 dark:bg-black rounded overflow-hidden border border-black/10 dark:border-white/20">
                <div
                  className="h-full bg-[var(--theme-color)] transition-all duration-700"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <span className="text-xs md:text-sm text-[var(--theme-color)] font-bold whitespace-nowrap">
                {totalXp} XP · {totalProgress}%
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsInsightsOpen(true)}
                className="px-3 py-1.5 bg-[var(--theme-color)]/10 border border-[var(--theme-color)]/30 rounded-lg text-[10px] font-bold text-[var(--theme-color)] uppercase inline-flex items-center gap-1.5"
              >
                <BarChart2 size={12} /> Weekly Insights
              </button>
              <button
                type="button"
                onClick={() => void generateGoals()}
                className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-[10px] font-bold text-gray-900 dark:text-white uppercase inline-flex items-center gap-1.5"
              >
                <Sparkles size={12} className="text-yellow-500" /> Smart Goals
              </button>
              <button
                type="button"
                onClick={() => void loadQuests()}
                disabled={loading}
                className="px-3 py-1.5 border border-black/10 dark:border-white/10 rounded-lg text-[10px] font-bold text-gray-500 uppercase inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Sync
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4 relative z-10 bg-gray-50 dark:bg-black/50 p-3 md:p-4 rounded-xl border border-black/5 dark:border-white/10">
          <div className="text-center">
            <div className="text-[10px] text-gray-500 font-bold tracking-widest mb-1">STREAK</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              <Target className="text-orange-500 w-5 h-5" /> {activeStreak}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
          <Loader2 className="animate-spin" /> Loading quests from API…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4">
              <BookOpen className="text-[var(--theme-color)] w-5 h-5" />
              <h2 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase">
                Today's Tasks
              </h2>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest ml-auto">
                API store
              </span>
            </div>

            {quests.length === 0 ? (
              <p className="text-sm text-gray-500">No quests for this profile in the API yet.</p>
            ) : (
              <div className="space-y-4">
                {quests.map((quest) => (
                  <ClassroomCard
                    key={quest.id}
                    assignment={quest}
                    onView={(id) =>
                      setSubmissionModal({ isOpen: true, id, title: quest.title })
                    }
                    onHelp={() => window.dispatchEvent(new CustomEvent('fes-open-ai'))}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-6 rounded-2xl mb-8">
              <h2 className="text-xs font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase mb-4">
                Daily Goals
              </h2>
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{totalProgress}%</span>
                <span className="text-xs text-gray-500 mb-1">
                  {completedCount} of {quests.length} completed
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-black rounded-full h-2 mb-4 border border-black/5 dark:border-white/10 overflow-hidden">
                <div
                  className="bg-[var(--theme-color)] h-full transition-all duration-1000"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-6 rounded-2xl mb-8">
              <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4 mb-6">
                <Activity className="text-[var(--theme-color)] w-5 h-5" />
                <h2 className="text-xs font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase">
                  XP Trend
                </h2>
              </div>
              <div className="h-40 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorXpKobby" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={user.themeHex} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={user.themeHex} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#000',
                        border: 'none',
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="xp"
                      stroke={user.themeHex}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorXpKobby)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4 mb-6">
              <Trophy className="text-[var(--theme-color)] w-5 h-5" />
              <h2 className="text-xs font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase">
                Achievement Badges
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Badge unlocked={completedCount >= 1} label="First Quest" icon={<Sparkles size={24} />} />
              <Badge unlocked={totalXp >= 150} label="XP Starter" icon={<Trophy size={24} />} />
              <Badge unlocked={totalProgress === 100 && quests.length > 0} label="Daily Clear" icon={<Star size={24} />} />
              <Badge unlocked={false} label="LOCKED" />
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-[var(--theme-color)] w-5 h-5" />
                <h2 className="text-xs font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase">
                  Family Leaderboard
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/50 p-1 rounded-lg mb-6 max-w-[200px]">
                {(['daily', 'weekly'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLeaderboardView(v)}
                    className={cn(
                      'flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md',
                      leaderboardView === v
                        ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500'
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { name: 'Kweku', role: 'Discoverer', xp: leaderboardView === 'daily' ? 1200 : 5400, color: '#f59e0b' },
                  { name: 'Kobby', role: 'Analyst', xp: leaderboardView === 'daily' ? totalXp || 750 : totalXp * 4 || 3450, color: '#06b6d4' },
                  { name: 'Seth', role: 'Adventurer', xp: leaderboardView === 'daily' ? 850 : 4000, color: '#0ea5e9' },
                  { name: 'Aba', role: 'Architect', xp: leaderboardView === 'daily' ? 600 : 4200, color: '#d97706' },
                ]
                  .sort((a, b) => b.xp - a.xp)
                  .map((m, i) => (
                    <div key={m.name} className="flex items-center gap-3 p-2 rounded-xl">
                      <div className="w-6 text-center font-bold text-gray-500 text-sm">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 dark:text-white truncate">{m.name}</div>
                        <div className="text-[9px] text-gray-500 uppercase">{m.role}</div>
                      </div>
                      <div className="font-bold text-sm" style={{ color: m.color }}>
                        {m.xp} XP
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isInsightsOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-2xl relative">
            <button
              type="button"
              onClick={() => setIsInsightsOpen(false)}
              className="absolute top-6 right-6 text-gray-500"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-3">
              <BarChart2 className="text-[var(--theme-color)]" /> Weekly Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InsightCard
                label="Completed"
                value={String(analytics.data?.completedAssignments ?? completedCount)}
              />
              <InsightCard
                label="Pending"
                value={String(analytics.data?.pendingAssignments ?? pendingCount)}
              />
              <InsightCard
                label="XP (7d)"
                value={String(analytics.data?.xpLast7Days ?? totalXp)}
              />
              <InsightCard label="Streak" value={String(activeStreak)} />
            </div>
          </div>
        </div>
      )}

      {isSuggesterOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[var(--theme-color)]/30 p-6 md:p-8 rounded-3xl w-full max-w-2xl relative">
            <button
              type="button"
              onClick={() => setIsSuggesterOpen(false)}
              className="absolute top-6 right-6 text-gray-500"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider flex items-center gap-3">
              <Sparkles className="text-[var(--theme-color)]" /> Smart Goals
            </h2>
            <p className="text-sm text-gray-500 mb-6">From `/api/suggest-goals` (Gemini when keyed).</p>
            {isLoadingGoals ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="animate-spin text-[var(--theme-color)] mb-4" />
                <div className="text-sm text-gray-400 uppercase tracking-widest font-bold">Analyzing…</div>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestedGoals.map((goal, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black/50 flex gap-4 items-start"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--theme-color)]/10 text-[var(--theme-color)] flex items-center justify-center shrink-0">
                      <Target size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-color)] mb-1">
                        {goal.type || 'QUEST'}
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{goal.title}</h4>
                      <p className="text-xs text-gray-500">{goal.desc}</p>
                    </div>
                    <div className="text-sm font-bold text-[var(--theme-color)]">+{goal.xp} XP</div>
                  </div>
                ))}
                {!suggestedGoals.length && (
                  <p className="text-sm text-gray-500">No suggestions returned.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <SubmissionWidget
        isOpen={submissionModal.isOpen}
        onClose={() => setSubmissionModal({ isOpen: false, id: '', title: '' })}
        assignmentId={submissionModal.id}
        assignmentTitle={submissionModal.title}
        user={user}
        onSubmit={handleSubmission}
      />
    </div>
  );
}

function Badge({
  unlocked,
  label,
  icon,
}: {
  unlocked: boolean;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'aspect-square rounded-2xl border flex flex-col items-center justify-center p-4 text-center',
        unlocked
          ? 'border-[var(--theme-color)]/30 bg-gray-50 dark:bg-[#0a0a0a]'
          : 'border-dashed border-black/10 dark:border-white/5 opacity-60 grayscale'
      )}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center mb-3',
          unlocked
            ? 'bg-[var(--theme-color)]/20 text-[var(--theme-color)]'
            : 'border border-gray-300 dark:border-gray-700 text-gray-500'
        )}
      >
        {icon || <Trophy size={20} />}
      </div>
      <div className="text-xs font-bold text-gray-900 dark:text-white font-sans">{label}</div>
    </div>
  );
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-black/50 border border-black/5 dark:border-white/5 p-5 rounded-2xl">
      <div className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-2">{label}</div>
      <div className="text-2xl font-bold text-[var(--theme-color)]">{value}</div>
    </div>
  );
}
