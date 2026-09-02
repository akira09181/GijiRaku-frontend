import { Suspense } from 'react';
import ProAnalyticsPage from '../../../components/pro/ProAnalyticsPage';

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-12 text-slate-300">議会別分析を読み込み中…</main>}>
      <ProAnalyticsPage />
    </Suspense>
  );
}
