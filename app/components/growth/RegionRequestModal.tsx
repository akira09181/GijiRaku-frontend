'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X } from 'lucide-react';
import type { Assembly } from '../../types/assembly';
import { getOrCreateAnonymousUserId } from '../../lib/anonymousUser';
import { unlockCitizenBadge } from '../../lib/citizenBadges';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface RegionRequestModalProps {
  readonly assembly: Assembly;
  readonly onClose: () => void;
}

export default function RegionRequestModal({ assembly, onClose }: RegionRequestModalProps) {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState('submitting');
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/region-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          municipality_id: assembly.id,
          municipality_name: assembly.name,
          email: formData.get('email'),
          message: formData.get('message'),
          anonymous_user_id: getOrCreateAnonymousUserId(),
          website: formData.get('website'),
        }),
      });
      if (!response.ok) throw new Error(`Region request failed: ${response.status}`);
      unlockCitizenBadge('region_advocate');
      setSubmitState('success');
    } catch (error) {
      console.error('Region request submission failed', error);
      setSubmitState('error');
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="region-request-title"
        data-testid="region-request-modal"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              導入準備中の地域
            </p>
            <h2 id="region-request-title" className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {assembly.name}の導入をリクエスト
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitState === 'success' ? (
          <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
            リクエストを受け付けました。{assembly.name}の公開が近づいたら、入力いただいた連絡先へお知らせします。
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              現在マチボイスは7議会で実データを公開中です。この地域の議会データ公開を希望する場合は、以下からリクエストを送ってください。
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                対象地域
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{assembly.name}</span>
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                メールアドレス（任意）
                <input
                  type="email"
                  name="email"
                  value={email}
                  maxLength={254}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="公開時にお知らせを受け取る"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                一言（任意）
                <textarea
                  name="message"
                  value={message}
                  rows={3}
                  maxLength={500}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="例：子育て支援の議論を追いかけたいです"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <label className="hidden" aria-hidden="true">
                Webサイト
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>

              {submitState === 'error' && (
                <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">
                  送信できませんでした。時間をおいて再度お試しください。
                </p>
              )}

              <button
                type="submit"
                disabled={submitState === 'submitting'}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
              >
                {submitState === 'submitting' ? '送信中…' : '導入をリクエストする'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
