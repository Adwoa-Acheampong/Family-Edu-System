import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface UIContextValue {
  isSidebarOpen: boolean;
  isAiOpen: boolean;
  isDarkMode: boolean;
  notice: string;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  openAi: () => void;
  closeAi: () => void;
  toggleAi: () => void;
  setDarkMode: (v: boolean) => void;
  toggleDarkMode: () => void;
  setNotice: (msg: string) => void;
  clearNotice: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAiOpen, setAiOpen] = useState(false);
  const [isDarkMode, setDarkMode] = useState(true);
  const [notice, setNoticeState] = useState('');

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  React.useEffect(() => {
    const open = () => setAiOpen(true);
    window.addEventListener('fes-open-ai', open);
    return () => window.removeEventListener('fes-open-ai', open);
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      isSidebarOpen,
      isAiOpen,
      isDarkMode,
      notice,
      setSidebarOpen,
      toggleSidebar: () => setSidebarOpen((v) => !v),
      openAi: () => setAiOpen(true),
      closeAi: () => setAiOpen(false),
      toggleAi: () => setAiOpen((v) => !v),
      setDarkMode,
      toggleDarkMode: () => setDarkMode((v) => !v),
      setNotice: (msg: string) => setNoticeState(msg),
      clearNotice: () => setNoticeState(''),
    }),
    [isSidebarOpen, isAiOpen, isDarkMode, notice]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
