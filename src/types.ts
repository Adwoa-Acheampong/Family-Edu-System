export type ThemeColor = 'gold' | 'emerald' | 'cyan' | 'amber' | 'purple' | 'lime';

export interface User {
  id: string;
  name: string;
  age: number;
  persona: string;
  theme: ThemeColor;
  themeHex: string;
  avatarInitials: string;
  role: 'admin' | 'learner';
  aiAssistantRole: string;
  learningFocus: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}
