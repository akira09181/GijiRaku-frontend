'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  History,
  ThumbsUp,
  Bell,
  Trash2,
  ExternalLink,
  Sparkles,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { fetchUserActivity } from '../utils/api';

interface UserActivityDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelectTopic?: (topicId: string) => void;
}

export default function UserActivityDrawer({
  isOpen,
  onClose,
  onSelectTopic,
}: UserActivityDrawerProps) {
  const [userData, setUserData] = useState<{
    activity: { viewed_topics: string[]; last_assembly_id?: string; last_theme?: string };
    reactions: Record<string, string>;
    subscriptions: Array<{ id: number; assembly_id: string; theme: string; email: string; notify_type: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchUserActivity().then((data) => {
        setUserData(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const reactionCount = userData ? Object.keys(userData.reactions).length : 0;
  const subscriptionCount = userData ? userData.subscriptions.length : 0;
  const viewedCount = userData ? userData.activity.viewed_topics.length : 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-2xs animate-fade-in">
      <div className="w-full max-w-md h-full dark:bg-slate-900 bg-white border-l dark:border-slate-800 border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="p-4 sm:p-5 border-b dark:border-slate-800 border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base dark:text-white text-slate-900">
                マイアクティビティ
              </h3>
              <p className="text-[10.5px] dark:text-slate-400 text-slate-500">
                保存された状態・閲覧履歴・リアクション
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full dark:bg-slate-800 dark:hover:bg-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>状態を読み込み中...</span>
            </div>
          ) : (
            <>
              {/* ステータスサマリーカード */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border-slate-200 border text-center space-y-0.5">
                  <span className="text-[10px] dark:text-slate-400 text-slate-500 block">閲覧した議論</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {viewedCount}件
                  </span>
                </div>
                <div className="p-3 rounded-2xl dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border-slate-200 border text-center space-y-0.5">
                  <span className="text-[10px] dark:text-slate-400 text-slate-500 block">リアクション</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {reactionCount}件
                  </span>
                </div>
                <div className="p-3 rounded-2xl dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border-slate-200 border text-center space-y-0.5">
                  <span className="text-[10px] dark:text-slate-400 text-slate-500 block">更新通知購読</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {subscriptionCount}件
                  </span>
                </div>
              </div>

              {/* 購読中の通知条件 */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold dark:text-slate-200 text-slate-900">
                  <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>登録中の更新通知 ({subscriptionCount}件)</span>
                </div>

                {userData?.subscriptions && userData.subscriptions.length > 0 ? (
                  <div className="space-y-2">
                    {userData.subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-xl dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border-slate-200 border flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold dark:text-white text-slate-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{sub.assembly_id} × {sub.theme}</span>
                          </div>
                          <span className="text-[10px] dark:text-slate-400 text-slate-500">
                            通知形式: {sub.notify_type === 'email' ? `メール (${sub.email})` : 'アプリ内・ブラウザ'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                          購読中
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl dark:bg-slate-950/60 bg-slate-50 text-center text-xs dark:text-slate-400 text-slate-500 border dark:border-slate-800/80 border-slate-200">
                    登録中の通知条件はありません。「この条件の更新通知を受け取る」から登録できます。
                  </div>
                )}
              </div>

              {/* 直近のリアクション履歴 */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold dark:text-slate-200 text-slate-900">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>あなたのリアクション履歴 ({reactionCount}件)</span>
                </div>

                {userData?.reactions && Object.keys(userData.reactions).length > 0 ? (
                  <div className="space-y-1.5">
                    {Object.entries(userData.reactions).map(([key, rtype]) => {
                      const label =
                        rtype === 'agree'
                          ? '👍 賛成'
                          : rtype === 'concern'
                          ? '⚠️ 懸念'
                          : rtype === 'more_info'
                          ? '🔍 もっと知りたい'
                          : '🆘 困っている';

                      return (
                        <div
                          key={key}
                          className="p-2.5 rounded-xl dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border-slate-200 border flex items-center justify-between text-xs"
                        >
                          <span className="font-mono text-[11px] dark:text-slate-300 text-slate-700 truncate max-w-[200px]">
                            {key}
                          </span>
                          <span className="px-2 py-0.5 rounded font-semibold text-[10.5px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl dark:bg-slate-950/60 bg-slate-50 text-center text-xs dark:text-slate-400 text-slate-500 border dark:border-slate-800/80 border-slate-200">
                    まだリアクションを送信していません。議論画面の「賛成」「懸念」等を押すと記録されます。
                  </div>
                )}
              </div>

              {/* 閲覧履歴 */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold dark:text-slate-200 text-slate-900">
                  <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>閲覧した議論 ({viewedCount}件)</span>
                </div>

                {userData?.activity.viewed_topics && userData.activity.viewed_topics.length > 0 ? (
                  <div className="space-y-1.5">
                    {userData.activity.viewed_topics.map((tId, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border-slate-200 border flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-[11px] dark:text-slate-300 text-slate-700 truncate">
                          {tId}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          閲覧済
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl dark:bg-slate-950/60 bg-slate-50 text-center text-xs dark:text-slate-400 text-slate-500 border dark:border-slate-800/80 border-slate-200">
                    閲覧履歴はまだありません。
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t dark:border-slate-800 border-slate-200 dark:bg-slate-950 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>状態は端末とDBに安全に同期されます</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white rounded-xl font-semibold transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
