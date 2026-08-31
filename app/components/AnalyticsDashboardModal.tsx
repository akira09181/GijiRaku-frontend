'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  BarChart3,
  Users,
  Building2,
  Activity,
  Vote,
  Layers,
  CheckCircle2,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Assembly } from '../types/assembly';
import {
  AssemblyAnalytics,
  TopicTrend,
  PartyPolicyStance,
  MemberScorecard,
} from '../types/analytics';

interface AnalyticsDashboardModalProps {
  readonly assembly: Assembly;
  readonly onClose: () => void;
}

type TabType = 'overview' | 'party' | 'member' | 'public';

interface ReactionAggregate {
  readonly statement_id: string;
  readonly counts: {
    readonly agree: number;
    readonly concern: number;
    readonly helpful: number;
  };
  readonly live_counts?: {
    readonly agree: number;
    readonly concern: number;
    readonly helpful: number;
  };
}

interface AssemblyRecordStatement {
  readonly statement_id: string;
  readonly speaker_name: string;
  readonly speaker_role: string;
  readonly party_name?: string;
  readonly stance_label?: string;
  readonly summary_quote: string;
  readonly source_excerpt?: string;
}

interface AssemblyRecord {
  readonly discussion_id: string;
  readonly topic: string;
  readonly source_url: string;
  readonly statements: readonly AssemblyRecordStatement[];
}

interface AssemblyRecordsResponse {
  readonly records?: readonly AssemblyRecord[];
}

interface ReactionTotals {
  readonly agree: number;
  readonly concern: number;
  readonly helpful: number;
}

/**
 * 議員・行政向け EBPM分析ダッシュボードモーダル
 * - 行政・議員向けEBPM分析・議事録トピック抽出・市民世論スコア
 * - スマートフォンでのフルスクリーンレスポンシブ対応
 */
