'use client';

import React, { useState, useEffect } from 'react';
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

import { getEbpmReactionCount } from '../utils/ebpmStore';

interface AnalyticsDashboardModalProps {
  readonly assembly: Assembly;
  readonly onClose: () => void;
}

type TabType = 'overview' | 'party' | 'member' | 'public';

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
  const [reactionCount, setReactionCount] = useState<number>(37);
  const [isCountUpdated, setIsCountUpdated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setReactionCount(getEbpmReactionCount());
    });

    const handleCountUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ count: number }>;
      if (customEvt.detail?.count) {
        setReactionCount(customEvt.detail.count);
        setIsCountUpdated(true);
      }
    };

    window.addEventListener('ebpm_count_updated', handleCountUpdate);

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('ebpm_count_updated', handleCountUpdate);
    };
  }, []);

  useEffect(() => {
    queueMicrotask(() => setLoading(true));
    const timer = setTimeout(() => {
      const isTokyo = assembly.id === 'tokyo-metropolitan';

      const mockTopicTrends: readonly TopicTrend[] = [
        {
          topic: '子育て支援・給食費無償化',
          frequency: 342,
          sentimentRatio: { positive: 65, neutral: 25, negative: 10 },
          hotKeywords: ['第2子無償', '所得制限撤廃', 'おむつ支援'],
        },
        {
          topic: '行政DX・窓口オンライン化',
          frequency: 218,
          sentimentRatio: { positive: 80, neutral: 15, negative: 5 },
          hotKeywords: ['スマホ申請', 'LINE連携', 'マイナンバー'],
        },
        {
          topic: '都市交通・再開発・防災',
          frequency: 185,
          sentimentRatio: { positive: 50, neutral: 35, negative: 15 },
          hotKeywords: ['モノレール', '駅前再開発', '浸水対策'],
        },
        {
          topic: '休日夜間診療・病児保育',
          frequency: 142,
          sentimentRatio: { positive: 55, neutral: 30, negative: 15 },
          hotKeywords: ['小児科確保', '即時予約', '待機児童'],
        },
      ];

      const mockPartyAnalytics: readonly PartyPolicyStance[] = [
        {
          partyName: isTokyo ? '都民ファーストの会' : '自由民主党・無所属の会',
          membersCount: isTokyo ? 27 : 12,
          topCategory: '行政DX・少子化対策',
          aiStanceSummary:
            'オープンデータ活用と子育て世代への直接給付を強く推進。財源確保の精査を求めつつ前向き姿勢。',
        },
        {
          partyName: isTokyo ? '公明党' : '公明党議員団',
          membersCount: isTokyo ? 23 : 8,
          topCategory: '医療福祉・学校教育',
          aiStanceSummary:
            '給食費無償化と病児保育の拡充を最重要課題と位置づけ。現場ニーズに基づく政策提案が中心。',
        },
        {
          partyName: isTokyo ? '立憲民主党' : '立憲・無所属クラブ',
          membersCount: isTokyo ? 15 : 6,
          topCategory: '情報公開・環境政策',
          aiStanceSummary:
            '行政プロセスの透明化と市民参加型合意形成を要求。再開発事業の検証を重点的に指摘。',
        },
        {
          partyName: isTokyo ? '日本共産党' : '日本共産党議員団',
          membersCount: isTokyo ? 19 : 5,
          topCategory: '福祉拡充・住民負担軽減',
          aiStanceSummary:
            '国民健康保険料の引き下げや公共施設使用料の据え置きなど、生活者目線での支援拡充を主張。',
        },
      ];

      const mockMemberScorecards: readonly MemberScorecard[] = [
        {
          id: 'mem-1',
          name: isTokyo ? '小池 百合子' : assembly.mayorName,
          title: isTokyo ? '東京都知事' : '区長 / 市長',
          party: '行政執行部',
          avatarType: 'neutral',
          activityScore: 96,
          aiEval: '政策推進力が高く、オープンデータおよびEBPM活用に強いリーダーシップを発揮。',
        },
        {
          id: 'mem-2',
          name: '山田 太郎',
          title: '総務政策委員会 委員長',
          party: '市政推進クラブ',
          avatarType: 'male',
          activityScore: 89,
          aiEval: '行政手続きのデジタル化や議会ペーパーレス化に関して鋭い質問を多数展開。',
        },
        {
          id: 'mem-3',
          name: '佐藤 花子',
          title: '文教子ども委員会 副委員長',
          party: '市民ネットワーク',
          avatarType: 'female',
          activityScore: 92,
          aiEval: '保育現場や学校現場のヒアリングデータを元にした具体的提言が多数。',
        },
      ];

      setAnalytics({
        assemblyId: assembly.id,
        assemblyName: assembly.name,
        totalSpeechesAnalyzed: isTokyo ? 12450 : assembly.totalMinutesCount,
        ebpmDataReadinessScore: isTokyo ? 94 : 88,
        topicTrends: mockTopicTrends,
        partyAnalytics: mockPartyAnalytics,
        memberScorecards: mockMemberScorecards,
        publicSentimentScore: 86,
      });
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [assembly]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* モーダル枠 */}
      <div className="w-full h-full sm:h-[90vh] sm:max-w-4xl bg-slate-950 sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* モーダルヘッダー */}
        <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  マチボイス EBPM政策分析 ({assembly.name})
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shrink-0">
                  EBPM Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                オープンデータ解析に基づくエビデンス・議会トレンド
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ナビゲーションタブ */}
        <div className="bg-slate-900/60 border-b border-slate-800/60 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
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
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* タブコンテンツ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950">
          {loading || !analytics ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">オープンデータを解析中...</span>
            </div>
          ) : (
            <>
              {/* サマリー数値カード */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
                  <span className="text-[11px] text-slate-400 block mb-1">解析対象 発言数</span>
                  <div className="text-base sm:text-xl font-bold text-white">
                    {analytics.totalSpeechesAnalyzed.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400 ml-1">件</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
                  <span className="text-[11px] text-slate-400 block mb-1">EBPM準備度</span>
                  <div className="text-base sm:text-xl font-bold text-emerald-400">
                    {analytics.ebpmDataReadinessScore}
                    <span className="text-xs font-normal text-slate-400 ml-1">/ 100点</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
                  <span className="text-[11px] text-slate-400 block mb-1">政策トピック数</span>
                  <div className="text-base sm:text-xl font-bold text-white">
                    {analytics.topicTrends.length}
                    <span className="text-xs font-normal text-slate-400 ml-1">分野</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
                  <span className="text-[11px] text-slate-400 block mb-1">市民賛同スコア</span>
                  <div className="text-base sm:text-xl font-bold text-emerald-400">
                    {analytics.publicSentimentScore}%
                  </div>
                </div>
              </div>

              {/* タブ 1: 政策トピック概況 */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>主要議論トピックと発言頻度</span>
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {analytics.topicTrends.map((topic, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-white">
                            {topic.topic}
                          </span>
                          <span className="text-xs font-mono text-emerald-400 font-bold shrink-0">
                            {topic.frequency} 回言及
                          </span>
                        </div>

                        {/* 感情・合意メーター */}
                        <div className="space-y-1">
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${topic.sentimentRatio.positive}%` }}
                              title={`前向き: ${topic.sentimentRatio.positive}%`}
                            />
                            <div
                              className="bg-slate-600 h-full"
                              style={{ width: `${topic.sentimentRatio.neutral}%` }}
                              title={`中立: ${topic.sentimentRatio.neutral}%`}
                            />
                            <div
                              className="bg-rose-500 h-full"
                              style={{ width: `${topic.sentimentRatio.negative}%` }}
                              title={`懸念: ${topic.sentimentRatio.negative}%`}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>前向き {topic.sentimentRatio.positive}%</span>
                            <span>中立 {topic.sentimentRatio.neutral}%</span>
                            <span>懸念 {topic.sentimentRatio.negative}%</span>
                          </div>
                        </div>

                        {/* ホットキーワード */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] text-slate-500">キーワード:</span>
                          {topic.hotKeywords.map((kw, kwIdx) => (
                            <span
                              key={kwIdx}
                              className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-slate-300 text-[10px]"
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
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>各会派の重点政策と議会スタンス</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analytics.partyAnalytics.map((party, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div>
                            <span className="font-bold text-xs sm:text-sm text-white block">
                              {party.partyName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              所属議員: {party.membersCount}名
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                            {party.topCategory}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
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
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>主要発言者の活動スコア</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analytics.memberScorecards.map((member) => (
                      <div
                        key={member.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs sm:text-sm text-white block">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {member.title} • {member.party}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold font-mono">
                            <Activity className="w-3 h-3" />
                            <span>{member.activityScore}点</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
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
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <Vote className="w-4 h-4 text-emerald-400" />
                      <span>リアルタイム市民フィードバック & EBPM政策提言</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                      Live EBPM Sync Active
                    </span>
                  </div>

                  {/* 実証目標KPIカード */}
                  <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        ソーシャルインパクト目標KPI (PoC検証設定)
                      </span>
                      <span className="text-xs text-slate-300 font-bold font-mono">
                        目標: 情報到達時間 30分 ➔ 3分 (90%短縮)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-300 leading-relaxed">
                      PoCでは、都民が必要な政策情報に到達する時間を30分から3分へ短縮することを目標に検証。LINE風超翻訳とオープンデータ連動で認知・理解・反応の循環を検証します。
                    </p>
                  </div>

                  {/* 市民フィードバックの実数集計 */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-medium">病児保育・給食無償化に関する市民リアクション</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        リアルタイム集計中
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">病児保育のLINE即時予約・受け入れ枠拡大</span>
                        <span className="text-[10.5px] text-slate-400">市民画面でのワンタップ「困っている / 賛成」の集計件数</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-extrabold text-emerald-400 font-mono transition-all ${isCountUpdated ? 'text-emerald-300 scale-110' : ''}`}>
                          {reactionCount}件
                        </span>
                        <span className="text-[10px] text-emerald-300 block font-medium">
                          {isCountUpdated ? '✨ +1 リアルタイム反映済' : '市民反応データを即時連携'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 年代別ニーズグラフ */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-slate-200">年代別民意・最重点テーマ</h5>
                    <div className="space-y-2">
                      {[
                        { group: '10代・20代 (若者層)', ratio: 91, issue: '病児保育即時LINE予約・おむつデジタルクーポン' },
                        { group: '30代 (子育て層)', ratio: 88, issue: '給食費全額無償化継続・学童受入拡大' },
                        { group: '40代・50代 (現役層)', ratio: 82, issue: '多摩モノレール延伸・行政手続きスマホ完結' },
                        { group: '60代以上 (シニア層)', ratio: 79, issue: '対面サポート窓口併設・エアコン購入助成' },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300 font-semibold">{item.group}</span>
                            <span className="text-emerald-400 font-mono font-bold">賛同率 {item.ratio}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${item.ratio}%` }} />
                          </div>
                          <p className="text-[10.5px] text-slate-400">最重要ニーズ: {item.issue}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 議員向け EBPM AI 自発提言カード */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>議員向け 次回定例会 優先EBPMAI提案</span>
                    </h5>

                    <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          優先度 1位
                        </span>
                        <span className="font-bold text-xs text-white">
                          若者・子育て世代の91%が即時要望: 『病児保育のLINE即時予約・枠拡大』
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        市民からのワンタップFBが急増中。主動的に定例会にて広域予約システム共通化の予算枠拡大提言を推奨します。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* モーダルフッター */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 sm:px-6 sm:py-3 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>MachiVoice EBPM Analytics Module v2.0</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
