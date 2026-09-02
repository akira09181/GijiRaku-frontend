'use client';

import { useEffect, useState } from 'react';
import { BookmarkCheck, List, MapPin, Moon, Sun, Type } from 'lucide-react';

interface MobileBottomNavigationProps {
  readonly followCount: number | null;
  readonly unreadFollowCount: number;
  readonly followUnavailable: boolean;
  readonly onOpenFollows: () => void;
}

type Theme = 'dark' | 'light';
type FontSize = 'normal' | 'large' | 'xlarge';

const FONT_SIZE_ORDER: readonly FontSize[] = ['normal', 'large', 'xlarge'];
const FONT_SIZE_LABEL: Readonly<Record<FontSize, string>> = {
  normal: '標準',
  large: '大',
  xlarge: '特大',
};

export default function MobileBottomNavigation({
  followCount,
  unreadFollowCount,
  followUnavailable,
  onOpenFollows,
}: MobileBottomNavigationProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('normal');

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const storedTheme = localStorage.getItem('gijiraku_theme');
        const storedFontSize = localStorage.getItem('gijiraku_font_size');
        if (storedTheme === 'dark' || storedTheme === 'light') setTheme(storedTheme);
        if (storedFontSize === 'normal' || storedFontSize === 'large' || storedFontSize === 'xlarge') {
          setFontSize(storedFontSize);
        }
      } catch {
        // Browser preferences are optional.
      }
    });

    const onThemeChanged = (event: Event) => {
      const nextTheme = (event as CustomEvent<{ theme?: Theme }>).detail?.theme;
      if (nextTheme === 'dark' || nextTheme === 'light') setTheme(nextTheme);
    };
    const onFontSizeChanged = (event: Event) => {
      const nextFontSize = (event as CustomEvent<{ fontSize?: FontSize }>).detail?.fontSize;
      if (nextFontSize && FONT_SIZE_ORDER.includes(nextFontSize)) setFontSize(nextFontSize);
    };
    window.addEventListener('theme_changed', onThemeChanged);
    window.addEventListener('font_size_changed', onFontSizeChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('theme_changed', onThemeChanged);
      window.removeEventListener('font_size_changed', onFontSizeChanged);
    };
  }, []);

  const scrollTo = (selector: string) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    try { localStorage.setItem('gijiraku_theme', nextTheme); } catch { /* optional */ }
    window.dispatchEvent(new CustomEvent('theme_changed', { detail: { theme: nextTheme } }));
  };

  const cycleFontSize = () => {
    const nextFontSize = FONT_SIZE_ORDER[(FONT_SIZE_ORDER.indexOf(fontSize) + 1) % FONT_SIZE_ORDER.length];
    setFontSize(nextFontSize);
    document.documentElement.setAttribute('data-font-size', nextFontSize);
    try { localStorage.setItem('gijiraku_font_size', nextFontSize); } catch { /* optional */ }
    window.dispatchEvent(new CustomEvent('font_size_changed', { detail: { fontSize: nextFontSize } }));
  };

  return (
    <nav aria-label="モバイルナビゲーション" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-950/95">
      <button type="button" onClick={() => scrollTo('#issue-list')} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
        <List className="h-4 w-4" /><span>議題</span>
      </button>
      <button type="button" onClick={() => scrollTo('#my-area-selector')} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
        <MapPin className="h-4 w-4" /><span>Myエリア</span>
      </button>
      <button
        type="button"
        data-onboarding="follows"
        onClick={onOpenFollows}
        aria-label={followUnavailable ? 'フォロー取得失敗' : `フォロー中 ${followCount ?? 0}件`}
        className="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"
      >
        <BookmarkCheck className="h-4 w-4" /><span>フォロー</span>
        {unreadFollowCount > 0 && <span className="absolute right-[24%] top-1.5 min-w-4 rounded-full bg-amber-500 px-1 text-[9px] leading-4 text-white">{unreadFollowCount}</span>}
      </button>
      <button type="button" onClick={cycleFontSize} aria-label={`文字サイズ ${FONT_SIZE_LABEL[fontSize]}`} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
        <Type className="h-4 w-4" /><span>{FONT_SIZE_LABEL[fontSize]}</span>
      </button>
      <button type="button" onClick={toggleTheme} aria-label="テーマ切替" className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
        {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
        <span>{theme === 'dark' ? 'ライト' : 'ダーク'}</span>
      </button>
    </nav>
  );
}
