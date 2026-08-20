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
  readonly id?: string;
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
  readonly sourceUrl?: string;
  readonly agreeCount?: number;
  readonly concernCount?: number;
  readonly helpfulCount?: number;
  readonly citizenComments?: readonly { user: string; text: string; tag?: string }[];
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
        voteRecord: '賛成',
        summaryQuote: '給食費の完全無償化とおむつ定額支給を軸に、品川区の子育て世代を全面的にバックアップします。',
        fullSummary: '令和8年度当初予算におきまして、品川区立小中学校の給食費全額公費負担を継続計上するとともに、0歳児から2歳児のおむつ配付助成を拡大実施いたします。',
        sourceExcerpt: '「本区におきましては、次世代を担う子どもたちの成長とご家庭の経済的負担軽減を最優先課題と位置付け、小中学校給食費の全額無償化を恒久的に継続するとともに、乳幼児紙おむつ等の定期便配付事業を強力に推進してまいります。」',
        meetingName: '令和8年 第1回定例会 本会議区政表明',
        avatarColor: 'emerald',
      },
      {
        speakerName: '伊藤 まさこ',
        speakerRole: '区議会議員',
        partyName: '品川区議会公明党',
        committeeName: '文教委員会',
        stanceLabel: '推進',
        voteRecord: '賛成',
        summaryQuote: '小中学校の給食費ゼロ継続に加え、病児保育予約の完全デジタル化も早期に完了させるべきです。',
        fullSummary: '給食費全額無償化の維持を歓迎しつつ、共働き世帯が最も困る病児・病後児保育のLINE予約システムの即時全域展開を求めて質疑を行いました。',
        sourceExcerpt: '「品川区における給食費無償化の継続方針を高く評価いたします。あわせて保護者の強いニーズである病児保育のオンライン即時予約枠の拡充について具体的進捗を伺います。」',
        meetingName: '文教委員会 質疑応答',
        avatarColor: 'emerald',
      },
      {
        speakerName: '松本 ときひろ',
        speakerRole: '区議会議員',
        partyName: '品川区議会自民党',
        committeeName: '予算特別委員会',
        stanceLabel: '条件付き賛成',
        voteRecord: '賛成',
        summaryQuote: '無償化施策の財源根拠と、将来にわたる持続可能性について予算特別委で精査が必要です。',
        fullSummary: '給食費無償化および各種手当の増額に対する都補助金縮小リスクを懸念し、品川区独自の単年度財源確保策の検証を行いました。',
        sourceExcerpt: '「無償化施策の理念には賛同いたしますが、単年度あたり数億円規模となる財源の持続性、並びに将来的な都補助金の変更に伴う影響を精査する必要があります。」',
        meetingName: '予算特別委員会 総括質疑',
        avatarColor: 'amber',
      },
      {
        speakerName: '田中 けんじ',
        speakerRole: '区議会議員',
        partyName: '無所属ネットワーク',
        committeeName: '福祉健康委員会',
        stanceLabel: '拡大提案',
        voteRecord: '未採決',
        summaryQuote: '区立学校だけでなく私立小中・フリースクールに通う区民児童への支援格差も解消すべきです。',
        fullSummary: '区立学校に通う児童だけでなく、区内に居住し私立小中学校や特別支援校、フリースクールに通学する児童への公平な支援措置を提案しました。',
        sourceExcerpt: '「公立小中学校のみならず、区内に在住し多様な学びの場を選択している全児童・生徒に対する支援の公平性観点から助成範囲の拡充を求めます。」',
        meetingName: '福祉健康委員会 審議',
        avatarColor: 'sky',
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
        voteRecord: '未採決',
        summaryQuote: '多摩モノレール町田延伸事業と併せ、0歳〜2歳児へのおむつ電子クーポン助成を強力に推進します。',
        fullSummary: '多摩都市モノレール町田延伸の都市計画決定手続きを進めるとともに、子育て世帯へデジタル決済ポイントで直接おむつ代を助成する新制度を開始します。',
        sourceExcerpt: '「次年度予算におきまして、電子ポイントを活用した紙おむつ購入費助成事業を新規計上し、併せて多摩都市モノレール町田方面延伸の早期事業化に全力を尽くします。」',
        meetingName: '令和8年 第1回定例会 市政方針演説',
        avatarColor: 'emerald',
      },
      {
        speakerName: '高橋 りえ',
        speakerRole: '市議会議員',
        partyName: '町田市民の会',
        committeeName: '文教社会委員会',
        stanceLabel: '拡大提案',
        voteRecord: '未採決',
        summaryQuote: 'おむつ助成をクーポンだけでなくアプリ決済対応にし、中学校給食の全員喫食も前倒しすべきです。',
        fullSummary: '紙のクーポンの使いづらさを指摘しスマホアプリ決済対応を求めるとともに、中学校全員給食の早期実現を促しました。',
        sourceExcerpt: '「子育て中の保護者が使いやすいようスマホアプリ決済との連動を強く求めます。また中学校給食の全員喫食化についても前倒しで運用を開始すべきです。」',
        meetingName: '文教社会委員会 質疑',
        avatarColor: 'sky',
      },
      {
        speakerName: '小林 けんじ',
        speakerRole: '市議会議員',
        partyName: '自由民主党町田市議団',
        committeeName: '建設常任委員会',
        stanceLabel: '条件付き賛成',
        voteRecord: '未採決',
        summaryQuote: '多摩都市モノレールの着工時期と周辺まちづくり事業の年間予算バランスを検証します。',
        fullSummary: 'モノレール延伸に伴う市負担額および町田駅周辺デッキ整備の事業計画と市債残高への影響について慎重な審査を実施しました。',
        sourceExcerpt: '「モノレール導入空間の確保とペデストリアンデッキ着工に係る市負担額の膨らみについて、将来世代の財政負担とならないよう精査が求められます。」',
        meetingName: '建設常任委員会 審査',
        avatarColor: 'amber',
      },
      {
        speakerName: '渡辺 まゆみ',
        speakerRole: '市議会議員',
        partyName: '町田市議会共産党',
        committeeName: '福祉委員会',
        stanceLabel: '課題提起',
        voteRecord: '未採決',
        summaryQuote: '学童保育の待機児童問題と指導員の処遇改善について追加対策を要望します。',
        fullSummary: '学童保育（放課後児童クラブ）の受け入れ枠不足および指導員の人手不足・処遇改善に向けた市独自の助成策を求めました。',
        sourceExcerpt: '「指導員の確保と待遇改善なしに放課後児童クラブの待機児童ゼロは達成できません。市独自の賃金上乗せ助成を速やかに実施してください。」',
        meetingName: '福祉委員会 質疑',
        avatarColor: 'purple',
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
        voteRecord: '賛成',
        summaryQuote: '繁華街の防犯安全強化と並行し、認可外保育助成およびLINEによる住民票デジタル申請を進めます。',
        fullSummary: '歌舞伎町・新宿駅周辺の防犯対策を強化しつつ、区民が役所に来ずにスマホ完結で証明書を取得できるデジタルトランスフォーメーションを推進します。',
        sourceExcerpt: '「新宿区の安全安心なまちづくりと区民利便性の向上に向け、LINEを活用した住民票および税証明の即時申請・受取システムを全区民へ公開いたします。」',
        meetingName: '令和8年 第1回定例会 区政表明',
        avatarColor: 'emerald',
      },
      {
        speakerName: '野もと あきとし',
        speakerRole: '区議会議員',
        partyName: '新宿区議会公明党',
        committeeName: '総務区民委員会',
        stanceLabel: '推進',
        voteRecord: '賛成',
        summaryQuote: '各種証明書のスマホ申請対応により窓口混雑を解消し、24時間申請を全手続きへ拡張すべきです。',
        fullSummary: 'オンライン申請の対象手続きを住民票だけでなく子育て手当・保育園入園申請へ拡大することを提言しました。',
        sourceExcerpt: '「役所窓口での長時間の待ち時間を削減するため、スマホ手続きの対象を子育て・福祉関連申請へ全面展開するよう求めます。」',
        meetingName: '総務区民委員会 審議',
        avatarColor: 'emerald',
      },
      {
        speakerName: '桑原 ようへい',
        speakerRole: '区議会議員',
        partyName: '自由民主党新宿区議団',
        committeeName: '防災・まちづくり委員会',
        stanceLabel: '課題提起',
        voteRecord: '未採決',
        summaryQuote: 'デジタル化が進む中で、スマホ操作に不安のある高齢区民へのフォロー窓口設置が不可欠です。',
        fullSummary: '行政手続きのオンライン化が進む一方、高齢者や障害者などデジタル弱者を取り残さないための対面サポート窓口の併設を要望しました。',
        sourceExcerpt: '「スマホ申請への移行と並行して、デジタル操作に不慣れな高齢区民の皆様への丁寧な対面補助体制を各地域センターへ配置してください。」',
        meetingName: '防災・まちづくり委員会 質疑',
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
        voteRecord: '賛成',
        summaryQuote: 'スタートアップ育成特区とスマートシティ渋谷を両輪に、行政手続きのスマート認証化を加速します。',
        fullSummary: 'グローバルスタートアップ拠点形成とシブヤスマートシティ构想に基づき、区民サービスおよび教育DXの先進事例を全国へ発信します。',
        sourceExcerpt: '「100年に一度の再開発が進む渋谷において、行政手続きの完全オンライン化とスタートアップ実証実験の場を創出してまいります。」',
        meetingName: '令和8年 第1回定例会 施策方針',
        avatarColor: 'emerald',
      },
      {
        speakerName: '神園 まちこ',
        speakerRole: '区議会議員',
        partyName: 'シブヤ未来会議',
        committeeName: '文教委員会',
        stanceLabel: '拡大提案',
        voteRecord: '賛成',
        summaryQuote: '放課後クラブのオンライン申込化やシブヤフォント活用など、子育て教育DXをさらに深めるべきです。',
        fullSummary: '渋谷区独自の教育テクノロジー活用と放課後クラブのデジタル化による保護者の負担軽減を提案しました。',
        sourceExcerpt: '「放課後クラブのオンライン申込化とシブヤフォント活用を通じたインクルーシブ教育のさらなる進化を要望いたします。」',
        meetingName: '文教委員会 質疑',
        avatarColor: 'sky',
      },
      {
        speakerName: '丸山 たかし',
        speakerRole: '区議会議員',
        partyName: '渋谷区議会自民党',
        committeeName: '都市再開発特別委員会',
        stanceLabel: '条件付き賛成',
        voteRecord: '未採決',
        summaryQuote: '100年に一度と言われる渋谷駅周辺再開発と安全・治安対策の事業費について継続検証を行います。',
        fullSummary: '渋谷駅周辺の再開発事業に伴う公共街路整備費用および夜間治安対策予算の費用対効果について検証を求めました。',
        sourceExcerpt: '「再開発事業における区負担額の増加を抑制し、深夜の安全対策と防災備蓄体制の向上を最優先に図るべきです。」',
        meetingName: '都市再開発特別委員会 審査',
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
      voteRecord: '賛成',
      summaryQuote: `「${hotTopic}」に関して、住民の負担軽減と地域の利便性向上を最優先に施策を推進してまいります。`,
      fullSummary: `令和8年度当初予算案におきまして、「${hotTopic}」に係る事業予算を重点計上し、関係機関と連携の上で早期運用開始を目指します。`,
      sourceExcerpt: `「ご質問の『${hotTopic}』に関しまして、本区・本市の重要施策として位置付け、速やかな事業着手と効果的な運用を行ってまいります。」`,
      meetingName: '令和8年 第1回定例会 本会議',
      avatarColor: 'emerald',
    },
    {
      speakerName: '山田 太郎',
      speakerRole: `${assembly.name} 議員`,
      partyName: isTokyo ? '都民ファーストの会' : '自由民主党会派',
      committeeName: '予算特別委員会',
      stanceLabel: '条件付き賛成',
      voteRecord: '賛成',
      summaryQuote: `「${hotTopic}」に関する事業の持続可能性と必要な財源措置について詳細な検証を行います。`,
      fullSummary: `事業に必要な継続的財源の裏付けおよび導入後の運用効率化について予算特別委員会で詳細なチェックを実施しました。`,
      sourceExcerpt: `「施策の方向性には理解を示しつつも、継続的な財政負担および運用の実行可能性について事前に精査を行う必要があります。」`,
      meetingName: '予算特別委員会 質疑',
      avatarColor: 'amber',
    },
    {
      speakerName: '佐藤 花子',
      speakerRole: `${assembly.name} 議員`,
      partyName: isTokyo ? '日本共産党' : '市民無所属ネットワーク',
      committeeName: '文教・生活福祉委員会',
      stanceLabel: '拡大提案',
      voteRecord: '未採決',
      summaryQuote: `「${hotTopic}」の対象範囲をさらに拡大し、支援が必要な世帯へ広く届くよう提案いたします。`,
      fullSummary: `一部の世帯だけでなく、所得制限撤廃やサポート対象者の拡大により、一人でも多くの住民に届く制度設計を求めました。`,
      sourceExcerpt: `「所得制限や年齢制限によって対象外となるご家庭をなくし、真に生活者へ届く支援への拡充を強く要望いたします。」`,
      meetingName: '文教・生活福祉委員会 審議',
      avatarColor: 'sky',
    },
    {
      speakerName: '鈴木 健太',
      speakerRole: `${assembly.name} 議員`,
      partyName: isTokyo ? '自由民主党' : '公明党会派',
      committeeName: '総務・防災委員会',
      stanceLabel: '課題提起',
      voteRecord: '未採決',
      summaryQuote: `「${hotTopic}」の運用に伴うデジタル弱者への対面フォロー体制の確保が必要です。`,
      fullSummary: `高齢者や障害をお持ちの方が手続から取り残されないよう、窓口サポートや訪問相談体制の併設を提言しました。`,
      sourceExcerpt: `「デジタル手続きの推進と同時に、窓口や電話による丁寧なサポート窓口を維持し、誰一人取り残さない行政サービスを構築してください。」`,
      meetingName: '総務・防災委員会 質疑',
      avatarColor: 'purple',
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
  const [expandedSpeakerKeys, setExpandedSpeakerKeys] = useState<Record<string, boolean>>({});
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'agree' | 'disagree'>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [ebpmToast, setEbpmToast] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const toggleSpeakerExpand = (key: string) => {
    setExpandedSpeakerKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [utteranceVotes, setUtteranceVotes] = useState<Record<string, 'agree' | 'concern' | 'helpful'>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem('gijiraku_voted_statements');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [utteranceCounts, setUtteranceCounts] = useState<Record<string, { agree: number; concern: number; helpful: number }>>({});
  const [openUtteranceComments, setOpenUtteranceComments] = useState<Record<string, boolean>>({});
  const [utteranceCommentInputs, setUtteranceCommentInputs] = useState<Record<string, string>>({});
  const [utteranceCommentsList, setUtteranceCommentsList] = useState<Record<string, Array<{ user: string; text: string }>>>({});

  const handleUtteranceVote = async (
    uttKey: string,
    speakerName: string,
    type: 'agree' | 'concern' | 'helpful',
    defaultCounts: { agree: number; concern: number; helpful: number }
  ) => {
    if (utteranceVotes[uttKey]) return;

    const nextVotes = { ...utteranceVotes, [uttKey]: type };
    setUtteranceVotes(nextVotes);
    try {
      localStorage.setItem('gijiraku_voted_statements', JSON.stringify(nextVotes));
    } catch {
      // ignore
    }

    setUtteranceCounts((prev) => {
      const current = prev[uttKey] || defaultCounts;
      return {
        ...prev,
        [uttKey]: {
          ...current,
          [type]: current[type] + 1,
        },
      };
    });

    const newCount = incrementEbpmReactionCount();
    const typeLabel = type === 'agree' ? '👍 賛成' : type === 'concern' ? '⚠️ 気になる' : '💡 参考になった';
    triggerEbpmFeedbackNotification(`『${speakerName}』の発言へのリアクション（${typeLabel}）`, newCount);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/api/statements/${encodeURIComponent(uttKey)}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction_type: type, speaker_name: speakerName }),
      });
    } catch {
      // Clean fallback if backend is sleeping
    }
  };

  const toggleUtteranceCommentBox = (uttKey: string) => {
    setOpenUtteranceComments((prev) => ({ ...prev, [uttKey]: !prev[uttKey] }));
  };

  const handleAddUtteranceComment = async (uttKey: string, speakerName: string) => {
    const text = utteranceCommentInputs[uttKey]?.trim();
    if (!text) return;

    setUtteranceCommentsList((prev) => ({
      ...prev,
      [uttKey]: [...(prev[uttKey] || []), { user: '市民（あなた）', text }],
    }));
    setUtteranceCommentInputs((prev) => ({ ...prev, [uttKey]: '' }));

    const newCount = incrementEbpmReactionCount();
    setEbpmToast(`💡 【EBPM連動】「${speakerName}議員の発言」へ市民意見『${text}』が集計されました！行政向け分析ダッシュボード(累積${newCount}件)に即時反映！`);
    setTimeout(() => setEbpmToast(null), 4500);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/api/statements/${encodeURIComponent(uttKey)}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_label: '市民（あなた）', comment_text: text, speaker_name: speakerName }),
      });
    } catch {
      // Clean fallback
    }
  };

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

                    {/* 【主要ブロック】この議論で、誰が何を言った？ (一覧では軽く ➔ タップで無制限深掘り展開) */}
                    {msg.speakerUtterances && msg.speakerUtterances.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span>この議論で、誰が何を言った？（全{msg.speakerUtterances.length}名の発言）</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            タップで原文・抜粋を展開
                          </span>
                        </div>

                        <div className="space-y-2">
                          {msg.speakerUtterances.map((utt, idx) => {
                            const itemKey = `${msg.id}-speaker-${idx}`;
                            const isExpanded = expandedSpeakerKeys[itemKey];

                            const stanceStyle =
                              utt.stanceLabel === '推進'
                                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60'
                                : utt.stanceLabel === '条件付き賛成'
                                ? 'bg-teal-950/90 text-teal-300 border-teal-700/60'
                                : utt.stanceLabel === '慎重'
                                ? 'bg-amber-950/90 text-amber-300 border-amber-700/60'
                                : utt.stanceLabel === '拡大提案'
                                ? 'bg-sky-950/90 text-sky-300 border-sky-700/60'
                                : 'bg-purple-950/90 text-purple-300 border-purple-700/60';

                            const voteStyle =
                              utt.voteRecord === '賛成'
                                ? 'bg-emerald-900/80 text-emerald-200 border-emerald-600/80'
                                : utt.voteRecord === '反対'
                                ? 'bg-rose-900/80 text-rose-200 border-rose-600/80'
                                : utt.voteRecord === '棄権'
                                ? 'bg-slate-800 text-slate-300 border-slate-600'
                                : 'bg-amber-950/80 text-amber-300 border-amber-700/80';

                            const avatarBg =
                              utt.avatarColor === 'emerald'
                                ? 'bg-emerald-600 text-white'
                                : utt.avatarColor === 'amber'
                                ? 'bg-amber-600 text-white'
                                : utt.avatarColor === 'sky'
                                ? 'bg-sky-600 text-white'
                                : 'bg-purple-600 text-white';

                            return (
                              <div key={idx} className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3 space-y-2">
                                {/* 上段: 一覧（アバター ＋ 氏名・所属 ＋ 2種バッジ: 発言上の立場 ✕ 採決結果） */}
                                <div className="flex items-start gap-2.5 text-xs">
                                  <div className={`w-8 h-8 rounded-full ${avatarBg} font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                                    {utt.speakerName.slice(0, 2)}
                                  </div>

                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                      <span className="font-bold text-white text-xs">{utt.speakerName}</span>
                                      <span className="text-slate-400 text-[10.5px]">
                                        {utt.partyName ? `${utt.partyName} / ` : ''}{utt.committeeName || utt.speakerRole}
                                      </span>
                                      {/* 発言上の立場 */}
                                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-semibold border ${stanceStyle}`}>
                                        発言: {utt.stanceLabel}
                                      </span>
                                      {/* 本会議での採決結果 */}
                                      {utt.voteRecord && (
                                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-semibold border ${voteStyle}`}>
                                          採決: {utt.voteRecord === '賛成' ? '🟢 賛成' : utt.voteRecord === '反対' ? '🔴 反対' : utt.voteRecord === '棄権' ? '⚪ 棄権' : '🟡 未採決(審議中)'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-200 text-xs font-normal leading-relaxed">
                                      💬「{utt.summaryQuote}」
                                    </div>
                                  </div>
                                 </div>

                                 {/* 下段: 発言単位の市民リアクションバー (👍 賛成 / ⚠️ 気になる / 💡 参考 / 💬 理由・意見) */}
                                 <div className="pt-2 border-t border-slate-900/80 space-y-2">
                                   {(() => {
                                     const defaultCounts = {
                                       agree: utt.agreeCount ?? 42,
                                       concern: utt.concernCount ?? 8,
                                       helpful: utt.helpfulCount ?? 15,
                                     };
                                     const counts = utteranceCounts[itemKey] || defaultCounts;
                                     const uttUserVote = utteranceVotes[itemKey];
                                     const isCommentOpen = openUtteranceComments[itemKey];
                                     const userComments = utteranceCommentsList[itemKey] || [];
                                     const initialComments = utt.citizenComments || [];
                                     const allComments = [...initialComments, ...userComments];

                                     return (
                                       <div className="space-y-2">
                                         <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                                           <div className="flex items-center gap-1.5 flex-wrap">
                                             <span className="text-[10px] text-slate-400 font-medium shrink-0">この発言への反応:</span>

                                             <button
                                               onClick={() => handleUtteranceVote(itemKey, utt.speakerName, 'agree', defaultCounts)}
                                               className={`px-2 py-0.8 rounded-lg font-semibold border flex items-center gap-1 transition-all ${
                                                 uttUserVote === 'agree'
                                                   ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                                   : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                                               }`}
                                             >
                                               <span>👍 賛成</span>
                                               <span className="text-[10px] opacity-90 font-mono">({counts.agree})</span>
                                             </button>

                                             <button
                                               onClick={() => handleUtteranceVote(itemKey, utt.speakerName, 'concern', defaultCounts)}
                                               className={`px-2 py-0.8 rounded-lg font-semibold border flex items-center gap-1 transition-all ${
                                                 uttUserVote === 'concern'
                                                   ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                                                   : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                                               }`}
                                             >
                                               <span>⚠️ 気になる</span>
                                               <span className="text-[10px] opacity-90 font-mono">({counts.concern})</span>
                                             </button>

                                             <button
                                               onClick={() => handleUtteranceVote(itemKey, utt.speakerName, 'helpful', defaultCounts)}
                                               className={`px-2 py-0.8 rounded-lg font-semibold border flex items-center gap-1 transition-all ${
                                                 uttUserVote === 'helpful'
                                                   ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                                                   : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                                               }`}
                                             >
                                               <span>💡 参考</span>
                                               <span className="text-[10px] opacity-90 font-mono">({counts.helpful})</span>
                                             </button>

                                             <button
                                               onClick={() => toggleUtteranceCommentBox(itemKey)}
                                               className="px-2 py-0.8 rounded-lg font-semibold border bg-slate-900 hover:bg-slate-800 text-emerald-400 border-emerald-900/60 flex items-center gap-1 transition-colors"
                                             >
                                               <MessageSquare className="w-3 h-3" />
                                               <span>理由・意見</span>
                                             </button>
                                           </div>

                                           <button
                                             onClick={() => toggleSpeakerExpand(itemKey)}
                                             className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors py-0.5 px-2 rounded bg-slate-900 border border-slate-800 shrink-0"
                                           >
                                             <span>{isExpanded ? '原文抜粋をたたむ ▴' : '発言の要旨・原文抜粋をみる ▾'}</span>
                                           </button>
                                         </div>

                                         {isCommentOpen && (
                                           <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-2 animate-fade-in">
                                             <div className="flex gap-2">
                                               <input
                                                 type="text"
                                                 value={utteranceCommentInputs[itemKey] || ''}
                                                 onChange={(e) => setUtteranceCommentInputs((prev) => ({ ...prev, [itemKey]: e.target.value }))}
                                                 onKeyDown={(e) => e.key === 'Enter' && handleAddUtteranceComment(itemKey, utt.speakerName)}
                                                 placeholder={`「${utt.speakerName}議員の発言」への匿名理由・意見（例: 財源の説明をもっと開示してほしい）`}
                                                 className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                               />
                                               <button
                                                 onClick={() => handleAddUtteranceComment(itemKey, utt.speakerName)}
                                                 className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shrink-0 transition-colors"
                                               >
                                                 送信 (EBPMへ反映)
                                               </button>
                                             </div>

                                             {allComments.length > 0 && (
                                               <div className="space-y-1 pt-1">
                                                 <div className="text-[10px] text-slate-400 font-semibold">集計された市民の理由・コメント:</div>
                                                 {allComments.map((c, cIdx) => (
                                                   <div key={cIdx} className="bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg text-xs flex items-start gap-1.5">
                                                     <span className="text-emerald-400 font-bold shrink-0">💬 {c.user}:</span>
                                                     <span className="text-slate-200 font-normal leading-relaxed">{c.text}</span>
                                                   </div>
                                                 ))}
                                               </div>
                                             )}
                                           </div>
                                         )}
                                       </div>
                                     );
                                   })()}
                                 </div>

                                  {isExpanded && (
                                    <div className="w-full mt-2.5 space-y-2 text-xs bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-slate-300 animate-fade-in">
                                      <div>
                                        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">💡 発言の要旨詳細</div>
                                        <div className="text-slate-200 leading-relaxed font-normal">{utt.fullSummary || utt.summaryQuote}</div>
                                      </div>

                                      <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">💬 公式会議録 原文抜粋</div>
                                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-[11.5px] italic text-slate-300 leading-relaxed">
                                          {utt.sourceExcerpt || `「${utt.summaryQuote}」`}
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1.5 border-t border-slate-800/60 flex-wrap gap-2">
                                        <div>
                                          📍 審議会議: <span className="text-slate-300 font-medium">{utt.meetingName || '令和8年 第1回定例会 本会議・委員会'}</span>
                                        </div>
                                        <a
                                          href={utt.sourceUrl || msg.sourceUrl || 'https://catalog.data.metro.tokyo.lg.jp/'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                                        >
                                          <span>公式議事録の原典を確認 ↗</span>
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>

                        <p className="text-[10px] text-slate-400 font-normal pt-0.5">
                          ※各発言者の右下ボタンをタップすると、公式会議録の原文抜粋および詳細な答弁内容を無制限に展開して閲覧できます。
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
