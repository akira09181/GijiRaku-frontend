'use client';

import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import {
  applyEducationModeAttribute,
  EDUCATION_MODE_EVENT,
  loadEducationMode,
  saveEducationMode,
} from '../../lib/educationMode';

export default function EducationModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const initial = loadEducationMode();
      setEnabled(initial);
      applyEducationModeAttribute(initial);
    });

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: unknown }>).detail;
      if (typeof detail?.enabled === 'boolean') {
        setEnabled(detail.enabled);
      }
    };
    window.addEventListener(EDUCATION_MODE_EVENT, handleChange);
    return () => window.removeEventListener(EDUCATION_MODE_EVENT, handleChange);
  }, []);

  return (
    <button
      type="button"
      data-testid="education-mode-toggle"
      aria-pressed={enabled}
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        saveEducationMode(next);
      }}
      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
        enabled
          ? 'bg-sky-600 text-white border-sky-500'
          : 'dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700/70 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
      }`}
      title="主権者教育向けにUIを簡素化します"
    >
      <GraduationCap className="w-3.5 h-3.5" />
      <span className="hidden lg:inline">{enabled ? '教育モードON' : '主権者教育'}</span>
    </button>
  );
}
