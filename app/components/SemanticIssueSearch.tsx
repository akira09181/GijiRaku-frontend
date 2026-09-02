'use client';

import { useMemo, useRef, useState } from 'react';
import { ExternalLink, LoaderCircle, Search, X } from 'lucide-react';
import { getApiBase } from '../lib/apiBase';
import type { IssueCatalogItem } from '../types/issueCatalog';
import type { SemanticSearchResponse, SemanticSearchResult } from '../types/semanticSearch';

interface SemanticIssueSearchProps {
  readonly issues: readonly IssueCatalogItem[];
  readonly selectedAssemblyId: string;
  readonly selectedTheme: string;
  readonly onOpenIssue: (issue: IssueCatalogItem) => void;
}

type SearchState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly query: string; readonly results: readonly SemanticSearchResult[] }
  | { readonly status: 'error'; readonly message: string };

function isSearchResponse(value: unknown): value is SemanticSearchResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SemanticSearchResponse>;
  return candidate.status === 'success' && Array.isArray(candidate.results);
}

function normalizeSearchResult(value: unknown): SemanticSearchResult | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SemanticSearchResult>;
  if (typeof candidate.issue_id !== 'string' || typeof candidate.statement_id !== 'string') {
    return null;
  }
  const text = (field: unknown) => typeof field === 'string' ? field : '';
  const rawScore = typeof candidate.relevance_score === 'number' && Number.isFinite(candidate.relevance_score)
    ? candidate.relevance_score
    : 0;
  return {
    issue_id: candidate.issue_id,
    statement_id: candidate.statement_id,
    assembly_id: text(candidate.assembly_id),
    assembly_name: text(candidate.assembly_name),
    title: text(candidate.title),
    meeting_name: text(candidate.meeting_name),
    meeting_date: text(candidate.meeting_date),
    speaker_name: text(candidate.speaker_name),
    speaker_role: text(candidate.speaker_role),
    summary: text(candidate.summary),
    source_excerpt: text(candidate.source_excerpt),
    source_url: text(candidate.source_url),
    relevance_score: Math.max(0, Math.min(1, rawScore)),
  };
}

export default function SemanticIssueSearch({
  issues,
  selectedAssemblyId,
  selectedTheme,
  onOpenIssue,
}: SemanticIssueSearchProps) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const requestIdRef = useRef(0);
  const issuesById = useMemo(
    () => new Map(issues.map((issue) => [issue.issue_id, issue])),
    [issues],
  );

  const runSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setState({ status: 'error', message: '2文字以上で検索してください。' });
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    setState({ status: 'loading' });
    try {
      const params = new URLSearchParams({ q: normalizedQuery, limit: '8' });
      if (selectedAssemblyId !== 'all') params.set('assembly_id', selectedAssemblyId);
      const response = await fetch(`${getApiBase()}/api/search/semantic?${params.toString()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Semantic search API failed: ${response.status}`);
      const payload: unknown = await response.json();
      if (!isSearchResponse(payload)) throw new Error('Semantic search response is invalid');
      if (requestId !== requestIdRef.current) return;
      const results = payload.results
        .map(normalizeSearchResult)
        .filter((result): result is SemanticSearchResult => Boolean(result))
        .filter((result) => (
          !result.assembly_id || selectedAssemblyId === 'all' || result.assembly_id === selectedAssemblyId
        ))
        .filter((result) => (
          selectedTheme === 'all' || issuesById.get(result.issue_id)?.theme.id === selectedTheme
        ));
      setState({ status: 'success', query: normalizedQuery, results });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Semantic issue search failed', {
        query: normalizedQuery,
        assembly_id: selectedAssemblyId === 'all' ? null : selectedAssemblyId,
        theme: selectedTheme === 'all' ? null : selectedTheme,
        error,
      });
      setState({
        status: 'error',
        message: controller.signal.aborted
          ? '検索がタイムアウトしました。もう一度お試しください。'
          : '文脈検索を利用できません。時間をおいて再試行してください。',
      });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const clearSearch = () => {
    requestIdRef.current += 1;
    setQuery('');
    setState({ status: 'idle' });
  };

  return (
    <section aria-labelledby="semantic-search-title" className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 id="semantic-search-title" className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Search className="h-4 w-4 text-emerald-600" />文脈で議事録を探す
          </h3>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">言葉が一致しなくても、意味が近い議題や発言を検索します。</p>
        </div>
        {state.status !== 'idle' && (
          <button type="button" onClick={clearSearch} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white">
            <X className="h-3.5 w-3.5" />検索をクリア
          </button>
        )}
      </div>
      <form onSubmit={runSearch} className="mt-3 flex gap-2">
        <label htmlFor="semantic-search-query" className="sr-only">議事録を文脈で検索</label>
        <input
          id="semantic-search-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="例：子どもが急に熱を出した時の預け先"
          maxLength={200}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
        <button type="submit" disabled={state.status === 'loading'} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60">
          {state.status === 'loading' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          検索
        </button>
      </form>

      <div aria-live="polite">
        {state.status === 'loading' && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">関連する発言を検索中です…</p>}
        {state.status === 'error' && <p role="alert" className="mt-3 text-xs font-medium text-rose-700 dark:text-rose-300">{state.message}</p>}
        {state.status === 'success' && state.results.length === 0 && (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">「{state.query}」に近い公開発言は見つかりませんでした。</p>
        )}
        {state.status === 'success' && state.results.length > 0 && (
          <ol data-testid="semantic-search-results" className="mt-3 space-y-2">
            {state.results.map((result) => {
              const issue = issuesById.get(result.issue_id);
              return (
                <li key={`${result.issue_id}:${result.statement_id}`} data-issue-id={result.issue_id} data-statement-id={result.statement_id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{result.assembly_name}・{result.meeting_date.replaceAll('-', '/')}</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{result.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{result.summary || result.source_excerpt}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{result.speaker_name}{result.speaker_role ? `（${result.speaker_role}）` : ''}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">関連度 {Math.round(result.relevance_score * 100)}%</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                    {issue && issue.assembly_id === result.assembly_id && (
                      <button type="button" onClick={() => onOpenIssue(issue)} className="text-xs font-bold text-emerald-700 hover:text-emerald-500 dark:text-emerald-400">この議題を見る</button>
                    )}
                    {result.source_url && (
                      <a href={result.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-700">公式原文 <ExternalLink className="h-3 w-3" /></a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
