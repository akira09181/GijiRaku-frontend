'use client';

import { useEffect, useState } from 'react';
import { Award, X } from 'lucide-react';
import {
  BADGE_UNLOCK_EVENT,
  CITIZEN_BADGES,
  getCitizenBadge,
  loadUnlockedBadges,
  type CitizenBadgeId,
} from '../../lib/citizenBadges';

export default function CitizenBadgePanel() {
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState<readonly CitizenBadgeId[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setUnlocked(loadUnlockedBadges()));

    const handleUnlock = (event: Event) => {
      const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
      if (typeof id !== 'string') return;
      const badge = getCitizenBadge(id as CitizenBadgeId);
      if (!badge) return;
      setUnlocked(loadUnlockedBadges());
      setToast(`${badge.emoji} ${badge.label} を獲得しました`);
      window.setTimeout(() => setToast(null), 4000);
    };

    window.addEventListener(BADGE_UNLOCK_EVENT, handleUnlock);
    return () => window.removeEventListener(BADGE_UNLOCK_EVENT, handleUnlock);
  }, []);

  return (
    <>
      <button
        type="button"
        data-testid="citizen-badge-button"
        onClick={() => setOpen(true)}
        className="relative px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5"
        aria-label={`市民バッジ ${unlocked.length}個`}
      >
        <Award className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">バッジ</span>
        <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.5 text-[10px] min-w-5">
          {unlocked.length}
        </span>
      </button>

      {toast && (
        <div
          role="status"
          data-testid="badge-toast"
          className="fixed top-20 left-1/2 z-[120] -translate-x-1/2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 shadow-lg dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
        >
          {toast}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-950/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="citizen-badge-title"
            data-testid="citizen-badge-panel"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="citizen-badge-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  市民バッジ
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  参加の記録です。個人名は表示されません。
                </p>
              </div>
              <button type="button" aria-label="閉じる" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="mt-4 space-y-3">
              {CITIZEN_BADGES.map((badge) => {
                const earned = unlocked.includes(badge.id);
                return (
                  <li
                    key={badge.id}
                    data-testid={`citizen-badge-item-${badge.id}`}
                    data-earned={earned}
                    className={`rounded-xl border p-3 ${earned ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 opacity-70'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">{badge.emoji}</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{badge.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{badge.description}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
