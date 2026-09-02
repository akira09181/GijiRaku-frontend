'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, CheckCircle2, FilePenLine, RefreshCw, Send } from 'lucide-react';
import {
  CITIZEN_RESPONSE_SUCCESS_MESSAGE,
  type CitizenQuestionDefinition,
} from '../data/citizenQuestions';
import { buildOpinionDraft } from '../lib/opinionDraft.js';
import { getOrCreateAnonymousUserId } from '../lib/anonymousUser';
import { getIssueStatus } from '../data/issueStatuses';
import IssueShareButton from './IssueShareButton';
import ShareButtons from './ShareButtons';
import FeedbackForm from './FeedbackForm';
import {
  normalizeCitizenResponseSnapshot,
  publishCitizenResponseCount,
  type CitizenResponseAggregate,
} from '../lib/citizenResponse';
import { getApiBase } from '../lib/apiBase';
import { unlockCitizenBadge } from '../lib/citizenBadges';

interface CitizenQuestionPanelProps {
  readonly config: CitizenQuestionDefinition;
  readonly isFollowed?: boolean;
  readonly onFollow?: () => boolean | Promise<boolean>;
}

interface SubmittedResponse {
  readonly selectedAnswer: string;
  readonly selectedReasons: readonly string[];
  readonly freeText: string;
}

