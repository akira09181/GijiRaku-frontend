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
import { incrementEbpmReactionCount, decrementEbpmReactionCount } from '../utils/ebpmStore';

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
  readonly questionType?: string;
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
  readonly sourceVerified?: boolean;
  readonly aiChainSteps?: readonly AiChainStep[];
}

interface LineChatModalProps {
  readonly assembly: Assembly;
  readonly initialTheme?: string;
  readonly onClose: () => void;
  readonly onOpenDashboard?: () => void;
}

type ReactionType = 'agree' | 'concern' | 'helpful';

interface ReactionCounts {
  readonly agree: number;
  readonly concern: number;
  readonly helpful: number;
}

interface ReactionStateResponse {
  readonly status: 'success';
  readonly statement_id: string;
  readonly previous_reaction_type: ReactionType | null;
  readonly reaction_type: ReactionType | null;
  readonly changed: boolean;
  readonly counts: ReactionCounts;
}

interface PersistedReactionState {
  readonly statement_id: string;
  readonly reaction_type: ReactionType | null;
  readonly counts: ReactionCounts;
}

interface AssemblyRecordStatement {
  readonly statement_id: string;
  readonly speaker_name: string;
  readonly speaker_role: string;
  readonly party_name?: string;
  readonly committee_name?: string;
  readonly stance_label: string;
  readonly vote_record?: string;
  readonly summary_quote: string;
  readonly full_summary?: string;
  readonly source_excerpt?: string;
  readonly question_type?: string;
  readonly avatar_color?: string;
}

interface AssemblyRecord {
  readonly discussion_id: string;
  readonly meeting_date: string;
  readonly meeting_name: string;
  readonly source_url: string;
  readonly what_changes: string;
  readonly target_audience: string;
  readonly current_stage: string;
  readonly budget_info: string;
  readonly original_quote: string;
  readonly statements: readonly AssemblyRecordStatement[];
}

interface AssemblyRecordsResponse {
  readonly status: 'success';
  readonly records: readonly AssemblyRecord[];
}

const ANONYMOUS_USER_STORAGE_KEY = 'gijiraku_anonymous_user_id';
const TOKYO_VERIFIED_MINUTES_URL = 'https://www.gikai.metro.tokyo.lg.jp/record/proceedings/2024-2/03-07.html';
const VERIFIED_ASSEMBLY_IDS = new Set([
  'tokyo-metropolitan',
  'shinjuku-ward',
  'machida-city',
  'shinagawa-ward',
  'shibuya-ward',
  'hachioji-city',
]);

const VERIFIED_ASSEMBLY_RECORDS: Readonly<Record<string, readonly SpeakerUtterance[]>> = {
  'shinjuku-ward': [
    {
      id: 'shinjuku-yamaguchi-2024-06-12-young-carer',
      speakerName: '山口 かおる',
      speakerRole: '新宿区議会議員',
      partyName: '立憲民主党・無所属クラブ',
      committeeName: '本会議',
      stanceLabel: '課題提起',
      summaryQuote: 'ヤングケアラーへの理解を広げ、本人が相談・支援につながりやすい体制を整えるよう求めました。',
      fullSummary: '家事や家族の世話を日常的に担う子どもが孤立しないよう、周知、早期把握、相談支援を一体で進める必要性を質問しました。',
      sourceExcerpt: '「ヤングケアラーの支援について」',
      meetingName: '令和6年第2回新宿区議会定例会（第1日）',
      meetingDate: '2024/6/12',
      questionType: '代表質問',
      sourceUrl: 'https://ssp.kaigiroku.net/tenant/shinjuku/SpMinuteView.html?council_id=3005&schedule_id=2',
      avatarColor: 'sky',
      agreeCount: 0,
      concernCount: 0,
      helpfulCount: 0,
    },
    {
      id: 'shinjuku-yoshizumi-2024-06-12-young-carer',
      speakerName: '吉住 健一',
      speakerRole: '新宿区長',
      partyName: '行政執行部',
      committeeName: '本会議・区長答弁',
      stanceLabel: '推進',
      summaryQuote: '関係機関が連携し、ヤングケアラーを早期に把握して必要な支援へつなげる取組を進めると答弁しました。',
      fullSummary: '学校や福祉部門などが子どもの状況を把握し、相談先の周知と関係機関の連携を通じて、家庭に応じた支援へつなぐ方針を示しました。',
      sourceExcerpt: '「ヤングケアラーの支援についてのお尋ねです。」',
      meetingName: '令和6年第2回新宿区議会定例会（第1日）',
      meetingDate: '2024/6/12',
      questionType: '区長答弁',
      sourceUrl: 'https://ssp.kaigiroku.net/tenant/shinjuku/SpMinuteView.html?council_id=3005&schedule_id=2',
      avatarColor: 'emerald',
      agreeCount: 0,
      concernCount: 0,
      helpfulCount: 0,
    },
  ],
  'machida-city': [
    {
      id: 'machida-imamura-2024-06-07-employment',
      speakerName: '今村 るか',
      speakerRole: '町田市議会議員',
      partyName: 'まちだ市民クラブ',
      committeeName: '本会議',
      stanceLabel: '課題提起',
      summaryQuote: '市内の雇用・労働環境をどう捉え、事業者と働く人をどのように支援するのか質問しました。',
      fullSummary: '人手不足や就業環境の変化を踏まえ、市内企業への支援、就労支援、市職員の人材確保を一体的に考えるよう求めました。',
      sourceExcerpt: '「町田市内の雇用・労働環境などについて」',
      meetingName: '令和6年6月定例会（第2回）本会議 第12号',
      meetingDate: '2024/6/7',
      questionType: '一般質問',
      sourceUrl: 'https://www.gikai-machida.jp/voices2/minutes.html?FINO=3474',
      avatarColor: 'sky',
      agreeCount: 0,
      concernCount: 0,
      helpfulCount: 0,
    },
    {
      id: 'machida-karasawa-2024-06-07-employment',
      speakerName: '唐澤 祐一',
      speakerRole: '町田市経済観光部長',
      partyName: '行政執行部',
      committeeName: '本会議・答弁',
      stanceLabel: '推進',
      summaryQuote: '建設業と福祉職で人手不足が特に顕著であり、関係機関と連携して雇用支援に取り組むと答弁しました。',
      fullSummary: '市内の有効求人倍率や業種別の状況を示し、ハローワーク町田や町田商工会議所と連携して事業者・求職者を支援する方針を説明しました。',
      sourceExcerpt: '「特に建設業と福祉職の人手不足は顕著」',
      meetingName: '令和6年6月定例会（第2回）本会議 第12号',
      meetingDate: '2024/6/7',
      questionType: '部長答弁',
      sourceUrl: 'https://www.gikai-machida.jp/voices2/minutes.html?FINO=3474',
      avatarColor: 'emerald',
      agreeCount: 0,
      concernCount: 0,
      helpfulCount: 0,
    },
  ],
  'shinagawa-ward': [
    {
      id: 'shinagawa-nodate-2024-06-27-shelter',
      speakerName: 'のだて 稔史',
      speakerRole: '品川区議会議員',
      partyName: '日本共産党',
      committeeName: '本会議',
      stanceLabel: '課題提起',
      summaryQuote: '能登半島地震の教訓を踏まえ、災害関連死を防ぐため避難所のトイレ・食事・寝床を改善するよう求めました。',
      fullSummary: '発災後の生活環境が健康悪化につながらないよう、携帯トイレ、温かい食事、間仕切り、ベッドなどの備えを強化する必要性を質問しました。',
      sourceExcerpt: '「災害関連死を出さない避難所環境の改善を」',
      meetingName: '令和6年第2回品川区議会定例会（第1日）',
      meetingDate: '2024/6/27',
      questionType: '一般質問',
      sourceUrl: 'https://kaigiroku.city.shinagawa.tokyo.jp/index.php/275892?Template=document&Id=6737',
      avatarColor: 'sky',
      agreeCount: 0,
      concernCount: 0,
      helpfulCount: 0,
    },
    {
      id: 'shinagawa-takizawa-2024-06-27-shelter',
      speakerName: '滝澤 災害対策担当部長',
      speakerRole: '品川区災害対策担当部長',
      partyName: '行政執行部',
      committeeName: '本会議・答弁',
      stanceLabel: '推進',
      summaryQuote: '携帯トイレの全区民への配布や避難所備蓄、段ボールベッドの供給協定などを進めていると答弁しました。',
      fullSummary: '避難所のトイレ対策に加え、温かい食事、間仕切り、エアマットを備蓄し、段ボールベッドを調達できる協定を結んでいると説明しました。',
      sourceExcerpt: '「携帯トイレの全区民への配布」',
      meetingName: '令和6年第2回品川区議会定例会（第1日）',
      meetingDate: '2024/6/27',
      questionType: '部長答弁',
      sourceUrl: 'https://kaigiroku.city.shinagawa.tokyo.jp/index.php/275892?Template=document&Id=6737',
      avatarColor: 'emerald',
      agreeCount: 0,
      concernCount: 0,
      helpfulCount: 0,
    },
  ],
  'shibuya-ward': [
    {
      id: 'shibuya-matsumoto-2024-06-03-street-drinking',
      speakerName: '松本 翔',
      speakerRole: '渋谷区議会議員',
      partyName: '渋谷区議会自由民主党議員団',
      committeeName: '本会議',
      stanceLabel: '課題提起',
      summaryQuote: '渋谷駅周辺の迷惑路上飲酒が、ごみや騒音、区民の安全・安心に与える影響と対策を質問しました。',
      fullSummary: '来街者や訪日客が増える中で、路上飲酒によるごみ、騒音、マナー違反を抑え、駅周辺の安全を守る具体策を求めました。',
      sourceExcerpt: '「渋谷駅周辺の迷惑路上飲酒対策について」',
      meetingName: '令和6年第2回渋谷区議会定例会（第1日）',
      meetingDate: '2024/6/3',
      questionType: '代表質問',
      sourceUrl: 'https://ssp.kaigiroku.net/tenant/shibuya/SpMinuteView.html?council_id=2344&schedule_id=2',
      avatarColor: 'sky',
      agreeCount: 0,
      concernCount: 0,
      helpfulCount: 0,
    },
    {
      id: 'shibuya-hasebe-2024-06-03-street-drinking',
      speakerName: '長谷部 健',
      speakerRole: '渋谷区長',
      partyName: '行政執行部',
      committeeName: '本会議・区長答弁',
      stanceLabel: '推進',
      summaryQuote: '条例改正に加え、施行前の周知と施行後のパトロールを組み合わせて対策すると答弁しました。',
      fullSummary: '路上飲酒者の増加に伴うごみや騒音を課題として認識し、条例による規制、広報、パトロールを通じて駅周辺環境の改善を図る方針を示しました。',
      sourceExcerpt: '「条例施行前の広報及び条例施行後のパトロール」',
      meetingName: '令和6年第2回渋谷区議会定例会（第1日）',
      meetingDate: '2024/6/3',
      questionType: '区長答弁',
      sourceUrl: 'https://ssp.kaigiroku.net/tenant/shibuya/SpMinuteView.html?council_id=2344&schedule_id=2',
      avatarColor: 'emerald',
      agreeCount: 0,
      concernCount: 0,
      helpfulCount: 0,
    },
  ],
  'hachioji-city': [
    {
      id: 'hachioji-muramatsu-2024-06-11-population',
      speakerName: '村松 徹',
      speakerRole: '八王子市議会議員',
      partyName: '市議会公明党',
      committeeName: '本会議',
      stanceLabel: '課題提起',
      summaryQuote: '人口戦略会議の持続可能性分析レポートを市がどう評価し、人口減少対策に生かすのか質問しました。',
      fullSummary: '若年女性人口の変化などを用いた自治体分類について、市の受け止めと出生数・人口減少への今後の対応を求めました。',
      sourceExcerpt: '「地方自治体『持続可能性』分析レポートについて」',
      meetingName: '令和6年第2回八王子市議会定例会（第2日目）',
      meetingDate: '2024/6/11',
      questionType: '一般質問',
      sourceUrl: 'https://www.city.hachioji.tokyo.dbsr.jp/index.php/549802?Id=5826&Template=document',
      avatarColor: 'sky',
      agreeCount: 0,
      concernCount: 0,
      helpfulCount: 0,
    },
    {
      id: 'hachioji-imagawa-2024-06-11-population',
      speakerName: '今川 邦洋',
      speakerRole: '八王子市都市戦略部長',
      partyName: '行政執行部',
      committeeName: '本会議・答弁',
      stanceLabel: '課題提起',
      summaryQuote: '八王子市は自然減対策が必要な自治体に分類され、出生数の減少が課題だと答弁しました。',
      fullSummary: '若年女性人口の移動仮定による減少率は17.7％である一方、封鎖人口での減少率が高く、人口流出より自然減への対策が重要だと説明しました。',
      sourceExcerpt: '「人口特性別の9分類では自然減対策が必要な自治体」',
      meetingName: '令和6年第2回八王子市議会定例会（第2日目）',
      meetingDate: '2024/6/11',
      questionType: '部長答弁',
      sourceUrl: 'https://www.city.hachioji.tokyo.dbsr.jp/index.php/549802?Id=5826&Template=document',
      avatarColor: 'emerald',
      agreeCount: 0,
      concernCount: 0,
      helpfulCount: 0,
    },
  ],
};

