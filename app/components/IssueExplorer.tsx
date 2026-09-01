'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  ExternalLink,
  Filter,
  MessageSquare,
  RefreshCw,
  Users,
} from 'lucide-react';
import type { Assembly } from '../types/assembly';
import type { IssueCatalogItem, IssueCatalogTheme } from '../types/issueCatalog';
import {
  CITIZEN_RESPONSE_COUNT_EVENT,
  normalizeCitizenResponseSnapshot,
} from '../lib/citizenResponse';

interface IssueExplorerProps {
  readonly assemblies: readonly Assembly[];
  readonly issues: readonly IssueCatalogItem[];
  readonly themes: readonly IssueCatalogTheme[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly selectedAssemblyId: string;
  readonly selectedTheme: string;
  readonly followedIssueIds: readonly string[];
  readonly onSelectAssembly: (assemblyId: string) => void;
  readonly onSelectTheme: (themeId: string) => void;
  readonly onOpenIssue: (issue: IssueCatalogItem) => void;
  readonly onRetry: () => void;
}

const PAGE_SIZE = 12;

function formatDate(value: string): string {
  return value.replaceAll('-', '/');
}

type AnswerCountState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly count: number }
  | { readonly status: 'error' };

function ResponseCount({ state, enabled }: { readonly state?: AnswerCountState; readonly enabled: boolean }) {
  if (!enabled) return <span data-testid="citizen-question-unavailable">市民質問は準備中</span>;
  if (!state || state.status === 'loading') return <span data-testid="answer-count-loading">回答状況を読み込み中</span>;
  if (state.status === 'error') return <span data-testid="answer-count-error">回答状況を確認できません</span>;
  return <span data-testid="answer-count">市民回答 {state.count}件</span>;
}

