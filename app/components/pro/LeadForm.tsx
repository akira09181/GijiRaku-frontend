'use client';

import { useState } from 'react';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function LeadForm() {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  async function submitLead(formData: FormData) {
    setSubmitState('submitting');
    try {
      const response = await fetch('/api/pro/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          organization: formData.get('organization'),
          name: formData.get('name'),
          email: formData.get('email'),
          purpose: formData.get('purpose'),
          website: formData.get('website'),
        }),
      });
      if (!response.ok) throw new Error(`Lead submission failed: ${response.status}`);
      setSubmitState('success');
    } catch (error) {
      console.error('Pro lead submission failed', error);
      setSubmitState('error');
    }
  }

  if (submitState === 'success') {
    return <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-100">お問い合わせを受け付けました。担当者からご連絡します。</div>;
  }

  return (
    <form action={submitLead} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-6">
      <label className="block text-sm font-medium text-slate-200">組織名<input required name="organization" maxLength={120} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" /></label>
      <label className="block text-sm font-medium text-slate-200">お名前<input required name="name" maxLength={80} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" /></label>
      <label className="block text-sm font-medium text-slate-200">メールアドレス<input required type="email" name="email" maxLength={254} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" /></label>
      <label className="block text-sm font-medium text-slate-200">利用目的<textarea name="purpose" rows={4} maxLength={1000} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" /></label>
      <label className="hidden" aria-hidden="true">Webサイト<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {submitState === 'error' && <p role="alert" className="text-sm text-rose-300">送信できませんでした。時間をおいて再度お試しください。</p>}
      <button disabled={submitState === 'submitting'} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60">
        {submitState === 'submitting' ? '送信中…' : '相談内容を送信'}
      </button>
    </form>
  );
}