export default function AnalyticsDashboardModal({
  assembly,
  onClose,
}: AnalyticsDashboardModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AssemblyAnalytics | null>(null);
  const [reactionCount, setReactionCount] = useState<number>(0);
  const [liveReactionCounts, setLiveReactionCounts] = useState<ReactionTotals>({
    agree: 0,
    concern: 0,
    helpful: 0,
  });
  const [isCountUpdated, setIsCountUpdated] = useState(false);
  const lastServerReactionCountRef = useRef<number | null>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    queueMicrotask(() => setLoading(true));
    let cancelled = false;
    let refreshInFlight = false;
    let recordsCache: readonly AssemblyRecord[] | null = null;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

    const loadAssemblyRecords = async (): Promise<readonly AssemblyRecord[]> => {
      if (recordsCache !== null) return recordsCache;
      try {
        const query = new URLSearchParams({ assembly_id: assembly.id, limit: '100' });
        const response = await fetch(`${apiBase}/api/assembly-records?${query.toString()}`, {
          cache: 'no-store',
        });
        if (!response.ok) return [];
        const payload = await response.json() as AssemblyRecordsResponse;
        recordsCache = payload.records || [];
        return recordsCache;
      } catch {
        return [];
      }
    };

    const refreshAnalytics = async () => {
      if (refreshInFlight) return;
      refreshInFlight = true;

      try {
        const records = await loadAssemblyRecords();
        const reactionByStatement = new Map<string, ReactionTotals>();
        let reactionRequestSucceeded = false;
        const query = new URLSearchParams({
          discussion_id: assembly.id,
          include_user_state: 'false',
        });
        try {
          const response = await fetch(`${apiBase}/api/reactions?${query.toString()}`, {
            cache: 'no-store',
          });
          if (response.ok) {
            reactionRequestSucceeded = true;
            const payload = await response.json() as {
              aggregates?: ReactionAggregate[];
              data?: ReactionAggregate[];
            };
            (payload.aggregates || payload.data || []).forEach((aggregate) => {
              reactionByStatement.set(
                aggregate.statement_id,
                aggregate.live_counts || { agree: 0, concern: 0, helpful: 0 },
              );
            });
          }
        } catch {
          // Keep the last displayed server count when the API is unavailable.
        }

        const totals = Array.from(reactionByStatement.values()).reduce<ReactionTotals>(
          (sum, counts) => ({
            agree: sum.agree + counts.agree,
            concern: sum.concern + counts.concern,
            helpful: sum.helpful + counts.helpful,
          }),
          { agree: 0, concern: 0, helpful: 0 },
        );
        const totalReactions = totals.agree + totals.concern + totals.helpful;
        const ratio = (count: number, total: number) => total > 0
          ? Math.round((count / total) * 100)
          : 0;
        const positivePct = ratio(totals.agree, totalReactions);

        if (cancelled) return;

        if (reactionRequestSucceeded) {
          if (
            lastServerReactionCountRef.current !== null &&
            lastServerReactionCountRef.current !== totalReactions
        ) {
          setIsCountUpdated(true);
        }
        lastServerReactionCountRef.current = totalReactions;
        setReactionCount(totalReactions);
        setLiveReactionCounts(totals);
        }

        const topicTrends: readonly TopicTrend[] = records.slice(0, 6).map((record) => {
          const counts = record.statements.reduce<ReactionTotals>((sum, statement) => {
            const reaction = reactionByStatement.get(
              `${assembly.id}-speaker-${statement.statement_id}`,
            ) || { agree: 0, concern: 0, helpful: 0 };
            return {
              agree: sum.agree + reaction.agree,
              concern: sum.concern + reaction.concern,
              helpful: sum.helpful + reaction.helpful,
            };
          }, { agree: 0, concern: 0, helpful: 0 });
          const total = counts.agree + counts.concern + counts.helpful;
          const hotKeywords = Array.from(new Set(
            record.statements.map((statement) => statement.stance_label).filter(Boolean),
          )).slice(0, 3) as string[];
          return {
            topic: record.topic,
            frequency: record.statements.length,
            sentimentRatio: {
              positive: ratio(counts.agree, total),
              neutral: ratio(counts.helpful, total),
              negative: ratio(counts.concern, total),
            },
            hotKeywords,
          };
        });

        const partyGroups = new Map<string, {
          speakers: Set<string>;
          statements: AssemblyRecordStatement[];
          topics: string[];
        }>();
        records.forEach((record) => record.statements.forEach((statement) => {
          const partyName = statement.party_name || '所属記載なし';
          const group = partyGroups.get(partyName) || {
            speakers: new Set<string>(),
            statements: [],
            topics: [],
          };
          group.speakers.add(statement.speaker_name);
          group.statements.push(statement);
          group.topics.push(record.topic);
          partyGroups.set(partyName, group);
        }));
        const partyAnalytics: readonly PartyPolicyStance[] = Array.from(partyGroups.entries())
          .sort((left, right) => right[1].statements.length - left[1].statements.length)
          .slice(0, 6)
          .map(([partyName, group]) => ({
            partyName,
            membersCount: group.speakers.size,
            topCategory: group.topics[0] || '議題未分類',
            aiStanceSummary: group.statements[0]?.summary_quote || '要約対象の発言はありません。',
          }));

        const speakerGroups = new Map<string, {
          role: string;
          party: string;
          statements: AssemblyRecordStatement[];
        }>();
        records.forEach((record) => record.statements.forEach((statement) => {
          const group = speakerGroups.get(statement.speaker_name) || {
            role: statement.speaker_role,
            party: statement.party_name || '所属記載なし',
            statements: [],
          };
          group.statements.push(statement);
          speakerGroups.set(statement.speaker_name, group);
        }));
        const memberScorecards: readonly MemberScorecard[] = Array.from(speakerGroups.entries())
          .sort((left, right) => right[1].statements.length - left[1].statements.length)
          .slice(0, 8)
          .map(([name, group], index) => ({
            id: group.statements[0]?.statement_id || `speaker-${index}`,
            name,
            title: group.role,
            party: group.party,
            avatarType: 'neutral',
            activityScore: group.statements.length,
            aiEval: group.statements[0]?.summary_quote || '要約対象の発言はありません。',
          }));

        const allStatements = records.flatMap((record) => record.statements);
        const sourcedStatements = records.flatMap((record) =>
          record.statements.filter((statement) => record.source_url && statement.source_excerpt),
        );
        const sourceCoverage = allStatements.length > 0
          ? Math.round((sourcedStatements.length / allStatements.length) * 100)
          : 0;

        setAnalytics({
          assemblyId: assembly.id,
          assemblyName: assembly.name,
          totalSpeechesAnalyzed: allStatements.length,
          ebpmDataReadinessScore: sourceCoverage,
          topicTrends,
          partyAnalytics,
          memberScorecards,
          publicSentimentScore: positivePct,
        });
        setLoading(false);
      } finally {
        refreshInFlight = false;
      }
    };

    const timer = setTimeout(() => void refreshAnalytics(), 250);
    const pollingTimer = setInterval(() => void refreshAnalytics(), 30000);
    const handleCountUpdate = () => void refreshAnalytics();
    window.addEventListener('ebpm_count_updated', handleCountUpdate);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(pollingTimer);
      window.removeEventListener('ebpm_count_updated', handleCountUpdate);
    };
  }, [assembly]);

  if (!mounted) return null;

  const reactionBreakdown = [
    { label: '肯定的', count: liveReactionCounts.agree, color: 'bg-emerald-500' },
    { label: '再議論希望', count: liveReactionCounts.concern, color: 'bg-rose-500' },
    { label: '参考', count: liveReactionCounts.helpful, color: 'bg-slate-400 dark:bg-slate-600' },
  ];
  const topReaction = reactionBreakdown.reduce((top, item) =>
    item.count > top.count ? item : top,
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* モーダル枠 */}
      <div className="w-full h-full sm:h-[90vh] sm:max-w-4xl dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 bg-white border-slate-200 text-slate-900 sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden">
        {/* モーダルヘッダー */}
        <div className="dark:bg-slate-900 dark:border-slate-800/80 bg-slate-100 border-slate-200 border-b px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl dark:bg-slate-800 dark:border-slate-700 bg-white border-slate-300 border flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base dark:text-white text-slate-900 truncate">
                  マチボイス EBPM政策分析 ({assembly.name})
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold shrink-0">
                  LIVE OPEN DATA
                </span>
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 truncate">
                公式会議録の構造化データ・Firestoreの市民リアクションを集計
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 text-slate-500 hover:bg-slate-200 bg-slate-200/60 flex items-center justify-center transition-colors"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ナビゲーションタブ */}
        <div className="dark:bg-slate-900/60 dark:border-slate-800/60 bg-slate-50 border-slate-200 border-b px-4 sm:px-6 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'overview', label: '政策トピック概況', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'party', label: '会派・政党スタンス', icon: <Building2 className="w-3.5 h-3.5" /> },
            { id: 'member', label: '発言・答弁評価', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'public', label: '市民世論フィードバック', icon: <Vote className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-2.5 px-3 border-b-2 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent dark:text-slate-400 dark:hover:text-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* タブコンテンツ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 dark:bg-slate-950 bg-slate-50/80">
          {loading || !analytics ? (
            <div className="flex flex-col items-center justify-center py-20 dark:text-slate-400 text-slate-500 gap-3">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">オープンデータを解析中...</span>
            </div>
          ) : (
            <>
              {/* サマリー数値カード */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border rounded-xl p-3 sm:p-4 shadow-xs">
                  <span className="text-[11px] dark:text-slate-400 text-slate-500 block mb-1">解析対象 発言数</span>
                  <div className="text-base sm:text-xl font-bold dark:text-white text-slate-900">
                    {analytics.totalSpeechesAnalyzed.toLocaleString()}
                    <span className="text-xs font-normal dark:text-slate-400 text-slate-500 ml-1">件</span>
                  </div>
                </div>

                <div className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border rounded-xl p-3 sm:p-4 shadow-xs">
                  <span className="text-[11px] dark:text-slate-400 text-slate-500 block mb-1">原文出典整備率</span>
                  <div className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {analytics.ebpmDataReadinessScore}
                    <span className="text-xs font-normal dark:text-slate-400 text-slate-500 ml-1">%</span>
                  </div>
                </div>

                <div className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border rounded-xl p-3 sm:p-4 shadow-xs">
                  <span className="text-[11px] dark:text-slate-400 text-slate-500 block mb-1">政策トピック数</span>
                  <div className="text-base sm:text-xl font-bold dark:text-white text-slate-900">
                    {analytics.topicTrends.length}
                    <span className="text-xs font-normal dark:text-slate-400 text-slate-500 ml-1">分野</span>
                  </div>
                </div>

                <div className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border rounded-xl p-3 sm:p-4 shadow-xs">
                  <span className="text-[11px] dark:text-slate-400 text-slate-500 block mb-1">肯定的リアクション率</span>
                  <div className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {analytics.publicSentimentScore}%
                  </div>
                </div>
              </div>

              {/* タブ 1: 政策トピック概況 */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>公式会議録の議題と収録発言数</span>
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {analytics.topicTrends.map((topic, i) => (
                      <div
                        key={i}
                        className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border rounded-xl p-3.5 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs sm:text-sm dark:text-white text-slate-900">
                            {topic.topic}
                          </span>
                          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                            {topic.frequency} 発言
                          </span>
                        </div>

                        {/* 感情・合意メーター */}
                        <div className="space-y-1">
                          <div className="w-full h-2 dark:bg-slate-800 bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${topic.sentimentRatio.positive}%` }}
                              title={`肯定的: ${topic.sentimentRatio.positive}%`}
                            />
                            <div
                              className="bg-slate-400 dark:bg-slate-600 h-full"
                              style={{ width: `${topic.sentimentRatio.neutral}%` }}
                              title={`参考: ${topic.sentimentRatio.neutral}%`}
                            />
                            <div
                              className="bg-rose-500 h-full"
                              style={{ width: `${topic.sentimentRatio.negative}%` }}
                              title={`再議論希望: ${topic.sentimentRatio.negative}%`}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] dark:text-slate-400 text-slate-600">
                            <span>肯定的 {topic.sentimentRatio.positive}%</span>
                            <span>参考 {topic.sentimentRatio.neutral}%</span>
                            <span>再議論希望 {topic.sentimentRatio.negative}%</span>
                          </div>
                        </div>

                        {/* ホットキーワード */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] dark:text-slate-500 text-slate-500">キーワード:</span>
                          {topic.hotKeywords.map((kw, kwIdx) => (
                            <span
                              key={kwIdx}
                              className="px-2 py-0.5 rounded dark:bg-slate-800 dark:border-slate-700/80 dark:text-slate-300 bg-slate-100 border-slate-200 border text-slate-700 text-[10px]"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* タブ 2: 会派・政党スタンス */}
              {activeTab === 'party' && (
                <div className="space-y-4">
                  <h4 className="text-xs sm:text-sm font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>公式会議録に収録された所属別発言</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analytics.partyAnalytics.map((party, i) => (
                      <div
                        key={i}
                        className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border rounded-xl p-3.5 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-100 pb-2">
                          <div>
                            <span className="font-bold text-xs sm:text-sm dark:text-white text-slate-900 block">
                              {party.partyName}
                            </span>
                            <span className="text-[10px] dark:text-slate-400 text-slate-500">
                              収録発言者: {party.membersCount}名
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 bg-emerald-50 text-emerald-800 border-emerald-300 border text-[10px] font-medium">
                            {party.topCategory}
                          </span>
                        </div>

                        <p className="text-xs dark:text-slate-300 text-slate-800 leading-relaxed">
                          {party.aiStanceSummary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* タブ 3: 発言・答弁評価 */}
              {activeTab === 'member' && (
                <div className="space-y-4">
                  <h4 className="text-xs sm:text-sm font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>公式会議録の主要発言者</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analytics.memberScorecards.map((member) => (
                      <div
                        key={member.id}
                        className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border rounded-xl p-3.5 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs sm:text-sm dark:text-white text-slate-900 block">
                              {member.name}
                            </span>
                            <span className="text-[10px] dark:text-slate-400 text-slate-500">
                              {member.title} • {member.party}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-400 bg-emerald-50 border-emerald-200 border text-emerald-800 text-xs font-bold font-mono">
                            <Activity className="w-3 h-3" />
                            <span>{member.activityScore}件</span>
                          </div>
                        </div>

                        <p className="text-xs dark:text-slate-300 text-slate-800 leading-relaxed dark:bg-slate-950 bg-slate-50 p-2.5 rounded-lg border dark:border-slate-800 border-slate-200">
                          {member.aiEval}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* タブ 4: 市民世論フィードバック (EBPM双方向連動) */}
              {activeTab === 'public' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                      <Vote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>リアルタイム市民フィードバック</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 bg-emerald-50 text-emerald-800 border-emerald-300 border font-mono font-medium">
                      Firestore Live Sync
                    </span>
                  </div>

                  {/* 実証目標KPIカード */}
                  <div className="dark:bg-gradient-to-r dark:from-emerald-950/40 dark:to-slate-900 dark:border-emerald-500/30 bg-emerald-50/90 border-emerald-200 border rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        ソーシャルインパクト目標KPI (PoC検証設定)
                      </span>
                      <span className="text-xs dark:text-slate-300 text-slate-800 font-bold font-mono">
                        目標: 情報到達時間 30分 ➔ 3分 (90%短縮)
                      </span>
                    </div>
                    <p className="text-[11.5px] dark:text-slate-300 text-slate-700 leading-relaxed">
                      PoCでは、都民が必要な政策情報に到達する時間を30分から3分へ短縮することを目標に検証。LINE風超翻訳とオープンデータ連動で認知・理解・反応の循環を検証します。
                    </p>
                  </div>

                  {/* 市民フィードバックの実数集計 */}
                  <div className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="dark:text-white text-slate-900 font-medium">公式会議録に対する市民リアクション</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                        リアルタイム集計中
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border-slate-200 border rounded-xl">
                      <div>
                        <span className="text-xs font-bold dark:text-white text-slate-900 block">発言・議題へのリアクション合計</span>
                        <span className="text-[10.5px] dark:text-slate-400 text-slate-500">議題単位の「進めてほしい / もっと議論してほしい」と、発言単位の「賛成 / 気になる / 参考」をFirestoreから集計</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono transition-all ${isCountUpdated ? 'text-emerald-500 scale-110' : ''}`}>
                          {reactionCount}件
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-medium">
                          {isCountUpdated ? '✨ 最新値をリアルタイム反映済' : '市民反応データを即時連携'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* リアクション内訳 */}
                  <div className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border rounded-xl p-4 space-y-3 shadow-xs">
                    <h5 className="text-xs font-bold dark:text-slate-200 text-slate-900">市民リアクション内訳（API実集計）</h5>
                    <div className="space-y-2">
                      {reactionBreakdown.map((item) => {
                        const ratio = reactionCount > 0
                          ? Math.round((item.count / reactionCount) * 100)
                          : 0;
                        return (
                        <div key={item.label} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="dark:text-slate-300 text-slate-800 font-semibold">{item.label}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{item.count}件 / {ratio}%</span>
                          </div>
                          <div className="w-full h-2 dark:bg-slate-800 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`${item.color} h-full`} style={{ width: `${ratio}%` }} />
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* オープンデータ連携フロー */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold dark:text-slate-200 text-slate-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>オープンデータから行政フィードバックまで</span>
                    </h5>

                    <div className="dark:bg-slate-900 dark:border-emerald-500/30 bg-emerald-50/90 border-emerald-300 border rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold shadow-2xs">
                          LIVE
                        </span>
                        <span className="font-bold text-xs dark:text-white text-slate-900">
                          公式会議録 → 発言構造化 → 住民リアクション → Firestore集計 → 行政画面
                        </span>
                      </div>
                      <p className="text-xs dark:text-slate-300 text-slate-800 leading-relaxed">
                        {reactionCount > 0
                          ? `住民から届いた${reactionCount}件を集計中。最多は「${topReaction.label}」${topReaction.count}件です。`
                          : 'まだリアクションはありません。住民画面で押すと、行政画面へ自動反映されます。'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* モーダルフッター */}
        <div className="dark:bg-slate-900 dark:border-slate-800 bg-slate-100 border-slate-200 border-t px-4 py-3 sm:px-6 sm:py-3 flex items-center justify-between text-[11px] dark:text-slate-400 text-slate-600 shrink-0">
          <span>MachiVoice EBPM Analytics Module v2.0</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium transition-colors shadow-2xs"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
