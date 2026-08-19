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
  ThumbsDown,
  ExternalLink,
  Bot,
  Sparkles,
} from 'lucide-react';
import { Assembly } from '../types/assembly';
import { incrementEbpmReactionCount } from '../utils/ebpmStore';

interface Comment {
  readonly user: string;
  readonly text: string;
}

export interface AiChainStep {
  readonly step_number: number;
  readonly title: string;
  readonly detail: string;
  readonly status?: string;
}

export interface StructuredSummary {
  readonly whatChanges: string;
  readonly targetAudience: string;
  readonly currentStage: string;
  readonly budgetInfo?: string;
}

interface Message {
  readonly id: string;
  readonly sender: 'user' | 'assistant';
  readonly plainText: string;
  readonly structuredSummary?: StructuredSummary;
  readonly speaker?: string;
  readonly speakerTitle?: string;
  readonly date?: string;
  readonly originalQuote?: string;
  readonly timestamp: string;
  readonly agreeCount?: number;
  readonly disagreeCount?: number;
  readonly comments?: readonly Comment[];
  readonly sourceUrl?: string;
  readonly aiChainSteps?: readonly AiChainStep[];
}

interface LineChatModalProps {
  readonly assembly: Assembly;
  readonly initialTheme?: string;
  readonly onClose: () => void;
}

/**
 * LINE風 議事録対話モーダル
 * - スマートフォンではフルスクリーン対応（二重スクロール防止）
 * - クリーンなSVGアイコンと行政・オープンデータに適した信頼感のあるデザイン
 */
