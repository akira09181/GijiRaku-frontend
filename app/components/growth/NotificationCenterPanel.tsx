'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellRing, CheckCheck, ExternalLink, LoaderCircle, RefreshCw } from 'lucide-react';
import {
  listNotifications,
  markNotificationsRead,
  type UserNotification,
} from '../../lib/notificationApi';

function formatWhen(value: string | undefined) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

interface NotificationCenterPanelProps {
  readonly onUnreadChange?: (count: number) => void;
  readonly onOpenIssue?: (issueId: string) => void;
}

export default function NotificationCenterPanel({
  onUnreadChange,
  onOpenIssue,
}: NotificationCenterPanelProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const inbox = await listNotifications();
      setNotifications([...inbox.notifications]);
      setUnreadTotal(inbox.unread_total);
      onUnreadChange?.(inbox.unread_total);
    } catch {
      setError('通知を取得できませんでした。');
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const markAllRead = async () => {
    setWorking(true);
    setError(null);
    try {
      const result = await markNotificationsRead();
      setUnreadTotal(result.unread_total);
      onUnreadChange?.(result.unread_total);
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    } catch {
      setError('既読更新に失敗しました。');
    } finally {
      setWorking(false);
    }
  };

  const openNotification = async (notification: UserNotification) => {
    if (!notification.read) {
      try {
        const result = await markNotificationsRead([notification.notification_id]);
        setUnreadTotal(result.unread_total);
        onUnreadChange?.(result.unread_total);
        setNotifications((current) => current.map((item) => (
          item.notification_id === notification.notification_id
            ? { ...item, read: true }
            : item
        )));
      } catch {
        setError('既読更新に失敗しました。');
      }
    }
    if (onOpenIssue) {
      onOpenIssue(notification.issue_id);
      return;
    }
    window.location.assign(`/issues/${notification.issue_id}`);
  };

  return (
    <details
      open={unreadTotal > 0}
      className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/20"
    >
      <summary className="cursor-pointer list-none text-sm font-bold text-indigo-900 dark:text-indigo-200">
        <span className="inline-flex items-center gap-2">
          <BellRing className="h-4 w-4" />
          関心テーマの通知
          {unreadTotal > 0 && (
            <span
              data-testid="notification-unread-badge"
              className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white"
            >
              未読 {unreadTotal}件
            </span>
          )}
        </span>
      </summary>

      <div className="mt-4 space-y-3" data-testid="notification-center">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || working}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-700 disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />再読込
          </button>
          {unreadTotal > 0 && (
            <button
              type="button"
              data-testid="notification-mark-all-read"
              onClick={() => void markAllRead()}
              disabled={working}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" />すべて既読
            </button>
          )}
        </div>

        {loading && (
          <p role="status" className="inline-flex items-center gap-1 text-xs text-slate-600">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />通知を読み込んでいます…
          </p>
        )}

        {!loading && notifications.length === 0 && (
          <p className="text-xs text-slate-600 dark:text-slate-300">
            まだ通知はありません。通知条件を保存すると、一致する新しい議題がここに表示されます。
          </p>
        )}

        {!loading && notifications.length > 0 && (
          <ul className="space-y-2">
            {notifications.map((notification) => (
              <li
                key={notification.notification_id}
                data-testid={`notification-item-${notification.issue_id}`}
                className={`rounded-xl border p-3 ${notification.read ? 'border-slate-200 bg-white/70' : 'border-indigo-300 bg-white'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-indigo-700">{notification.municipality || '関心テーマ一致'}</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">{notification.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{notification.message}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{formatWhen(notification.updated_at || notification.created_at)}</p>
                  </div>
                  {!notification.read && (
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">未読</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void openNotification(notification)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    詳しく見る
                  </button>
                  {notification.source_url && (
                    <a
                      href={notification.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      公式原文 <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
      </div>
    </details>
  );
}
