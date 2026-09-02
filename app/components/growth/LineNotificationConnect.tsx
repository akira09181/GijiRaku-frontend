'use client';

import { useEffect, useState } from 'react';
import { Link2, LoaderCircle, Unlink } from 'lucide-react';
import { getOrCreateAnonymousUserId } from '../../lib/anonymousUser';
import { buildLineLoginUrl, getLineLoginChannelId } from '../../lib/lineLogin';
import {
  getLineLinkStatus,
  unlinkLineNotification,
  type LineLinkStatus,
} from '../../lib/lineNotificationApi';

const DEFAULT_STATUS: LineLinkStatus = {
  linked: false,
  line_push_enabled: false,
  configured: false,
  login_configured: false,
};

export default function LineNotificationConnect() {
  const [status, setStatus] = useState<LineLinkStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lineLoginAvailable = Boolean(getLineLoginChannelId());

  useEffect(() => {
    let cancelled = false;
    void getLineLinkStatus()
      .then((next) => {
        if (!cancelled) setStatus(next);
      })
      .catch(() => {
        if (!cancelled) setError('LINE連携状態を取得できませんでした。');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = () => {
    setError(null);
    setMessage(null);
    const loginUrl = buildLineLoginUrl(getOrCreateAnonymousUserId());
    if (!loginUrl) {
      setError('LINEログインが未設定です。管理者向けに LINE_LOGIN_CHANNEL_ID を設定してください。');
      return;
    }
    window.location.href = loginUrl;
  };

  const disconnect = async () => {
    setWorking(true);
    setError(null);
    setMessage(null);
    try {
      setStatus(await unlinkLineNotification());
      setMessage('LINE連携を解除しました。');
    } catch {
      setError('LINE連携を解除できませんでした。');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-950/40"
      data-testid="line-notification-connect"
    >
      <div className="flex items-start gap-2">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">LINEでプッシュ通知</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              保存した関心テーマに一致する新しい議題を、LINEでお知らせします。
            </p>
          </div>
          {loading ? (
            <p role="status" className="inline-flex items-center gap-1 text-xs text-slate-500">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />確認中…
            </p>
          ) : status.linked ? (
            <div className="space-y-2">
              <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                連携済み{status.display_name ? `（${status.display_name}）` : ''}
                {status.configured ? '' : ' · 送信基盤は準備中'}
              </p>
              <button
                type="button"
                onClick={() => void disconnect()}
                disabled={working}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <Unlink className="h-3.5 w-3.5" />{working ? '解除中…' : '連携を解除'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {!lineLoginAvailable && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  LINEログイン未設定のため、連携ボタンはデモ環境では無効です。
                </p>
              )}
              <button
                type="button"
                onClick={connect}
                disabled={!lineLoginAvailable || working}
                className="inline-flex items-center gap-1 rounded-lg bg-[#06C755] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Link2 className="h-3.5 w-3.5" />LINEで連携する
              </button>
            </div>
          )}
          {message && <p role="status" className="text-xs font-medium text-emerald-700">{message}</p>}
          {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