export default function IssueExplorer({
  assemblies,
  issues,
  themes,
  loading,
  error,
  selectedAssemblyId,
  selectedTheme,
  followedIssueIds,
  onSelectAssembly,
  onSelectTheme,
  onOpenIssue,
  onRetry,
}: IssueExplorerProps) {
  const [stage, setStage] = useState('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [followedOnly, setFollowedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [answerCountStates, setAnswerCountStates] = useState<Record<string, AnswerCountState>>({});

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10_000);
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const loadCounts = async () => {
      const configuredIssues = issues.filter((issue) => issue.question_id);
      setAnswerCountStates(Object.fromEntries(
        configuredIssues.map((issue) => [issue.issue_id, { status: 'loading' } satisfies AnswerCountState]),
      ));
      const entries = await Promise.all(configuredIssues.map(async (issue) => {
        const query = new URLSearchParams({
          issue_id: issue.issue_id,
          question_id: issue.question_id!,
          include_my_response: 'false',
        });
        try {
          const response = await fetch(`${apiBase}/api/citizen-question-responses?${query}`, {
            cache: 'no-store',
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(`Citizen response API failed: ${response.status}`);
          const snapshot = normalizeCitizenResponseSnapshot(
            await response.json(),
            issue.issue_id,
            issue.question_id!,
          );
          return [issue.issue_id, {
            status: 'success',
            count: snapshot.aggregate.total_responses,
          } satisfies AnswerCountState] as const;
        } catch (error) {
          if (!cancelled) {
            console.error('Citizen response count could not be loaded', {
              issue_id: issue.issue_id,
              question_id: issue.question_id,
              timed_out: timedOut,
              error,
            });
          }
          return [issue.issue_id, { status: 'error' } satisfies AnswerCountState] as const;
        }
      }));
      if (!cancelled) {
        setAnswerCountStates(Object.fromEntries(entries));
      }
      window.clearTimeout(timeout);
    };
    void loadCounts();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [issues]);

  useEffect(() => {
    const handleCountUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ issueId?: unknown; count?: unknown }>).detail;
      if (typeof detail?.issueId !== 'string' || typeof detail.count !== 'number') return;
      const issueId = detail.issueId;
      const count = detail.count;
      setAnswerCountStates((current) => ({
        ...current,
        [issueId]: { status: 'success', count: Math.max(0, count) },
      }));
    };
    window.addEventListener(CITIZEN_RESPONSE_COUNT_EVENT, handleCountUpdate);
    return () => window.removeEventListener(CITIZEN_RESPONSE_COUNT_EVENT, handleCountUpdate);
  }, []);

  const stages = useMemo(() => Array.from(new Set(issues.map((issue) => issue.stage))), [issues]);
  const filteredIssues = useMemo(() => {
    const result = issues.filter((issue) => (
      (selectedAssemblyId === 'all' || issue.assembly_id === selectedAssemblyId)
      && (selectedTheme === 'all' || issue.theme.id === selectedTheme)
      && (stage === 'all' || issue.stage === stage)
      && (!followedOnly || followedIssueIds.includes(issue.issue_id))
    ));
    return result.sort((left, right) => (
      sort === 'newest'
        ? right.meeting_date.localeCompare(left.meeting_date)
        : left.meeting_date.localeCompare(right.meeting_date)
    ));
  }, [followedIssueIds, followedOnly, issues, selectedAssemblyId, selectedTheme, sort, stage]);

  const regionCards = useMemo(() => assemblies
    .filter((assembly) => selectedAssemblyId === 'all' || assembly.id === selectedAssemblyId)
    .map((assembly) => {
      const regionIssues = issues.filter((issue) => (
        issue.assembly_id === assembly.id
        && (selectedTheme === 'all' || issue.theme.id === selectedTheme)
      ));
      return { assembly, issues: regionIssues.slice(0, 3), total: regionIssues.length };
    })
    .filter((item) => item.total > 0), [assemblies, issues, selectedAssemblyId, selectedTheme]);

  if (loading) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">議題を読み込んでいます…</p>;
  }
  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        <p className="font-bold">議題を取得できませんでした</p>
        <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-1 font-bold text-emerald-700">
          <RefreshCw className="h-4 w-4" />再試行
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="region-issues-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 id="region-issues-title" className="text-base font-bold text-slate-900 dark:text-white">地域ごとの直近の議題</h3>
          <span className="text-xs text-slate-500">{issues.length}議題を公開中</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {regionCards.map(({ assembly, issues: latest, total }) => (
            <article key={assembly.id} data-testid="discussion-card" data-assembly-id={assembly.id} data-discussion-id={latest[0]?.issue_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h4 data-testid="card-municipality" className="font-bold text-slate-900 dark:text-white">{assembly.name}</h4>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{total}議題</span>
              </div>
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {latest.map((issue, index) => (
                  <li key={issue.issue_id} className="py-3">
                    <button type="button" aria-label={index === 0 ? `この議論を見る：${issue.title}` : undefined} onClick={() => onOpenIssue(issue)} className="w-full text-left">
                      <span data-testid={index === 0 ? 'card-topic' : undefined} className="block text-sm font-bold text-slate-900 hover:text-emerald-700 dark:text-white">{issue.title}</span>
                      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span data-testid={index === 0 ? 'card-date' : undefined}>{formatDate(issue.meeting_date)}｜{issue.meeting_name}</span><span>{issue.theme.label}</span><span>{issue.stage}</span><span>{issue.speaker_count}人が発言</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <span className="text-slate-500">ほか{Math.max(0, total - latest.length)}件</span>
                <button type="button" onClick={() => onSelectAssembly(assembly.id)} className="inline-flex items-center font-bold text-emerald-700 dark:text-emerald-400">
                  この地域の議題をすべて見る<ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="issue-list" aria-labelledby="issue-list-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 id="issue-list-title" className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"><Filter className="h-4 w-4" />議題を探す</h3>
          <span data-testid="filtered-issue-count" className="text-xs text-slate-500">該当 {filteredIssues.length}件</span>
        </div>
        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
          <select aria-label="地域で絞り込む" value={selectedAssemblyId} onChange={(event) => { setVisibleCount(PAGE_SIZE); onSelectAssembly(event.target.value); }} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-950">
            <option value="all">すべての地域</option>{assemblies.map((assembly) => <option key={assembly.id} value={assembly.id}>{assembly.name}</option>)}
          </select>
          <select aria-label="テーマで絞り込む" value={selectedTheme} onChange={(event) => { setVisibleCount(PAGE_SIZE); onSelectTheme(event.target.value); }} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-950">
            <option value="all">すべてのテーマ</option>{themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.label}</option>)}
          </select>
          <select aria-label="進捗で絞り込む" value={stage} onChange={(event) => { setVisibleCount(PAGE_SIZE); setStage(event.target.value); }} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-950">
            <option value="all">すべての進捗</option>{stages.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select aria-label="並び替え" value={sort} onChange={(event) => { setVisibleCount(PAGE_SIZE); setSort(event.target.value as 'newest' | 'oldest'); }} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-950">
            <option value="newest">新着順</option><option value="oldest">古い順</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-2 py-2 text-xs dark:border-slate-700">
            <input type="checkbox" checked={followedOnly} onChange={(event) => { setVisibleCount(PAGE_SIZE); setFollowedOnly(event.target.checked); }} />自分がフォロー中
          </label>
        </div>

        {filteredIssues.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">条件に一致する議題はありません。</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {filteredIssues.slice(0, visibleCount).map((issue) => (
              <article key={issue.issue_id} data-testid="issue-card" data-issue-id={issue.issue_id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3 text-[11px] text-slate-500">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{issue.assembly_name}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(issue.meeting_date)}</span>
                </div>
                <h4 data-testid="issue-card-title" className="mt-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">{issue.title}</h4>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{issue.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">{issue.theme.label}</span>
                  <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">{issue.stage}</span>
                </div>
                <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                  <p><Users className="mr-1 inline h-3 w-3" />{issue.people.join('、')}（発言者 {issue.speaker_count}人）</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300"><ResponseCount state={answerCountStates[issue.issue_id]} enabled={Boolean(issue.question_id)} /></p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button type="button" onClick={() => onOpenIssue(issue)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500">
                    <MessageSquare className="h-3.5 w-3.5" />詳細を見る
                  </button>
                  <a href={issue.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-700">公式原文<ExternalLink className="h-3 w-3" /></a>
                </div>
              </article>
            ))}
          </div>
        )}
        {visibleCount < filteredIssues.length && (
          <button type="button" data-testid="load-more-issues" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="mx-auto mt-5 block rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400">もっと見る</button>
        )}
      </section>
    </div>
  );
}
