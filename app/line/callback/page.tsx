import { Suspense } from 'react';
import LineCallbackPage from './LineCallbackPage';

export default function Page() {
  return (
    <Suspense fallback={(
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm text-slate-600">LINE連携を処理しています…</p>
      </main>
    )}
    >
      <LineCallbackPage />
    </Suspense>
  );
}
