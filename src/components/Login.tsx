import React from 'react';
import { USERS } from '../data';
import { User } from '../types';
import { cn } from '../utils';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-white/20">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-8 border-[3px] border-white/20 rounded-sm rotate-45 flex items-center justify-center">
            <div className="w-3 h-3 bg-white/40 -rotate-45" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-light mb-4 tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
          Educational ERP
        </h1>
        <p className="text-gray-400 text-sm tracking-widest uppercase">Select Profile to Resume Learning</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 max-w-4xl w-full">
        {USERS.map((user) => (
          <button
            key={user.id}
            onClick={() => onLogin(user)}
            className="flex flex-col items-center group transition-all duration-300 hover:-translate-y-2"
            style={{ '--hover-color': user.themeHex } as React.CSSProperties}
          >
            <div 
              className={cn(
                "w-32 h-32 rounded-[2rem] mb-5 flex items-center justify-center text-4xl font-semibold shadow-xl",
                "border border-white/10 bg-white/5 transition-all duration-300",
                "group-hover:border-[var(--hover-color)] group-hover:bg-[var(--hover-color)]/10 group-hover:shadow-[0_10px_40px_-10px_var(--hover-color)]"
              )}
              style={{ color: user.themeHex }}
            >
              {user.avatarInitials}
            </div>
            <h2 className="text-xl font-medium mb-1 text-gray-200 group-hover:text-white transition-colors">{user.name}</h2>
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">{user.persona}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
