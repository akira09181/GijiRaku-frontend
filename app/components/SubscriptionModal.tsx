'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, Mail, Smartphone, CheckCircle2, Sparkles } from 'lucide-react';
import { subscribeTopicUpdates } from '../utils/api';

interface SubscriptionModalProps {
  readonly isOpen: boolean;
  readonly assemblyName: string;
  readonly assemblyId: string;
  readonly themeName: string;
  readonly themeId: string;
  readonly onClose: () => void;
  readonly onSubscribed: (message: string) => void;
}

export default function SubscriptionModal({
  isOpen,
  assemblyName,
  assemblyId,
  themeName,
  themeId,
  onClose,
  onSubscribed,
}: SubscriptionModalProps) {
  const [notifyType, setNotifyType] = useState<'browser' | 'email'>('browser');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notifyType === 'email' && !email.trim()) return;

    setIsSubmitting(true);
    try {
      await subscribeTopicUpdates({
        assemblyId,
        theme: themeId,
        email: notifyType === 'email' ? email.trim() : '',
        notifyType,
      });

      setIsSuccess(true);
      const msg = `🔔 【通知登録完了】「${assemblyName} × ${themeName}」の最新議会ニュース更新通知を保存しました。`;
      setTimeout(() => {
        setIsSuccess(false);
        onSubscribed(msg);
        onClose();
      }, 1800);
    } catch {
      alert('購読登録に失敗しました。時間をおいて再試行してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="p-4 sm:p-5 border-b dark:border-slate-800 border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base sm:text-lg dark:text-white text-slate-900">
              更新通知を受け取る
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full dark:bg-slate-800 dark:hover:bg-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base dark:text-white text-slate-900">
              更新通知の購読を保存しました
            </h4>
            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
              「{assemblyName} × {themeName}」に関する新しい定例会・委員会での議論がオープンデータへ反映された際に通知をお届けします。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="p-5 sm:p-6 space-y-4">
            {/* 購読対象条件 */}
            <div className="p-3.5 dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border-slate-200 border rounded-2xl space-y-1.5">
              <div className="text-[11px] font-semibold dark:text-slate-400 text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>購読する条件</span>
              </div>
              <div className="text-xs sm:text-sm font-bold dark:text-white text-slate-900">
                {assemblyName} <span className="text-emerald-600 dark:text-emerald-400">×</span> {themeName}
              </div>
              <p className="text-[10.5px] dark:text-slate-400 text-slate-500">
                定例会での質問、答弁、予算化、制度開始などの新着情報が届きます。
              </p>
            </div>

            {/* 受信方法の選択 */}
            <div className="space-y-2">
              <label className="text-xs font-semibold dark:text-slate-300 text-slate-700">
                通知の受け取り方法
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNotifyType('browser')}
                  className={`p-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all ${
                    notifyType === 'browser'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>アプリ内・ブラウザ</span>
                  <span className="text-[9.5px] opacity-80">ワンタップ登録</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotifyType('email')}
                  className={`p-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all ${
                    notifyType === 'email'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>メール通知</span>
                  <span className="text-[9.5px] opacity-80">アドレス宛に配信</span>
                </button>
              </div>
            </div>

            {/* メール入力欄 */}
            {notifyType === 'email' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-semibold dark:text-slate-300 text-slate-700">
                  通知先メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@domain.com"
                  required
                  className="w-full px-3 py-2 dark:bg-slate-950 dark:border-slate-800 dark:text-white bg-slate-50 border-slate-300 text-slate-900 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold dark:text-slate-400 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (notifyType === 'email' && !email.trim())}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isSubmitting ? '登録中...' : 'この条件で通知登録'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
