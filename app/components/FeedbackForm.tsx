'use client';

import { FormEvent, useState } from 'react';

export default function FeedbackForm() {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    alert('ご意見を送信しました。ありがとうございます。');
    setMessage('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3">
        <label htmlFor="feedback" className="mb-2 block text-sm font-semibold text-slate-800">
          議案へのご意見
        </label>
        <textarea
          id="feedback"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          maxLength={500}
          placeholder="この議案について感じたこと、改善案、賛成・反対の理由を自由にご記入ください。"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <p className="mb-3 text-xs text-slate-500">試作フォームのため、この入力はサーバーには保存されません。</p>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="inline-flex min-w-[150px] items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? '送信中...' : '意見を送信'}
        </button>
      </div>
    </form>
  );
}