export default function CitizenQuestionPanel({
  config,
  isFollowed = false,
  onFollow,
}: CitizenQuestionPanelProps) {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');
  const [aggregate, setAggregate] = useState<CitizenResponseAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<SubmittedResponse | null>(null);
  const [draftAction, setDraftAction] = useState<'use' | 'edit' | 'none' | null>(null);
  const [followDecision, setFollowDecision] = useState<'followed' | 'later' | null>(null);
  const [followSaving, setFollowSaving] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const issueStatus = getIssueStatus(config.issueId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aggregateSectionRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLElement>(null);

  const fetchSnapshot = useCallback(async (restoreMyResponse: boolean) => {
    setLoading(true);
    setLoadError(false);
    try {
      const apiBase = getApiBase();
      const query = new URLSearchParams({
        issue_id: config.issueId,
        question_id: config.questionId,
        anonymous_user_id: getOrCreateAnonymousUserId(),
        include_my_response: 'true',
      });
      const response = await fetch(
        `${apiBase}/api/citizen-question-responses?${query.toString()}`,
        { cache: 'no-store' },
      );
      if (!response.ok) throw new Error(`Citizen response API failed: ${response.status}`);
      const snapshot = normalizeCitizenResponseSnapshot(
        await response.json(),
        config.issueId,
        config.questionId,
      );
      setAggregate(snapshot.aggregate);
      publishCitizenResponseCount(config.issueId, snapshot.aggregate.total_responses);
      if (restoreMyResponse && snapshot.my_response) {
        setSelectedAnswer(snapshot.my_response.selected_answer);
        setSelectedReasons([...snapshot.my_response.selected_reasons]);
        setFreeText(snapshot.my_response.free_text);
      }
      return true;
    } catch (error) {
      console.error('Citizen response status could not be loaded', {
        issue_id: config.issueId,
        question_id: config.questionId,
        error,
      });
      setAggregate(null);
      setLoadError(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [config.issueId, config.questionId]);

  useEffect(() => {
    queueMicrotask(() => void fetchSnapshot(true));
  }, [fetchSnapshot]);

  const toggleReason = (reasonId: string) => {
    setAccepted(false);
    setDraftAction(null);
    setSelectedReasons((current) => current.includes(reasonId)
      ? current.filter((id) => id !== reasonId)
      : [...current, reasonId]);
  };

  const textIsTooLong = freeText.length > 500;
  const canSubmit = Boolean(selectedAnswer)
    && selectedReasons.length > 0
    && !textIsTooLong
    && !saving;

  const opinionDraft = useMemo(
    () => buildOpinionDraft(config, selectedAnswer, selectedReasons),
    [config, selectedAnswer, selectedReasons],
  );

  const applyOpinionDraft = (editAfterApplying: boolean) => {
    setFreeText(opinionDraft);
    setAccepted(false);
    setDraftAction(editAfterApplying ? 'edit' : 'use');
    if (editAfterApplying) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setSubmitError(null);
    setAccepted(false);
    let responseSaved = false;
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/citizen-question-responses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_id: config.issueId,
          question_id: config.questionId,
          anonymous_user_id: getOrCreateAnonymousUserId(),
          selected_answer: selectedAnswer,
          selected_reasons: selectedReasons,
          free_text: freeText,
        }),
      });
      if (!response.ok) throw new Error(`Citizen response API failed: ${response.status}`);
      responseSaved = true;
      const aggregateLoaded = await fetchSnapshot(false);
      if (!aggregateLoaded) {
        setSubmitError('回答は保存されましたが、集計を取得できませんでした。再試行してください。');
        return;
      }
      setSubmittedResponse({
        selectedAnswer,
        selectedReasons: [...selectedReasons],
        freeText,
      });
      setAccepted(true);
      unlockCitizenBadge('first_answer');
      setFollowDecision(isFollowed ? 'followed' : null);
      requestAnimationFrame(() => receiptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch {
      setSubmitError(responseSaved
        ? '回答は保存されましたが、集計を取得できませんでした。再試行してください。'
        : '回答を保存できませんでした。入力内容を保持したまま再試行できます。');
    } finally {
      setSaving(false);
    }
  };

  const topReasons = useMemo(
    () => aggregate?.top_reasons.slice(0, 3) || [],
    [aggregate],
  );

  const submittedAnswerLabel = config.answers.find(
    (answer) => answer.id === submittedResponse?.selectedAnswer,
  )?.label;
  const submittedReasonLabels = (submittedResponse?.selectedReasons || []).map(
    (reasonId) => config.reasons.find((reason) => reason.id === reasonId)?.label || reasonId,
  );

  const followIssue = async () => {
    if (!onFollow || isFollowed) return;
    setFollowSaving(true);
    setFollowError(null);
    try {
      const saved = await onFollow();
      if (!saved) throw new Error('Follow save failed');
      setFollowDecision('followed');
    } catch {
      setFollowError('回答は保存されましたが、フォローを登録できませんでした。');
    } finally {
      setFollowSaving(false);
    }
  };

  return (
    <section
      data-testid="citizen-question-panel"
      className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5"
    >
      <p className="text-xs font-bold tracking-wide text-emerald-700">市民への質問</p>
      <h3 className="mt-2 text-base font-bold leading-relaxed text-slate-900">
        {config.question}
      </h3>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">アクション</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">この議題について、意見を伝えたい方へ</p>
        </div>
        <ShareButtons url="" title={config.question} />
      </div>

      <div className="mt-4">
        <FeedbackForm />
      </div>

      <div className="mt-4 grid gap-2">
        {config.answers.map((answer) => (
          <label
            key={answer.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium transition ${
              selectedAnswer === answer.id
                ? 'border-emerald-500 ring-2 ring-emerald-100'
                : 'border-slate-200 hover:border-emerald-300'
            }`}
          >
            <input
              data-testid={`question-answer-${answer.id}`}
              type="radio"
              name={config.questionId}
              value={answer.id}
              checked={selectedAnswer === answer.id}
              onChange={() => {
                setSelectedAnswer(answer.id);
                setAccepted(false);
                setDraftAction(null);
              }}
              className="accent-emerald-600"
            />
            {answer.label}
          </label>
        ))}
      </div>

      {selectedAnswer && (
        <div className="mt-5" data-testid="citizen-question-details">
          <p className="text-sm font-bold text-slate-800">その理由を選んでください（複数選択可）</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {config.reasons.map((reason) => (
              <label key={reason.id} className="flex cursor-pointer items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  data-testid={`question-reason-${reason.id}`}
                  type="checkbox"
                  checked={selectedReasons.includes(reason.id)}
                  onChange={() => toggleReason(reason.id)}
                  className="mt-0.5 accent-emerald-600"
                />
                {reason.label}
              </label>
            ))}
          </div>
          {opinionDraft && (
            <div data-testid="opinion-draft" className="mt-4 rounded-xl border border-emerald-200 bg-white p-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <FilePenLine className="h-4 w-4 text-emerald-600" />
                意見文の下書き
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{opinionDraft}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="use-opinion-draft"
                  onClick={() => applyOpinionDraft(false)}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                >
                  このまま意見として使用
                </button>
                <button
                  type="button"
                  data-testid="edit-opinion-draft"
                  onClick={() => applyOpinionDraft(true)}
                  className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700"
                >
                  修正して使用
                </button>
                <button
                  type="button"
                  data-testid="skip-opinion-draft"
                  onClick={() => {
                    setFreeText('');
                    setDraftAction('none');
                    setAccepted(false);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600"
                >
                  意見は送らず回答だけ送る
                </button>
              </div>
              {draftAction && (
                <p className="mt-2 text-xs text-slate-500" role="status">
                  {draftAction === 'none' ? '自由記述なしで回答できます。' : '自由記述欄へ反映しました。送信前に編集できます。'}
                </p>
              )}
            </div>
          )}
          <label className="mt-4 block text-sm font-bold text-slate-800" htmlFor="citizen-free-text">
            具体的な経験や希望があれば教えてください（任意）
          </label>
          <textarea
            ref={textareaRef}
            id="citizen-free-text"
            data-testid="question-free-text"
            rows={4}
            value={freeText}
            onChange={(event) => {
              setFreeText(event.target.value);
              setAccepted(false);
              if (draftAction === 'use') setDraftAction('edit');
            }}
            className={`mt-2 w-full rounded-xl border bg-white p-3 text-sm outline-none ${textIsTooLong ? 'border-red-500' : 'border-slate-200 focus:border-emerald-500'}`}
            placeholder="この議題についての具体的な経験や希望を入力してください"
          />
          <p className={`text-right text-xs ${textIsTooLong ? 'font-bold text-red-600' : 'text-slate-500'}`}>
            {freeText.length}/500文字
          </p>
          {textIsTooLong && <p className="mt-1 text-sm text-red-600">自由記述は500文字以内で入力してください。</p>}
          {selectedReasons.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">理由を1つ以上選ぶと回答できます。</p>
          )}
          <button
            type="button"
            data-testid="submit-citizen-response"
            disabled={!canSubmit}
            onClick={() => void submit()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {saving ? '送信中…' : '回答を送る'}
          </button>
        </div>
      )}

      {accepted && submittedResponse && aggregate && (
        <section
          ref={receiptRef}
          data-testid="participation-receipt"
          className="mt-4 rounded-2xl border border-emerald-300 bg-white p-4 text-sm text-slate-700 shadow-sm"
        >
          <h4 data-testid="citizen-response-success" className="flex items-center gap-2 text-base font-bold text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />回答を受け付けました
          </h4>
          <p className="mt-2 font-bold text-slate-900">{config.municipality}｜{config.theme}</p>
          <dl className="mt-3 space-y-2">
            <div><dt className="text-xs font-bold text-slate-500">あなたの回答</dt><dd className="font-medium">{submittedAnswerLabel}</dd></div>
            <div>
              <dt className="text-xs font-bold text-slate-500">選んだ理由</dt>
              <dd><ul className="mt-1 space-y-0.5">{submittedReasonLabels.map((label) => <li key={label}>・{label}</li>)}</ul></dd>
            </div>
            <div><dt className="text-xs font-bold text-slate-500">自由記述</dt><dd>{submittedResponse.freeText.trim() ? '送信あり' : '送信なし'}</dd></div>
            <div><dt className="text-xs font-bold text-slate-500">現在の回答総数</dt><dd className="font-bold">{aggregate.total_responses}件</dd></div>
            <div><dt className="text-xs font-bold text-slate-500">対応状況の最終確認</dt><dd>{config.statusCheckedAt}</dd></div>
          </dl>
          <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
            {CITIZEN_RESPONSE_SUCCESS_MESSAGE}
          </p>
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-sm font-bold text-slate-900">この議題のその後を追いますか？</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="receipt-follow-issue"
                disabled={isFollowed || followDecision === 'followed' || followSaving || !onFollow}
                onClick={() => void followIssue()}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                <Bookmark className="h-3.5 w-3.5" />
                {isFollowed || followDecision === 'followed' ? 'フォロー中' : followSaving ? '登録中…' : 'この議題をフォローする'}
              </button>
              <button
                type="button"
                onClick={() => setFollowDecision('later')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600"
              >
                今はしない
              </button>
              <button
                type="button"
                data-testid="receipt-view-aggregate"
                onClick={() => aggregateSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-700"
              >
                みんなの回答を見る
              </button>
              <button
                type="button"
                data-testid="receipt-change-response"
                onClick={() => setAccepted(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600"
              >
                回答を変更する
              </button>
              {issueStatus && <IssueShareButton issue={config} status={issueStatus} />}
            </div>
            {followDecision === 'later' && <p className="mt-2 text-xs text-slate-500">回答のみ受け付けました。後からフォローできます。</p>}
            {followDecision === 'followed' && <p role="status" className="mt-2 text-xs font-medium text-emerald-800">フォローしました。その後の変化をマイフォローで確認できます。</p>}
            {followError && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{followError}</p>}
          </div>
        </section>
      )}
      {submitError && <p className="mt-3 text-sm font-medium text-red-600">{submitError}</p>}

      <div ref={aggregateSectionRef} className="mt-5 border-t border-emerald-200 pt-4" aria-live="polite">
        <h4 className="text-sm font-bold text-slate-900">みんなの回答</h4>
        {loading && <p className="mt-2 text-sm text-slate-500">回答状況を読み込み中</p>}
        {!loading && loadError && (
          <div data-testid="aggregate-error" className="mt-2 rounded-xl bg-white p-3">
            <p className="text-sm font-medium text-red-700">回答状況を確認できません</p>
            <button
              type="button"
              data-testid="retry-aggregate"
              onClick={() => void fetchSnapshot(false)}
              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-emerald-700"
            >
              <RefreshCw className="h-4 w-4" />再試行
            </button>
          </div>
        )}
        {!loading && aggregate && (
          <div className="mt-3">
            <p data-testid="aggregate-total" className="text-sm font-bold text-slate-800">市民回答 {aggregate.total_responses}件</p>
            {aggregate.total_responses > 0 && (
              <>
                <div className="mt-3 space-y-2">
                  {aggregate.answers.map((answer) => (
                    <div key={answer.id} data-testid={`aggregate-answer-${answer.id}`} className="rounded-lg bg-white px-3 py-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <span>{answer.label}</span>
                        <strong>{answer.count}件（{answer.percentage ?? 0}%）</strong>
                      </div>
                    </div>
                  ))}
                </div>
                {topReasons.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-600">選択理由の上位項目</p>
                    <ol className="mt-2 space-y-1 text-sm text-slate-700">
                      {topReasons.map((reason) => (
                        <li key={reason.id}>{reason.label}：{reason.count}件</li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
