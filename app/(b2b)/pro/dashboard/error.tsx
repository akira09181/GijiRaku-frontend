'use client';

export default function DashboardError({ reset }: { readonly reset: () => void }) {
  return <main className="mx-auto max-w-6xl px-4 py-8"><div role="alert" className="rounded-2xl border border-rose-800 bg-rose-950/30 p-6 text-rose-100"><p>ダッシュボードを表示できませんでした。</p><button type="button" onClick={reset} className="mt-4 rounded-lg border border-rose-700 px-3 py-2 text-sm font-bold">再試行</button></div></main>;
}
