'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, BarChart3, Sun, Moon, User, Bell } from 'lucide-react';
import { Assembly } from '../types/assembly';

interface HeaderProps {
  readonly onOpenAnalytics: () => void;
  readonly onOpenMyActivity?: () => void;
  readonly defaultAssembly?: Assembly;
}

/**
 * アプリケーション共通ヘッダー
 */
export default function Header({
  onOpenAnalytics,
  onOpenMyActivity,
}: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('gijiraku_theme') as 'dark' | 'light' | null;
      if (storedTheme) {
        setTheme(storedTheme);
      }
      const storedFont = localStorage.getItem('gijiraku_font_size') as 'normal' | 'large' | 'xlarge' | null;
      if (storedFont) {
        setFontSize(storedFont);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('gijiraku_theme', nextTheme);
    window.dispatchEvent(new CustomEvent('theme_changed', { detail: { theme: nextTheme } }));
  };

  const changeFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSize(size);
    localStorage.setItem('gijiraku_font_size', size);
    document.documentElement.setAttribute('data-font-size', size);
    window.dispatchEvent(new CustomEvent('font_size_changed', { detail: { fontSize: size } }));
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

        {/* 右側アクションエリア */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 文字サイズ変更ピル */}
          <div className="hidden md:flex items-center gap-0.5 p-1 rounded-lg dark:bg-slate-800/80 dark:border-slate-700/70 bg-slate-100 border-slate-300 border text-xs">
            <span className="px-1 text-slate-500 font-bold text-[11px]">文字</span>
            <button
              onClick={() => changeFontSize('normal')}
              className={`px-1.5 py-0.5 rounded font-semibold transition-all text-[11px] ${
                fontSize === 'normal'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'dark:text-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              標準
            </button>
            <button
              onClick={() => changeFontSize('large')}
              className={`px-1.5 py-0.5 rounded font-semibold transition-all text-[11px] ${
                fontSize === 'large'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'dark:text-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              大
            </button>
            <button
              onClick={() => changeFontSize('xlarge')}
              className={`px-1.5 py-0.5 rounded font-semibold transition-all text-[11px] ${
                fontSize === 'xlarge'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'dark:text-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              特大
            </button>
          </div>

          {/* マイアクティビティ（履歴・保存状態） */}
          {onOpenMyActivity && (
            <button
              onClick={onOpenMyActivity}
              className="px-2.5 py-1.5 rounded-xl dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:border-slate-700/70 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="閲覧履歴・リアクション履歴・通知購読を確認"
            >
              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">マイアクティビティ</span>
            </button>
          )}

          {/* テーマ切替 */}
          <button
            onClick={toggleTheme}
            className="px-2 py-1.5 rounded-xl dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:border-slate-700/70 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 border text-xs font-medium flex items-center gap-1.5 transition-colors"
            aria-label="テーマ切替"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
          </button>

          {/* 行政・議員向け分析ダッシュボード導線 */}
          <button
            onClick={onOpenAnalytics}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            aria-label="議員・行政向けEBPM分析を開く"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">行政向けEBPM分析</span>
            <span className="sm:hidden">行政分析</span>
          </button>
        </div>
      </div>
    </header>
  );
}
