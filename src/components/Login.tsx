import React, { useState } from 'react';
import { USERS } from '../data';
import { User } from '../types';
import { cn } from '../utils';
import { Lock, ArrowRight, Mic, CheckCircle2, ChevronLeft, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [imageSequence, setImageSequence] = useState<number[]>([]);
  
  const handleSelect = (user: User) => {
    if (user.id === 'shee') {
      onLogin(user);
    } else {
      setSelectedUser(user);
      setPassword('');
      setPin('');
      setImageSequence([]);
    }
  };

  const handlePin = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => onLogin(selectedUser!), 500);
      }
    }
  };

  const handleImageSelect = (idx: number) => {
    if (imageSequence.length < 3) {
      const newSeq = [...imageSequence, idx];
      setImageSequence(newSeq);
      if (newSeq.length === 3) {
        setTimeout(() => onLogin(selectedUser!), 500);
      }
    }
  };

  const handleKwekuLogin = () => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("Welcome Kweku!");
      msg.rate = 1.2;
      window.speechSynthesis.speak(msg);
    }
    onLogin(selectedUser!);
  };

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-6 text-white font-sans">
        <button 
          onClick={() => setSelectedUser(null)}
          className="absolute top-8 left-8 text-gray-500 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest text-xs font-bold"
        >
          <ChevronLeft size={16} /> Back
        </button>
        
        <div 
          className="w-32 h-32 rounded-[2rem] mb-8 flex items-center justify-center text-4xl font-semibold shadow-xl border border-white/10"
          style={{ backgroundColor: `${selectedUser.themeHex}10`, color: selectedUser.themeHex, borderColor: selectedUser.themeHex }}
        >
          {selectedUser.avatarInitials}
        </div>
        <h2 className="text-3xl font-medium mb-10 text-white">{selectedUser.name}</h2>

        {/* Aba & Kobby - Password Input */}
        {(selectedUser.id === 'aba' || selectedUser.id === 'kobby') && (
          <form 
            onSubmit={(e) => { e.preventDefault(); onLogin(selectedUser); }} 
            className="w-full max-w-sm flex flex-col gap-4"
          >
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (any to continue)"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                style={{ '--theme-color': selectedUser.themeHex } as React.CSSProperties}
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              style={{ color: selectedUser.themeHex }}
            >
              Sign In <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Badu - 4 Digit PIN */}
        {selectedUser.id === 'badu' && (
          <div className="w-full max-w-xs">
            <div className="flex justify-center gap-4 mb-8">
              {[0,1,2,3].map(i => (
                <div 
                  key={i} 
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-colors",
                    pin.length > i ? "bg-[var(--theme-color)] border-[var(--theme-color)]" : "border-white/20"
                  )}
                  style={{ '--theme-color': selectedUser.themeHex } as React.CSSProperties}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3,4,5,6,7,8,9].map(num => (
                <button 
                  key={num}
                  onClick={() => handlePin(num.toString())}
                  className="aspect-square rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-2xl font-light transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
              <div />
              <button 
                onClick={() => handlePin('0')}
                className="aspect-square rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-2xl font-light transition-all active:scale-95"
              >
                0
              </button>
              <button 
                onClick={() => setPin(pin.slice(0, -1))}
                className="aspect-square rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-bold uppercase text-gray-500 transition-all active:scale-95 flex items-center justify-center"
              >
                Del
              </button>
            </div>
          </div>
        )}

        {/* Pappy & Seth - Picture Sequence */}
        {(selectedUser.id === 'pappy' || selectedUser.id === 'seth') && (
          <div className="w-full max-w-sm">
            <p className="text-gray-400 mb-6 text-center">Tap 3 pictures to unlock!</p>
            <div className="flex justify-center gap-3 mb-8">
              {[0,1,2].map(i => (
                <div 
                  key={i} 
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all border-2",
                    imageSequence.length > i ? "bg-white/10 border-[var(--theme-color)]" : "border-white/10"
                  )}
                  style={{ '--theme-color': selectedUser.themeHex } as React.CSSProperties}
                >
                  {imageSequence.length > i ? (selectedUser.id === 'seth' ? ['🌲', '🦋', '🐸', '🍄'] : ['🚀', '🦊', '🪐', '⭐'])[imageSequence[i]] : ''}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(selectedUser.id === 'seth' ? ['🌲', '🦋', '🐸', '🍄'] : ['🚀', '🦊', '🪐', '⭐']).map((emoji, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleImageSelect(idx)}
                  className="aspect-square bg-white/5 border border-white/10 rounded-3xl text-5xl hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center hover:border-[var(--theme-color)]"
                  style={{ '--theme-color': selectedUser.themeHex } as React.CSSProperties}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Kweku - Voice/Action */}
        {selectedUser.id === 'kweku' && (
          <div className="flex flex-col items-center">
            <button 
              onClick={handleKwekuLogin}
              className="w-48 h-48 rounded-[3rem] bg-[var(--theme-color)]/20 border-4 border-[var(--theme-color)] flex flex-col items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all text-[var(--theme-color)] shadow-[0_0_50px_var(--theme-color)]"
              style={{ '--theme-color': selectedUser.themeHex } as React.CSSProperties}
            >
              <Mic size={48} />
              <span className="font-bold text-xl uppercase tracking-widest">Tap to start</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-white/20">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white/10 rounded-2xl rotate-12 flex items-center justify-center border border-white/20">
            <ShieldCheck size={24} className="text-white -rotate-12" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
          Educational ERP Hub
        </h1>
        <p className="text-gray-400 text-sm tracking-widest uppercase font-bold">Select Profile</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 max-w-4xl w-full">
        {USERS.map((user) => (
          <button
            key={user.id}
            onClick={() => handleSelect(user)}
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
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{user.persona}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
