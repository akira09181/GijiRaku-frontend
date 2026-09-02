'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import {
  decodeLineOAuthState,
  getLineCallbackUrl,
  verifyLineOAuthNonce,
} from '../../lib/lineLogin';
import { completeLineOAuth } from '../../lib/lineNotificationApi';

type CallbackState = 'loading' | 'success' | 'error';

export default function LineCallbackPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>('loading');
  const [detail, setDetail] = useState('LINE連携を処理しています…');

  useEffect(() => {
    let cancelled = false;
    const code = searchParams.get('code')?.trim();
    const oauthState = searchParams.get('state')?.trim();
    const oauthError = searchParams.get('error_description') || searchParams.get('error');

    if (oauthError) {
      setState('error');
      setDetail('LINEログインがキャンセルまたは失敗しました。');
      return;
    }
    if (!code || !oauthState) {
      setState('error');
      setDetail('LINE連携に必要な情報がありません。');
      return;
    }

    const decoded = decodeLineOAuthState(oauthState);
    if (!decoded || !verifyLineOAuthNonce(decoded.n)) {
      setState('error');
      setDetail('セッションが無効です。もう一度お試しください。');
      return;
    }

    void completeLineOAuth(code, getLineCallbackUrl())
      .then((lineStatus) => {
        if (cancelled) return;
        setState('success');
        setDetail(
          lineStatus.display_name
            ? `${lineStatus.display_name} としてLINE連携しました。`
            : 'LINE連携が完了しました。',
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState('error');
        setDetail(error instanceof Error ? error.message : 'LINE連携に失敗しました。');
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      {state === 'loading' && (
        <LoaderCircle className="mb-4 h-8 w-8 animate-spin text-emerald-600" aria-hidden="true" />
      )}
      <h1 className="text-lg font-bold text-slate-900 dark:text-white">LINE通知連携</h1>
      <p role={state === 'error' ? 'alert' : 'status'} className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        {detail}
      </p>
      {state !== 'loading' && (
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"
        >
          トップに戻る
        </Link>
      )}
    </main>
  );
}
