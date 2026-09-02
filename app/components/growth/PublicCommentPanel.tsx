'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Megaphone } from 'lucide-react';
import {
  buildPublicCommentSubmissionText,
  getPublicCommentPortal,
} from '../../data/publicCommentPortals';

interface PublicCommentPanelProps {
  readonly assemblyId: string;
  readonly municipality: string;
  readonly issueTitle: string;
  readonly draftText?: string;
}

export default function PublicCommentPanel({
  assemblyId,
  municipality,
  issueTitle,
  draftText = '',
}: PublicCommentPanelProps) {
  const portal = getPublicCommentPortal(assemblyId);
  const [manualText, setManualText] = useState('');
  const [copied, setCopied] = useState(false);
  const [openedPortal, setOpenedPortal] = useState(false);

  const submissionText = useMemo(() => buildPublicCommentSubmissionText({
    municipality,
    issueTitle,
    draftText: draftText.trim() || manualText.trim(),
  }), [draftText, issueTitle, manualText, municipality]);

  const copySubmission = async () => {
    if (!submissionText) return;
    try {
      await navigator.clipboard.writeText(submissionText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!portal) {
    return (
      <div
        data-testid="public-comment-panel"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm font-semibold text-slate-800">パブリックコメント</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          この自治体の意見募集ページ情報は準備中です。自治体公式サイトの「意見公募」「パブリックコメント」から提出してください。
        </p>
      </div>
    );
  }

  return (
    <section
      data-testid="public-comment-panel"
      className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm"
    >
      <div className="flex items-start gap-2">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">パブリックコメントへ意見を届ける</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {portal.guidance}
            </p>
          </div>

          {!draftText.trim() && (
            <label className="block text-xs font-bold text-slate-700">
              提出用の意見文
              <textarea
                data-testid="public-comment-draft"
                value={manualText}
                onChange={(event) => setManualText(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="賛成・反対の理由、改善案、具体的な経験などを入力してください。"
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </label>
          )}

          {submissionText && (
            <div className="rounded-xl border border-sky-200 bg-white p-3">
              <p className="text-xs font-bold text-slate-500">提出用テキスト</p>
              <pre
                data-testid="public-comment-submission-text"
                className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700"
              >
                {submissionText}
              </pre>
            </div>
          )}

          <ol className="space-y-1 text-xs text-slate-600">
            <li>1. 下書きをコピーする</li>
            <li>2. 自治体の意見募集ページを開く</li>
            <li>3. フォームに貼り付けて送信する</li>
          </ol>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="public-comment-copy"
              onClick={() => void copySubmission()}
              disabled={!submissionText}
              className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'コピーしました' : '意見文をコピー'}
            </button>
            <a
              href={portal.portalUrl}
              target="_blank"
              rel="noreferrer"
              data-testid="public-comment-open-portal"
              onClick={() => setOpenedPortal(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-sky-300 bg-white px-3 py-2 text-xs font-bold text-sky-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {portal.portalLabel}を開く
            </a>
          </div>

          {portal.deadlineNote && (
            <p className="text-[11px] text-slate-500">{portal.deadlineNote}</p>
          )}
          {openedPortal && (
            <p role="status" className="text-xs font-medium text-sky-800">
              意見募集ページを開きました。コピーした意見文をフォームに貼り付けて送信してください。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