function getTokyoThemeEvidence(theme: string) {
  switch (theme) {
    case '子育て支援・給食費無償化':
      return {
        summary: '子供政策や教育施策では、実施件数だけでなく、施策前後の意欲や行動の変化を成果として測る必要性が提起されました。',
        audience: '都内の子供・生徒、保護者、教育施策を設計する行政部門',
        excerpt: '「その前後で意欲の伸長について評価をしたり」',
      };
    case '行政DX・スマホ手続き':
      return {
        summary: '教育ダッシュボードについて、研究校の成果公開と国内外の最新事例を踏まえたデータ活用が求められました。',
        audience: '都立学校の児童生徒・教員、教育データを扱う行政部門',
        excerpt: '「教育データの利活用に関する最新事例を収集し」',
      };
    case '都市再開発・交通インフラ':
      return {
        summary: '地域公共交通を維持する基盤として、バス運行データの共有・オープン化を促進する必要性が議論されました。',
        audience: 'バスなど地域公共交通を利用する都民と区市町村',
        excerpt: '「バスの運行データのオープン化をより一層促進し」',
      };
    case '医療体制・休日診療':
      return {
        summary: '緊急避妊を必要とする若者が、診療可能な医療機関の正確な情報へ速やかにアクセスできる仕組みが議論されました。',
        audience: '緊急避妊に関する情報・相談支援を必要とする若者',
        excerpt: '「早く、そして正確な情報を手に入れられる仕組みが必要です。」',
      };
    default:
      return {
        summary: '事業の設計段階から評価指標と測定方法を定め、データに基づいて成果を検証する考え方が議論されました。',
        audience: '東京都の政策・行政サービスを利用する都民と行政部門',
        excerpt: '「あらかじめ事業に評価を組み込む必要があります。」',
      };
  }
}

function getOrCreateAnonymousUserId(): string {
  const stored = localStorage.getItem(ANONYMOUS_USER_STORAGE_KEY);
  if (stored) return stored;
  const anonymousUserId = crypto.randomUUID();
  localStorage.setItem(ANONYMOUS_USER_STORAGE_KEY, anonymousUserId);
  return anonymousUserId;
}

function mapAssemblyRecordsToSpeakers(records: readonly AssemblyRecord[]): SpeakerUtterance[] {
  return records.flatMap((record) => record.statements.map((statement) => ({
    id: statement.statement_id,
    speakerName: statement.speaker_name,
    speakerRole: statement.speaker_role,
    partyName: statement.party_name,
    committeeName: statement.committee_name,
    stanceLabel: statement.stance_label,
    voteRecord: statement.vote_record,
    summaryQuote: statement.summary_quote,
    fullSummary: statement.full_summary,
    sourceExcerpt: statement.source_excerpt,
    meetingName: record.meeting_name,
    meetingDate: record.meeting_date.replaceAll('-', '/'),
    questionType: statement.question_type,
    sourceUrl: record.source_url,
    avatarColor: statement.avatar_color,
    agreeCount: 0,
    concernCount: 0,
    helpfulCount: 0,
  })));
}

/**
 * LINE風 議事録対話モーダル
 */
