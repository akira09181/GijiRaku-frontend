'use client';

import React, { useState } from 'react';
import { Bell, BookmarkCheck, ExternalLink, Trash2, X } from 'lucide-react';
import { getCitizenQuestionByIssueId } from '../data/citizenQuestions';
import { getIssueStatus } from '../data/issueStatuses';
import type { FollowedTopic } from '../types/follow';
import IssueShareButton from './IssueShareButton';
import NotificationPreferencesPanel from './NotificationPreferencesPanel';
import NotificationCenterPanel from './growth/NotificationCenterPanel';

interface MyFollowModalProps {
  readonly follows: readonly FollowedTopic[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly onRetry: () => void;
  readonly onOpenIssue: (follow: FollowedTopic) => void;
  readonly onDelete: (follow: FollowedTopic) => Promise<boolean>;
  readonly onClose: () => void;
  readonly onNotificationUnreadChange?: (count: number) => void;
  readonly onOpenIssueById?: (issueId: string) => void;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '未回答';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' }).format(parsed);
}

export default function MyFollowModal({
  follows,
  loading,
  error,
  onRetry,
  onOpenIssue,
  onDelete,
  onClose,
  onNotificationUnreadChange,
  onOpenIssueById,
}: MyFollowModalProps) {
  const [confirmingIssueId, setConfirmingIssueId] = useState<string | null>(null);
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = async (follow: FollowedTopic) => {
    setDeletingIssueId(follow.issue_id);
    setDeleteError(null);
    try {
      const deleted = await onDelete(follow);
      if (!deleted) throw new Error('Follow delete failed');
      setConfirmingIssueId(null);
    } catch {
      setDeleteError('フォローを解除できませんでした。');
    } finally {
      setDeletingIssueId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/60 p-3 sm:p-6 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="マイフォロー">
      <section className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col">
        <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5 text-emerald-600" />
              マイフォロー
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">回答後に明示的にフォローした議題だけを表示します。</p>
          </div>
          <button type="button" onClick={onClose} aria-label="マイフォローを閉じる" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-4 space-y-3">
          <NotificationCenterPanel
            onUnreadChange={onNotificationUnreadChange}
            onOpenIssue={onOpenIssueById}
          />
          <NotificationPreferencesPanel />
          {loading && <p role="status" className="text-sm text-slate-600 dark:text-slate-300">フォロー情報を取得しています…</p>}
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <p>{error}</p>
              <button type="button" onClick={onRetry} className="mt-2 font-bold underline">再試行</button>
            </div>
          )}
          {!loading && !error && follows.length === 0 && (
            <div className="py-8 text-center space-y-3" data-testid="my-follow-empty">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">フォロー中の議題はありません</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">気になる議題に回答したあと、その後の動きを追跡できます</p>
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">議題一覧へ戻る</button>
            </div>
          )}
          {!loading && !error && follows.map((follow) => {
            const question = getCitizenQuestionByIssueId(follow.issue_id);
            const issueStatus = getIssueStatus(follow.issue_id);
            const answer = question?.answers.find((choice) => choice.id === follow.my_response?.selected_answer);
            const sortedUpdates = [...follow.status_updates].sort((left, right) => left.updated_at.localeCompare(right.updated_at));
            const latestUpdate = sortedUpdates.at(-1);
            const previousUpdate = sortedUpdates.at(-2);
            const unseenUpdates = sortedUpdates.filter(
              (update) => Date.parse(update.updated_at) > Date.parse(follow.last_viewed_status_at),
            );
            return (
              <article key={follow.issue_id} data-testid={`my-follow-${follow.issue_id}`} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-slate-50 dark:bg-slate-950/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{follow.municipality}</p>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{follow.title}</h3>
                  </div>
                  {follow.has_new_status && (
                    <span data-testid="follow-update-badge" className="shrink-0 rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2 py-1 text-[10px] font-bold flex items-center gap-1">
                      <Bell className="w-3 h-3" />前回から更新あり
                    </span>
                  )}
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-slate-500">回答状況</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{follow.my_response ? '回答済み' : '未回答'}</dd>
                  <dt className="text-slate-500">あなたの回答</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{answer?.label || '未回答'}</dd>
                  <dt className="text-slate-500">回答日</dt>
                  <dd className="text-slate-700 dark:text-slate-300">{formatDate(follow.my_response?.updated_at)}</dd>
                  <dt className="text-slate-500">現在の市民回答数</dt>
                  <dd data-testid="follow-current-response-count" className="font-semibold text-slate-800 dark:text-slate-200">
                    {follow.current_response_count === null ? '回答状況を確認できません' : `市民回答 ${follow.current_response_count}件`}
                  </dd>
                  <dt className="text-slate-500">最終更新日</dt>
                  <dd className="text-slate-700 dark:text-slate-300">{formatDate(follow.status_updated_at)}</dd>
                  <dt className="text-slate-500">最終確認日</dt>
                  <dd className="text-slate-700 dark:text-slate-300">{formatDate(follow.status_checked_at)}</dd>
                  <dt className="text-slate-500">現在の状態</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{follow.current_status}</dd>
                </dl>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{follow.status_summary}</p>
                {follow.has_new_status && unseenUpdates.length > 0 && (
                  <div data-testid="follow-update-details" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                    <p className="font-bold">更新内容</p>
                    <ul className="mt-1 space-y-1">
                      {unseenUpdates.map((update) => <li key={`${update.updated_at}:${update.status}`}>{update.summary}</li>)}
                    </ul>
                    {previousUpdate && latestUpdate && previousUpdate.status !== latestUpdate.status && (
                      <p data-testid="follow-status-transition" className="mt-2 font-semibold">進捗変更：{previousUpdate.status} → {latestUpdate.status}</p>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  {question && issueStatus && <IssueShareButton issue={question} status={issueStatus} />}
                  <a href={follow.source_url} target="_blank" rel="noreferrer" className="px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    公式原文 <ExternalLink className="w-3 h-3" />
                  </a>
                  <button type="button" onClick={() => { setConfirmingIssueId(follow.issue_id); setDeleteError(null); }} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1">
                    <Trash2 className="w-3 h-3" />解除
                  </button>
                  <button type="button" onClick={() => onOpenIssue(follow)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">詳しく見る</button>
                </div>
                {confirmingIssueId === follow.issue_id && (
                  <div data-testid="unfollow-confirmation" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                    <p className="font-bold">この議題のフォローを解除しますか？</p>
                    <p className="mt-1">回答データと全体集計は削除されません。</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" disabled={deletingIssueId === follow.issue_id} onClick={() => void confirmDelete(follow)} className="rounded-lg bg-rose-600 px-3 py-2 font-bold text-white disabled:opacity-60">
                        {deletingIssueId === follow.issue_id ? '解除中…' : '解除する'}
                      </button>
                      <button type="button" disabled={deletingIssueId === follow.issue_id} onClick={() => { setConfirmingIssueId(null); setDeleteError(null); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700">
                        キャンセル
                      </button>
                    </div>
                    {deleteError && <p role="alert" className="mt-2 font-medium text-rose-700">{deleteError}</p>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
