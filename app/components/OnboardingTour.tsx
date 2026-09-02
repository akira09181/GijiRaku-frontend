'use client';

import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';

export const ONBOARDING_STORAGE_KEY = 'gijiraku_onboarding_v1';

const STEPS = [
  {
    selector: '#my-area-selector',
    title: 'Myエリアを選ぶ',
    description: '選んだ地域はこの端末に記憶され、次回からその地域の議題を表示します。',
  },
  {
    selector: '#semantic-search-title',
    title: '言葉が違っても検索',
    description: '知りたいことを普段の言葉で入力すると、意味が近い議題や発言を探せます。',
  },
  {
    selector: '#issue-list',
    title: '議題を確かめる',
    description: '議員の質問、行政答弁、原文、市民の反応を同じ議題IDのまま確認できます。',
  },
  {
    selector: '[data-onboarding="follows"]',
    title: '変化を追いかける',
    description: '気になる議題をフォローすると、答弁や進捗の更新を次回訪問時に確認できます。',
  },
] as const;

interface HighlightRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

function visibleTarget(selector: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find((element) => (
    element.getClientRects().length > 0
  )) || null;
}

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  const updateHighlight = useCallback(() => {
    const target = visibleTarget(STEPS[stepIndex].selector);
    if (!target) {
      setHighlightRect(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    setHighlightRect({
      top: Math.max(8, rect.top - 6),
      left: Math.max(8, rect.left - 6),
      width: Math.min(window.innerWidth - 16, rect.width + 12),
      height: rect.height + 12,
    });
  }, [stepIndex]);

  useEffect(() => {
    let completed = false;
    try {
      completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'completed';
    } catch {
      // A private browser may not provide storage; the tour can still be shown.
    }
    if (completed) return;
    const timer = window.setTimeout(() => setActive(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!active) return;
    const target = visibleTarget(STEPS[stepIndex].selector);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = window.setTimeout(updateHighlight, 350);
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [active, stepIndex, updateHighlight]);

  const finish = () => {
    try { localStorage.setItem(ONBOARDING_STORAGE_KEY, 'completed'); } catch { /* optional */ }
    setActive(false);
    setHighlightRect(null);
  };

  if (!active) return null;
  const step = STEPS[stepIndex];
  const tooltipAbove = highlightRect && highlightRect.top > window.innerHeight * 0.55;
  const tooltipStyle = highlightRect
    ? {
        left: Math.min(Math.max(12, highlightRect.left), Math.max(12, window.innerWidth - 332)),
        top: tooltipAbove
          ? Math.max(12, highlightRect.top - 188)
          : Math.min(window.innerHeight - 190, highlightRect.top + highlightRect.height + 12),
      }
    : { left: 12, top: Math.max(12, window.innerHeight / 2 - 90) };

  return (
    <div data-testid="onboarding-tour" className="pointer-events-none fixed inset-0 z-[70]" aria-live="polite">
      {highlightRect && (
        <div
          aria-hidden="true"
          className="fixed rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.58)] transition-all duration-300"
          style={highlightRect}
        />
      )}
      {!highlightRect && <div aria-hidden="true" className="fixed inset-0 bg-slate-950/60" />}
      <section
        role="dialog"
        aria-label="初回ガイド"
        className="pointer-events-none fixed w-[calc(100%-24px)] max-w-xs rounded-2xl border border-emerald-300 bg-white p-4 text-slate-900 shadow-2xl dark:border-emerald-800 dark:bg-slate-900 dark:text-white"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">はじめてのマチボイス {stepIndex + 1}/{STEPS.length}</p>
            <h2 className="mt-1 text-sm font-bold">{step.title}</h2>
          </div>
          <button type="button" onClick={finish} className="pointer-events-auto rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="ガイドを閉じる"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{step.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={finish} className="pointer-events-auto text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white">スキップ</button>
          <div className="flex gap-2">
            {stepIndex > 0 && <button type="button" onClick={() => setStepIndex((current) => current - 1)} className="pointer-events-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold dark:border-slate-700">戻る</button>}
            <button
              type="button"
              onClick={() => stepIndex === STEPS.length - 1 ? finish() : setStepIndex((current) => current + 1)}
              className="pointer-events-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
            >
              {stepIndex === STEPS.length - 1 ? '使ってみる' : '次へ'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
