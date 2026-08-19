'use client';

import React from 'react';
import { Landmark, BarChart3 } from 'lucide-react';
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
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* ロゴ & サービス名 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight shrink-0">
              マチボイス
            </h1>
            <span className="text-xs text-slate-400 font-mono hidden xs:inline">MachiVoice</span>
          </div>
        </div>

        {/* B2B / 行政向け導線 */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onOpenAnalytics}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            aria-label="議員・行政向けEBPM分析を開く"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">議員・行政向け分析</span>
            <span className="sm:hidden">行政向け</span>
          </button>
        </div>
      </div>
    </header>
  );
}
