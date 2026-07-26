import React from 'react';
import { User } from '../types';

export function LearningHub({ user }: { user: User }) {
  return (
    <div className="p-6 md:p-10 font-sans max-w-5xl mx-auto animate-in fade-in duration-300">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-6">Learning Hub</h1>
      <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-3xl p-12 text-center shadow-xl">
        <div className="text-6xl mb-6">📚</div>
        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Welcome to the Learning Hub, {user.name}!</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Your curated courses, assignments, and educational materials will appear here.</p>
      </div>
    </div>
  );
}

export function MyProfile({ user }: { user: User }) {
  return (
    <div className="p-6 md:p-10 font-sans max-w-3xl mx-auto animate-in fade-in duration-300">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-6">My Profile</h1>
      <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 opacity-20" style={{ backgroundColor: user.themeHex }} />
        
        <div 
          className="w-32 h-32 rounded-[2rem] flex items-center justify-center text-5xl font-bold mb-6 text-white relative z-10 shadow-2xl border-4 border-white/20 dark:border-black/20"
          style={{ backgroundColor: user.themeHex }}
        >
          {user.avatarInitials}
        </div>
        <h2 className="text-3xl font-bold mb-1 text-gray-900 dark:text-white relative z-10">{user.name}</h2>
        <div className="text-[var(--theme-color)] font-bold tracking-[0.2em] uppercase text-xs mb-8 relative z-10">{user.persona}</div>
        
        <div className="w-full space-y-6 text-left border-t border-black/5 dark:border-white/5 pt-8 relative z-10">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-black/50 p-4 rounded-2xl border border-black/5 dark:border-white/5">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Age</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{user.age}</div>
            </div>
            <div className="bg-gray-50 dark:bg-black/50 p-4 rounded-2xl border border-black/5 dark:border-white/5">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Role</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white capitalize">{user.role}</div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-black/50 p-4 rounded-2xl border border-black/5 dark:border-white/5">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Learning Focus</div>
            <div className="text-base font-medium text-gray-900 dark:text-white">{user.learningFocus}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
