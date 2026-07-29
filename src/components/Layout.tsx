import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { AIAssistant } from './AIAssistant';
import { StorageProgress } from './StorageProgress';
import { getDriveUsage } from '../lib/api';
import {
  Menu,
  Search,
  Bell,
  Grid,
  BookOpen,
  UserCircle,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { cn } from '../utils';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export function Layout({ user, onLogout, activeTab, onTabChange, children }: LayoutProps) {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [driveUsed, setDriveUsed] = useState(2.5 * 1024 ** 3);
  const [driveTotal, setDriveTotal] = useState(15 * 1024 ** 3);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const open = () => setIsAiOpen(true);
    window.addEventListener('fes-open-ai', open);
    return () => window.removeEventListener('fes-open-ai', open);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDriveUsage(user.id)
      .then((d) => {
        if (cancelled || !d) return;
        if (typeof d.used === 'number') setDriveUsed(d.used);
        if (typeof d.total === 'number') setDriveTotal(d.total);
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const nav = [
    { name: 'Dashboard', icon: Grid, id: 'dashboard' },
    { name: 'Learning Hub', icon: BookOpen, id: 'learning-hub' },
    { name: 'My Profile', icon: UserCircle, id: 'profile' },
  ];

  const go = (id: string) => {
    onTabChange(id);
    setIsSidebarOpen(false);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white font-sans flex flex-col overflow-hidden transition-colors duration-500"
      style={{ '--theme-color': user.themeHex } as React.CSSProperties}
    >
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/10 dark:border-white/5 flex items-center h-16 px-4 md:px-6 gap-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-lg"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div
          className="flex items-center gap-3 font-medium text-lg shrink-0 tracking-tight"
          style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif' }}
        >
          <div className="w-5 h-5 border-[2px] border-[var(--theme-color)] rounded-sm rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[var(--theme-color)] -rotate-45" />
          </div>
          EDU HUB
        </div>

        {user.role === 'admin' && (
          <div className="hidden md:flex ml-4 bg-[var(--theme-color)]/10 border border-[var(--theme-color)]/25 rounded-full px-3 py-1 items-center gap-2 text-[10px] font-bold tracking-widest text-[var(--theme-color)] uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-color)] animate-pulse" />
            Architect Mode
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3 md:gap-4">
          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/50 text-xs text-gray-600 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/5 transition-colors">
            <Search size={14} />
            Search...
            <span className="ml-4 border border-black/10 dark:border-white/10 rounded px-1.5 py-0.5 text-[9px] font-mono">⌘K</span>
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-8 h-8 rounded-full border border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button className="w-8 h-8 rounded-full border border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 relative transition-colors">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--theme-color)]" />
          </button>

          <button
            onClick={() => setIsAiOpen(true)}
            className="h-8 px-3 sm:px-4 rounded-full bg-[var(--theme-color)]/10 text-[var(--theme-color)] border border-[var(--theme-color)]/30 flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase hover:bg-[var(--theme-color)]/20 transition-all"
          >
            <MessageSquare size={14} />
            <span className="hidden sm:inline">Engine Room</span>
          </button>

          <div className="h-5 w-px bg-black/10 dark:bg-white/10 hidden sm:block" />

          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-2 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 group transition-colors"
            title="Sign out"
          >
            <div
              className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-bold border border-black/10 dark:border-white/10 group-hover:border-[var(--theme-color)]/50"
              style={{ color: user.themeHex }}
            >
              {user.avatarInitials}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold leading-none text-gray-800 dark:text-gray-200">{user.name}</div>
              <div className="text-[9px] text-[var(--theme-color)] uppercase tracking-wider mt-1 font-bold">{user.persona}</div>
            </div>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            'absolute md:relative w-64 h-full bg-white dark:bg-[#020202] border-r border-black/10 dark:border-white/5 z-30 transition-transform duration-300 flex flex-col',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          <div className="flex-1 overflow-y-auto py-6 px-4">
            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 dark:text-gray-600 uppercase mb-4 px-2">
              Navigation
            </div>
            <nav className="space-y-1.5 mb-8">
              {nav.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                      isActive
                        ? 'bg-[var(--theme-color)]/10 text-[var(--theme-color)]'
                        : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                  >
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 dark:text-gray-600 uppercase mb-4 px-2">
              Current Focus
            </div>
            <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl p-4 mb-6">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 leading-tight">
                {user.learningFocus}
              </div>
              <div className="w-full bg-gray-200 dark:bg-black rounded-full h-1.5 mt-3 overflow-hidden border border-black/10 dark:border-white/5">
                <div className="bg-[var(--theme-color)] h-full w-[45%] rounded-full shadow-[0_0_10px_var(--theme-color)]" />
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">In Progress</span>
                <span className="text-xs text-[var(--theme-color)] font-mono font-bold">45%</span>
              </div>
            </div>

            <StorageProgress usedBytes={driveUsed} totalBytes={driveTotal} />
          </div>

          {user.role === 'admin' && (
            <div className="p-4 border-t border-black/10 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <Settings size={18} />
                System Settings
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto w-full min-h-full">{children}</div>
        </main>
      </div>

      <AIAssistant user={user} isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}
