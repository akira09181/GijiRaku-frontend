'use client';

import React from 'react';
import { Building2, Landmark } from 'lucide-react';
import type { HomeScope } from '../data/homeScope';

interface HomeScopeTabsProps {
  readonly value: HomeScope;
  readonly onChange: (scope: HomeScope) => void;
}

const TAB_OPTIONS: readonly { id: HomeScope; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'tokyo',
    label: '東京',
    description: '62市区町村 + 都議会',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    id: 'diet',
    label: '国会',
    description: '衆議院・参議院',
    icon: <Landmark className="w-4 h-4" />,
  },
];

export default function HomeScopeTabs({ value, onChange }: HomeScopeTabsProps) {
  return (
    <div
      data-testid="home-scope-tabs"
      className="grid grid-cols-2 gap-2 rounded-2xl border dark:border-slate-800 border-slate-200 dark:bg-slate-950/60 bg-slate-100/80 p-1.5"
      role="tablist"
      aria-label="表示範囲"
    >
      {TAB_OPTIONS.map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            data-testid={`home-scope-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`rounded-xl px-3 py-2.5 text-left transition-all ${
              selected
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                : 'dark:text-slate-300 text-slate-700 dark:hover:bg-slate-900/80 hover:bg-white'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              {tab.icon}
              <span>{tab.label}</span>
            </span>
            <span className={`mt-0.5 block text-[10px] font-medium ${
              selected ? 'text-emerald-50/90' : 'dark:text-slate-400 text-slate-500'
            }`}
            >
              {tab.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
