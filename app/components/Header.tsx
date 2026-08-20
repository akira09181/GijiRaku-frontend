'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, BarChart3, Sun, Moon } from 'lucide-react';
import { Assembly } from '../types/assembly';

interface HeaderProps {
  readonly onOpenAnalytics: () => void;
  readonly defaultAssembly?: Assembly;
}

/**
  * アプリケーション共通ヘッダー
  */
export default function Header({
  onOpenAnalytics,
}: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const storedTheme = localStorage.getItem('gijiraku_theme') as 'dark' | 'light' | null;
      return storedTheme || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('gijiraku_theme', nextTheme);
    window.dispatchEvent(new CustomEvent('theme_changed', { detail: { theme: nextTheme } }));
  };

  return (
    <header className="sticky top-0 z-40 dark:bg-slate-900/90 dark:border-slate-800 bg-white/90 border-slate-200 backdrop-blur-md border-b px-4 sm:px-6 py-3 transition-colors shadow-xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* ロゴ & サービス名 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-bold dark:text-white text-slate-900 tracking-tight shrink-0">
              マチボイス
            </h1>
            <span className="text-xs dark:text-slate-400 text-slate-500 font-mono hidden xs:inline">MachiVoice</span>
          </div>
        </div>

        {/* テーマ切替 ＆ 行政向け導線 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="px-2.5 py-1.5 rounded-lg dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700/70 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 border text-xs font-medium flex items-center gap-1.5 transition-colors"
            aria-label="テーマ切替"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline">ライト</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden xs:inline">ダーク</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenAnalytics}
            className="px-3 py-1.5 rounded-lg dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700/70 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 border text-xs font-medium flex items-center gap-1.5 transition-colors"
            aria-label="議員・行政向けEBPM分析を開く"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">議員・行政向け分析</span>
            <span className="sm:hidden">行政向け</span>
          </button>
        </div>
      </div>
    </header>
  );
}
