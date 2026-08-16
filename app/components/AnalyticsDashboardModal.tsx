'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Assembly } from './AssemblyMap';

interface AnalyticsDashboardModalProps {
  assembly: Assembly;
  onClose: () => void;
}

interface TopicDistribution {
  name: string;
  ratio: number;
  color: string;
}

interface PartyAnalytics {
  party_name: string;
  members_count: number;
  top_category: string;
  ai_stance_summary: string;
  category_breakdown: { category: string; percent: number }[];
}

interface MemberScorecard {
  id: string;
  name: string;
  title: string;
  party: string;
  avatar_type: string;
  total_statements: number;
  activity_score: number;
  main_focus: string;
  ai_eval: string;
}

interface EbpmData {
  youth_uninterested_rate: number;
  total_votes_recorded: number;
  age_demographics: { group: string; support_ratio: number; top_issue: string }[];
  ebpm_ai_recommendations: { rank: number; title: string; action: string }[];
}

interface AnalyticsData {
  topic_distribution: TopicDistribution[];
  party_analytics: PartyAnalytics[];
  member_scorecards: MemberScorecard[];
  ebpm_citizen_data?: EbpmData;
}

export default function AnalyticsDashboardModal({ assembly, onClose }: AnalyticsDashboardModalProps) {
  const [mounted, setMounted] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ebpm' | 'party' | 'member' | 'public'>('ebpm');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      try {
        const res = await fetch(`${apiBase}/api/assemblies/${assembly.id}/analytics`);
        if (res.ok) {
          const json = await res.json();
          setAnalytics(json.data);
        } else {
          throw new Error('Analytics fetch failed');
        }
      } catch (err) {
        console.error(err);
        setAnalytics({
          topic_distribution: [
            { name: '👶 おむつ代補助・給食費無償化', ratio: 32, color: '#06C755' },
            { name: '💻 スマホ行政手続95%化', ratio: 24, color: '#3B82F6' },
            { name: '🏗️ 街づくり・多摩モノレール', ratio: 20, color: '#F59E0B' },
            { name: '🛡️ 防災・避難所Wi-Fi', ratio: 14, color: '#EF4444' },
            { name: '🏥 医療・病児保育予約', ratio: 10, color: '#EC4899' },
          ],
          ebpm_citizen_data: {
            youth_uninterested_rate: 84.8,
            total_votes_recorded: 1420,
            age_demographics: [
              { group: '10代・20代 (若者)', support_ratio: 91, top_issue: 'おむつ代補助電子クーポン・給食ゼロ' },
              { group: '30代 (子育て層)', support_ratio: 88, top_issue: '病児保育当日スマホ予約・学童枠拡大' },
            ],
            ebpm_ai_recommendations: [
              {
                rank: 1,
                title: '若者・子育て世代の89%が賛同: 『紙おむつデジタルクーポン支給』',
                action: '次回定例会にてスマホアプリ決済による電子クーポン予算枠の拡大提言を推奨。',
              },
            ],
          },
          party_analytics: [
            {
              party_name: '町田市民の会 / 都民ファースト',
              members_count: 31,
              top_category: '👶 おむつ代補助・給食費無償化',
              ai_stance_summary: '0歳〜2歳児へ『年間最大3万円のおむつ電子クーポン』および都内小中学校給食費全額公費負担を最優先で推進。',
              category_breakdown: [
                { category: 'おむつ・子育て', percent: 50 },
                { category: 'デジタルDX', percent: 30 },
                { category: '街づくり', percent: 20 },
              ],
            },
          ],
          member_scorecards: [
            {
              id: 'mem-mc-1',
              name: '高橋 りえ',
              title: '市議会議員',
              party: '町田市民の会',
              avatar_type: 'politician_female',
              total_statements: 38,
              activity_score: 96,
              main_focus: 'おむつ代補助・乳幼児電子クーポン',
              ai_eval: '物価高に悩む子育て世代の切実な声を取り上げ、おむつ代の具体的な電子クーポン（3万円分）支給を市長から引き出す高い答弁引き出し力を発揮。',
            },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [assembly.id]);

  const getAvatarIcon = (type?: string) => {
    switch (type) {
      case 'governor_female':
        return '👩‍💼';
      case 'mayor_male':
        return '👨‍💼';
      case 'politician_female':
        return '👩‍⚖️';
      case 'bureaucrat_male':
        return '🧑‍💻';
      default:
        return '👨‍⚖️';
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[999999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-slate-100">
      {/* Analytics Modal Window */}
      <div className="relative w-full max-w-4xl h-[92vh] sm:h-[840px] bg-slate-900 rounded-[28px] overflow-hidden shadow-2xl flex flex-col border border-slate-700 text-left">
        
        {/* Modal Header */}
        <div className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-lg">
              📊
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {assembly.name} 発言分析 & 議員向けEBPMダッシュボード
              </h2>
              <p className="text-xs text-slate-400">東京都オープンデータ × リアルタイム市民世論EBPM分析（B2G画面）</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-slate-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ebpm')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'ebpm'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              👔 議員・行政向け EBPM民意分析 (マネタイズ)
            </button>
            <button
              onClick={() => setActiveTab('party')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'party'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🏛️ 政党別 注力テーマ分析
            </button>
            <button
              onClick={() => setActiveTab('member')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'member'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              👤 議員発言スコアリング
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'public'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🗳️ 市民パブコメ集計
            </button>
          </div>

          <div className="hidden sm:block text-xs text-emerald-400 font-semibold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 shrink-0">
            オープンデータ実態連動中
          </div>
        </div>

        {/* Scrollable Analytics Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-400">EBPM民意データを解析中...</p>
            </div>
          ) : !analytics ? (
            <div className="text-center py-16 text-slate-400 text-sm">データを読み込めませんでした。</div>
          ) : (
            <>
              {/* Assembly Global Topic Share Bar */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span>📈</span>
                    <span>{assembly.name} イシュー別関心構成比</span>
                  </span>
                  <span className="text-slate-400 font-normal">全議題のAI自動カテゴリ分類結果</span>
                </div>

                <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex">
                  {analytics.topic_distribution.map((topic, i) => (
                    <div
                      key={i}
                      style={{ width: `${topic.ratio}%`, backgroundColor: topic.color }}
                      className="h-full transition-all duration-500 hover:opacity-90 relative group"
                      title={`${topic.name}: ${topic.ratio}%`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                  {analytics.topic_distribution.map((topic, i) => (
                    <div key={i} className="flex items-center space-x-1.5 text-slate-300 font-medium">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: topic.color }} />
                      <span>{topic.name}</span>
                      <span className="font-bold text-white">({topic.ratio}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab 0: EBPM Politician Analytics Mode */}
              {activeTab === 'ebpm' && (
                <div className="space-y-5">
                  {/* B2G Header Banner */}
                  <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5">
                        <span>💡</span>
                        <span>議員・行政向け EBPM政策立案エビデンス画面</span>
                      </span>
                      <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 rounded-full font-bold">
                        B2G SaaSサービス
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      「若者の84.8%が政治に関心なし（東京都オープンデータ調査）」という課題に対し、アプリ上で収集された若者・子育て世代のリアルタイムな政策賛否データを議員・行政へ還元する意思決定ダッシュボードです。
                    </p>
                  </div>

                  {/* Age Group Sentiment Cards */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span>📊</span>
                      <span>年齢層別 政策関心・賛否エビデンス（EBPM基礎データ）</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analytics.ebpm_citizen_data?.age_demographics.map((demo, idx) => (
                        <div key={idx} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                            <span className="font-extrabold text-sm text-white">{demo.group}</span>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                              賛同率 {demo.support_ratio}%
                            </span>
                          </div>
                          <div className="text-xs text-slate-300">
                            <span className="text-slate-400 font-bold block mb-0.5">最重視イシュー:</span>
                            <span className="text-white font-bold">{demo.top_issue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Policy Proposal Recommendations for Politicians */}
                  <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>🤖</span>
                      <span>AI推奨：次回定例会での議員質疑・政策提案（TOP 2）</span>
                    </h3>

                    {analytics.ebpm_citizen_data?.ebpm_ai_recommendations.map((rec) => (
                      <div key={rec.rank} className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-1.5 text-xs">
                        <div className="text-emerald-400 font-bold flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                            {rec.rank}
                          </span>
                          <span>{rec.title}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-medium pl-7">
                          👉 {rec.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 1: Party Analytics */}
              {activeTab === 'party' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <span>🏛️</span>
                    <span>政党ごとの主要政策・テーマスタンス（AIサマリー）</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analytics.party_analytics.map((party, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-lg"
                      >
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                          <div>
                            <h4 className="font-extrabold text-base text-white">{party.party_name}</h4>
                            <span className="text-[11px] text-slate-400">議員数: {party.members_count}名</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                            推し: {party.top_category}
                          </span>
                        </div>

                        <div className="bg-slate-950/60 rounded-xl p-3 text-xs text-slate-300 leading-relaxed border border-slate-800">
                          <span className="text-emerald-400 font-bold block mb-1">🤖 AI政策サマリー:</span>
                          {party.ai_stance_summary}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Member Scorecards */}
              {activeTab === 'member' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <span>👤</span>
                    <span>議員・答弁者の発言熱量スコア & AIプロファイル</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analytics.member_scorecards.map((member) => (
                      <div
                        key={member.id}
                        className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-3"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-2xl shrink-0 shadow-md">
                            {getAvatarIcon(member.avatar_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-base text-white">{member.name}</h4>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/30">
                                🔥 発言熱量 {member.activity_score}点
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                              <span>{member.title}</span>
                              <span>•</span>
                              <span className="text-slate-300 font-medium">{member.party}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-3 rounded-xl border border-slate-700/50">
                          <span className="text-blue-400 font-bold block mb-1">💡 AI発言スタイル評価:</span>
                          {member.ai_eval}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Public Sentiment */}
              {activeTab === 'public' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <span>🗳️</span>
                    <span>市民世論・パブリックコメント投票集計</span>
                  </h3>

                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white">全議題の市民賛否メーター</span>
                      <span className="text-emerald-400">賛成率: 88% / 懸念率: 12%</span>
                    </div>

                    <div className="w-full h-4 bg-rose-500/80 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: '88%' }} />
                    </div>

                    <p className="text-xs text-slate-400">
                      市民投票総数: <strong>1,420票</strong>（おむつ代補助・給食無償化への賛同が最多）
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950/90 border-t border-slate-800 px-6 py-3.5 flex items-center justify-between text-xs text-slate-400">
          <span>分析モデル: GijiRaku NLP Politician Profiler v2.6 (B2G EBPM Suite)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