const getDynamicSpeakerUtterances = (assembly: Assembly, theme?: string): SpeakerUtterance[] => {
  const isTokyo = assembly.id === 'tokyo-metropolitan';
  const mayorName = isTokyo ? '小池 百合子' : assembly.mayorName || '首長';
  const mayorRole = isTokyo ? '東京都知事' : assembly.type === 'ward' ? '区長' : assembly.type === 'city' ? '市長' : '首長';
  const hotTopic = theme || assembly.hotTopic;
  const verifiedRecord = VERIFIED_ASSEMBLY_RECORDS[assembly.id];

  if (verifiedRecord) {
    return [...verifiedRecord];
  }

  if (isTokyo) {
    return [
      {
        id: 'tokyo-fukushima-2024-06-05-ebpm',
        speakerName: '福島 りえこ',
        speakerRole: '東京都議会議員',
        partyName: '都民ファーストの会',
        committeeName: '本会議',
        stanceLabel: '課題提起',
        summaryQuote: '事業の成果を正しく測るため、設計段階から評価指標と測定方法を組み込む必要があると提案しました。',
        fullSummary: '事業の執行状況だけでなく成果を評価するため、統計的なデータ分析、事前の指標設計、実施前後のデータ取得を政策評価に組み込むよう求めました。',
        sourceExcerpt: '「あらかじめ事業に評価を組み込む必要があります。」',
        meetingName: '令和6年第2回定例会 東京都議会会議録第9号',
        meetingDate: '2024/6/5',
        questionType: '一般質問',
        sourceUrl: TOKYO_VERIFIED_MINUTES_URL,
        avatarColor: 'sky',
        agreeCount: 0,
        concernCount: 0,
        helpfulCount: 0,
      },
      {
        id: 'tokyo-koike-2024-06-05-ebpm',
        speakerName: '小池 百合子',
        speakerRole: '東京都知事',
        partyName: '行政執行部',
        committeeName: '本会議・知事答弁',
        stanceLabel: '推進',
        summaryQuote: '成果重視の評価や外部有識者・データ分析の活用を進め、都民サービス向上と財源確保につなげると答弁しました。',
        fullSummary: '全事業への終期設定、外部有識者の知見、データ分析を活用した成果重視の評価を導入し、評価制度を継続的に見直す方針を示しました。',
        sourceExcerpt: '「評価制度の不断の見直しで、都民のQOL向上と着実な財源確保につなげてまいります。」',
        meetingName: '令和6年第2回定例会 東京都議会会議録第9号',
        meetingDate: '2024/6/5',
        questionType: '知事答弁',
        sourceUrl: TOKYO_VERIFIED_MINUTES_URL,
        avatarColor: 'emerald',
        agreeCount: 0,
        concernCount: 0,
        helpfulCount: 0,
      },
    ];
  }

  if (assembly.id === 'shinagawa-ward') {
    return [
      {
        id: 'shinagawa-morisawa-01',
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
        agreeCount: 78,
        concernCount: 6,
        helpfulCount: 34,
        citizenComments: [
          { user: '品川区民 (30代保護者)', text: '給食費とおむつのW支援は本当に助かります！継続を強く希望します。' },
        ],
      },
      {
        id: 'shinagawa-ito-02',
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
        agreeCount: 52,
        concernCount: 3,
        helpfulCount: 29,
        citizenComments: [
          { user: '共働きパパAさん', text: '病児保育のLINE予約は絶対必要。朝電話がつながらない問題を解消してほしい。' },
        ],
      },
      {
        id: 'shinagawa-matsumoto-03',
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
        agreeCount: 31,
        concernCount: 44,
        helpfulCount: 58,
        citizenComments: [
          { user: '区民Bさん', text: 'ただ無償化するだけでなく、将来の区財政が圧迫されないかの懸念チェックは大切。' },
        ],
      },
      {
        id: 'shinagawa-tanaka-04',
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
        agreeCount: 63,
        concernCount: 9,
        helpfulCount: 21,
        citizenComments: [
          { user: '私立小通学の保護者', text: '公立私立を問わず品川区民の子ども全員を平等に支援する視点に共感します。' },
        ],
      },
    ];
  }

  if (assembly.id === 'machida-city') {
    return [
      {
        id: 'machida-ishizaka-01',
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
        agreeCount: 94,
        concernCount: 18,
        helpfulCount: 41,
        citizenComments: [
          { user: '町田市民 (20代ママ)', text: '電子ポイントでおむつが買えるのは助かる！モノレール延伸も期待。' },
        ],
      },
      {
        id: 'machida-takahashi-02',
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
        agreeCount: 45,
        concernCount: 7,
        helpfulCount: 23,
      },
      {
        id: 'machida-kobayashi-03',
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
        agreeCount: 22,
        concernCount: 36,
        helpfulCount: 49,
      },
      {
        id: 'machida-watanabe-04',
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
        agreeCount: 38,
        concernCount: 14,
        helpfulCount: 32,
      },
    ];
  }

  if (assembly.id === 'shinjuku-ward') {
    return [
      {
        id: 'shinjuku-yoshizumi-01',
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
        agreeCount: 112,
        concernCount: 15,
        helpfulCount: 67,
      },
      {
        id: 'shinjuku-nomoto-02',
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
        agreeCount: 49,
        concernCount: 4,
        helpfulCount: 28,
      },
      {
        id: 'shinjuku-kuwabara-03',
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
        agreeCount: 58,
        concernCount: 12,
        helpfulCount: 73,
      },
    ];
  }

  if (assembly.id === 'shibuya-ward') {
    return [
      {
        id: 'shibuya-hasebe-01',
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
        agreeCount: 135,
        concernCount: 29,
        helpfulCount: 84,
      },
      {
        id: 'shibuya-kamizono-02',
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
        agreeCount: 71,
        concernCount: 8,
        helpfulCount: 46,
      },
      {
        id: 'shibuya-maruyama-03',
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
        agreeCount: 34,
        concernCount: 41,
        helpfulCount: 52,
      },
    ];
  }

  const prefix = assembly.id || 'tokyo';

  return [
    {
      id: `${prefix}-mayor-01`,
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
      agreeCount: 85,
      concernCount: 12,
      helpfulCount: 48,
    },
    {
      id: `${prefix}-yamada-02`,
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
      agreeCount: 28,
      concernCount: 35,
      helpfulCount: 61,
    },
    {
      id: `${prefix}-sato-03`,
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
      agreeCount: 56,
      concernCount: 14,
      helpfulCount: 29,
    },
    {
      id: `${prefix}-suzuki-04`,
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
      agreeCount: 67,
      concernCount: 9,
    },
  ];

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
  onOpenDashboard,
}: LineChatModalProps) {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  const [expandedChains, setExpandedChains] = useState<Record<string, boolean>>({});
  const [expandedSpeakerKeys, setExpandedSpeakerKeys] = useState<Record<string, boolean>>({});
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'agree' | 'concern'>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [ebpmToast, setEbpmToast] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const anonymousUserIdRef = useRef('');
  const reactionRequestsInFlight = useRef<Set<string>>(new Set());

  const toggleSpeakerExpand = (key: string) => {
    setExpandedSpeakerKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [utteranceVotes, setUtteranceVotes] = useState<Record<string, ReactionType | null>>({});

  const [utteranceCounts, setUtteranceCounts] = useState<Record<string, ReactionCounts>>({});

  const [openUtteranceComments, setOpenUtteranceComments] = useState<Record<string, boolean>>({});
  const [utteranceCommentInputs, setUtteranceCommentInputs] = useState<Record<string, string>>({});
  const [utteranceCommentsList, setUtteranceCommentsList] = useState<Record<string, Array<{ user: string; text: string }>>>({});

  const getAnonymousUserId = () => {
    if (!anonymousUserIdRef.current) {
      anonymousUserIdRef.current = getOrCreateAnonymousUserId();
    }
    return anonymousUserIdRef.current;
  };

  const putReactionState = async (
    statementId: string,
    reactionType: ReactionType | null,
    baseCounts: ReactionCounts,
  ): Promise<ReactionStateResponse> => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${apiBase}/api/reactions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discussion_id: assembly.id,
        statement_id: statementId,
        reaction_type: reactionType,
        anonymous_user_id: getAnonymousUserId(),
        base_counts: baseCounts,
      }),
    });
    if (!response.ok) throw new Error(`Reaction API failed: ${response.status}`);
    return response.json();
  };

  const loadPersistedReactions = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const query = new URLSearchParams({
        discussion_id: assembly.id,
        anonymous_user_id: getAnonymousUserId(),
      });
      const response = await fetch(`${apiBase}/api/reactions?${query.toString()}`);
      if (!response.ok) return;
      const payload = await response.json() as { data?: PersistedReactionState[] };
      const persisted = payload.data || [];
      const topicVotes: Record<string, 'agree' | 'concern'> = {};
      const statementVotes: Record<string, ReactionType | null> = {};
      const statementCounts: Record<string, ReactionCounts> = {};
      const topicStates = new Map<string, PersistedReactionState>();

      persisted.forEach((state) => {
        if (state.statement_id.includes('-speaker-')) {
          statementVotes[state.statement_id] = state.reaction_type;
          statementCounts[state.statement_id] = state.counts;
        } else {
          topicStates.set(state.statement_id, state);
          if (state.reaction_type === 'agree' || state.reaction_type === 'concern') {
            topicVotes[state.statement_id] = state.reaction_type;
          }
        }
      });

      setUserVotes(topicVotes);
      setUtteranceVotes(statementVotes);
      setUtteranceCounts(statementCounts);
      setMessages((prev) => prev.map((message) => {
        const persistedState = topicStates.get(message.id);
        if (!persistedState) return message;
        return {
          ...message,
          agreeCount: persistedState.counts.agree,
          disagreeCount: persistedState.counts.concern,
        };
      }));

      try {
        localStorage.setItem('gijiraku_voted_statements_v2', JSON.stringify(statementVotes));
        localStorage.setItem('gijiraku_statement_counts_v2', JSON.stringify(statementCounts));
      } catch {
        // ignore
      }
    } catch {
      // Keep the existing screen unchanged when the API is unavailable.
    }
  };

  const handleUtteranceVote = async (
    uttKey: string,
    speakerName: string,
    type: ReactionType,
    defaultCounts: ReactionCounts
  ) => {
    const currentVote = utteranceVotes[uttKey] || null;
    const nextVote: ReactionType | null = currentVote === type ? null : type;
    const requestKey = `${assembly.id}:${uttKey}`;
    if (reactionRequestsInFlight.current.has(requestKey)) return;
    reactionRequestsInFlight.current.add(requestKey);

    try {
      const result = await putReactionState(uttKey, nextVote, defaultCounts);
      setUtteranceVotes((prev) => {
        const nextVotes = { ...prev, [uttKey]: result.reaction_type };
        try {
          localStorage.setItem('gijiraku_voted_statements_v2', JSON.stringify(nextVotes));
        } catch {
          // ignore
        }
        return nextVotes;
      });
      setUtteranceCounts((prev) => {
        const nextCounts = { ...prev, [uttKey]: result.counts };
        try {
          localStorage.setItem('gijiraku_statement_counts_v2', JSON.stringify(nextCounts));
        } catch {
          // ignore
        }
        return nextCounts;
      });

      const typeLabel = type === 'agree' ? '👍 賛成' : type === 'concern' ? '⚠️ 気になる' : '💡 参考';
      if (result.changed && result.reaction_type === null) {
        decrementEbpmReactionCount();
        setEbpmToast(`ℹ️ 「${speakerName}」議員の発言へのリアクションを取り消しました（集計: ${result.counts[type]}件）`);
      } else if (result.changed && result.previous_reaction_type !== null) {
        setEbpmToast(`👍 「${speakerName}」議員の発言へのリアクションを【${typeLabel}】に変更しました！（集計: ${result.counts[type]}件）`);
      } else if (result.changed) {
        incrementEbpmReactionCount();
        triggerEbpmFeedbackNotification(speakerName, typeLabel, result.counts[type]);
      }
      setTimeout(() => setEbpmToast(null), 4000);
    } catch {
      // Keep the existing screen unchanged when the API is unavailable.
    } finally {
      reactionRequestsInFlight.current.delete(requestKey);
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

    setEbpmToast(`💬 「${speakerName}」議員の発言にご意見を届けました！`);
    setTimeout(() => setEbpmToast(null), 4500);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
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
    { step_number: 1, title: '公式データ取得・連携', detail: '各議会の公式サイトより該当する会議録本文を取得', status: 'completed' },
    { step_number: 2, title: '発言・テーマ構造化', detail: '会議録より質問・答弁・関連施策情報を特定・分類', status: 'completed' },
    { step_number: 3, title: '平易な要約・解説作成', detail: '専門用語や行政条文をわかりやすい対話形式に整理', status: 'completed' },
    { step_number: 4, title: '原文照合・ファクトチェック', detail: '公式会議録の原文との整合性を照合済み', status: 'completed' },
  ];

  const DEMO_CHAIN_STEPS: AiChainStep[] = [
    { step_number: 1, title: '公開情報の対象確認', detail: '自治体の公開会議録システムをデータ取得対象として登録', status: 'completed' },
    { step_number: 2, title: 'デモ発言生成', detail: '想定テーマに基づく画面体験用のデモ発言を生成', status: 'completed' },
    { step_number: 3, title: '平易な要約・解説作成', detail: '専門用語をわかりやすい対話形式に整理', status: 'completed' },
    { step_number: 4, title: '個別原文照合', detail: 'このデモ発言は公式会議録との個別照合対象外', status: 'completed' },
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
    const isVerifiedAssembly = VERIFIED_ASSEMBLY_IDS.has(assembly.id);
    const dynamicSpeakers = getDynamicSpeakerUtterances(assembly);
    const primaryUtterance = dynamicSpeakers[0];
    const secondaryUtterance = dynamicSpeakers[1];
    const verifiedSourceUrl = primaryUtterance?.sourceUrl || assembly.sourceUrl;
    const verifiedMeeting = primaryUtterance?.meetingName || '公式会議録';
    const verifiedDate = primaryUtterance?.meetingDate || '会議録記載日';
    const chainSteps = isVerifiedAssembly ? DEFAULT_CHAIN_STEPS : DEMO_CHAIN_STEPS;

    const initialMsgs: Message[] = [
      {
        id: 'msg-1',
        sender: 'assistant',
        plainText: `こんにちは！${assembly.name}の会議録データをわかりやすく構造化してお届けします。\n知りたいテーマや疑問があればご質問ください。`,
        speaker: `${assembly.name} 議会案内`,
        speakerTitle: isVerifiedAssembly ? '公式会議録・原文照合済み' : '画面体験用デモデータ',
        date: isVerifiedAssembly ? `${verifiedDate} ${verifiedMeeting}` : 'デモデータ',
        timestamp: '10:00',
        sourceUrl: isVerifiedAssembly ? verifiedSourceUrl : assembly.sourceUrl,
        sourceVerified: isVerifiedAssembly,
        aiChainSteps: chainSteps,
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        plainText: isTokyo
          ? '東京都議会では、事業の設計段階から評価指標と測定方法を組み込み、成果をデータで検証するEBPMの進め方が議論されました。'
          : isVerifiedAssembly
            ? primaryUtterance?.fullSummary || primaryUtterance?.summaryQuote || assembly.hotTopic
          : `${assembly.name}における「${assembly.hotTopic}」について支援策が進んでいます。`,
        structuredSummary: {
          whatChanges: isTokyo
            ? '政策を実施してから評価するだけでなく、設計段階から指標・測定方法・データ取得を組み込む考え方が示されました。'
            : isVerifiedAssembly
              ? primaryUtterance?.summaryQuote || assembly.hotTopic
            : `${assembly.name}において「${assembly.hotTopic}」を推進し、区民・市民の生活負担を減らす案が検討されています。`,
          targetAudience: isTokyo
            ? '東京都の政策・行政サービスを利用する都民と、事業を設計・評価する行政部門'
            : isVerifiedAssembly
              ? `${assembly.name}の住民と関係する行政部門`
            : `${assembly.name}にお住まいの子育て世帯・ご家庭および関係住民の皆様`,
          currentStage: isVerifiedAssembly ? `${verifiedDate}の${verifiedMeeting}で質疑・答弁済み` : '画面体験用のデモシナリオ',
          budgetInfo: isTokyo
            ? '事業評価による財源確保と成果重視の評価制度について議論'
            : isVerifiedAssembly
              ? '公式会議録に記載された質疑・答弁を要約'
              : 'デモ値（個別原文との照合対象外）',
          nextStep: isTokyo
            ? '評価制度を継続的に見直し、都民サービス向上と財源確保につなげる方針'
            : isVerifiedAssembly
              ? '今後の行政対応・議会審議を継続確認'
              : '実データ接続後に個別検証',
        },
        timeline: isVerifiedAssembly
          ? [
              { date: verifiedDate, event: `${primaryUtterance?.speakerName || '議員'}が議会で質問`, status: 'completed' },
              { date: verifiedDate, event: `${secondaryUtterance?.speakerName || '行政執行部'}が答弁`, status: 'completed' },
            ]
          : [
              { date: 'デモ', event: '画面体験用シナリオ（公式会議録との個別照合前）', status: 'active' },
            ],
        policyArguments: isTokyo
          ? {
              supporting: [
                '政策目的に対応した成果指標を事前に設計できる',
                'データ分析を事業改善と財源確保につなげられる',
              ],
              concerns: [
                '複合要因を扱うため、統計的な分析設計が必要',
                '事業実施前から継続的にデータを取得する必要がある',
              ],
            }
          : isVerifiedAssembly
            ? {
                supporting: [primaryUtterance?.summaryQuote || '公式会議録に記載された提案・行政対応'],
                concerns: ['会議録に記載された課題と行政対応を継続確認'],
              }
            : {
              supporting: ['デモデータによる画面体験'],
              concerns: ['公式会議録との個別照合が必要'],
            },
        speakerUtterances: dynamicSpeakers,
        speaker: isTokyo ? '東京都議会 3分解説' : '議会定例会 3分解説',
        speakerTitle: isVerifiedAssembly ? '公式会議録・原文照合済み' : `${assembly.name} デモ分析`,
        date: isVerifiedAssembly ? verifiedMeeting : 'デモデータ',
        originalQuote: isTokyo
          ? '「あらかじめ事業に評価を組み込む必要があります。」'
          : isVerifiedAssembly
            ? primaryUtterance?.sourceExcerpt
          : `「${assembly.name}における本施策は、区民・市民の生活利便性向上と行政手続きの抜本的な効率化を目指し、令和8年度当初予算案に重点計上しております。」`,
        timestamp: '10:01',
        agreeCount: isVerifiedAssembly ? 0 : 42,
        disagreeCount: isVerifiedAssembly ? 0 : 3,
        sourceUrl: isVerifiedAssembly ? verifiedSourceUrl : assembly.sourceUrl,
        sourceVerified: isVerifiedAssembly,
        aiChainSteps: chainSteps,
      },
    ];

    if (initialTheme) {
      const themeSpeakers = getDynamicSpeakerUtterances(assembly, initialTheme);
      const tokyoEvidence = getTokyoThemeEvidence(initialTheme);
      initialMsgs.push({
        id: 'msg-theme',
        sender: 'user',
        plainText: `「${initialTheme}」について詳しく教えてください`,
        timestamp: '10:02',
      });
      initialMsgs.push({
        id: 'msg-theme-reply',
        sender: 'assistant',
        plainText: isTokyo
          ? `公式会議録から「${initialTheme}」に関連する発言を確認しました。${tokyoEvidence.summary}`
          : isVerifiedAssembly
            ? `公式会議録から「${initialTheme}」に関連する発言を確認しました。${primaryUtterance?.summaryQuote || ''}`
          : `「${initialTheme}」に関する手続きをスマホで完結できるよう改善する案が進んでいます。`,
        structuredSummary: {
          whatChanges: isTokyo
            ? tokyoEvidence.summary
            : isVerifiedAssembly
              ? primaryUtterance?.summaryQuote || initialTheme
              : `「${initialTheme}」に関する申請手続きをスマホ完結・ワンストップ化する案が進んでいます。`,
          targetAudience: isTokyo
            ? tokyoEvidence.audience
            : isVerifiedAssembly
              ? `${assembly.name}の住民と関係する行政部門`
              : `${assembly.name}にお住まいで対象手続きを行う区民・市民の皆様`,
          currentStage: isVerifiedAssembly ? `${verifiedDate}の${verifiedMeeting}で質疑・答弁済み` : '画面体験用のデモシナリオ',
          budgetInfo: isVerifiedAssembly ? '公式会議録に記載された質疑・答弁を要約' : 'デモ値（個別原文との照合対象外）',
          nextStep: isVerifiedAssembly ? '関連する行政対応・議会審議を継続確認' : '実データ接続後に個別検証',
        },
        timeline: isVerifiedAssembly
          ? [{ date: verifiedDate, event: `${verifiedMeeting}で質問・答弁`, status: 'completed' }]
          : [{ date: 'デモ', event: '画面体験用シナリオ（公式会議録との個別照合前）', status: 'active' }],
        policyArguments: isTokyo
          ? {
              supporting: ['公開データを使って政策課題を把握・評価できる'],
              concerns: ['施策ごとに適切な指標と検証方法を設計する必要がある'],
            }
          : isVerifiedAssembly
            ? {
                supporting: [primaryUtterance?.summaryQuote || '公式会議録に記載された提案・行政対応'],
                concerns: ['会議録に記載された課題と行政対応を継続確認'],
              }
            : {
                supporting: ['デモデータによる画面体験'],
                concerns: ['公式会議録との個別照合が必要'],
              },
        speakerUtterances: themeSpeakers,
        speaker: 'テーマ別要点解説',
        speakerTitle: isVerifiedAssembly ? `${assembly.name} 公式会議録分析` : `${assembly.name} デモ分析`,
        date: isVerifiedAssembly ? verifiedMeeting : 'デモデータ',
        originalQuote: isTokyo ? tokyoEvidence.excerpt : isVerifiedAssembly ? primaryUtterance?.sourceExcerpt : '画面体験用に生成したデモ発言です。',
        timestamp: '10:03',
        agreeCount: isVerifiedAssembly ? 0 : 28,
        disagreeCount: isVerifiedAssembly ? 0 : 1,
        sourceUrl: isVerifiedAssembly ? verifiedSourceUrl : assembly.sourceUrl,
        sourceVerified: isVerifiedAssembly,
        aiChainSteps: chainSteps,
      });
    }

    queueMicrotask(() => {
      setUserVotes({});
      setUtteranceVotes({});
      setUtteranceCounts({});
      setMessages(initialMsgs);
      void loadPersistedReactions();
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = 0;
      }
    });

    const controller = new AbortController();
    const loadAssemblyRecords = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const query = new URLSearchParams({ assembly_id: assembly.id, limit: '20' });
        const response = await fetch(`${apiBase}/api/assembly-records?${query.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const payload = await response.json() as AssemblyRecordsResponse;
        const records = payload.records || [];
        const latestRecord = records[0];
        if (!latestRecord) return;

        const apiSpeakers = mapAssemblyRecordsToSpeakers(records);
        const latestSpeakers = apiSpeakers.slice(0, latestRecord.statements.length);
        const latestDate = latestRecord.meeting_date.replaceAll('-', '/');
        const latestTimeline: TimelineItem[] = latestSpeakers.map((speaker) => ({
          date: latestDate,
          event: `${speaker.speakerName}が${speaker.questionType || '本会議'}で発言`,
          status: 'completed',
        }));

        setMessages((current) => current.map((message) => {
          if (message.id === 'msg-1') {
            return {
              ...message,
              date: `${latestDate} ${latestRecord.meeting_name}`,
              sourceUrl: latestRecord.source_url,
              sourceVerified: true,
            };
          }
          if (message.id !== 'msg-2' && message.id !== 'msg-theme-reply') return message;
          return {
            ...message,
            plainText: latestRecord.what_changes,
            structuredSummary: {
              whatChanges: latestRecord.what_changes,
              targetAudience: latestRecord.target_audience,
              currentStage: latestRecord.current_stage,
              budgetInfo: latestRecord.budget_info,
              nextStep: '今後の行政対応・議会審議を継続確認',
            },
            timeline: latestTimeline,
            policyArguments: {
              supporting: [latestSpeakers[0]?.summaryQuote || latestRecord.what_changes],
              concerns: ['会議録に記載された課題と行政対応を継続確認'],
            },
            speakerUtterances: apiSpeakers,
            date: latestRecord.meeting_name,
            originalQuote: latestRecord.original_quote,
            sourceUrl: latestRecord.source_url,
            sourceVerified: true,
          };
        }));
        void loadPersistedReactions();
      } catch {
        // API停止時は従来の埋め込み済み表示をそのまま維持する。
      }
    };
    void loadAssemblyRecords();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assembly, initialTheme]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // モーダルオープン時および自治体変更時は常に一番上（scrollTop = 0）にスクロール位置をリセット
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = 0;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [assembly]);

  // ユーザーが新しい質問を送信した時のみ、最新メッセージへスクロールダウン
  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const toggleQuote = (id: string) => {
    setExpandedQuotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChain = (id: string) => {
    setExpandedChains((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const triggerEbpmFeedbackNotification = (speakerName: string, typeStr: string, updatedCount: number) => {
    setEbpmToast(`👍 「${speakerName}」議員の発言に【${typeStr}】を届けました！（集計: ${updatedCount}件）`);
    setTimeout(() => {
      setEbpmToast(null);
    }, 4000);
  };

  const handleVote = async (id: string, type: 'agree' | 'concern', baseCounts: ReactionCounts) => {
    if (userVotes[id]) return;
    const requestKey = `${assembly.id}:${id}`;
    if (reactionRequestsInFlight.current.has(requestKey)) return;
    reactionRequestsInFlight.current.add(requestKey);

    try {
      const result = await putReactionState(id, type, baseCounts);
      if (result.reaction_type === 'agree' || result.reaction_type === 'concern') {
        setUserVotes((prev) => ({ ...prev, [id]: result.reaction_type as 'agree' | 'concern' }));
      }
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== id) return msg;
          return {
            ...msg,
            agreeCount: result.counts.agree,
            disagreeCount: result.counts.concern,
          };
        })
      );

      if (result.changed && result.previous_reaction_type === null) {
        const newCount = incrementEbpmReactionCount();
        triggerEbpmFeedbackNotification(assembly.name, type === 'agree' ? '賛成の声' : '懸念の声', newCount);
      }
    } catch {
      // Keep the existing screen unchanged when the API is unavailable.
    } finally {
      reactionRequestsInFlight.current.delete(requestKey);
    }
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
          date: data.source_verified ? '公式会議録・原文照合済み' : 'デモ回答',
          originalQuote: data.original_quote,
          timestamp: nowStr,
          agreeCount: 1,
          disagreeCount: 0,
          sourceUrl: data.source_url || 'https://catalog.data.metro.tokyo.lg.jp/',
          sourceVerified: data.source_verified === true,
          aiChainSteps: data.ai_chain_steps || DEMO_CHAIN_STEPS,
        };
        setMessages((prev) => [...prev, assistantReply]);
      } else {
        throw new Error('API failed');
      }
    } catch {
      const fallbackReply: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        plainText: `ご質問「${userText}」への回答を取得できませんでした。公開会議録へのリンクから原文をご確認ください。`,
        speaker: 'マチボイス AI',
        speakerTitle: 'API接続エラー',
        date: '回答未取得',
        timestamp: nowStr,
        agreeCount: 1,
        disagreeCount: 0,
        sourceUrl: assembly.sourceUrl || 'https://catalog.data.metro.tokyo.lg.jp/',
        sourceVerified: false,
        aiChainSteps: DEMO_CHAIN_STEPS,
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = assembly.id === 'tokyo-metropolitan'
    ? ['EBPMはどう進める？', '教育データをどう活用する？', 'バス運行データの公開は？']
    : assembly.mainIssues.slice(0, 3).map((issue) => `${issue.label}は？`);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* モーダルコンテナ（モバイルでは全画面、PCではカード） */}
      <div className="w-full h-full sm:h-[88vh] sm:max-w-2xl dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 bg-white border-slate-200 text-slate-900 sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden relative">
        {/* EBPMリアルタイム連動トーストバナー */}
        {ebpmToast && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-between animate-bounce">
            <span>{ebpmToast}</span>
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        {/* ヘッダー */}
        <div className="dark:bg-slate-900 dark:border-slate-800 bg-slate-100 border-slate-200 border-b px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl dark:bg-slate-800 dark:border-slate-700 bg-white border-slate-300 border flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base dark:text-white text-slate-900 truncate">
                  マチボイス ({assembly.name})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] dark:bg-slate-800 dark:text-emerald-400 dark:border-slate-700 bg-emerald-50 text-emerald-700 border-emerald-300 border font-medium shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {VERIFIED_ASSEMBLY_IDS.has(assembly.id) ? '公式会議録連携' : 'デモデータ'}
                </span>
              </div>
              <p className="text-[11px] dark:text-slate-400 text-slate-500 truncate">
                {VERIFIED_ASSEMBLY_IDS.has(assembly.id) ? '公式議事録・発言データの要約・質問アシスタント' : '公開会議録への接続を想定したデモ画面'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm border border-slate-700"
                title="議員ダッシュボードを開く"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>議員ダッシュボード</span>
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

        {/* クイック質問チップ（横スクロール） */}
        <div className="dark:bg-slate-900/60 dark:border-slate-800/50 bg-slate-50 border-slate-200 border-b px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[11px] dark:text-slate-400 text-slate-500 font-medium shrink-0 pl-1">
            よくある質問:
          </span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setInputQuestion(prompt)}
              className="px-2.5 py-1 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200 bg-white hover:bg-slate-100 border-slate-300 text-slate-700 border text-xs rounded-lg whitespace-nowrap shrink-0 transition-colors shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* チャットメッセージログ（スクロール領域） */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 dark:bg-slate-950 bg-slate-50/80">
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
                <div className="w-7 h-7 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-400 bg-emerald-100 border-emerald-300 text-emerald-700 border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1.5">
                  {/* 発言者・日付バッジ */}
                  {msg.speaker && (
                    <div className="flex items-center gap-1.5 text-[11px] dark:text-slate-400 text-slate-700 font-semibold">
                      <span className="font-bold dark:text-slate-200 text-slate-900">{msg.speaker}</span>
                      {msg.speakerTitle && <span className="dark:text-slate-400 text-slate-600 font-medium">({msg.speakerTitle})</span>}
                      {msg.date && (
                        <span className="dark:text-slate-400 text-slate-500 hidden xs:inline">• {msg.date}</span>
                      )}
                    </div>
                  )}

                  {/* 要約本文カード (4大主要ブロック構成) */}
                  <div className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border rounded-2xl rounded-tl-sm p-4 sm:p-5 text-xs sm:text-sm dark:text-slate-200 text-slate-800 leading-relaxed space-y-3.5 shadow-md">
                    
                    {/* 【ブロック1】何が変わる？ */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>何が変わる？</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 bg-slate-100 text-slate-700 border-slate-300 border font-medium">
                          {msg.sourceVerified ? '原文検証済み' : 'デモデータ'}
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-bold dark:text-white text-slate-900 leading-snug">
                        {msg.structuredSummary ? msg.structuredSummary.whatChanges : msg.plainText}
                      </div>
                    </div>

                    {/* 【ブロック2, 3, 4】誰に関係する？ × いまどの段階？ × お金・予算は？ */}
                    {msg.structuredSummary && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t dark:border-slate-800/80 border-slate-200">
                        <div className="dark:bg-slate-950 dark:border-slate-800/80 bg-slate-50 border-slate-200 border p-2.5 rounded-xl space-y-1">
                          <div className="text-[10.5px] font-semibold dark:text-slate-400 text-slate-500">📌 誰に関係する？</div>
                          <div className="text-xs font-semibold dark:text-slate-200 text-slate-800 leading-tight">
                            {msg.structuredSummary.targetAudience}
                          </div>
                        </div>
                        <div className="dark:bg-slate-950 dark:border-slate-800/80 bg-slate-50 border-slate-200 border p-2.5 rounded-xl space-y-1">
                          <div className="text-[10.5px] font-semibold dark:text-slate-400 text-slate-500">🟡 いまどの段階？</div>
                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-300 flex items-center gap-1.5 leading-tight">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            <span>{msg.structuredSummary.currentStage}</span>
                          </div>
                        </div>
                        <div className="dark:bg-slate-950 dark:border-slate-800/80 bg-slate-50 border-slate-200 border p-2.5 rounded-xl space-y-1">
                          <div className="text-[10.5px] font-semibold dark:text-slate-400 text-slate-500">💰 お金・予算は？</div>
                          <div className="text-xs font-semibold dark:text-slate-300 text-slate-700 leading-tight">
                            {msg.structuredSummary.budgetInfo || '令和8年度当初予算案に重点計上'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 【主要ブロック】この議論で、誰が何を言った？ (一覧では軽く ➔ タップで無制限深掘り展開) */}
                    {msg.speakerUtterances && msg.speakerUtterances.length > 0 && (
                      <div className="pt-3 border-t dark:border-slate-800/80 border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold dark:text-white text-slate-900 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>この議論で、誰が何を言った？（全{msg.speakerUtterances.length}名の発言）</span>
                          </div>
                          <span className="text-[10px] dark:text-slate-400 text-slate-500 font-normal">
                            タップで原文・抜粋を展開
                          </span>
                        </div>

                        <div className="space-y-2">
                          {msg.speakerUtterances.map((utt, idx) => {
                            const itemKey = `${assembly.id}-speaker-${utt.id || idx}`;
                            const isExpanded = expandedSpeakerKeys[itemKey];

                            const stanceStyle =
                              utt.stanceLabel === '推進'
                                ? 'dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-700/60 bg-emerald-100 text-emerald-800 border-emerald-300'
                                : utt.stanceLabel === '条件付き賛成'
                                ? 'dark:bg-teal-950/90 dark:text-teal-300 dark:border-teal-700/60 bg-teal-100 text-teal-800 border-teal-300'
                                : utt.stanceLabel === '慎重'
                                ? 'dark:bg-amber-950/90 dark:text-amber-300 dark:border-amber-700/60 bg-amber-100 text-amber-800 border-amber-300'
                                : utt.stanceLabel === '拡大提案'
                                ? 'dark:bg-sky-950/90 dark:text-sky-300 dark:border-sky-700/60 bg-sky-100 text-sky-800 border-sky-300'
                                : 'dark:bg-purple-950/90 dark:text-purple-300 dark:border-purple-700/60 bg-purple-100 text-purple-800 border-purple-300';

                            const voteStyle =
                              utt.voteRecord === '賛成'
                                ? 'dark:bg-emerald-900/80 dark:text-emerald-200 dark:border-emerald-600/80 bg-emerald-100 text-emerald-900 border-emerald-300'
                                : utt.voteRecord === '反対'
                                ? 'dark:bg-rose-900/80 dark:text-rose-200 dark:border-rose-600/80 bg-rose-100 text-rose-900 border-rose-300'
                                : utt.voteRecord === '棄権'
                                ? 'dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 bg-slate-200 text-slate-700 border-slate-300'
                                : 'dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/80 bg-amber-100 text-amber-900 border-amber-300';

                            const avatarBg =
                              utt.avatarColor === 'emerald'
                                ? 'bg-emerald-600 text-white'
                                : utt.avatarColor === 'amber'
                                ? 'bg-amber-600 text-white'
                                : utt.avatarColor === 'sky'
                                ? 'bg-sky-600 text-white'
                                : 'bg-purple-600 text-white';

                            return (
                              <div key={itemKey} className="dark:bg-slate-950/90 dark:border-slate-800/90 bg-slate-50 border-slate-200 border rounded-xl p-3 space-y-2">
                                {/* 発言の出典ヘッダー（日時・会議名・質問種別） */}
                                <div className="flex items-center justify-between border-b dark:border-slate-800/80 border-slate-200 pb-1.5 mb-1.5 text-[10px] dark:text-slate-400 text-slate-500">
                                  <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                    <Calendar className="w-3 h-3" />
                                    <span>{utt.meetingDate || 'デモ'} ｜ {utt.meetingName || '画面体験用データ'} ｜ {utt.questionType || 'デモ発言'}</span>
                                  </div>
                                </div>

                                {/* 上段: 一覧（アバター ＋ 氏名・所属 ＋ 2種バッジ: 発言上の立場 ✕ 採決結果） */}
                                <div className="flex items-start gap-2.5 text-xs">
                                  <div className={`w-8 h-8 rounded-full ${avatarBg} font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                                    {utt.speakerName.slice(0, 2)}
                                  </div>

                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                      <span className="font-bold dark:text-white text-slate-900 text-xs">{utt.speakerName}</span>
                                      <span className="dark:text-slate-400 text-slate-500 text-[10.5px]">
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
                                    <div className="dark:text-slate-200 text-slate-800 text-xs font-normal leading-relaxed">
                                      💬「{utt.summaryQuote}」
                                    </div>
                                  </div>
                                 </div>

                                 {/* 下段: 発言単位の市民リアクションバー (👍 賛成 / ⚠️ 気になる / 💡 参考 / 💬 理由・意見) */}
                                 <div className="pt-2 border-t dark:border-slate-900/80 border-slate-200 space-y-2">
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
                                             <span className="text-[10px] dark:text-slate-400 text-slate-500 font-medium shrink-0">この発言への反応:</span>

                                             <button
                                               onClick={() => handleUtteranceVote(itemKey, utt.speakerName, 'agree', defaultCounts)}
                                               className={`px-2 py-0.8 rounded-lg font-semibold border flex items-center gap-1 transition-all ${
                                                 uttUserVote === 'agree'
                                                   ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                                   : 'dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
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
                                                   : 'dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
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
                                                   : 'dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                               }`}
                                             >
                                               <span>💡 参考</span>
                                               <span className="text-[10px] opacity-90 font-mono">({counts.helpful})</span>
                                             </button>

                                             <button
                                               onClick={() => toggleUtteranceCommentBox(itemKey)}
                                               className="px-2 py-0.8 rounded-lg font-semibold border dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-emerald-400 dark:border-emerald-900/60 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1 transition-colors shadow-2xs"
                                             >
                                               <MessageSquare className="w-3 h-3" />
                                               <span>理由・意見</span>
                                             </button>
                                           </div>

                                           <button
                                             onClick={() => toggleSpeakerExpand(itemKey)}
                                             className="text-[11px] dark:text-emerald-400 dark:hover:text-emerald-300 dark:bg-slate-900 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 border font-semibold flex items-center gap-1 transition-colors py-0.5 px-2 rounded shrink-0 shadow-2xs"
                                           >
                                             <span>{isExpanded ? '原文抜粋をたたむ ▴' : '発言の要旨・原文抜粋をみる ▾'}</span>
                                           </button>
                                         </div>

                                         {isCommentOpen && (
                                           <div className="mt-2 pt-2 border-t dark:border-slate-800/80 border-slate-200 space-y-2 animate-fade-in">
                                             <div className="flex gap-2">
                                               <input
                                                 type="text"
                                                 value={utteranceCommentInputs[itemKey] || ''}
                                                 onChange={(e) => setUtteranceCommentInputs((prev) => ({ ...prev, [itemKey]: e.target.value }))}
                                                 onKeyDown={(e) => e.key === 'Enter' && handleAddUtteranceComment(itemKey, utt.speakerName)}
                                                 placeholder={`「${utt.speakerName}議員の発言」への匿名理由・意見（例: 財源の説明をもっと開示してほしい）`}
                                                 className="flex-1 dark:bg-slate-900 dark:border-slate-700/80 dark:text-white bg-white border-slate-300 text-slate-900 border rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                                               />
                                               <button
                                                 onClick={() => handleAddUtteranceComment(itemKey, utt.speakerName)}
                                                 className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shrink-0 transition-colors shadow-2xs"
                                               >
                                                 送信 (EBPMへ反映)
                                               </button>
                                             </div>

                                             {allComments.length > 0 && (
                                               <div className="space-y-1 pt-1">
                                                 <div className="text-[10px] dark:text-slate-400 text-slate-500 font-semibold">集計された市民の理由・コメント:</div>
                                                 {allComments.map((c, cIdx) => (
                                                   <div key={cIdx} className="dark:bg-slate-900/90 dark:border-slate-800/80 bg-slate-100 border-slate-200 border p-2 rounded-lg text-xs flex items-start gap-1.5 text-slate-800">
                                                     <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">💬 {c.user}:</span>
                                                     <span className="dark:text-slate-200 text-slate-800 font-normal leading-relaxed">{c.text}</span>
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
                                    <div className="w-full mt-2.5 space-y-2 text-xs dark:bg-slate-900/90 dark:border-slate-800 bg-white border-slate-200 border p-3 rounded-lg dark:text-slate-300 text-slate-800 animate-fade-in shadow-xs">
                                      <div>
                                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">💡 発言の要旨詳細</div>
                                        <div className="dark:text-slate-200 text-slate-900 leading-relaxed font-normal">{utt.fullSummary || utt.summaryQuote}</div>
                                      </div>

                                      <div>
                                        <div className="text-[10px] dark:text-slate-400 text-slate-500 font-bold uppercase tracking-wider mb-0.5">💬 {msg.sourceVerified ? '公式会議録 原文抜粋' : '画面体験用デモ発言'}</div>
                                        <div className="dark:bg-slate-950 dark:border-slate-800/80 dark:text-slate-300 bg-slate-50 border-slate-200 border p-2.5 rounded text-[11.5px] italic text-slate-800 leading-relaxed">
                                          {utt.sourceExcerpt || `「${utt.summaryQuote}」`}
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-[10.5px] dark:text-slate-400 text-slate-500 pt-1.5 border-t dark:border-slate-800/60 border-slate-200 flex-wrap gap-2">
                                        <div>
                                          📍 審議会議: <span className="dark:text-slate-300 text-slate-800 font-medium">{utt.meetingName || '令和8年 第1回定例会 本会議・委員会'}</span>
                                        </div>
                                        <a
                                          href={utt.sourceUrl || msg.sourceUrl || 'https://catalog.data.metro.tokyo.lg.jp/'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-colors border border-emerald-200 dark:border-emerald-800"
                                        >
                                          <span>{msg.sourceVerified ? '出典を見る ➔ 元議事録の該当箇所' : '公開会議録システムを見る'}</span>
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>

                        <p className="text-[10px] dark:text-slate-400 text-slate-500 font-normal pt-0.5">
                          {msg.sourceVerified
                            ? '※各発言者の右下ボタンから、公式会議録の原文抜粋と直接出典を確認できます。'
                            : '※この発言は画面体験用デモデータです。公開会議録との個別照合は行っていません。'}
                        </p>
                      </div>
                    )}

                    {/* スケジュール・時間軸 (Timeline) */}
                    {msg.timeline && msg.timeline.length > 0 && (
                      <div className="pt-2.5 border-t dark:border-slate-800/80 border-slate-200 space-y-1.5">
                        <div className="text-[11px] font-bold dark:text-slate-300 text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>今後のスケジュール・時系列</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {msg.timeline.map((item, idx) => (
                            <div key={idx} className="dark:bg-slate-950/80 dark:border-slate-800/80 bg-slate-50 border-slate-200 border p-2 rounded-lg text-[11px]">
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">{item.date}</div>
                              <div className="dark:text-slate-200 text-slate-800 font-medium leading-tight mt-0.5">{item.event}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 議会での主な論点 (Supporting vs Concerns) */}
                    {msg.policyArguments && (
                      <div className="pt-2.5 border-t dark:border-slate-800/80 border-slate-200 space-y-2">
                        <div className="text-[11px] font-bold dark:text-slate-300 text-slate-800 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>議会での主な論点（審議内容）</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="dark:bg-emerald-950/40 dark:border-emerald-800/40 bg-emerald-50/80 border-emerald-200 border p-2.5 rounded-xl space-y-1">
                            <div className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>賛成理由・推進側の主な意見</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 dark:text-slate-300 text-slate-800 text-[10.5px]">
                              {msg.policyArguments.supporting.map((arg, idx) => (
                                <li key={idx}>{arg}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="dark:bg-rose-950/40 dark:border-rose-800/40 bg-rose-50/80 border-rose-200 border p-2.5 rounded-xl space-y-1">
                            <div className="text-[10.5px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>慎重論・懸念される主な点</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 dark:text-slate-300 text-slate-800 text-[10.5px]">
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
                      <div className="pt-2 border-t dark:border-slate-800/80 border-slate-200 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-1 text-[11px]">
                          <button
                            onClick={() => toggleQuote(msg.id)}
                            className="font-medium dark:text-slate-300 dark:hover:text-emerald-400 text-slate-700 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{msg.sourceVerified ? '根拠：公式会議録の原文を' : 'デモ発言を'}{isQuoteExpanded ? '閉じる' : '確認する'}</span>
                            {isQuoteExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <a
                            href={msg.sourceUrl || 'https://catalog.data.metro.tokyo.lg.jp/'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10.5px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>東京都オープンデータ原典</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {isQuoteExpanded && (
                          <div className="mt-2 p-3 dark:bg-slate-950 dark:border-slate-800/80 dark:text-slate-300 bg-slate-50 border-slate-200 border rounded-xl text-xs text-slate-800 font-serif leading-relaxed italic animate-fade-in">
                            {msg.originalQuote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 補助情報: この議論、どう思う？ (双方向フィードバック) & AI検証ステップ */}
                    {(msg.agreeCount !== undefined || msg.disagreeCount !== undefined) && (
                      <div className="pt-2.5 border-t dark:border-slate-800/80 border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold dark:text-slate-300 text-slate-800">この議論、どう思う？</span>
                            <button
                              onClick={() => handleVote(msg.id, 'agree', {
                                agree: msg.agreeCount !== undefined ? msg.agreeCount : 42,
                                concern: msg.disagreeCount !== undefined ? msg.disagreeCount : 3,
                                helpful: 0,
                              })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                                hasVoted === 'agree'
                                  ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                                  : 'dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>賛成 {msg.agreeCount !== undefined ? msg.agreeCount : 42}</span>
                            </button>
                            <button
                              onClick={() => handleVote(msg.id, 'concern', {
                                agree: msg.agreeCount !== undefined ? msg.agreeCount : 42,
                                concern: msg.disagreeCount !== undefined ? msg.disagreeCount : 3,
                                helpful: 0,
                              })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                                hasVoted === 'concern'
                                  ? 'bg-rose-600/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                                  : 'dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>懸念 {msg.disagreeCount !== undefined ? msg.disagreeCount : 3}</span>
                            </button>
                            <button
                              onClick={() => toggleCommentBox(msg.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 border flex items-center gap-1 transition-colors"
                            >
                              <Send className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>意見を書く</span>
                            </button>
                          </div>

                          <button
                            onClick={() => toggleChain(msg.id)}
                            className="text-[10.5px] font-medium dark:text-slate-400 dark:hover:text-slate-200 text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors ml-auto"
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
                              className="flex-1 px-3 py-1.5 dark:bg-slate-950 dark:border-slate-800 dark:text-white bg-white border-slate-300 text-slate-900 border rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                            />
                            <button
                              onClick={() => handleAddComment(msg.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shrink-0 shadow-2xs"
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
                                className="dark:bg-slate-950/80 dark:border-slate-800/80 dark:text-slate-300 bg-slate-100 border-slate-200 border p-2 rounded-lg text-[11px] text-slate-800"
                              >
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{c.user}: </span>
                                <span>{c.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Processing Chain アコーディオン展開 */}
                    {isChainExpanded && (
                      <div className="p-3 dark:bg-slate-950 dark:border-slate-800 bg-slate-100 border-slate-200 border rounded-xl space-y-2 text-xs animate-fade-in">
                        <p className="text-[11px] dark:text-slate-400 text-slate-600 font-semibold mb-1">
                          処理ステップ: 公式データ連携 ➔ 情報抽出 ➔ 構造化要約 ➔ 原文照合
                        </p>
                        {chainSteps.map((step) => (
                          <div key={step.step_number} className="flex items-start gap-2 text-[11px]">
                            <span className="w-4 h-4 rounded-full dark:bg-slate-800 dark:text-emerald-400 dark:border-slate-700 bg-white border-slate-300 text-emerald-700 border flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                              {step.step_number}
                            </span>
                            <div>
                              <span className="font-semibold dark:text-slate-200 text-slate-900">{step.title}</span>
                              <p className="dark:text-slate-400 text-slate-600 text-[10.5px] leading-tight">{step.detail}</p>
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

        {/* AIデータ構造化パイプライン（システムアピール用） */}
        <div className="bg-slate-100 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 px-3 py-2 text-[10.5px] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 whitespace-nowrap min-w-max text-slate-600 dark:text-slate-400 font-medium">
            <span className="font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1"><Sparkles className="w-3 h-3 text-emerald-600"/>システム処理:</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-emerald-600"/>議事録PDF</span>
            <span className="text-slate-400">→</span>
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">発言単位に構造化</span>
            <span className="text-slate-400">→</span>
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">議員・会議情報を紐付け</span>
            <span className="text-slate-400">→</span>
            <span>AI要約</span>
            <span className="text-slate-400">→</span>
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">原文出典を保持</span>
          </div>
        </div>

        {/* チャット入力フォーム */}
        <div className="dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200 border-t p-3 sm:p-4 shrink-0">
          <form onSubmit={handleSendQuestion} className="flex items-center gap-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="政策や予算について質問を入力..."
              disabled={isSending}
              className="flex-1 px-4 py-2.5 dark:bg-slate-950 dark:border-slate-800 dark:text-white bg-slate-50 border-slate-300 text-slate-900 border rounded-xl text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSending || !inputQuestion.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
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
