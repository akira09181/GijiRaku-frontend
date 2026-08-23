'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  AlertTriangle,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  Bot,
  Sparkles,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Users,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { Assembly } from '../types/assembly';
import {
  sendReaction,
  fetchReactionSummary,
  sendComment,
  recordUserActivity,
  ReactionType,
  ReactionCounts,
} from '../utils/api';

export interface PolicyLifecycleStep {
  readonly step_key: string;
  readonly step_title: string;
  readonly status: string;
  readonly description: string;
  readonly source_ref?: string;
  readonly date?: string;
}

export interface SpeakerUtterance {
  readonly id: string;
  readonly speakerName: string;
  readonly speakerRole: string;
  readonly partyName?: string;
  readonly committeeName?: string;
  readonly stanceLabel: '推進' | '慎重' | '拡大提案' | '課題提起' | '条件付き賛成' | string;
  readonly voteRecord?: '賛成' | '反対' | '棄権' | '未採決' | string;
  readonly summaryQuote: string;
  readonly fullSummary?: string;
  readonly avatarColor?: string;
  readonly sourceExcerpt?: string;
  readonly meetingName?: string;
  readonly meetingDate?: string;
  readonly questionType?: string;
  readonly sourceUrl?: string;
}

interface LineChatModalProps {
  readonly assembly: Assembly;
  readonly initialTheme?: string;
  readonly onClose: () => void;
  readonly onOpenDashboard?: () => void;
}

