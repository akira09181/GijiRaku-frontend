'use client';

import React from 'react';
import { Landmark, BarChart3, MessageSquare, ExternalLink } from 'lucide-react';
import { Assembly } from '../types/assembly';

interface HeaderProps {
  readonly onOpenAnalytics: () => void;
  readonly onOpenChat: () => void;
  readonly defaultAssembly?: Assembly;
}

/**
 * アプリケーション共通ヘッダー
 * - スマホ/タブレット/デスクトップに応じたレスポンシブレイアウト
 * - プロフェッショナルなオープンデータ・EBPMツールのトーン＆マナー
 */
export default function Header({
  onOpenAnalytics,
  onOpenChat,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3 sm:py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* ロゴ & サービス名 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-500/10 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                GijiRaku <span className="text-xs sm:text-sm font-normal text-slate-400">議会ナビ</span>
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                EBPM Platform
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden xs:block">
              東京都オープンデータ活用 ・ 議事録対話 & EBPM分析基盤
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* EBPM分析ダッシュボード */}
          <button
            onClick={onOpenAnalytics}
            className="px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            aria-label="EBPM分析ダッシュボードを開く"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">議員・行政向け</span>
            <span>EBPM分析</span>
          </button>

          {/* LINE風対話 */}
          <button
            onClick={onOpenChat}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-600/20"
            aria-label="議事録チャットを開く"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>対話を開く</span>
          </button>
        </div>
      </div>
    </header>
  );
}
