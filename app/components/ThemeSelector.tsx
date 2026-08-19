'use client';

import React from 'react';
import { Layers, Baby, Laptop, Building2, HeartPulse, Filter } from 'lucide-react';
import { IssueTheme } from '../types/assembly';

interface ThemeOption {
  readonly id: IssueTheme;
  readonly label: string;
  readonly icon: React.ReactNode;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { id: 'all', label: 'すべてのテーマ', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'child', label: '子育て・給食費支援', icon: <Baby className="w-3.5 h-3.5" /> },
  { id: 'dx', label: '行政DX・スマホ手続き', icon: <Laptop className="w-3.5 h-3.5" /> },
  { id: 'redevelop', label: '交通・都市再開発', icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: 'medical', label: '医療・休日夜間診療', icon: <HeartPulse className="w-3.5 h-3.5" /> },
];

interface ThemeSelectorProps {
  readonly selectedTheme: IssueTheme;
  readonly onSelectTheme: (theme: IssueTheme) => void;
}

/**
 * 生活テーマ選択バー
 * - モバイルでの横スワイプスクロール（スクロールバー非表示）に対応
 * - プロフェッショナルなピルチップデザイン
 */
export default function ThemeSelector({
  selectedTheme,
  onSelectTheme,
}: ThemeSelectorProps) {
  return (
    <div className="bg-slate-900/60 border-b border-slate-800 py-2.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* ラベル */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 shrink-0">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-white">政策テーマ絞り込み</span>
          <span className="text-slate-400 hidden md:inline text-[11px] font-normal">
            選択したテーマで議事録・発言データをフィルタリングします
          </span>
        </div>

        {/* チップリスト（横スクロール対応） */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                aria-pressed={isSelected}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {theme.icon}
                <span>{theme.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
