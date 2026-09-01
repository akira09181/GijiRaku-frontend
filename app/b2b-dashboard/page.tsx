'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { AssemblyRecord } from '../types/assemblyRecord';

type AssemblyRecordsResponse = {
  status?: string;
  records?: unknown;
};

type ReactionAggregate = {
  statement_id: string;
  counts: {
    agree: number;
    concern: number;
    helpful: number;
  };
};

type ReactionsResponse = {
  status?: string;
  aggregates?: unknown;
  data?: unknown;
};

function normalizeRecords(value: unknown): AssemblyRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is AssemblyRecord => (
    Boolean(item)
    && typeof item === 'object'
    && typeof (item as AssemblyRecord).discussion_id === 'string'
    && typeof (item as AssemblyRecord).topic === 'string'
    && Array.isArray((item as AssemblyRecord).statements)
  ));
}

function normalizeReactions(value: unknown): ReactionAggregate[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ReactionAggregate => (
    Boolean(item)
    && typeof item === 'object'
    && typeof (item as ReactionAggregate).statement_id === 'string'
    && Boolean((item as ReactionAggregate).counts)
    && typeof (item as ReactionAggregate).counts.agree === 'number'
    && typeof (item as ReactionAggregate).counts.concern === 'number'
  ));
}

export default function B2bDashboardPage() {
  const [records, setRecords] = useState<AssemblyRecord[]>([]);
  const [reactions, setReactions] = useState<ReactionAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

      try {
        const recordsRes = await fetch(
          `${apiBase}/api/assembly-records?assembly_id=tokyo-metropolitan&limit=5`,
          { cache: 'no-store' },
        );
        if (!recordsRes.ok) {
          throw new Error('APIの取得に失敗しました');
        }
        const recordsPayload = (await recordsRes.json()) as AssemblyRecordsResponse;
        let nextReactions: ReactionAggregate[] = [];
        try {
          const reactionsRes = await fetch(
            `${apiBase}/api/reactions?discussion_id=tokyo-app-2026-06-16&include_user_state=false`,
            { cache: 'no-store' },
          );
          if (!reactionsRes.ok) throw new Error(`Reaction API failed: ${reactionsRes.status}`);
          const reactionsPayload = (await reactionsRes.json()) as ReactionsResponse;
          nextReactions = normalizeReactions(reactionsPayload.aggregates ?? reactionsPayload.data);
        } catch (reactionError) {
          console.error('B2B dashboard reaction totals could not be loaded', reactionError);
        }

        if (!cancelled) {
          setRecords(normalizeRecords(recordsPayload.records));
          setReactions(nextReactions);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '読み込みに失敗しました');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const totalStatementCount = useMemo(
    () => records.reduce((sum, record) => sum + (record.statements?.length ?? 0), 0),
    [records],
  );

  const totalPositiveReactionCount = useMemo(
    () => reactions.reduce((sum, item) => sum + (item.counts?.agree ?? 0), 0),
    [reactions],
  );

  const totalConcernCount = useMemo(
    () => reactions.reduce((sum, item) => sum + (item.counts?.concern ?? 0), 0),
    [reactions],
  );

  const latestTopic = records[0]?.topic ?? '議事録の読み込み待ち';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
            >
              <ArrowLeft className="h-4 w-4" />
              トップへ戻る
            </Link>
          </div>
          <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            B2B ダッシュボード
          </div>
        </div>

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-6 shadow-2xl shadow-emerald-900/10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">MachiVoice Administration</p>
              <h1 className="mt-2 text-3xl font-bold text-white">東京都議会・施策分析ダッシュボード</h1>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-400/10 p-3 text-emerald-200">
              <BarChart3 className="h-7 w-7" />
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            会議録の発言単位構造化と市民の反応を横断し、政策訴求の強さ、テーマの焦点、懸念の分布を一目で把握できる。行政・議員向けのEBPM確認画面として使える。
          </p>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
            読み込み中です…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-800 bg-rose-950/30 p-6 text-rose-200">
            <p>{error}</p>
            <button type="button" onClick={() => { setLoading(true); setReloadToken((value) => value + 1); }} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-rose-700 px-3 py-2 text-xs font-bold">
              <RefreshCw className="h-3.5 w-3.5" />再試行
            </button>
          </div>
        ) : (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                testId="b2b-record-count"
                title="対象議題"
                value={records.length.toString()}
                hint="公開中の議事録"
                icon={<FileText className="h-5 w-5" />}
              />
              <SummaryCard
                testId="b2b-statement-count"
                title="発言数"
                value={totalStatementCount.toString()}
                hint="構造化済み発言"
                icon={<Users className="h-5 w-5" />}
              />
              <SummaryCard
                testId="b2b-agree-count"
                title="東京アプリの賛成反応"
                value={totalPositiveReactionCount.toString()}
                hint="agree 集計"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <SummaryCard
                testId="b2b-concern-count"
                title="東京アプリの懸念件数"
                value={totalConcernCount.toString()}
                hint="concern 集計"
                icon={<ShieldCheck className="h-5 w-5" />}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">主要テーマの動向</h2>
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="space-y-4">
                  {records.map((record, index) => (
                    <div key={record.discussion_id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                          {index + 1}. {record.meeting_date ?? '日付不明'}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-300">
                          {record.statements.length}発言
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white">{record.topic}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {record.what_changes ?? '要約は未設定です。'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">最新トピック</h2>
                  <Building2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">Current focus</p>
                  <h3 className="mt-2 text-xl font-bold text-white">{latestTopic}</h3>
                </div>

                <div className="mt-5 space-y-3">
                  {records[0]?.statements.slice(0, 4).map((statement) => (
                    <div key={statement.statement_id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-100">{statement.speaker_name}</span>
                        <span className="text-[10px] text-slate-400">{statement.question_type ?? '発言'}</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-300">{statement.summary_quote}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  testId,
  title,
  value,
  hint,
  icon,
}: {
  testId: string;
  title: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div data-testid={testId} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-slate-950/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-300">{title}</span>
        <span className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-emerald-300">{icon}</span>
      </div>
      <div className="text-3xl font-bold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-xs text-slate-400">{hint}</div>
    </div>
  );
}