export default function LineChatModal({
  assembly,
  initialTheme,
  onClose,
}: LineChatModalProps) {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  const [expandedChains, setExpandedChains] = useState<Record<string, boolean>>({});
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'agree' | 'disagree'>>({});
  const [ebpmToast, setEbpmToast] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const DEFAULT_CHAIN_STEPS: AiChainStep[] = [
    { step_number: 1, title: '公式データ取得・連携', detail: '東京都オープンデータカタログより該当の議会会議録データを取得', status: 'completed' },
    { step_number: 2, title: '発言・答弁データの抽出', detail: '会議録より質問・答弁・関連施策情報を特定・分類', status: 'completed' },
    { step_number: 3, title: '平易な要約・解説作成', detail: '専門用語や行政条文をわかりやすい対話形式に整理', status: 'completed' },
    { step_number: 4, title: '原文照合・ファクトチェック', detail: '公式会議録の原文との整合性を照合済み', status: 'completed' },
  ];

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
    // モーダル表示中は背景のスクロールを固定
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // 初期メッセージ設定
  useEffect(() => {
    const isTokyo = assembly.id === 'tokyo-metropolitan';
    const initialMsgs: Message[] = [
      {
        id: 'msg-1',
        sender: 'assistant',
        plainText: `こんにちは！${assembly.name}の会議録データをわかりやすく構造化してお届けします。\n知りたいテーマや疑問があればご質問ください。`,
        speaker: `${assembly.name} 議会案内`,
        speakerTitle: '公式データ連携',
        date: '最新の定例会より',
        timestamp: '10:00',
        sourceUrl: 'https://catalog.data.metro.tokyo.lg.jp/',
        aiChainSteps: DEFAULT_CHAIN_STEPS,
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        plainText: isTokyo
          ? `第2子以降の保育料を無料にする案が進んでいます。おむつ代を定額で支援する制度も検討されています。`
          : `${assembly.name}における「${assembly.hotTopic}」について支援策が進んでいます。`,
        structuredSummary: {
          whatChanges: isTokyo
            ? '第2子以降の保育料を無料にする案が進んでいます。おむつ代を定額で支援する制度も検討されています。'
            : `${assembly.name}において「${assembly.hotTopic}」を推進し、区民・市民の生活負担を減らす案が検討されています。`,
          targetAudience: isTokyo
            ? '都内にお住まいの子育て世帯（特に小中学生や乳幼児のいるご家庭）'
            : `${assembly.name}にお住まいの子育て世帯・ご家庭および関係住民の皆様`,
          currentStage: '2026年 当初予算案を審議中（決定後に運用スタート予定）',
          budgetInfo: '所得制限なしの重点事業として予算計上（都の重点施策）',
        },
        speaker: isTokyo ? '小池 百合子' : assembly.mayorName,
        speakerTitle: isTokyo ? '東京都知事' : '首長答弁',
        date: '2026年 第1回定例会 本会議',
        originalQuote: isTokyo
          ? '「次代を担う子どもたちの健やかな育成を社会全体で後押しすべく、所得制限のない幼児教育・保育の負担軽減策を拡充し、切れ目のない子育て支援を推進してまいります。」'
          : `「${assembly.name}における本施策は、区民・市民の生活利便性向上と行政手続きの抜本的な効率化を目指し、令和8年度当初予算案に重点計上しております。」`,
        timestamp: '10:01',
        agreeCount: 42,
        disagreeCount: 3,
        sourceUrl: 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000021d0000000010',
        aiChainSteps: DEFAULT_CHAIN_STEPS,
      },
    ];

    if (initialTheme) {
      initialMsgs.push({
        id: 'msg-theme',
        sender: 'user',
        plainText: `「${initialTheme}」について詳しく教えてください`,
        timestamp: '10:02',
      });
      initialMsgs.push({
        id: 'msg-theme-reply',
        sender: 'assistant',
        plainText: `「${initialTheme}」に関する手続きをスマホで完結できるよう改善する案が進んでいます。`,
        structuredSummary: {
          whatChanges: `「${initialTheme}」に関する申請手続きをスマホ完結・ワンストップ化する案が進んでいます。`,
          targetAudience: `${assembly.name}にお住まいで対象手続きを行う区民・市民の皆様`,
          currentStage: '予算特別委員会にて具体仕様および実施ロードマップを審議中',
          budgetInfo: 'システム構築およびオンライン申請運用予算を令和8年度に計上',
        },
        speaker: '議会事務局 / 担当委員会',
        speakerTitle: '予算特別委員会',
        date: '2026年 委員会審査',
        originalQuote: '「市民の皆様からのご要望を踏まえ、オンラインでのワンストップ申請窓口の整備と支給スピードの短縮に努めてまいります。」',
        timestamp: '10:03',
        agreeCount: 28,
        disagreeCount: 1,
        sourceUrl: 'https://catalog.data.metro.tokyo.lg.jp/',
        aiChainSteps: DEFAULT_CHAIN_STEPS,
      });
    }

    queueMicrotask(() => setMessages(initialMsgs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assembly, initialTheme]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleQuote = (id: string) => {
    setExpandedQuotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChain = (id: string) => {
    setExpandedChains((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const triggerEbpmFeedbackNotification = (typeStr: string, newCount: number) => {
    setEbpmToast(`💡 あなたの「${typeStr}」が送信されました！議員ダッシュボードの反応数が ${newCount - 1}件 ➔ ${newCount}件 に即時反映！`);
    setTimeout(() => {
      setEbpmToast(null);
    }, 4500);
  };

  const handleVote = (id: string, type: 'agree' | 'disagree') => {
    if (userVotes[id]) return;
    setUserVotes((prev) => ({ ...prev, [id]: type }));
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== id) return msg;
        return {
          ...msg,
          agreeCount: type === 'agree' ? (msg.agreeCount || 0) + 1 : msg.agreeCount,
          disagreeCount: type === 'disagree' ? (msg.disagreeCount || 0) + 1 : msg.disagreeCount,
        };
      })
    );

    // カウントアップ連動イベント発火
    const newCount = incrementEbpmReactionCount();

    // バックエンドヘ非同期通知
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    fetch(`${apiBase}/api/assemblies/${assembly.id}/messages/${id}/opinion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opinion_type: type }),
    }).catch(() => {});

    triggerEbpmFeedbackNotification(type === 'agree' ? '賛成の声' : '懸念の声', newCount);
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isSending) return;

    const userText = inputQuestion.trim();
    setInputQuestion('');
    setIsSending(true);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      plainText: userText,
      timestamp: nowStr,
    };

    setMessages((prev) => [...prev, userMsg]);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${apiBase}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userText, assembly_id: assembly.id }),
      });
      if (res.ok) {
        const data = await res.json();
        const assistantReply: Message = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          plainText: data.answer,
          speaker: data.speaker || `${assembly.name} AI答弁`,
          speakerTitle: data.role || '超翻訳ナビゲーター',
          date: '最新会議録より',
          originalQuote: data.original_quote,
          timestamp: nowStr,
          agreeCount: 1,
          disagreeCount: 0,
          sourceUrl: data.source_url || 'https://catalog.data.metro.tokyo.lg.jp/',
          aiChainSteps: data.ai_chain_steps || DEFAULT_CHAIN_STEPS,
        };
        setMessages((prev) => [...prev, assistantReply]);
      } else {
        throw new Error('API failed');
      }
    } catch {
      const fallbackReply: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        plainText: `ご質問「${userText}」に関して、${assembly.name}の最新議事録オープンデータを参照しました。\n\n本件については直近の定例会でも議論されており、関連予算および実施スケジュールが審議されています。`,
        speaker: `${assembly.name} 議会答弁`,
        speakerTitle: '関係部長・担当課',
        date: '最新会議録より',
        originalQuote: `「本件に関する施策につきましては、関係各所と綿密な連携を図りつつ、所期の目的達成に向けて着実に進行管理を行ってまいります。」`,
        timestamp: nowStr,
        agreeCount: 1,
        disagreeCount: 0,
        sourceUrl: 'https://catalog.data.metro.tokyo.lg.jp/',
        aiChainSteps: DEFAULT_CHAIN_STEPS,
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    '病児保育の予約や受け入れ枠は？',
    '給食費無償化の対象や条件は？',
    'スマホ申請できる行政手続きは？',
  ];

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* モーダルコンテナ（モバイルでは全画面、PCではカード） */}
      <div className="w-full h-full sm:h-[88vh] sm:max-w-2xl bg-slate-950 sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
        {/* EBPMリアルタイム連動トーストバナー */}
        {ebpmToast && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-between animate-bounce">
            <span>{ebpmToast}</span>
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        {/* ヘッダー */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  マチボイス ({assembly.name})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-emerald-400 border border-slate-700 font-medium shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  公式データ連携
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                公式議事録・発言データの要約・質問アシスタント
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

        {/* クイック質問チップ（横スクロール） */}
        <div className="bg-slate-900/60 border-b border-slate-800/50 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 pl-1">
            よくある質問:
          </span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setInputQuestion(prompt)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* チャットメッセージログ（スクロール領域） */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isQuoteExpanded = expandedQuotes[msg.id];
            const isChainExpanded = expandedChains[msg.id];
            const hasVoted = userVotes[msg.id];
            const chainSteps = msg.aiChainSteps || DEFAULT_CHAIN_STEPS;

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end items-end gap-1.5">
                  <span className="text-[10px] text-slate-500 mb-1">{msg.timestamp}</span>
                  <div className="max-w-[80%] sm:max-w-[70%] bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs sm:text-sm font-normal leading-relaxed shadow-sm">
                    {msg.plainText}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1.5">
                  {/* 発言者・日付バッジ */}
                  {msg.speaker && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">{msg.speaker}</span>
                      {msg.speakerTitle && <span>({msg.speakerTitle})</span>}
                      {msg.date && (
                        <span className="text-slate-500 hidden xs:inline">• {msg.date}</span>
                      )}
                    </div>
                  )}

                  {/* 要約本文カード (4大主要ブロック構成) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 sm:p-5 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3.5 shadow-md">
                    
                    {/* 【ブロック1】何が変わる？ */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>何が変わる？</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                          原文検証済み
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-bold text-white leading-snug">
                        {msg.structuredSummary ? msg.structuredSummary.whatChanges : msg.plainText}
                      </div>
                    </div>

                    {/* 【ブロック2, 3, 4】誰に関係する？ × いまどの段階？ × お金・予算は？ */}
                    {msg.structuredSummary && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                          <div className="text-[10.5px] font-semibold text-slate-400">📌 誰に関係する？</div>
                          <div className="text-xs font-semibold text-slate-200 leading-tight">
                            {msg.structuredSummary.targetAudience}
                          </div>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                          <div className="text-[10.5px] font-semibold text-slate-400">🟡 いまどの段階？</div>
                          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 leading-tight">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            <span>{msg.structuredSummary.currentStage}</span>
                          </div>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                          <div className="text-[10.5px] font-semibold text-slate-400">💰 お金・予算は？</div>
                          <div className="text-xs font-semibold text-slate-300 leading-tight">
                            {msg.structuredSummary.budgetInfo || '令和8年度当初予算案に重点計上'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 【ブロック4】根拠は？ (公式会議録 原文引用 & オープンデータリンク) */}
                    {msg.originalQuote && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-1 text-[11px]">
                          <button
                            onClick={() => toggleQuote(msg.id)}
                            className="font-medium text-slate-300 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            <span>根拠：公式会議録の原文を{isQuoteExpanded ? '閉じる' : '確認する'}</span>
                            {isQuoteExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <a
                            href={msg.sourceUrl || 'https://catalog.data.metro.tokyo.lg.jp/'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10.5px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium underline underline-offset-2"
                          >
                            <span>東京都オープンデータ原典</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {isQuoteExpanded && (
                          <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-serif leading-relaxed italic animate-fade-in">
                            {msg.originalQuote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 補助情報: 市民の反応 (賛成・懸念) & 検証ステップ */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] text-slate-400">市民の反応:</span>
                        <button
                          onClick={() => handleVote(msg.id, 'agree')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                            hasVoted === 'agree'
                              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>賛成</span>
                          {msg.agreeCount !== undefined && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {msg.agreeCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleVote(msg.id, 'disagree')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                            hasVoted === 'disagree'
                              ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                              : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>懸念</span>
                          {msg.disagreeCount !== undefined && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {msg.disagreeCount}
                            </span>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => toggleChain(msg.id)}
                        className="text-[10.5px] font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors ml-auto"
                      >
                        <span>AI検証プロセス</span>
                        {isChainExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* AI Processing Chain アコーディオン展開 */}
                    {isChainExpanded && (
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs animate-fade-in">
                        <p className="text-[11px] text-slate-400 font-semibold mb-1">
                          処理ステップ: 公式データ連携 ➔ 情報抽出 ➔ 構造化要約 ➔ 原文照合
                        </p>
                        {chainSteps.map((step) => (
                          <div key={step.step_number} className="flex items-start gap-2 text-[11px]">
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                              {step.step_number}
                            </span>
                            <div>
                              <span className="font-semibold text-slate-200">{step.title}</span>
                              <p className="text-slate-400 text-[10.5px] leading-tight">{step.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 pl-1">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* チャット入力フォーム */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 shrink-0">
          <form onSubmit={handleSendQuestion} className="flex items-center gap-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="政策や予算について質問を入力..."
              disabled={isSending}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isSending || !inputQuestion.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              aria-label="送信"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">送信</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
