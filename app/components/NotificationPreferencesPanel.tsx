'use client';

import { useEffect, useState } from 'react';
import { BellRing, RefreshCw, Save } from 'lucide-react';
import {
  getNotificationMatches,
  getNotificationPreferences,
  putNotificationPreferences,
  type NotificationMatch,
} from '../lib/notificationApi';

function parseEntries(value: string): string[] {
  return Array.from(new Set(
    value
      .split(/[、,\n]/)
      .map((item) => item.trim())
      .filter(Boolean),
  )).slice(0, 20);
}

async function fetchNotificationState() {
  const [preferences, matches] = await Promise.all([
    getNotificationPreferences(),
    getNotificationMatches(),
  ]);
  return { preferences, matches };
}

export default function NotificationPreferencesPanel() {
  const [themes, setThemes] = useState('');
  const [municipalities, setMunicipalities] = useState('');
  const [keywords, setKeywords] = useState('');
  const [matches, setMatches] = useState<NotificationMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { preferences, matches: nextMatches } = await fetchNotificationState();
      setThemes(preferences.interest_themes.join('、'));
      setMunicipalities(preferences.municipalities.join('、'));
      setKeywords(preferences.keywords.join('、'));
      setMatches(nextMatches);
    } catch {
      setError('通知条件を取得できませんでした。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void fetchNotificationState()
      .then(({ preferences, matches: nextMatches }) => {
        if (cancelled) return;
        setThemes(preferences.interest_themes.join('、'));
        setMunicipalities(preferences.municipalities.join('、'));
        setKeywords(preferences.keywords.join('、'));
        setMatches(nextMatches);
      })
      .catch(() => {
        if (!cancelled) setError('通知条件を取得できませんでした。');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const savedPreferences = await putNotificationPreferences({
        interest_themes: parseEntries(themes),
        municipalities: parseEntries(municipalities),
        keywords: parseEntries(keywords),
      });
      setThemes(savedPreferences.interest_themes.join('、'));
      setMunicipalities(savedPreferences.municipalities.join('、'));
      setKeywords(savedPreferences.keywords.join('、'));
      setSaved(true);
      try {
        setMatches(await getNotificationMatches());
      } catch {
        setError('通知条件は保存しましたが、一致件数を更新できませんでした。');
      }
    } catch {
      setError('通知条件を保存できませんでした。入力内容は保持されています。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
      <summary className="cursor-pointer list-none text-sm font-bold text-emerald-900 dark:text-emerald-200">
        <span className="inline-flex items-center gap-2"><BellRing className="h-4 w-4" />関心テーマの通知条件</span>
      </summary>
      <div className="mt-4 space-y-3" data-testid="notification-preferences">
        {loading ? (
          <p role="status" className="text-xs text-slate-600 dark:text-slate-300">通知条件を読み込んでいます…</p>
        ) : (
          <>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              地域（読点・カンマ区切り）
              <input value={municipalities} onChange={(event) => { setMunicipalities(event.target.value); setSaved(false); }} placeholder="東京都、新宿区" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              関心テーマ
              <input value={themes} onChange={(event) => { setThemes(event.target.value); setSaved(false); }} placeholder="子育て、交通、生成AI" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              キーワード
              <input value={keywords} onChange={(event) => { setKeywords(event.target.value); setSaved(false); }} placeholder="予約、支援情報" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                <Save className="h-3.5 w-3.5" />{saving ? '保存中…' : '通知条件を保存'}
              </button>
              <button type="button" onClick={() => void load()} disabled={saving} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-60">
                <RefreshCw className="h-3.5 w-3.5" />再読込
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-300">一致する議題 {matches.length}件</span>
            </div>
            {saved && <p role="status" className="text-xs font-medium text-emerald-700">通知条件を保存しました。</p>}
          </>
        )}
        {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
      </div>
    </details>
  );
}
