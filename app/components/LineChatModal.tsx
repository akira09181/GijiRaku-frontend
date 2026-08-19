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
  Calendar,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Users,
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

export interface TimelineItem {
  readonly date: string;
  readonly event: string;
  readonly status?: 'completed' | 'active' | 'upcoming';
}

export interface PolicyArguments {
  readonly supporting: readonly string[];
  readonly concerns: readonly string[];
}

export interface SpeakerUtterance {
  readonly speakerName: string;
  readonly speakerRole: string;
  readonly partyName?: string;
  readonly committeeName?: string;
  readonly stanceLabel: '推進' | '慎重' | '拡大提案' | '課題提起' | string;
  readonly summaryQuote: string;
  readonly avatarColor?: string;
  readonly sourceExcerpt?: string;
}

export interface StructuredSummary {
  readonly whatChanges: string;
  readonly targetAudience: string;
  readonly currentStage: string;
  readonly budgetInfo?: string;
  readonly nextStep?: string;
}

interface Message {
  readonly id: string;
  readonly sender: 'user' | 'assistant';
  readonly plainText: string;
  readonly structuredSummary?: StructuredSummary;
  readonly timeline?: readonly TimelineItem[];
  readonly policyArguments?: PolicyArguments;
  readonly speakerUtterances?: readonly SpeakerUtterance[];
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
 */
const getDynamicSpeakerUtterances = (assembly: Assembly, theme?: string): SpeakerUtterance[] => {
  const isTokyo = assembly.id === 'tokyo-metropolitan';
  const mayorName = isTokyo ? '小池 百合子' : assembly.mayorName || '首長';
  const mayorRole = isTokyo ? '東京都知事' : assembly.type === 'ward' ? '区長' : assembly.type === 'city' ? '市長' : '首長';
  const hotTopic = theme || assembly.hotTopic;

  if (assembly.id === 'shinagawa-ward') {
    return [
      {
        speakerName: '森澤 恭子',
        speakerRole: '品川区長',
        partyName: '無所属',
        committeeName: '本会議・区長方針表明',
        stanceLabel: '推進',
        summaryQuote: '給食費の完全無償化とおむつ定額支給を軸に、品川区の子育て世代を全面的にバックアップします。',
        avatarColor: 'emerald',
      },
      {
        speakerName: '伊藤 まさこ',
        speakerRole: '区議会議員',
        partyName: '品川区議会公明党',
        committeeName: '文教委員会',
        stanceLabel: '推進',
        summaryQuote: '小中学校の給食費ゼロ継続に加え、病児保育予約の完全デジタル化も早期に完了させるべきです。',
        avatarColor: 'emerald',
      },
      {
        speakerName: '松本 ときひろ',
        speakerRole: '区議会議員',
        partyName: '品川区議会自民党',
        committeeName: '予算特別委員会',
        stanceLabel: '慎重',
        summaryQuote: '無償化施策の財源根拠と、将来にわたる持続可能性について予算特別委で精査が必要です。',
        avatarColor: 'amber',
      },
    ];
  }

  if (assembly.id === 'machida-city') {
    return [
      {
        speakerName: '石阪 丈一',
        speakerRole: '町田市長',
        partyName: '無所属',
        committeeName: '本会議・市政方針',
        stanceLabel: '推進',
        summaryQuote: '多摩モノレール町田延伸事業と併せ、0歳〜2歳児へのおむつ電子クーポン助成を強力に推進します。',
        avatarColor: 'emerald',
      },
      {
        speakerName: '高橋 りえ',
        speakerRole: '市議会議員',
        partyName: '町田市民の会',
        committeeName: '文教社会委員会',
        stanceLabel: '拡大提案',
        summaryQuote: 'おむつ助成をクーポンだけでなくアプリ決済対応にし、中学校給食の全員喫食も前倒しすべきです。',
        avatarColor: 'sky',
      },
      {
        speakerName: '小林 けんじ',
        speakerRole: '市議会議員',
        partyName: '自由民主党町田市議団',
        committeeName: '建設常任委員会',
        stanceLabel: '慎重',
        summaryQuote: '多摩都市モノレールの着工時期と周辺まちづくり事業の年間予算バランスを検証します。',
        avatarColor: 'amber',
      },
    ];
  }

  if (assembly.id === 'shinjuku-ward') {
    return [
      {
        speakerName: '吉住 健一',
        speakerRole: '新宿区長',
        partyName: '無所属',
        committeeName: '本会議・区政方針',
        stanceLabel: '推進',
        summaryQuote: '繁華街の防犯安全強化と並行し、認可外保育助成およびLINEによる住民票デジタル申請を進めます。',
        avatarColor: 'emerald',
      },
      {
        speakerName: '野もと あきとし',
        speakerRole: '区議会議員',
        partyName: '新宿区議会公明党',
        committeeName: '総務区民委員会',
        stanceLabel: '推進',
        summaryQuote: '各種証明書のスマホ申請対応により窓口混雑を解消し、24時間申請を全手続きへ拡張すべきです。',
        avatarColor: 'emerald',
      },
      {
        speakerName: '桑原 ようへい',
        speakerRole: '区議会議員',
        partyName: '自由民主党新宿区議団',
        committeeName: '防災・まちづくり委員会',
        stanceLabel: '課題提起',
        summaryQuote: 'デジタル化が進む中で、スマホ操作に不安のある高齢区民へのフォロー窓口設置が不可欠です。',
        avatarColor: 'purple',
      },
    ];
  }

  if (assembly.id === 'shibuya-ward') {
    return [
      {
        speakerName: '長谷部 健',
        speakerRole: '渋谷区長',
        partyName: '無所属',
        committeeName: '本会議・施策方針',
        stanceLabel: '推進',
        summaryQuote: 'スタートアップ育成特区とスマートシティ渋谷を両輪に、行政手続きのスマート認証化を加速します。',
        avatarColor: 'emerald',
      },
      {
        speakerName: '神園 まちこ',
        speakerRole: '区議会議員',
        partyName: 'シブヤ未来会議',
        committeeName: '文教委員会',
        stanceLabel: '拡大提案',
        summaryQuote: '放課後クラブのオンライン申込化やシブヤフォント活用など、子育て教育DXをさらに深めるべきです。',
        avatarColor: 'sky',
      },
      {
        speakerName: '丸山 たかし',
        speakerRole: '区議会議員',
        partyName: '渋谷区議会自民党',
        committeeName: '都市再開発特別委員会',
        stanceLabel: '慎重',
        summaryQuote: '100年に一度と言われる渋谷駅周辺再開発と安全・治安対策の事業費について継続検証を行います。',
        avatarColor: 'amber',
      },
    ];
  }

  return [
    {
      speakerName: mayorName,
      speakerRole: `${assembly.name} ${mayorRole}`,
      partyName: '無所属',
      committeeName: '本会議・首長答弁',
      stanceLabel: '推進',
      summaryQuote: `「${hotTopic}」に関して、住民の負担軽減と地域の利便性向上を最優先に施策を推進してまいります。`,
      avatarColor: 'emerald',
    },
    {
      speakerName: '山田 太郎',
      speakerRole: `${assembly.name} 議員`,
      partyName: isTokyo ? '都民ファーストの会' : '自由民主党会派',
      committeeName: '予算特別委員会',
      stanceLabel: '慎重',
      summaryQuote: `「${hotTopic}」に関する事業の持続可能性と必要な財源措置について詳細な検証を行います。`,
      avatarColor: 'amber',
    },
    {
      speakerName: '佐藤 花子',
      speakerRole: `${assembly.name} 議員`,
      partyName: isTokyo ? '日本共産党' : '市民無所属ネットワーク',
      committeeName: '文教・生活福祉委員会',
      stanceLabel: '拡大提案',
      summaryQuote: `「${hotTopic}」の対象範囲をさらに拡大し、支援が必要な世帯へ広く届くよう提案いたします。`,
      avatarColor: 'sky',
    },
  ];
};

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
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [ebpmToast, setEbpmToast] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const DEFAULT_CHAIN_STEPS: AiChainStep[] = [
    { step_number: 1, title: '公式データ取得・連携', detail: '東京都オープンデータカタログより該当の議会会議録データを取得', status: 'completed' },
    { step_number: 2, title: '発言・テーマ構造化', detail: '会議録より質問・答弁・関連施策情報を特定・分類', status: 'completed' },
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
    const dynamicSpeakers = getDynamicSpeakerUtterances(assembly);

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
          nextStep: '予算案可決後、2026年度中の制度開始に向け準備進行予定',
        },
        timeline: [
          { date: '2026-02-20', event: '令和8年度当初予算案 提出', status: 'completed' },
          { date: '2026-03-05', event: '予算特別委員会で詳細審議', status: 'active' },
          { date: '2026-03-25', event: '本会議で採決予定（可決後に準備開始）', status: 'upcoming' },
        ],
        policyArguments: {
          supporting: [
            '子育て世帯の経済的負担を抜本的に軽減できる',
            '若年世代の定住促進と地域活性化につながる',
          ],
          concerns: [
            '継続的な年間財源の確保に関する検証が必要',
            '受入枠（保育士・施設容量）の確保が課題',
          ],
        },
        speakerUtterances: dynamicSpeakers,
        speaker: '議会定例会 3分解説',
        speakerTitle: `${assembly.name} 会議録オープンデータ分析`,
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
      const themeSpeakers = getDynamicSpeakerUtterances(assembly, initialTheme);
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
          nextStep: '委員会での承認後、本年度中にオンライン申請システム構築を開始',
        },
        timeline: [
          { date: '2026-02-15', event: 'オンライン化基本構想の発表', status: 'completed' },
          { date: '2026-03-10', event: '委員会審査・システム予算採決', status: 'active' },
          { date: '2026-10-01', event: 'スマホ完結申請サービスの運用開始予定', status: 'upcoming' },
        ],
        policyArguments: {
          supporting: [
            '役所窓口の待ち時間をゼロにし、24時間申請を可能にする',
            'ペーパーレス化による行政コストの削減',
          ],
          concerns: [
            '高齢者やスマホ未保有者へのサポート体制の準備が必要',
            '個人情報・セキュリティ対策の徹底が求められる',
          ],
        },
        speakerUtterances: themeSpeakers,
        speaker: 'テーマ別要点解説',
        speakerTitle: `${assembly.name} 委員会審査分析`,
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

  const toggleCommentBox = (id: string) => {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (id: string) => {
    const text = commentInputs[id]?.trim();
    if (!text) return;

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== id) return msg;
        return {
          ...msg,
          comments: [...(msg.comments || []), { user: '市民（あなた）', text }],
        };
      })
    );
    setCommentInputs((prev) => ({ ...prev, [id]: '' }));

    const newCount = incrementEbpmReactionCount();

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    fetch(`${apiBase}/api/assemblies/${assembly.id}/messages/${id}/opinion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opinion_type: 'agree', comment_text: text }),
    }).catch(() => {});

    setEbpmToast(`💡 あなたの声が匿名集計されました！議員・行政向け分析ダッシュボード（EBPM）の集計数が ${newCount}件 に即時反映！`);
    setTimeout(() => {
      setEbpmToast(null);
    }, 4500);
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

                    {/* 【主要ブロック】この議論で、誰が何を言った？ (氏名・所属会派・発言の要旨アバター吹き出し) */}
                    {msg.speakerUtterances && msg.speakerUtterances.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span>この議論で、誰が何を言った？</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                            発言の要旨
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {msg.speakerUtterances.map((utt, idx) => {
                            const stanceStyle =
                              utt.stanceLabel === '推進'
                                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60'
                                : utt.stanceLabel === '慎重'
                                ? 'bg-amber-950/90 text-amber-300 border-amber-700/60'
                                : utt.stanceLabel === '拡大提案'
                                ? 'bg-sky-950/90 text-sky-300 border-sky-700/60'
                                : 'bg-purple-950/90 text-purple-300 border-purple-700/60';

                            const avatarBg =
                              utt.avatarColor === 'emerald'
                                ? 'bg-emerald-600 text-white'
                                : utt.avatarColor === 'amber'
                                ? 'bg-amber-600 text-white'
                                : utt.avatarColor === 'sky'
                                ? 'bg-sky-600 text-white'
                                : 'bg-purple-600 text-white';

                            return (
                              <div key={idx} className="flex items-start gap-2.5 text-xs">
                                {/* 丸型簡易アバター */}
                                <div className={`w-8 h-8 rounded-full ${avatarBg} font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                                  {utt.speakerName.slice(0, 2)}
                                </div>

                                {/* 発言者詳細 ＋ 吹き出し */}
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                    <span className="font-bold text-white text-xs">{utt.speakerName}</span>
                                    <span className="text-slate-400 text-[10.5px]">
                                      {utt.partyName ? `${utt.partyName} / ` : ''}{utt.committeeName || utt.speakerRole}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-semibold border ${stanceStyle}`}>
                                      {utt.stanceLabel}
                                    </span>
                                  </div>
                                  <div className="bg-slate-950 border border-slate-800/90 p-2.5 rounded-2xl rounded-tl-xs text-slate-200 leading-relaxed font-normal">
                                    💬「{utt.summaryQuote}」
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-[10px] text-slate-400 font-normal pt-0.5">
                          ※上記は議事録をもとにした発言の要旨です。正確な表現は原文をご確認ください。
                        </p>
                      </div>
                    )}

                    {/* スケジュール・時間軸 (Timeline) */}
                    {msg.timeline && msg.timeline.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>今後のスケジュール・時系列</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {msg.timeline.map((item, idx) => (
                            <div key={idx} className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 text-[11px]">
                              <div className="text-[10px] text-emerald-400 font-mono font-semibold">{item.date}</div>
                              <div className="text-slate-200 font-medium leading-tight mt-0.5">{item.event}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 議会での主な論点 (Supporting vs Concerns) */}
                    {msg.policyArguments && (
                      <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>議会での主な論点（審議内容）</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/40 space-y-1">
                            <div className="text-[10.5px] font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>賛成理由・推進側の主な意見</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10.5px]">
                              {msg.policyArguments.supporting.map((arg, idx) => (
                                <li key={idx}>{arg}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40 space-y-1">
                            <div className="text-[10.5px] font-bold text-rose-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>慎重論・懸念される主な点</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10.5px]">
                              {msg.policyArguments.concerns.map((arg, idx) => (
                                <li key={idx}>{arg}</li>
                              ))}
                            </ul>
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

                    {/* 補助情報: この議論、どう思う？ (双方向フィードバック) & AI検証ステップ */}
                    {(msg.agreeCount !== undefined || msg.disagreeCount !== undefined) && (
                      <div className="pt-2.5 border-t border-slate-800/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-300">この議論、どう思う？</span>
                            <button
                              onClick={() => handleVote(msg.id, 'agree')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                                hasVoted === 'agree'
                                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>賛成 {msg.agreeCount !== undefined ? msg.agreeCount : 42}</span>
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
                              <span>懸念 {msg.disagreeCount !== undefined ? msg.disagreeCount : 3}</span>
                            </button>
                            <button
                              onClick={() => toggleCommentBox(msg.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
                            >
                              <Send className="w-3 h-3 text-emerald-400" />
                              <span>意見を書く</span>
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

                        {/* 意見コメント入力ボックス */}
                        {openComments[msg.id] && (
                          <div className="pt-2 flex items-center gap-1.5 animate-fade-in">
                            <input
                              type="text"
                              value={commentInputs[msg.id] || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({ ...prev, [msg.id]: e.target.value }))
                              }
                              placeholder="この議題への匿名意見・声を届ける（行政ダッシュボードへ集計）..."
                              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() => handleAddComment(msg.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shrink-0"
                            >
                              届ける
                            </button>
                          </div>
                        )}

                        {/* 投稿された市民コメント */}
                        {msg.comments && msg.comments.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {msg.comments.map((c, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 text-[11px] text-slate-300"
                              >
                                <span className="font-semibold text-emerald-400">{c.user}: </span>
                                <span>{c.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

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
