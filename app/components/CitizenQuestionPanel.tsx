'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, Send } from 'lucide-react';
import {
  CITIZEN_RESPONSE_SUCCESS_MESSAGE,
  type CitizenQuestionDefinition,
} from '../data/citizenQuestions';

interface MyResponse {
  readonly selected_answer: string;
  readonly selected_reasons: readonly string[];
  readonly free_text: string;
}

interface AggregateItem {
  readonly id: string;
  readonly label: string;
  readonly count: number;
  readonly percentage?: number;
}

interface Aggregate {
  readonly total_responses: number;
  readonly answers: readonly AggregateItem[];
  readonly reasons: readonly AggregateItem[];
  readonly top_reasons: readonly AggregateItem[];
}

interface CitizenQuestionSnapshot {
  readonly storage_backend: 'firestore';
  readonly my_response: MyResponse | null;
  readonly aggregate: Aggregate;
}

const ANONYMOUS_USER_STORAGE_KEY = 'gijiraku_anonymous_user_id';

function getOrCreateAnonymousUserId() {
  const existing = window.localStorage.getItem(ANONYMOUS_USER_STORAGE_KEY);
  if (existing) return existing;
  const generated = window.crypto?.randomUUID?.()
    || `anonymous-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(ANONYMOUS_USER_STORAGE_KEY, generated);
  return generated;
}

interface CitizenQuestionPanelProps {
  readonly config: CitizenQuestionDefinition;
}

export default function CitizenQuestionPanel({ config }: CitizenQuestionPanelProps) {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const fetchSnapshot = useCallback(async (restoreMyResponse: boolean) => {
    setLoading(true);
    setLoadError(false);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
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
      const payload = await response.json() as CitizenQuestionSnapshot;
      if (payload.storage_backend !== 'firestore') {
        throw new Error('Unexpected citizen response storage backend');
      }
      setAggregate(payload.aggregate);
      if (restoreMyResponse && payload.my_response) {
        setSelectedAnswer(payload.my_response.selected_answer);
        setSelectedReasons([...payload.my_response.selected_reasons]);
        setFreeText(payload.my_response.free_text);
      }
    } catch {
      setAggregate(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [config.issueId, config.questionId]);

  useEffect(() => {
    queueMicrotask(() => void fetchSnapshot(true));
  }, [fetchSnapshot]);

  const toggleReason = (reasonId: string) => {
    setAccepted(false);
    setSelectedReasons((current) => current.includes(reasonId)
      ? current.filter((id) => id !== reasonId)
      : [...current, reasonId]);
  };

  const textIsTooLong = freeText.length > 500;
  const canSubmit = Boolean(selectedAnswer)
    && selectedReasons.length > 0
    && !textIsTooLong
    && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setSubmitError(null);
    setAccepted(false);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
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
      await fetchSnapshot(false);
      setAccepted(true);
    } catch {
      setSubmitError('回答を保存できませんでした。時間をおいて再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const topReasons = useMemo(
    () => aggregate?.top_reasons.slice(0, 3) || [],
    [aggregate],
  );

  return (
    <section
      data-testid="citizen-question-panel"
      className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5"
    >
      <p className="text-xs font-bold tracking-wide text-emerald-700">市民への質問</p>
      <h3 className="mt-2 text-base font-bold leading-relaxed text-slate-900">
        {config.question}
      </h3>

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
          <label className="mt-4 block text-sm font-bold text-slate-800" htmlFor="citizen-free-text">
            具体的な経験や希望があれば教えてください（任意）
          </label>
          <textarea
            id="citizen-free-text"
            data-testid="question-free-text"
            rows={4}
            value={freeText}
            onChange={(event) => {
              setFreeText(event.target.value);
              setAccepted(false);
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

      {accepted && (
        <p data-testid="citizen-response-success" className="mt-4 flex items-start gap-2 rounded-xl bg-white p-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {CITIZEN_RESPONSE_SUCCESS_MESSAGE}
        </p>
      )}
      {submitError && <p className="mt-3 text-sm font-medium text-red-600">{submitError}</p>}

      <div className="mt-5 border-t border-emerald-200 pt-4" aria-live="polite">
        <h4 className="text-sm font-bold text-slate-900">みんなの回答</h4>
        {loading && <p className="mt-2 text-sm text-slate-500">集計を読み込んでいます…</p>}
        {!loading && loadError && (
          <div data-testid="aggregate-error" className="mt-2 rounded-xl bg-white p-3">
            <p className="text-sm font-medium text-red-700">集計を取得できませんでした</p>
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
            <p data-testid="aggregate-total" className="text-sm font-bold text-slate-800">
              回答総数：{aggregate.total_responses}件
            </p>
            {aggregate.total_responses === 0 ? (
              <p className="mt-2 text-sm text-slate-600">まだ回答はありません。</p>
            ) : (
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
