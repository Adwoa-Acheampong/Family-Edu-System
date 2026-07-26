import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { User } from '../types';
import { cn } from '../utils';
import { Activity, BookOpen, Code, Target, Trophy, Play, Star, Sparkles, BookHeart, Cloud, ShieldCheck, CheckCircle2, ChevronRight, Zap, Database, Search, X, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ClassroomCard } from './ClassroomCard';
import { SubmissionWidget } from './SubmissionWidget';
import { submitAssignment, suggestGoals } from '../lib/api';

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  switch (user.id) {
    case 'aba':
      return <ArchitectDashboard user={user} />;
    case 'badu':
      return <MasterDashboard user={user} />;
    case 'kobby':
      return <AnalystDashboard user={user} />;
    case 'pappy':
      return <ExplorerDashboard user={user} />;
    case 'kweku':
      return <DiscovererDashboard user={user} />;
    case 'shee':
      return <SeedlingDashboard user={user} />;
    case 'seth':
      return <AdventurerDashboard user={user} />;
    default:
      return <div className="p-8 text-white">Dashboard not found</div>;
  }
}

// ============================================================================
// ABA (THE ARCHITECT) - PROFESSIONAL, DATA-DENSE (Dark/Gold)
// ============================================================================
function ArchitectDashboard({ user }: DashboardProps) {
  return (
    <div className="p-6 md:p-10 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--theme-color)] uppercase mb-3">SYSTEM COMMAND</div>
          <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Enterprise Overview</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-transparent border border-white/20 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:border-white/40 transition-colors">
            View Analytics
          </button>
          <button className="px-5 py-2.5 bg-[var(--theme-color)] text-black rounded-lg text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity shadow-[0_0_20px_var(--theme-color)]/20">
            System Config
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'NETWORK STATUS', value: 'OPTIMAL', sub: 'Latency < 24ms', icon: Activity },
          { label: 'DB SYNC', value: '99.9%', sub: 'MongoDB Atlas', icon: Database },
          { label: 'AI WORKERS', value: '4/4', sub: 'Engine Room Active', icon: Zap },
          { label: 'ACTIVE TENANTS', value: '7', sub: 'All users authenticated', icon: Target },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--theme-color)]/50 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 group-hover:text-[var(--theme-color)] transition-all">
              <stat.icon size={32} strokeWidth={1} />
            </div>
            <div className="text-[9px] text-gray-500 font-bold tracking-[0.2em] uppercase mb-3">{stat.label}</div>
            <div className="text-2xl font-light text-white mb-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{stat.value}</div>
            <div className="text-[11px] font-medium text-[var(--theme-color)]">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h2 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">Engine Room Logs</h2>
              <span className="text-[11px] font-bold tracking-widest text-[var(--theme-color)] uppercase cursor-pointer hover:underline">View All &rarr;</span>
            </div>
            
            <div className="space-y-4">
              {[
                { time: '10:14:32', event: 'Sync completed: MongoDB Atlas', status: 'SUCCESS' },
                { time: '09:42:11', event: 'Manus API routed query for user [badu]', status: 'SUCCESS' },
                { time: '08:15:00', event: 'Baidu OCR processed 12 pages for [kobby]', status: 'SUCCESS' },
                { time: '02:00:00', event: 'Daily architectural routine initialized', status: 'INFO' },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-black border border-white/5 font-mono text-xs">
                  <div className="text-gray-500 shrink-0 w-20">{log.time}</div>
                  <div className="text-gray-300 flex-1">{log.event}</div>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] tracking-wider shrink-0",
                    log.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                  )}>
                    {log.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-[#0a0a0a] border border-[var(--theme-color)]/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-color)]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 relative z-10">
            <h2 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">150-Day Curriculum</h2>
          </div>
          <div className="space-y-8 relative z-10">
            <div className="relative pl-6 border-l border-[var(--theme-color)] pb-2">
              <div className="absolute w-3 h-3 rounded-full bg-black border-2 border-[var(--theme-color)] -left-[6.5px] top-0 shadow-[0_0_10px_var(--theme-color)]" />
              <div className="text-xs font-bold text-[var(--theme-color)] tracking-widest uppercase mb-1.5">MONTH 1</div>
              <div className="text-sm font-medium text-white mb-2">BABOK Foundations</div>
              <div className="text-[11px] text-gray-400 leading-relaxed">Financial reporting, elicitations, requirements management.</div>
            </div>
            <div className="relative pl-6 border-l border-white/10 pb-2">
              <div className="absolute w-3 h-3 rounded-full bg-black border-2 border-white/30 -left-[6.5px] top-0" />
              <div className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1.5">MONTH 2</div>
              <div className="text-sm font-medium text-white mb-2">BI & Data Engineering</div>
              <div className="text-[11px] text-gray-400">Power BI, Tableau, Advanced Visual Storytelling.</div>
            </div>
            <div className="relative pl-6 opacity-50">
              <div className="absolute w-3 h-3 rounded-full bg-black border-2 border-white/30 -left-[6.5px] top-0" />
              <div className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1.5">MONTH 3</div>
              <div className="text-sm font-medium text-white mb-2">Systems Architecture</div>
              <div className="text-[11px] text-gray-400">Python APIs, Java Enterprise patterns.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BADU (THE MASTER) - INSTRUCTIONAL, LARGE TEXT (Emerald)
// ============================================================================
function MasterDashboard({ user }: DashboardProps) {
  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl font-serif text-white mb-4 leading-tight">Welcome back,<br /><span className="text-[var(--theme-color)]">{user.name}</span></h1>
        <p className="text-xl text-gray-400 font-light">Let's continue your culinary journey today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[2rem] hover:border-[var(--theme-color)]/50 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-[var(--theme-color)]/10 text-[var(--theme-color)] flex items-center justify-center mb-8 border border-[var(--theme-color)]/20">
            <BookOpen size={32} />
          </div>
          <div className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-3">CURRENT RECIPE</div>
          <h2 className="text-3xl font-serif text-white mb-6">Homemade Lasagna</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-10">You've successfully made the béchamel sauce. Next up: layering the pasta and meat sauce.</p>
          <button className="w-full py-5 bg-[var(--theme-color)] text-black text-lg font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-[var(--theme-color)]/90 transition-colors">
            Continue Recipe <ChevronRight size={24} />
          </button>
        </div>
        
        <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[2rem]">
          <div className="w-16 h-16 rounded-2xl bg-white/5 text-white flex items-center justify-center mb-8 border border-white/10">
            <Activity size={32} />
          </div>
          <div className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-6">DAILY HEALTH LOG</div>
          <div className="space-y-4">
            <label className="flex items-center p-6 rounded-2xl bg-black border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
              <input type="checkbox" defaultChecked className="w-8 h-8 rounded border-white/20 text-[var(--theme-color)] bg-black focus:ring-0 focus:ring-offset-0" />
              <span className="ml-5 text-xl text-gray-200">Morning walk (30 mins)</span>
            </label>
            <label className="flex items-center p-6 rounded-2xl bg-black border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
              <input type="checkbox" className="w-8 h-8 rounded border-white/20 text-[var(--theme-color)] bg-black focus:ring-0 focus:ring-offset-0" />
              <span className="ml-5 text-xl text-gray-200">Hydration check (4 glasses)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOBBY (THE ANALYST) - GAMIFIED, TECH (Cyan)
// ============================================================================
function AnalystDashboard({ user }: DashboardProps) {
  const [showToast, setShowToast] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isSuggesterOpen, setIsSuggesterOpen] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<any[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [leaderboardView, setLeaderboardView] = useState<'daily' | 'weekly'>('daily');
  const [submissionModal, setSubmissionModal] = useState<{isOpen: boolean, id: string, title: string}>({ isOpen: false, id: '', title: '' });
  
  const [dailyQuests, setDailyQuests] = useState([
    { id: '1', title: 'Python Variables & Types', desc: 'Master the basics of data storage.', xp: 150, type: 'MAIN QUEST', done: true, progress: 100 },
    { id: '2', title: 'Loops & Logic Challenge', desc: 'Write a program to sort a list of numbers.', xp: 300, type: 'MAIN QUEST', done: false, progress: 60 },
    { id: '3', title: 'First Data Chart', desc: 'Use matplotlib to draw a simple line graph.', xp: 200, type: 'SIDE QUEST', done: false, progress: 15 },
  ]);

  const handleSubmission = async (id: string, data: any) => {
    try {
      await submitAssignment('default', id, data);
      setDailyQuests(prev => prev.map(q => q.id === id ? { ...q, done: true, progress: 100 } : q));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const totalProgress = Math.round(dailyQuests.reduce((acc, q) => acc + q.progress, 0) / dailyQuests.length);
  const completedCount = dailyQuests.filter(q => q.done).length;
  const pendingCount = dailyQuests.length - completedCount;

  const chartData = [
    { name: 'Mon', xp: 400 },
    { name: 'Tue', xp: 300 },
    { name: 'Wed', xp: 550 },
    { name: 'Thu', xp: 450 },
    { name: 'Fri', xp: 700 },
    { name: 'Sat', xp: 650 },
    { name: 'Sun', xp: 800 },
  ];

  useEffect(() => {
    if (pendingCount > 0) {
      const timer = setTimeout(() => setShowToast(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [pendingCount]);

  useEffect(() => {
    if (totalProgress === 100) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: [user.themeHex, '#ffffff', '#000000']
      });
    }
  }, [totalProgress, user.themeHex]);

  const generateGoals = async () => {
    setIsSuggesterOpen(true);
    setIsLoadingGoals(true);
    try {
      const data = await suggestGoals(user);
      if (data.suggestions) {
        setSuggestedGoals(data.suggestions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const activeStreak = 5;

  return (
    <div className="p-4 md:p-10 font-mono relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[var(--theme-color)]/30 rounded-2xl p-4 shadow-2xl flex items-start gap-4 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-[var(--theme-color)]/10 text-[var(--theme-color)] flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Incoming Signal</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">You have {pendingCount} pending quests left today. Keep your streak alive!</p>
            </div>
            <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[var(--theme-color)]/30 rounded-3xl p-5 md:p-8 relative overflow-hidden shadow-lg dark:shadow-[0_0_30px_var(--theme-color)]/10">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--theme-color)]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8 relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-4 w-full sm:w-auto sm:block">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-xl md:rounded-2xl border-2 border-[var(--theme-color)] flex items-center justify-center text-2xl md:text-4xl font-bold bg-gray-100 dark:bg-black text-gray-900 dark:text-white shadow-md dark:shadow-[0_0_15px_var(--theme-color)]/50 shrink-0">
              L4
            </div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-wider truncate sm:hidden">{user.name}'s Terminal</h1>
          </div>
          <div className="flex-1 min-w-0 w-full">
            <h1 className="hidden sm:block text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider truncate">{user.name}'s Terminal</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3">
              <div className="flex-1 min-w-[120px] sm:w-48 md:w-64 h-3 md:h-4 bg-gray-200 dark:bg-black rounded overflow-hidden border border-black/10 dark:border-white/20 shrink-0">
                <div className="h-full bg-[var(--theme-color)] w-3/4 shadow-[0_0_10px_var(--theme-color)]" />
              </div>
              <span className="text-xs md:text-sm text-[var(--theme-color)] font-bold whitespace-nowrap">750 / 1000 XP</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setIsInsightsOpen(true)}
                className="px-3 py-1.5 bg-[var(--theme-color)]/10 border border-[var(--theme-color)]/30 rounded-lg text-[10px] font-bold text-[var(--theme-color)] uppercase hover:bg-[var(--theme-color)]/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <BarChart2 size={12} /> Weekly Insights
              </button>
              <button 
                onClick={generateGoals}
                className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-[10px] font-bold text-gray-900 dark:text-white uppercase hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles size={12} className="text-yellow-500" /> Smart Goals
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4 md:gap-6 relative z-10 bg-gray-50 dark:bg-black/50 p-3 md:p-4 rounded-xl border border-black/5 dark:border-white/10 w-full md:w-auto justify-center md:justify-start">
          <div className="text-center group">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold tracking-widest mb-1 md:mb-2 transition-colors group-hover:text-orange-500">STREAK</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              <div className={cn(
                "flex items-center gap-2", 
                activeStreak >= 5 ? "animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" : ""
              )}>
                <Target className="text-orange-500 w-5 h-5 md:w-6 md:h-6" /> {activeStreak}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4">
            <BookOpen className="text-[var(--theme-color)] w-5 h-5 md:w-6 md:h-6" />
            <h2 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase">Today's Tasks</h2>
          </div>
          
          <div className="space-y-4">
            {dailyQuests.map((quest, i) => (
              <div key={i}>
                <ClassroomCard 
                  assignment={{
                    id: quest.id,
                    title: quest.title,
                    description: quest.desc,
                    dueDate: new Date().toISOString(),
                    status: quest.done ? 'GRADED' : 'PENDING',
                    points: quest.xp
                  }}
                  onView={(id) => setSubmissionModal({ isOpen: true, id, title: quest.title })}
                  onHelp={(id) => console.log('Help', id)}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-6 rounded-2xl mb-8 hover:border-[var(--theme-color)]/30 transition-colors shadow-sm dark:shadow-none">
            <h2 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase mb-4">Daily Goals</h2>
            
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{totalProgress}%</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{completedCount} of {dailyQuests.length} completed</span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-black rounded-full h-2 mb-4 border border-black/5 dark:border-white/10 overflow-hidden">
              <div 
                className="bg-[var(--theme-color)] h-full shadow-[0_0_10px_var(--theme-color)] transition-all duration-1000" 
                style={{ width: `${totalProgress}%` }} 
              />
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center">
              {totalProgress === 100 ? 'Goal Reached!' : 'Keep it up!'}
            </p>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-6 rounded-2xl mb-8 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4 mb-6">
              <Activity className="text-[var(--theme-color)] w-5 h-5 md:w-6 md:h-6" />
              <h2 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase">XP Trend</h2>
            </div>
            <div className="h-40 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={user.themeHex} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={user.themeHex} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: user.themeHex }}
                  />
                  <Area type="monotone" dataKey="xp" stroke={user.themeHex} strokeWidth={2} fillOpacity={1} fill="url(#colorXp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4 mb-6">
            <Trophy className="text-[var(--theme-color)] w-5 h-5 md:w-6 md:h-6" />
            <h2 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase">Achievement Badges</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-2xl border border-[var(--theme-color)]/30 bg-gray-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center group hover:bg-[var(--theme-color)]/5 transition-colors cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-color)]/10 to-transparent opacity-50" />
              <div className="w-14 h-14 rounded-full bg-[var(--theme-color)]/20 text-[var(--theme-color)] flex items-center justify-center mb-3 shadow-[0_0_20px_var(--theme-color)]/40 group-hover:scale-110 transition-transform relative z-10">
                <Sparkles size={24} />
              </div>
              <div className="text-xs font-bold text-gray-900 dark:text-white font-sans relative z-10">Syntax Starter</div>
            </div>
            <div className="aspect-square rounded-2xl border border-[var(--theme-color)]/30 bg-gray-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center group hover:bg-[var(--theme-color)]/5 transition-colors cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-color)]/10 to-transparent opacity-50" />
              <div className="w-14 h-14 rounded-full bg-[var(--theme-color)]/20 text-[var(--theme-color)] flex items-center justify-center mb-3 shadow-[0_0_20px_var(--theme-color)]/40 group-hover:scale-110 transition-transform relative z-10">
                <Trophy size={24} />
              </div>
              <div className="text-xs font-bold text-gray-900 dark:text-white font-sans relative z-10">Math Whiz</div>
            </div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-2xl border border-black/10 dark:border-white/5 border-dashed bg-gray-100 dark:bg-black/50 flex flex-col items-center justify-center p-4 text-center grayscale opacity-60">
                <div className="w-14 h-14 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center mb-3 text-gray-400 dark:text-gray-700 bg-gray-50 dark:bg-black/50">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-600 tracking-widest font-sans uppercase">LOCKED</div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 border-b border-transparent">
                <Star className="text-[var(--theme-color)] w-5 h-5 md:w-6 md:h-6" />
                <h2 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase">Family Leaderboard</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/50 p-1 rounded-lg mb-6 w-full max-w-[200px] mx-auto border border-black/5 dark:border-white/5">
              <button 
                onClick={() => setLeaderboardView('daily')}
                className={cn("flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors", leaderboardView === 'daily' ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white")}
              >
                Daily
              </button>
              <button 
                onClick={() => setLeaderboardView('weekly')}
                className={cn("flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors", leaderboardView === 'weekly' ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white")}
              >
                Weekly
              </button>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Kweku', role: 'Discoverer', xp: leaderboardView === 'daily' ? 1200 : 5400, color: '#f59e0b', initials: 'Kw' },
                { name: 'Kobby', role: 'Analyst', xp: leaderboardView === 'daily' ? 750 : 3450, color: '#06b6d4', initials: 'Ko' },
                { name: 'Aba', role: 'Architect', xp: leaderboardView === 'daily' ? 600 : 4200, color: '#d97706', initials: 'Ab' },
                { name: 'Badu', role: 'Master', xp: leaderboardView === 'daily' ? 450 : 3100, color: '#10b981', initials: 'Ba' },
                { name: 'Seth', role: 'Adventurer', xp: leaderboardView === 'daily' ? 850 : 4000, color: '#0ea5e9', initials: 'Se' },
              ].sort((a, b) => b.xp - a.xp).map((member, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: member.color }} />
                  <div className="w-6 text-center font-bold text-gray-400 dark:text-gray-600 text-sm">{i + 1}</div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: `${member.color}20`, color: member.color }}>
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{member.name}</div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest truncate">{member.role}</div>
                  </div>
                  <div className="text-sm font-bold text-right shrink-0" style={{ color: member.color }}>
                    {member.xp} XP
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Insights Modal */}
      {isInsightsOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-2xl relative shadow-2xl">
            <button onClick={() => setIsInsightsOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-gray-900 dark:hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-3">
              <BarChart2 className="text-[var(--theme-color)]" /> Weekly Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-black/50 border border-black/5 dark:border-white/5 p-5 rounded-2xl">
                <div className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-2">Top Subject</div>
                <div className="text-2xl font-bold text-[var(--theme-color)] mb-1">Data Science</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">12 Quests Completed</div>
              </div>
              <div className="bg-gray-50 dark:bg-black/50 border border-black/5 dark:border-white/5 p-5 rounded-2xl">
                <div className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-2">Total XP</div>
                <div className="text-2xl font-bold text-[var(--theme-color)] mb-1">3,450 XP</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">+15% from last week</div>
              </div>
              <div className="bg-gray-50 dark:bg-black/50 border border-black/5 dark:border-white/5 p-5 rounded-2xl md:col-span-2">
                <div className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">Focus Distribution</div>
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-bold">Python</span>
                      <span className="text-gray-500">60%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-black rounded-full h-1.5 overflow-hidden"><div className="bg-[var(--theme-color)] h-full" style={{width: '60%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-bold">SQL</span>
                      <span className="text-gray-500">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-black rounded-full h-1.5 overflow-hidden"><div className="bg-blue-500 h-full" style={{width: '25%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-bold">Machine Learning</span>
                      <span className="text-gray-500">15%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-black rounded-full h-1.5 overflow-hidden"><div className="bg-purple-500 h-full" style={{width: '15%'}}></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Goal Suggester Modal */}
      {isSuggesterOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[var(--theme-color)]/30 p-6 md:p-8 rounded-3xl w-full max-w-2xl relative shadow-2xl">
            <button onClick={() => setIsSuggesterOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-gray-900 dark:hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider flex items-center gap-3">
              <Sparkles className="text-[var(--theme-color)]" /> Smart Goals
            </h2>
            <p className="text-sm text-gray-500 mb-6">AI-generated quests based on your learning history.</p>
            
            {isLoadingGoals ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[var(--theme-color)] border-t-transparent rounded-full animate-spin mb-4" />
                <div className="text-sm text-gray-400 uppercase tracking-widest font-bold animate-pulse">Analyzing progress...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestedGoals.map((goal, i) => (
                  <div key={i} className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black/50 flex gap-4 items-start group hover:border-[var(--theme-color)]/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-[var(--theme-color)]/10 text-[var(--theme-color)] flex items-center justify-center shrink-0">
                      <Target size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-color)] mb-1">{goal.type || 'QUEST'}</div>
                      <h4 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-1">{goal.title}</h4>
                      <p className="text-xs text-gray-500">{goal.desc}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold text-[var(--theme-color)] mb-2">+{goal.xp} XP</div>
                      <button className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase rounded hover:opacity-90 transition-opacity">
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
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

// ============================================================================
// PAPPY (THE EXPLORER) - ADVENTURE (Amber)
// ============================================================================
function ExplorerDashboard({ user }: DashboardProps) {
  const [activeView, setActiveView] = useState<'menu' | 'space' | 'story'>('menu');
  const [planetIndex, setPlanetIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);

  const planets = [
    { name: 'Earth', fact: 'Earth is the only planet we know of that supports life!', icon: '🌍' },
    { name: 'Mars', fact: 'Mars is sometimes called the Red Planet because of rusty iron in the ground.', icon: '🔴' },
    { name: 'Saturn', fact: 'Saturn has beautiful rings made of ice and rock!', icon: '🪐' },
  ];

  const storyText = "Once upon a time in a magical forest, a brave little fox named Pappy decided to build a spaceship. He gathered shiny leaves and strong branches. With a mighty WHOOSH, his ship flew into the starry sky!";

  const nextPlanet = () => {
    if (planetIndex < planets.length - 1) {
      setPlanetIndex(p => p + 1);
    } else {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setActiveView('menu');
      setPlanetIndex(0);
    }
  };

  const readStory = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(storyText);
      msg.rate = 0.9;
      msg.pitch = 1.2;
      msg.onend = () => {
        setIsReading(false);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      };
      setIsReading(true);
      window.speechSynthesis.speak(msg);
    }
  };

  const stopStory = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReading(false);
  };

  if (activeView === 'space') {
    const planet = planets[planetIndex];
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto text-center font-sans mt-10">
        <button onClick={() => setActiveView('menu')} className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 mx-auto">
          <ChevronRight className="rotate-180" /> Back to Menu
        </button>
        <div className="text-9xl mb-8 animate-bounce">{planet.icon}</div>
        <h2 className="text-5xl font-black text-white mb-6">{planet.name}</h2>
        <p className="text-2xl text-gray-300 mb-12">{planet.fact}</p>
        <button 
          onClick={nextPlanet}
          className="px-10 py-5 bg-[var(--theme-color)] text-black rounded-full font-bold text-2xl hover:scale-105 transition-transform"
        >
          {planetIndex === planets.length - 1 ? 'Finish!' : 'Next Planet!'}
        </button>
      </div>
    );
  }

  if (activeView === 'story') {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto text-center font-sans mt-10">
        <button onClick={() => { stopStory(); setActiveView('menu'); }} className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 mx-auto">
          <ChevronRight className="rotate-180" /> Back to Menu
        </button>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 mb-8 relative">
          <div className="text-6xl mb-6">🦊🚀</div>
          <p className="text-2xl text-gray-200 leading-relaxed text-left">{storyText}</p>
        </div>
        <button 
          onClick={isReading ? stopStory : readStory}
          className="px-10 py-5 bg-[var(--theme-color)] text-black rounded-full font-bold text-2xl hover:scale-105 transition-transform flex items-center justify-center gap-3 mx-auto"
        >
          {isReading ? 'Stop Reading' : <><Play size={24} fill="currentColor" /> Read to me</>}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto text-center font-sans mt-10">
      <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Hello, {user.name}! 🚀</h1>
      <p className="text-2xl text-[var(--theme-color)] font-medium mb-16">Choose your adventure today!</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
        <div 
          onClick={() => setActiveView('space')}
          className="group aspect-square bg-[#0a0a0a] border-4 border-white/10 rounded-[4rem] hover:border-[var(--theme-color)] hover:-translate-y-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-color)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-8xl mb-8 group-hover:scale-110 transition-transform duration-500 relative z-10">🪐</div>
          <h2 className="text-3xl font-bold text-white mb-3 relative z-10">Space Science</h2>
          <p className="text-gray-400 text-lg mb-8 relative z-10">Let's learn about the planets!</p>
          <button className="px-8 py-4 bg-[var(--theme-color)] text-black rounded-full font-bold text-xl inline-flex items-center gap-3 relative z-10 group-hover:shadow-[0_0_30px_var(--theme-color)] transition-shadow">
            <Play size={24} fill="currentColor" /> Play Game
          </button>
        </div>
        <div 
          onClick={() => setActiveView('story')}
          className="group aspect-square bg-[#0a0a0a] border-4 border-white/10 rounded-[4rem] hover:border-[var(--theme-color)] hover:-translate-y-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-color)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-8xl mb-8 group-hover:scale-110 transition-transform duration-500 relative z-10">📚</div>
          <h2 className="text-3xl font-bold text-white mb-3 relative z-10">Story Time</h2>
          <p className="text-gray-400 text-lg mb-8 relative z-10">Read a magic story with Pappy.</p>
          <button className="px-8 py-4 bg-[var(--theme-color)] text-black rounded-full font-bold text-xl inline-flex items-center gap-3 relative z-10 group-hover:shadow-[0_0_30px_var(--theme-color)] transition-shadow">
            <Play size={24} fill="currentColor" /> Read Story
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KWEKU (THE DISCOVERER) - PLAYFUL (Purple)
// ============================================================================
function DiscovererDashboard({ user }: DashboardProps) {
  const [targetShape, setTargetShape] = useState('');
  const [score, setScore] = useState(0);

  const shapes = [
    { id: 'apple', icon: '🍎', color: 'bg-red-500', name: 'red apple' },
    { id: 'square', icon: '🟦', color: 'bg-blue-500', name: 'blue square' },
    { id: 'star', icon: '⭐', color: 'bg-yellow-400', name: 'yellow star' },
  ];

  useEffect(() => {
    pickNewTarget();
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(text);
      msg.rate = 0.9;
      msg.pitch = 1.2;
      window.speechSynthesis.speak(msg);
    }
  };

  const pickNewTarget = () => {
    const random = shapes[Math.floor(Math.random() * shapes.length)];
    setTargetShape(random.id);
    setTimeout(() => {
      speak(`Can you find the ${random.name}?`);
    }, 1000);
  };

  const handleTap = (id: string, name: string) => {
    if (id === targetShape) {
      speak(`Yay! You found the ${name}! Great job!`);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#facc15']
      });
      setScore(s => s + 1);
      setTimeout(pickNewTarget, 3000);
    } else {
      speak(`That's a ${name}. Try finding the ${shapes.find(s => s.id === targetShape)?.name}!`);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="flex justify-center mb-10">
        <Star className="text-[var(--theme-color)] w-24 h-24 animate-[bounce_3s_infinite]" fill="currentColor" />
      </div>
      <h1 className="text-6xl font-black text-white mb-8 tracking-tight">Play Time, {user.name}!</h1>
      {score > 0 && <p className="text-3xl text-yellow-400 font-bold mb-8">Score: {score} 🌟</p>}
      
      <div className="flex flex-wrap justify-center gap-10">
        {shapes.map((shape) => (
          <button 
            key={shape.id}
            onClick={() => handleTap(shape.id, shape.name)}
            className={cn(
              "w-56 h-56 rounded-[3rem] hover:-translate-y-4 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-9xl border-[12px] border-white/20 shadow-2xl",
              shape.color,
              shape.id === 'star' ? "rotate-45 group" : ""
            )}
          >
            <div className={shape.id === 'star' ? "-rotate-45 group-hover:animate-spin" : ""}>
              {shape.icon}
            </div>
          </button>
        ))}
      </div>
      
      <p className="mt-20 text-3xl text-gray-300 font-bold bg-white/10 px-8 py-4 rounded-full border border-white/20 cursor-pointer" onClick={() => speak(`Can you find the ${shapes.find(s => s.id === targetShape)?.name}?`)}>
        Tap to hear instruction again 🎵
      </p>
    </div>
  );
}

// ============================================================================
// SHEE (THE SEEDLING) - VISUAL (Lime)
// ============================================================================
function SeedlingDashboard({ user }: DashboardProps) {
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        const msg = new SpeechSynthesisUtterance(`Hello ${user.name}! Welcome to play time!`);
        msg.rate = 0.8;
        msg.pitch = 1.5;
        window.speechSynthesis.speak(msg);
      }, 1000);
    }
  }, [user.name]);

  const speakAnimal = (animal: string, sound: string) => {
    if ('speechSynthesis' in window) {
      // Speak the sound
      const soundMsg = new SpeechSynthesisUtterance(sound);
      soundMsg.rate = 0.8;
      soundMsg.pitch = 1.3;
      window.speechSynthesis.speak(soundMsg);
      
      // Then speak the name
      const nameMsg = new SpeechSynthesisUtterance(`It's a ${animal}!`);
      nameMsg.rate = 0.9;
      nameMsg.pitch = 1.4;
      window.speechSynthesis.speak(nameMsg);
    }
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: [user.themeHex, '#ffffff']
    });
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6">
      <div className="grid grid-cols-2 gap-8 md:gap-12 w-full max-w-3xl">
        <button 
          onClick={() => speakAnimal('cat', 'Meow, meow')}
          className="aspect-square bg-pink-500 rounded-[3rem] flex items-center justify-center text-8xl md:text-9xl shadow-[0_20px_60px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95 transition-all border-8 border-white/30"
        >
          🐱
        </button>
        <button 
          onClick={() => speakAnimal('dog', 'Woof, woof')}
          className="aspect-square bg-[var(--theme-color)] rounded-[3rem] flex items-center justify-center text-8xl md:text-9xl shadow-[0_20px_60px_var(--theme-color)] hover:scale-105 active:scale-95 transition-all border-8 border-white/30"
        >
          🐶
        </button>
        <button 
          onClick={() => speakAnimal('cow', 'Moo, moo')}
          className="aspect-square bg-orange-400 rounded-[3rem] flex items-center justify-center text-8xl md:text-9xl shadow-[0_20px_60px_rgba(251,146,60,0.4)] hover:scale-105 active:scale-95 transition-all border-8 border-white/30"
        >
          🐮
        </button>
        <button 
          onClick={() => speakAnimal('duck', 'Quack, quack')}
          className="aspect-square bg-cyan-400 rounded-[3rem] flex items-center justify-center text-8xl md:text-9xl shadow-[0_20px_60px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95 transition-all border-8 border-white/30"
        >
          🦆
        </button>
      </div>
    </div>
  );
}


export function AdventurerDashboard({ user }: DashboardProps) {
  const [activeView, setActiveView] = useState<'menu' | 'letters' | 'numbers' | 'nature'>('menu');

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.rate = 0.9;
      msg.pitch = 1.1;
      window.speechSynthesis.speak(msg);
    }
  };

  useEffect(() => {
    if (activeView === 'menu') {
      speak(`Hello ${user.name}! What adventure should we go on today?`);
    } else if (activeView === 'letters') {
      speak("Let's go on a letter hunt! Tap the letters to hear their sounds.");
    } else if (activeView === 'numbers') {
      speak("Welcome to the count trail! Let's count together.");
    } else if (activeView === 'nature') {
      speak("Welcome to the nature walk! What can we find in the forest?");
    }
  }, [activeView]);

  if (activeView === 'letters') {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto text-center font-sans mt-10">
        <button onClick={() => setActiveView('menu')} className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 mx-auto">
          <ChevronRight className="rotate-180" /> Back to Camp
        </button>
        <h2 className="text-5xl font-black text-white mb-12">Letter Hunt 🔤</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter) => (
            <button 
              key={letter}
              onClick={() => {
                speak(`${letter}!`);
                confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 }, colors: [user.themeHex] });
              }}
              className="aspect-square bg-sky-500 rounded-[2rem] flex items-center justify-center text-7xl font-bold text-white shadow-[0_10px_30px_rgba(14,165,233,0.3)] hover:-translate-y-2 hover:scale-105 active:scale-95 transition-all border-4 border-white/20"
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeView === 'numbers') {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto text-center font-sans mt-10">
        <button onClick={() => setActiveView('menu')} className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 mx-auto">
          <ChevronRight className="rotate-180" /> Back to Camp
        </button>
        <h2 className="text-5xl font-black text-white mb-12">Count Trail 🔢</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button 
              key={num}
              onClick={() => {
                speak(`${num}!`);
                confetti({ particleCount: num * 10, spread: 60, origin: { y: 0.8 }, colors: [user.themeHex, '#ffffff'] });
              }}
              className="aspect-square bg-amber-500 rounded-full flex items-center justify-center text-7xl font-bold text-white shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:-translate-y-2 hover:scale-105 active:scale-95 transition-all border-4 border-white/20"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeView === 'nature') {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto text-center font-sans mt-10">
        <button onClick={() => setActiveView('menu')} className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 mx-auto">
          <ChevronRight className="rotate-180" /> Back to Camp
        </button>
        <h2 className="text-5xl font-black text-white mb-12">Nature Walk 🌲</h2>
        <div className="grid grid-cols-2 gap-8">
          {[
            { icon: '🦋', name: 'Butterfly', color: 'bg-purple-500', shadow: 'shadow-[0_10px_30px_rgba(168,85,247,0.4)]' },
            { icon: '🐸', name: 'Frog', color: 'bg-green-500', shadow: 'shadow-[0_10px_30px_rgba(34,197,94,0.4)]' },
            { icon: '🍄', name: 'Mushroom', color: 'bg-red-500', shadow: 'shadow-[0_10px_30px_rgba(239,68,68,0.4)]' },
            { icon: '🦉', name: 'Owl', color: 'bg-stone-600', shadow: 'shadow-[0_10px_30px_rgba(87,83,78,0.4)]' }
          ].map((item) => (
            <button 
              key={item.name}
              onClick={() => {
                speak(`Look! It's a ${item.name}!`);
                confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
              }}
              className={cn("aspect-square rounded-[3rem] flex flex-col items-center justify-center hover:-translate-y-2 hover:scale-105 active:scale-95 transition-all border-4 border-white/20", item.color, item.shadow)}
            >
              <div className="text-8xl mb-4">{item.icon}</div>
              <div className="text-2xl font-bold text-white">{item.name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto text-center font-sans mt-10">
      <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Ready for adventure, {user.name}? 🗺️</h1>
      <p className="text-xl text-gray-400 mb-12 font-medium">Choose your path today!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div 
          onClick={() => setActiveView('letters')}
          className="group aspect-square bg-[#0a0a0a] border-4 border-white/10 rounded-[3rem] hover:border-[var(--theme-color)] hover:-translate-y-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 shadow-2xl relative overflow-hidden"
          style={{ '--theme-color': user.themeHex } as React.CSSProperties}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-color)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-500 relative z-10">🔤</div>
          <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Letter Hunt</h2>
        </div>

        <div 
          onClick={() => setActiveView('numbers')}
          className="group aspect-square bg-[#0a0a0a] border-4 border-white/10 rounded-[3rem] hover:border-[var(--theme-color)] hover:-translate-y-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 shadow-2xl relative overflow-hidden"
          style={{ '--theme-color': user.themeHex } as React.CSSProperties}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-color)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-500 relative z-10">🔢</div>
          <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Count Trail</h2>
        </div>

        <div 
          onClick={() => setActiveView('nature')}
          className="group aspect-square bg-[#0a0a0a] border-4 border-white/10 rounded-[3rem] hover:border-[var(--theme-color)] hover:-translate-y-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 shadow-2xl relative overflow-hidden"
          style={{ '--theme-color': user.themeHex } as React.CSSProperties}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-color)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-500 relative z-10">🌲</div>
          <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Nature Walk</h2>
        </div>
      </div>
    </div>
  );
}