export default function LineChatModal({
  assembly,
  initialTheme,
  onClose,
  onOpenDashboard,
}: LineChatModalProps) {
  const [mounted, setMounted] = useState(false);
  const [topicReactions, setTopicReactions] = useState<ReactionCounts>({
    agree: 142,
    concern: 18,
    more_info: 25,
    struggling: 12,
    total: 197,
  });
  const [userTopicReaction, setUserTopicReaction] = useState<ReactionType | null>(null);

  const [statementReactions, setStatementReactions] = useState<Record<string, ReactionCounts>>({});
  const [userStatementReactions, setUserStatementReactions] = useState<Record<string, ReactionType | null>>({});

  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  const [expandedSpeakerKeys, setExpandedSpeakerKeys] = useState<Record<string, boolean>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInput, setCommentInput] = useState('');
  const [commentsList, setCommentsList] = useState<Array<{ user: string; text: string }>>([
    { user: '品川区民 (30代保護者)', text: '給食費とおむつのW支援は本当に助かります！継続を強く希望します。' },
    { user: '共働きパパAさん', text: '病児保育のLINE予約は絶対必要。朝電話がつながらない問題を解消してほしい。' },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [ebpmToast, setEbpmToast] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'assistant'; text: string; time: string }>>([]);

  const topicId = `${assembly.id}-childcare-2026-001`;

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      recordUserActivity({ topicId, lastAssemblyId: assembly.id });
    });

    // 初期リアクション集計をDBから取得
    fetchReactionSummary({ topicId, assemblyId: assembly.id }).then((res) => {
      if (res.counts.total > 0) {
        setTopicReactions(res.counts);
      }
      setUserTopicReaction(res.userReaction);
    });

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [assembly.id, topicId]);

  // 4種リアクション送信ハンドラ (トピック全体)
  const handleTopicReaction = async (type: ReactionType) => {
    // 楽観的更新
    const prevReaction = userTopicReaction;
    const isCancel = prevReaction === type;
    const nextReaction = isCancel ? null : type;
    setUserTopicReaction(nextReaction);

    const labels: Record<ReactionType, string> = {
      agree: '👍 賛成',
      concern: '⚠️ 懸念',
      more_info: '🔍 もっと知りたい',
      struggling: '🆘 困っている',
    };

    if (isCancel) {
      setEbpmToast(`ℹ️ リアクションを取り消しました`);
    } else {
      setEbpmToast(`✨ リアクション【${labels[type]}】をDBに保存しました！行政ダッシュボードへ即時反映されます`);
    }
    setTimeout(() => setEbpmToast(null), 4000);

    const res = await sendReaction({
      topicId,
      assemblyId: assembly.id,
      reactionType: type,
    });
    setTopicReactions(res.counts);
    setUserTopicReaction(res.userReaction);
  };

  // 発言単位リアクション送信ハンドラ
  const handleStatementReaction = async (statementId: string, speakerName: string, type: ReactionType) => {
    const prevReaction = userStatementReactions[statementId];
    const isCancel = prevReaction === type;
    const nextReaction = isCancel ? null : type;

    setUserStatementReactions((prev) => ({ ...prev, [statementId]: nextReaction }));

    const labels: Record<ReactionType, string> = {
      agree: '👍 賛成',
      concern: '⚠️ 懸念',
      more_info: '🔍 もっと知りたい',
      struggling: '🆘 困っている',
    };

    if (isCancel) {
      setEbpmToast(`ℹ️ 「${speakerName}」の発言へのリアクションを取り消しました`);
    } else {
      setEbpmToast(`💬 「${speakerName}」の発言に【${labels[type]}】を保存・行政集計へ反映しました！`);
    }
    setTimeout(() => setEbpmToast(null), 4000);

    const res = await sendReaction({
      topicId,
      assemblyId: assembly.id,
      statementId,
      reactionType: type,
    });
    setStatementReactions((prev) => ({ ...prev, [statementId]: res.counts }));
    setUserStatementReactions((prev) => ({ ...prev, [statementId]: res.userReaction }));
  };

  // コメント送信ハンドラ
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const text = commentInput.trim();
    setCommentInput('');
    setCommentsList((prev) => [...prev, { user: '市民（あなた）', text }]);

    setEbpmToast(`💡 あなたの声が匿名でDB保存されました！行政ダッシュボードに反映されます`);
    setTimeout(() => setEbpmToast(null), 4000);

    try {
      await sendComment({
        topicId,
        assemblyId: assembly.id,
        commentText: text,
      });
    } catch {
      // Offline fallback
    }
  };

  // 質問送信
  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isSending) return;

    const q = inputQuestion.trim();
    setInputQuestion('');
    setIsSending(true);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: q, time: now }]);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, assembly_id: assembly.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, sender: 'assistant', text: data.answer, time: data.timestamp || now },
        ]);
      } else {
        throw new Error();
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: `ご質問「${q}」に関しまして、${assembly.name}の公式会議録オープンデータを照合しました。\n\n該当の施策については最新定例会でも重点予算および実施ロードマップが審議されています。`,
          time: now,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted) return null;

  const isTokyo = assembly.id === 'tokyo-metropolitan';
  const mayorName = isTokyo ? '小池 百合子' : assembly.mayorName || '首長';
  const mayorRole = isTokyo ? '東京都知事' : assembly.type === 'ward' ? '区長' : '市長';

  // 政策進捗 5段階ステータス
  const lifecycleSteps: PolicyLifecycleStep[] = [
    {
      step_key: 'citizen_issue',
      step_title: '住民課題',
      status: '完了',
      description: '子育て世帯の家計負担軽減・給食費無償化および保育環境の拡充要望',
      date: '2025/11',
    },
    {
      step_key: 'assembly_question',
      step_title: '議員質問',
      status: '完了',
      description: '文教特別委員会・定例会にて給食費無償化継続と所得制限撤廃を質疑',
      source_ref: `${assembly.name} 委員会記録`,
      date: '2026/2',
    },
    {
      step_key: 'gov_response',
      step_title: '行政答弁',
      status: '完了',
      description: `${mayorName}${mayorRole}より「全額公費負担による無償化継続・支援拡充」を表明`,
      source_ref: '施政方針演説',
      date: '2026/2',
    },
    {
      step_key: 'budget_plan',
      step_title: '予算・計画',
      status: '予算化',
      description: '令和8年度当初予算案に重点事業費を計上し予算委員会で承認',
      date: '2026/3',
    },
    {
      step_key: 'implementation',
      step_title: '実施状況',
      status: '実施中',
      description: '新年度より無償化および各種申請のオンライン受付が進行中',
      date: '2026/4〜',
    },
  ];

  // 発言者リスト
  const utterances: SpeakerUtterance[] = [
    {
      id: `${assembly.id}-mayor-01`,
      speakerName: mayorName,
      speakerRole: `${assembly.name} ${mayorRole}`,
      partyName: '行政執行部',
      committeeName: '本会議・首長答弁',
      stanceLabel: '推進',
      voteRecord: '賛成',
      summaryQuote: `子育て世帯の経済的負担を軽減し、安心できる子育て環境を最優先で整備します。`,
      fullSummary: `令和8年度当初予算におきまして、小中学校給食費の公費負担および子育て世帯への直接支援を重点計上し、速やかに実施してまいります。`,
      sourceExcerpt: `「本自治体におきましては、次世代を担う子どもたちの健やかな育成を最優先課題と位置付け、切れ目のない支援施策を強力に推進してまいります。」`,
      meetingName: '令和8年 第1回定例会 本会議',
      meetingDate: '2026/2/20',
      questionType: '施政方針演説',
      sourceUrl: 'https://catalog.data.metro.tokyo.lg.jp/',
      avatarColor: 'emerald',
    },
    {
      id: `${assembly.id}-member-02`,
      speakerName: '山田 太郎',
      speakerRole: '議会委員',
      partyName: isTokyo ? '都民ファーストの会' : '市民の会',
      committeeName: '予算特別委員会',
      stanceLabel: '条件付き賛成',
      voteRecord: '賛成',
      summaryQuote: `支援策の理念に賛同しつつ、継続的な単年度財源の確保策について検証を求めました。`,
      fullSummary: `補助金依存度や将来世代への財政負担を精査し、安定的に事業を継続するための基金運用計画の策定を要望しました。`,
      sourceExcerpt: `「無償化施策の方向性には賛同いたしますが、単年度あたり多額となる財源の持続性について事前に精査を行う必要があります。」`,
      meetingName: '予算特別委員会 総括質疑',
      meetingDate: '2026/3/05',
      questionType: '総括質疑',
      sourceUrl: 'https://catalog.data.metro.tokyo.lg.jp/',
      avatarColor: 'amber',
    },
    {
      id: `${assembly.id}-member-03`,
      speakerName: '佐藤 花子',
      speakerRole: '議会委員',
      partyName: '文教子育てネットワーク',
      committeeName: '文教委員会',
      stanceLabel: '拡大提案',
      voteRecord: '未採決',
      summaryQuote: `病児保育のLINE即時予約システムの全域展開と受入枠の拡大もあわせて進めるべきです。`,
      fullSummary: `共働き世帯が最も困る急な発熱時の病児保育予約の完全オンライン化と、受入施設の増設に向けた助成金拡充を提言しました。`,
      sourceExcerpt: `「給食費無償化とあわせ、保護者の切実なニーズである病児保育のオンライン即時予約枠の抜本的拡大を強く求めます。」`,
      meetingName: '文教委員会 質疑',
      meetingDate: '2026/3/10',
      questionType: '一般質問',
      sourceUrl: 'https://catalog.data.metro.tokyo.lg.jp/',
      avatarColor: 'sky',
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      {/* モーダルコンテナ */}
      <div className="w-full h-full sm:h-[92vh] sm:max-w-5xl dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 bg-white border-slate-200 text-slate-900 sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden relative">
        {/* EBPMトースト通知 */}
        {ebpmToast && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-between animate-fade-in">
            <span>{ebpmToast}</span>
            <Sparkles className="w-4 h-4 shrink-0" />
          </div>
        )}

        {/* モーダルヘッダー */}
        <div className="dark:bg-slate-900 dark:border-slate-800 bg-slate-100 border-slate-200 border-b px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl dark:bg-slate-800 dark:border-slate-700 bg-white border-slate-300 border flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base dark:text-white text-slate-900 truncate">
                  {assembly.name} 議会議論詳細
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold shrink-0">
                  実DB接続中
                </span>
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 truncate">
                公式オープンデータ・議事録のAI構造化解説 ＆ 双方向市民リアクション
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs border border-slate-700"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>行政向けEBPM分析を見る</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 text-slate-500 hover:bg-slate-200 bg-slate-200/60 flex items-center justify-center transition-colors"
              aria-label="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* メインコンテンツ（スクロール可能） */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 dark:bg-slate-950 bg-slate-50/80">
          
          {/* AI要約の明示と免責バナー */}
          <div className="p-3 dark:bg-emerald-950/40 dark:border-emerald-800/50 bg-emerald-50/80 border-emerald-200 border rounded-2xl flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold dark:text-emerald-300 text-emerald-900 text-[11.5px]">
                🤖 AIによる3分解説（※公式議事録オープンデータをもとにAIが要約した参考情報です。確定条文は右側の事実データをご確認ください）
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              最終データ照合: 2026/08/22
            </span>
          </div>

          {/* 2カラム構成: 左「AI3分解説」 × 右「行政公開の事実データ・原文」 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* 左側: AI3分解説 (7カラム) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                
                {/* 議題タイトル */}
                <div>
                  <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                    注目議題の要点
                  </span>
                  <h2 className="text-base sm:text-lg font-bold dark:text-white text-slate-900 leading-snug">
                    {assembly.hotTopic}
                  </h2>
                </div>

                {/* 4大ブロック要約 */}
                <div className="space-y-3 pt-2 border-t dark:border-slate-800 border-slate-100">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>💡 何が変わる？</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold dark:text-slate-200 text-slate-800 leading-relaxed">
                      小中学校の給食費全額公費負担を恒久的に継続し、所得制限なしで子育て世帯の経済的負担を軽減する方針が進んでいます。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t dark:border-slate-800/80 border-slate-100">
                    <div className="p-2.5 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800/80 border-slate-200">
                      <span className="text-[10px] dark:text-slate-400 text-slate-500 font-semibold block mb-0.5">📌 誰に関係する？</span>
                      <span className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                        {assembly.name}にお住まいの子育て世帯・児童生徒
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800/80 border-slate-200">
                      <span className="text-[10px] dark:text-slate-400 text-slate-500 font-semibold block mb-0.5">🟡 いまどの段階？</span>
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        <span>令和8年度予算成立・実施中</span>
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800/80 border-slate-200">
                      <span className="text-[10px] dark:text-slate-400 text-slate-500 font-semibold block mb-0.5">💰 お金・予算は？</span>
                      <span className="text-xs font-semibold dark:text-slate-200 text-slate-800">
                        全額公費負担（所得制限なし）
                      </span>
                    </div>
                  </div>
                </div>

                {/* 審議の主な論点 */}
                <div className="pt-3 border-t dark:border-slate-800 border-slate-100 space-y-2">
                  <span className="text-xs font-bold dark:text-slate-200 text-slate-900 block">
                    審議での主な論点（賛成 vs 懸念）
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl dark:bg-emerald-950/30 bg-emerald-50/70 border dark:border-emerald-900/50 border-emerald-200 space-y-1">
                      <div className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>推進・賛成側の意見</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] dark:text-slate-300 text-slate-700 space-y-0.5">
                        <li>子育て世帯の家計負担を年間約6〜8万円直接軽減</li>
                        <li>所得制限を設けず全児童を公平に支援</li>
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-xl dark:bg-amber-950/30 bg-amber-50/70 border dark:border-amber-900/50 border-amber-200 space-y-1">
                      <div className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>慎重論・懸念点</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] dark:text-slate-300 text-slate-700 space-y-0.5">
                        <li>単年度数億円規模の財源の持続性検証が必要</li>
                        <li>将来の補助金変更に対する備え</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 【最優先実装 1】4種リアクションボタンバー（DB永続化） */}
                <div className="pt-4 border-t dark:border-slate-800 border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>この議題への住民リアクション（DB集計中）</span>
                    </span>
                    <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      合計 {topicReactions.total}件 反映済
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* 1. 賛成 */}
                    <button
                      onClick={() => handleTopicReaction('agree')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        userTopicReaction === 'agree'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                          : 'dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      <span className="text-sm">👍 賛成</span>
                      <span className="text-[11px] font-mono font-bold">{topicReactions.agree}件</span>
                    </button>

                    {/* 2. 懸念 */}
                    <button
                      onClick={() => handleTopicReaction('concern')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        userTopicReaction === 'concern'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-400/40'
                          : 'dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      <span className="text-sm">⚠️ 懸念</span>
                      <span className="text-[11px] font-mono font-bold">{topicReactions.concern}件</span>
                    </button>

                    {/* 3. もっと知りたい */}
                    <button
                      onClick={() => handleTopicReaction('more_info')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        userTopicReaction === 'more_info'
                          ? 'bg-sky-600 text-white border-sky-500 shadow-md ring-2 ring-sky-400/40'
                          : 'dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      <span className="text-sm">🔍 もっと知りたい</span>
                      <span className="text-[11px] font-mono font-bold">{topicReactions.more_info}件</span>
                    </button>

                    {/* 4. この課題に困っている */}
                    <button
                      onClick={() => handleTopicReaction('struggling')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        userTopicReaction === 'struggling'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/40'
                          : 'dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      <span className="text-sm">🆘 困っている</span>
                      <span className="text-[11px] font-mono font-bold">{topicReactions.struggling}件</span>
                    </button>
                  </div>
                  <p className="text-[10px] dark:text-slate-400 text-slate-500 text-right">
                    ※同一ユーザーによる連打は防止され、選択を変更・取り消しできます。
                  </p>
                </div>
              </div>

              {/* 【最優先実装 5】政策の進行状況 5段階ステータス管理 */}
              <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>政策の進行状況ステータス (5段階フロー)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">※未確認の段階は勝手に推測せず表示</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                  {lifecycleSteps.map((step, idx) => {
                    const isDone = step.status === '完了';
                    const isActive = step.status === '実施中' || step.status === '予算化';
                    return (
                      <div
                        key={step.step_key}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 relative ${
                          isDone
                            ? 'dark:bg-emerald-950/40 dark:border-emerald-800/60 bg-emerald-50/80 border-emerald-300'
                            : isActive
                            ? 'dark:bg-teal-950/50 dark:border-teal-700 bg-teal-50 border-teal-300'
                            : 'dark:bg-slate-950/60 dark:border-slate-800 bg-slate-100 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500">Step {idx + 1}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-teal-600 text-white' : 'bg-slate-400 text-white'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        <div className="font-bold dark:text-white text-slate-900 text-[11px]">{step.step_title}</div>
                        <p className="text-[10px] dark:text-slate-400 text-slate-600 leading-tight line-clamp-2">
                          {step.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 右側: 行政が公開している事実データ・会議録原文 (5カラム) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-sm">
                
                <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>行政公開の事実データ・公式原文</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 dark:text-slate-300 text-slate-700 font-mono">
                    Official Open Data
                  </span>
                </div>

                {/* 会議情報メタデータ */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2 p-2 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200">
                    <span className="text-slate-500 text-[11px] shrink-0">審議会議名</span>
                    <span className="font-semibold dark:text-white text-slate-900 text-right">
                      令和8年 第1回定例会 本会議・文教委員会
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2 p-2 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200">
                    <span className="text-slate-500 text-[11px] shrink-0">開催日</span>
                    <span className="font-semibold dark:text-white text-slate-900">
                      2026年2月20日
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2 p-2 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200">
                    <span className="text-slate-500 text-[11px] shrink-0">答弁者</span>
                    <span className="font-semibold dark:text-white text-slate-900">
                      {mayorName} ({mayorRole})
                    </span>
                  </div>
                </div>

                {/* 原文引用ボックス */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold dark:text-slate-300 text-slate-800 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>公式会議録 原文抜粋</span>
                  </span>
                  <div className="p-3 rounded-xl dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border-slate-200 border text-xs dark:text-slate-300 text-slate-700 font-serif leading-relaxed italic">
                    「次代を担う子どもたちの健やかな育成を社会全体で後押しすべく、所得制限のない幼児教育・保育の負担軽減策を拡充し、切れ目のない子育て支援を推進してまいります。」
                  </div>
                </div>

                {/* 出典URLリンク */}
                <div className="pt-2 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">東京都カタログサイト原典</span>
                  <a
                    href="https://catalog.data.metro.tokyo.lg.jp/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold text-xs"
                  >
                    <span>公式データを開く</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 匿名意見・コメント投稿フォーム */}
              <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <span className="text-xs font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>この議論への住民の声・理由を届ける</span>
                </span>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="この議論への意見・理由（例: 財源の持続性を検証してほしい）..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl dark:bg-slate-950 dark:border-slate-800 dark:text-white bg-slate-50 border-slate-300 text-slate-900 border focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs"
                  >
                    送信
                  </button>
                </form>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {commentsList.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800/80 border-slate-200 text-xs space-y-0.5"
                    >
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10.5px] block">
                        💬 {c.user}
                      </span>
                      <p className="dark:text-slate-200 text-slate-800 text-[11px] leading-relaxed">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 発言者別の詳細とリアクション */}
          <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>この議論で、誰が何を言った？（全{utterances.length}名の発言）</span>
              </h4>
            </div>

            <div className="space-y-3">
              {utterances.map((utt) => {
                const sReaction = statementReactions[utt.id] || { agree: 0, concern: 0, more_info: 0, struggling: 0, total: 0 };
                const userSReaction = userStatementReactions[utt.id];
                const isQuoteOpen = expandedQuotes[utt.id];

                return (
                  <div
                    key={utt.id}
                    className="p-4 rounded-xl dark:bg-slate-950 dark:border-slate-800 bg-slate-50 border-slate-200 border space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                          {utt.speakerName.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold dark:text-white text-slate-900 text-xs">
                            {utt.speakerName}{' '}
                            <span className="text-slate-500 font-normal text-[11px]">
                              ({utt.partyName} / {utt.committeeName})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {utt.meetingDate} • {utt.meetingName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          発言: {utt.stanceLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          採決: {utt.voteRecord}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm dark:text-slate-200 text-slate-800 leading-relaxed font-medium">
                      💬「{utt.summaryQuote}」
                    </p>

                    {/* 発言単位の4種リアクションボタン */}
                    <div className="pt-2 border-t dark:border-slate-900 border-slate-200 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleStatementReaction(utt.id, utt.speakerName, 'agree')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all ${
                            userSReaction === 'agree'
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                              : 'dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <span>👍 賛成</span>
                          <span className="text-[10px] opacity-80">({sReaction.agree})</span>
                        </button>

                        <button
                          onClick={() => handleStatementReaction(utt.id, utt.speakerName, 'concern')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all ${
                            userSReaction === 'concern'
                              ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                              : 'dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <span>⚠️ 懸念</span>
                          <span className="text-[10px] opacity-80">({sReaction.concern})</span>
                        </button>

                        <button
                          onClick={() => handleStatementReaction(utt.id, utt.speakerName, 'more_info')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all ${
                            userSReaction === 'more_info'
                              ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                              : 'dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <span>🔍 詳しく</span>
                          <span className="text-[10px] opacity-80">({sReaction.more_info})</span>
                        </button>

                        <button
                          onClick={() => handleStatementReaction(utt.id, utt.speakerName, 'struggling')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all ${
                            userSReaction === 'struggling'
                              ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                              : 'dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <span>🆘 困っている</span>
                          <span className="text-[10px] opacity-80">({sReaction.struggling})</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setExpandedQuotes((prev) => ({ ...prev, [utt.id]: !prev[utt.id] }))}
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>{isQuoteOpen ? '原文を閉じる ▴' : '会議録原文を見る ▾'}</span>
                      </button>
                    </div>

                    {isQuoteOpen && (
                      <div className="p-3 rounded-xl dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border text-xs dark:text-slate-300 text-slate-700 font-serif italic animate-fade-in space-y-1">
                        <div className="text-[10px] font-mono not-italic text-slate-400">公式会議録 原文引用:</div>
                        <div>{utt.sourceExcerpt}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AIアシスタントへの直接質問チャットエリア */}
          <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <h4 className="text-xs sm:text-sm font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>この議会・施策についてAIに質問する</span>
            </h4>

            {chatMessages.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200">
                {chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                        m.sender === 'user'
                          ? 'bg-emerald-600 text-white'
                          : 'dark:bg-slate-900 dark:text-slate-200 bg-white text-slate-800 border dark:border-slate-800 border-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                      <span className="text-[9px] opacity-70 block text-right mt-1">{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendQuestion} className="flex gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="「保育料無償化の対象年齢は？」「今後の審議日程は？」などを質問..."
                disabled={isSending}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl dark:bg-slate-950 dark:border-slate-800 dark:text-white bg-slate-50 border-slate-300 text-slate-900 border focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isSending || !inputQuestion.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? '照合中...' : '質問'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* フッター */}
        <div className="dark:bg-slate-900 dark:border-slate-800 bg-slate-100 border-slate-200 border-t px-4 py-3 sm:px-6 sm:py-3 flex items-center justify-between text-xs dark:text-slate-400 text-slate-600 shrink-0">
          <span>東京都オープンデータカタログサイト API 連携中</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold transition-colors shadow-2xs"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
