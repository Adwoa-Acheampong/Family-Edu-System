import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { X, Send, Bot, User as UserIcon, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../utils';
import { sendChatMessage } from '../lib/api';

interface AIAssistantProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistant({ user, isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      conversationIdRef.current = undefined;
      setMessages([
        {
          id: '1',
          text: `Hello ${user.name}! I am your ${user.aiAssistantRole}. How can I assist you with ${user.learningFocus} today?`,
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, user, messages.length]);

  useEffect(() => {
    // Reset thread when switching family member
    conversationIdRef.current = undefined;
    setMessages([]);
    setInput('');
  }, [user.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const messageText = input.trim();

    const newMsg: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const data = await sendChatMessage({
        message: messageText,
        persona: user.persona,
        userName: user.name,
        age: user.age,
        learningFocus: user.learningFocus,
        conversationId: conversationIdRef.current,
        aiAssistantRole: user.aiAssistantRole,
      });

      conversationIdRef.current = data.conversationId;

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error(error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: user.age <= 8
          ? "Oops! Let's try again!"
          : "I encountered an error connecting to the Engine Room. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:bottom-6 sm:right-6 bg-[#0a0a0a] sm:rounded-2xl border border-white/10 shadow-2xl flex flex-col z-50 transform transition-all duration-300 overflow-hidden",
        isExpanded
          ? "w-full sm:w-[600px] h-full sm:h-[80vh] sm:max-h-[800px]"
          : "w-full sm:w-[380px] h-[75vh] sm:h-[600px] sm:max-h-[600px]"
      )}
      style={{ '--tw-ring-color': user.themeHex } as React.CSSProperties}
    >
      <div className="p-4 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{ borderColor: `${user.themeHex}40`, color: user.themeHex, backgroundColor: `${user.themeHex}10` }}
          >
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">{user.aiAssistantRole}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user.themeHex }} />
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Gemini Online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors hidden sm:block"
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3 max-w-[88%]", msg.sender === 'user' ? "ml-auto flex-row-reverse" : "")}>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto",
                msg.sender === 'ai' ? "border" : "bg-white/10"
              )}
              style={msg.sender === 'ai' ? { borderColor: `${user.themeHex}50`, color: user.themeHex, backgroundColor: `${user.themeHex}15` } : {}}
            >
              {msg.sender === 'ai' ? <Bot size={14} /> : <UserIcon size={14} className="text-white" />}
            </div>
            <div
              className={cn(
                "p-3.5 text-[13px] leading-relaxed whitespace-pre-wrap",
                msg.sender === 'user'
                  ? "bg-white/10 text-white rounded-2xl rounded-br-sm"
                  : "bg-black text-gray-300 rounded-2xl rounded-bl-sm border border-white/5 shadow-md"
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 max-w-[88%]">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto border"
              style={{ borderColor: `${user.themeHex}50`, color: user.themeHex, backgroundColor: `${user.themeHex}15` }}
            >
              <Bot size={14} />
            </div>
            <div className="p-3.5 bg-black text-gray-300 rounded-2xl rounded-bl-sm border border-white/5 shadow-md flex items-center gap-1.5 h-11 px-4">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#0a0a0a] border-t border-white/5">
        <div className="flex items-center gap-2 bg-black border border-white/10 rounded-xl p-1.5 focus-within:border-[var(--tw-ring-color)] focus-within:ring-1 focus-within:ring-[var(--tw-ring-color)]/20 transition-all shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Message ${user.aiAssistantRole}...`}
            className="flex-1 bg-transparent border-none text-white text-sm px-3 py-2 outline-none placeholder:text-gray-600"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:bg-transparent disabled:text-gray-600"
            style={input.trim() && !isTyping ? { backgroundColor: user.themeHex, color: '#000' } : {}}
            disabled={!input.trim() || isTyping}
          >
            <Send size={16} className={input.trim() ? "ml-0.5" : ""} />
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[9px] text-gray-600 tracking-widest uppercase">Powered by Gemini</span>
        </div>
      </div>
    </div>
  );
}
