'use client';

import { useState, useSyncExternalStore, useTransition } from 'react';
import { BarChart3, Building2, CalendarRange, FileText, RefreshCw, Users } from 'lucide-react';
import type { ProTrendData, TrendResult } from '../../types/proTrends';
import { getTrendDashboard } from '../../(b2b)/pro/dashboard/actions';

function monthBounds(month: string) {
  const [year, value] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, value, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

export default function TrendDashboard({ initialResult, initialMonth }: {
  readonly initialResult: TrendResult;
  readonly initialMonth: string;
}) {
  const [result, setResult] = useState(initialResult);
  const [month, setMonth] = useState(initialMonth);
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [isPending, startTransition] = useTransition();

  function loadMonth(nextMonth: string) {
    setMonth(nextMonth);
    startTransition(async () => {
      setResult(await getTrendDashboard(monthBounds(nextMonth)));
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Cross-council intelligence</p>
          <h1 className="mt-2 text-3xl font-bold text-white">複数議会トレンド</h1>
          <p className="mt-2 text-sm text-slate-400">公開済みの公式会議録を、議題ID単位で集計しています。</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <CalendarRange className="h-4 w-4 text-emerald-400" />
          対象月
          <input
            type="month"
            value={month}
            disabled={!hydrated || isPending}
            onChange={(event) => loadMonth(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white disabled:cursor-wait disabled:opacity-60"
          />
        </label>
      </div>

      {isPending ? <DashboardSkeleton /> : result.ok ? <DashboardContent data={result.data} /> : (
        <div role="alert" className="rounded-2xl border border-rose-800 bg-rose-950/30 p-6 text-rose-100">
          <p>{result.message}</p>
          <button type="button" onClick={() => loadMonth(month)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-700 px-3 py-2 text-sm font-bold">
            <RefreshCw className="h-4 w-4" />再試行
          </button>
        </div>
      )}
    </main>
  );
}

function DashboardContent({ data }: { readonly data: ProTrendData }) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric title="対象議会" value={data.totals.assembly_count} icon={<Building2 className="h-5 w-5" />} />
        <Metric title="公開議題" value={data.totals.issue_count} icon={<FileText className="h-5 w-5" />} />
        <Metric title="登場人物" value={data.totals.speaker_count} icon={<Users className="h-5 w-5" />} />
      </section>

      {data.totals.issue_count === 0 ? (
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-slate-600" />
          <h2 className="mt-4 font-bold text-white">この期間の公開議題はありません</h2>
          <p className="mt-2 text-sm text-slate-400">別の月を選択してください。0件は取得エラーとして扱いません。</p>
        </section>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-bold text-white">頻出キーワード</h2>
            <p className="mt-1 text-xs text-slate-500">同一議題内の重複を除いた出現議題数</p>
            <KeywordBars keywords={data.keywords} />
          </section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-bold text-white">議会別の議題数</h2>
            <p className="mt-1 text-xs text-slate-500">テーマ分類は公式原文に紐づく議題データから算出</p>
            <AssemblyBars assemblies={data.assemblies} />
          </section>
        </div>
      )}

      <p className="mt-5 text-right text-xs text-slate-500">データ最終更新: {data.updated_at ? new Date(data.updated_at).toLocaleString('ja-JP') : '不明'}</p>
    </>
  );
}

function KeywordBars({ keywords }: { readonly keywords: ProTrendData['keywords'] }) {
  const max = Math.max(1, ...keywords.map((item) => item.issue_count));
  if (keywords.length === 0) return <p className="mt-6 text-sm text-slate-500">抽出対象のキーワードはありません。</p>;
  return <div className="mt-5 space-y-4">{keywords.map((item) => (
    <div key={item.label}>
      <div className="mb-1 flex justify-between text-sm"><span>{item.label}</span><span className="text-slate-400">{item.issue_count}議題 / {item.assembly_count}議会</span></div>
      <div className="h-2.5 rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(5, item.issue_count / max * 100)}%` }} /></div>
    </div>
  ))}</div>;
}

function AssemblyBars({ assemblies }: { readonly assemblies: ProTrendData['assemblies'] }) {
  const max = Math.max(1, ...assemblies.map((item) => item.issue_count));
  return <div className="mt-5 space-y-4">{assemblies.map((item) => (
    <div key={item.assembly_id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between gap-3"><span className="font-semibold text-white">{item.assembly_name}</span><span className="text-sm text-slate-400">{item.issue_count}議題</span></div>
      <div className="mt-3 h-2.5 rounded-full bg-slate-800"><div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(5, item.issue_count / max * 100)}%` }} /></div>
      <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{item.top_theme ?? 'テーマなし'}</span><span>{item.speaker_count}人</span></div>
    </div>
  ))}</div>;
}

function Metric({ title, value, icon }: { readonly title: string; readonly value: number; readonly icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between text-sm text-slate-400"><span>{title}</span><span className="text-emerald-400">{icon}</span></div><p className="mt-3 text-3xl font-bold text-white">{value.toLocaleString('ja-JP')}</p></div>;
}

function DashboardSkeleton() {
  return <div aria-label="議会トレンドを読み込み中" className="animate-pulse space-y-6"><div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-28 rounded-2xl bg-slate-900" />)}</div><div className="grid gap-6 xl:grid-cols-2"><div className="h-80 rounded-2xl bg-slate-900" /><div className="h-80 rounded-2xl bg-slate-900" /></div></div>;
}
