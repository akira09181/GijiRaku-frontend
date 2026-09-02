'use client';

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import AssemblyMap from './components/AssemblyMap';
import AssemblyListDrawer from './components/AssemblyListDrawer';
import LineChatModal from './components/LineChatModal';
import MyFollowModal from './components/MyFollowModal';
import IssueExplorer from './components/IssueExplorer';
import MobileBottomNavigation from './components/MobileBottomNavigation';
import OnboardingTour from './components/OnboardingTour';
import RegionRequestModal from './components/growth/RegionRequestModal';
import { Assembly, IssueTheme } from './types/assembly';
import { isAssemblyReady, mergeTokyoAssemblies, TOKYO_PLANNED_ASSEMBLIES } from './data/tokyoPlannedAssemblies';
import type { AssemblyRecord, AssemblyRecordsResponse } from './types/assemblyRecord';
import type { IssueCatalogItem, IssueCatalogResponse } from './types/issueCatalog';
import type { FollowedTopic, FollowTopicInput } from './types/follow';
import {
  FOLLOWED_TOPICS_STORAGE_KEY,
  loadFollowedTopics,
} from './lib/followedTopics';
import {
  deleteFirestoreFollow,
  listFirestoreFollows,
  markFirestoreFollowViewed,
  putFirestoreFollow,
} from './lib/followApi';
import { getApiBase } from './lib/apiBase';
import { loadMyArea, saveMyArea } from './lib/myArea';
import { getUnreadNotificationCount } from './lib/notificationApi';
import { getCitizenQuestionByIssueId } from './data/citizenQuestions';
import { unlockCitizenBadge } from './lib/citizenBadges';
import {
  MapPin,
  Filter,
  MessageSquare,
  ChevronDown,
  Building2,
  Baby,
  Laptop,
  Building,
  HeartPulse,
  Layers,
  Map as MapIcon,
  List as ListIcon,
} from 'lucide-react';

/**
 * 東京都内 議会・自治体マスターデータ
 */
const TOKYO_ASSEMBLIES: readonly Assembly[] = [
  {
    id: 'national-diet',
    name: '国会',
    type: 'national',
    lat: 35.6759,
    lng: 139.7449,
    membersCount: 713,
    mayorName: '内閣総理大臣',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'diet-medical-cost-burden-2025-03-13',
    hotTopic: '物価高と医療費負担の見直し',
    mainIssues: [
      { theme: 'health', label: '物価高と医療費負担の見直し', count: 1 },
    ],
    sourceUrl: 'https://kokkai.ndl.go.jp/txt/121705261X02020250313/2',
    lastMeetingDate: '2025/3/13｜予算委員会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'tokyo-metropolitan',
    name: '東京都議会',
    type: 'prefecture',
    lat: 35.6895,
    lng: 139.6917,
    membersCount: 127,
    mayorName: '小池 百合子',
    openDataStatus: 'ready',
    totalMinutesCount: 3,
    featuredDiscussionId: 'tokyo-app-2026-06-16',
    hotTopic: '東京アプリの機能強化',
    mainIssues: [
      { theme: 'child', label: '子育て・介護情報の配信', count: 1 },
      { theme: 'dx', label: '行政サービスのログイン簡素化', count: 1 },
      { theme: 'dx', label: 'デジタル都民証', count: 1 },
      { theme: 'dx', label: '生成AIによる支援案内', count: 1 },
    ],
    sourceUrl: 'https://www.gikai.metro.tokyo.lg.jp/record/proceedings/2026-2/02-01.html',
    lastMeetingDate: '2026/6/16｜第2回定例会',
    lastUpdatedDate: '2026/08/24',
  },
  {
    id: 'shinjuku-ward',
    name: '新宿区議会',
    type: 'ward',
    lat: 35.6938,
    lng: 139.7034,
    membersCount: 38,
    mayorName: '吉住 健一',
    openDataStatus: 'ready',
    totalMinutesCount: 4,
    featuredDiscussionId: 'shinjuku-sick-child-care-2026-06-10',
    hotTopic: '病児保育の利用拒否・空き状況・予約改善',
    mainIssues: [
      { theme: 'child', label: '病児保育の受入体制', count: 1 },
      { theme: 'dx', label: '空き状況・予約のICT化', count: 1 },
      { theme: 'redevelop', label: '施設・人員の供給体制', count: 1 },
      { theme: 'medical', label: '症状別の受入判断', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/shinjuku/SpMinuteView.html?council_id=3193&schedule_id=2',
    lastMeetingDate: '2026/6/10｜第2回定例会',
    lastUpdatedDate: '2026/08/24',
  },
  {
    id: 'machida-city',
    name: '町田市議会',
    type: 'city',
    lat: 35.5467,
    lng: 139.4386,
    membersCount: 36,
    mayorName: '稲垣 康治',
    openDataStatus: 'ready',
    totalMinutesCount: 3,
    featuredDiscussionId: 'machida-regional-transport-2026-03-26',
    hotTopic: '交通不便地域の新しい地域交通モデル',
    mainIssues: [
      { theme: 'child', label: '子育て世帯の移動', count: 1 },
      { theme: 'dx', label: '新しい移動サービス', count: 1 },
      { theme: 'redevelop', label: '交通不便地域対策', count: 1 },
      { theme: 'medical', label: '通院・高齢者の移動', count: 1 },
    ],
    sourceUrl: 'https://www.gikai-machida.jp/g07_Shitsumon.asp?KAIGI=174&Sflg=2',
    lastMeetingDate: '2026/3/26｜第1回定例会',
    lastUpdatedDate: '2026/08/24',
  },
  {
    id: 'shinagawa-ward',
    name: '品川区議会',
    type: 'ward',
    lat: 35.6092,
    lng: 139.7302,
    membersCount: 40,
    mayorName: '森澤 恭子',
    openDataStatus: 'ready',
    totalMinutesCount: 4,
    featuredDiscussionId: 'shinagawa-inclusive-education-2026-02-19',
    hotTopic: '深い学び・多様性の包摂・教員負担軽減',
    mainIssues: [
      { theme: 'child', label: '多様性を包摂する教育', count: 1 },
      { theme: 'dx', label: '教育DX・データ活用', count: 1 },
      { theme: 'redevelop', label: '学校支援人材の充実', count: 1 },
      { theme: 'medical', label: '特別支援教育', count: 1 },
    ],
    sourceUrl: 'https://kaigiroku.city.shinagawa.tokyo.jp/100000?QueryType=New&Template=document&VoiceExpand1=r08-0219_002',
    lastMeetingDate: '2026/2/19｜第1回定例会',
    lastUpdatedDate: '2026/08/24',
  },
  {
    id: 'shibuya-ward',
    name: '渋谷区議会',
    type: 'ward',
    lat: 35.664,
    lng: 139.6982,
    membersCount: 34,
    mayorName: '長谷部 健',
    openDataStatus: 'ready',
    totalMinutesCount: 4,
    featuredDiscussionId: 'shibuya-inflation-support-2026-01-16',
    hotTopic: '物価高騰緊急支援給付金・子育て応援手当',
    mainIssues: [
      { theme: 'child', label: '子ども1人2万円給付', count: 1 },
      { theme: 'dx', label: '給付方法の分かりやすい案内', count: 1 },
      { theme: 'redevelop', label: '全区民1人5,000円給付', count: 1 },
      { theme: 'medical', label: '物価高騰緊急支援', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/shibuya/SpMinuteView.html?council_id=2494&schedule_id=2',
    lastMeetingDate: '2026/1/16｜第1回臨時会',
    lastUpdatedDate: '2026/08/24',
  },
  {
    id: 'arakawa-ward',
    name: '荒川区議会',
    type: 'ward',
    lat: 35.7361,
    lng: 139.7833,
    membersCount: 32,
    mayorName: '滝口 学',
    openDataStatus: 'ready',
    totalMinutesCount: 5,
    featuredDiscussionId: 'arakawa-ward-auto-2026-03-17-685-6-267',
    hotTopic: '令和8年度予算・物価高対策・行政DX',
    mainIssues: [
      { theme: 'child', label: '小中一貫教育・子育て支援', count: 1 },
      { theme: 'dx', label: '電子地域通貨・行政DX', count: 1 },
      { theme: 'redevelop', label: '町会・自治会と地域連携', count: 1 },
      { theme: 'medical', label: '医療・介護体制', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/arakawa/SpMinuteView.html?council_id=685&schedule_id=2',
    lastMeetingDate: '2026/3/17｜定例会・2月会議',
    lastUpdatedDate: '2026/08/24',
  },
  {
    id: 'hachioji-city',
    name: '八王子市議会',
    type: 'city',
    lat: 35.6558,
    lng: 139.3389,
    membersCount: 40,
    mayorName: '初宿 和夫',
    openDataStatus: 'ready',
    totalMinutesCount: 4,
    featuredDiscussionId: 'hachioji-rag-ai-2026-06-11',
    hotTopic: '検索拡張生成AIの行政利用・市民サービス向上',
    mainIssues: [
      { theme: 'child', label: '市民サービスの質向上', count: 1 },
      { theme: 'dx', label: '検索拡張生成AI', count: 1 },
      { theme: 'redevelop', label: '庁内文書・会議録活用', count: 1 },
      { theme: 'medical', label: '福祉相談窓口へのAI活用', count: 1 },
    ],
    sourceUrl: 'https://www.city.hachioji.tokyo.dbsr.jp/index.php/611167?Template=document&Id=6213',
    lastMeetingDate: '2026/6/11｜第2回定例会',
    lastUpdatedDate: '2026/08/24',
  },
  {
    id: 'nerima-ward',
    name: '練馬区議会',
    type: 'ward',
    lat: 35.7356,
    lng: 139.6517,
    membersCount: 50,
    mayorName: '大島 都',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'nerima-ward-auto-2024-03-15-5227-9-275',
    hotTopic: '高齢者対策の強化',
    mainIssues: [
      { theme: 'child', label: '高齢者いきいき健康事業', count: 1 },
      { theme: 'medical', label: '地域包括支援センター', count: 1 },
      { theme: 'housing', label: '低所得高齢者の家賃補助', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/nerima/SpMinuteView.html?council_id=5227&schedule_id=9',
    lastMeetingDate: '2024/3/15｜第1回定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'nakano-ward',
    name: '中野区議会',
    type: 'ward',
    lat: 35.7074,
    lng: 139.6638,
    membersCount: 42,
    mayorName: '野崎 清美',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'nakano-ward-auto-2024-03-06-197-4-196',
    hotTopic: '子育て支援',
    mainIssues: [
      { theme: 'child', label: '子育て支援策', count: 1 },
      { theme: 'housing', label: '空き家対策', count: 1 },
      { theme: 'digital', label: 'DX・教育', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/nakano/SpMinuteView.html?council_id=197&schedule_id=4',
    lastMeetingDate: '2024/3/6｜第1回定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'kita-ward',
    name: '北区議会',
    type: 'ward',
    lat: 35.7536,
    lng: 139.7335,
    membersCount: 40,
    mayorName: '西 美友',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'kita-ward-auto-2024-06-07-653-2-8',
    hotTopic: '子育て支援策と防災対策',
    mainIssues: [
      { theme: 'child', label: '子ども条例', count: 1 },
      { theme: 'safety', label: '防災・安全なまちづくり', count: 1 },
      { theme: 'digital', label: '都区連携事業', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/kita/SpMinuteView.html?council_id=653&schedule_id=2',
    lastMeetingDate: '2024/6/7｜第2回定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'sumida-ward',
    name: '墨田区議会',
    type: 'ward',
    lat: 35.7107,
    lng: 139.8015,
    membersCount: 36,
    mayorName: '野本 幸司',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'sumida-ward-auto-2024-06-12-555-2-150',
    hotTopic: '職員の人材育成',
    mainIssues: [
      { theme: 'digital', label: '総合的人事戦略', count: 1 },
      { theme: 'community', label: '行政サービスの持続', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/sumida/SpMinuteView.html?council_id=555&schedule_id=2',
    lastMeetingDate: '2024/6/12｜第2回定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'tachikawa-city',
    name: '立川市議会',
    type: 'city',
    lat: 35.7138,
    lng: 139.4095,
    membersCount: 28,
    mayorName: '高橋 都志',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'tachikawa-city-auto-2024-02-27-2629-4-62',
    hotTopic: '個別の教育支援計画と個別の指導計画',
    mainIssues: [
      { theme: 'child', label: '特別な支援を必要とする児童生徒', count: 1 },
      { theme: 'child', label: '就学支援シートの引継ぎ', count: 1 },
      { theme: 'child', label: '夏季休業中の学童昼食', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/tachikawa/SpMinuteView.html?council_id=2629&schedule_id=4',
    lastMeetingDate: '2024/2/27｜第1回定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'chuo-ward',
    name: '中央区議会',
    type: 'ward',
    lat: 35.6706,
    lng: 139.772,
    membersCount: 30,
    mayorName: '長谷川 健一',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'chuo-ward-auto-2023-06-19-109-3-64',
    hotTopic: '学童保育と預かり場所の確保',
    mainIssues: [
      { theme: 'child', label: '学童保育と預かり場所の確保', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/chuo/SpMinuteView.html?council_id=109&schedule_id=3',
    lastMeetingDate: '2023/6/19｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'kodaira-city',
    name: '小平市議会',
    type: 'city',
    lat: 35.7284,
    lng: 139.4777,
    membersCount: 28,
    mayorName: '白石 幸男',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'kodaira-city-auto-2024-02-26-1458-2-432',
    hotTopic: '市立保育園の保育士確保',
    mainIssues: [
      { theme: 'child', label: '市立保育園の保育士確保', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/kodaira/SpMinuteView.html?council_id=1458&schedule_id=2',
    lastMeetingDate: '2024/2/26｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'akishima-city',
    name: '昭島市議会',
    type: 'city',
    lat: 35.7058,
    lng: 139.3539,
    membersCount: 24,
    mayorName: '佐々木 綾子',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'akishima-city-auto-2024-03-05-2203-10-30',
    hotTopic: '子育て世代が働きやすいまち',
    mainIssues: [
      { theme: 'child', label: '子育て世代が働きやすいまち', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/akishima/SpMinuteView.html?council_id=2203&schedule_id=10',
    lastMeetingDate: '2024/3/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'ome-city',
    name: '青梅市議会',
    type: 'city',
    lat: 35.7879,
    lng: 139.2756,
    membersCount: 24,
    mayorName: '加藤 健一',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'ome-city-auto-2024-03-05-1269-3-117',
    hotTopic: '人口減少対策と子育て環境',
    mainIssues: [
      { theme: 'child', label: '人口減少対策と子育て環境', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/ome/SpMinuteView.html?council_id=1269&schedule_id=3',
    lastMeetingDate: '2024/3/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'higashiyamato-city',
    name: '東大和市議会',
    type: 'city',
    lat: 35.7454,
    lng: 139.4266,
    membersCount: 22,
    mayorName: '岸本 礼子',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'higashiyamato-city-auto-2024-02-27-33-4-95',
    hotTopic: '妊産婦や子育て家庭への支援',
    mainIssues: [
      { theme: 'child', label: '妊産婦や子育て家庭への支援', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/higashiyamato/SpMinuteView.html?council_id=33&schedule_id=4',
    lastMeetingDate: '2024/2/27｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'kiyose-city',
    name: '清瀬市議会',
    type: 'city',
    lat: 35.7854,
    lng: 139.5268,
    membersCount: 22,
    mayorName: '小久保 令子',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'kiyose-city-auto-2024-03-06-495-5-5',
    hotTopic: '清瀬市の防災対策',
    mainIssues: [
      { theme: 'safety', label: '清瀬市の防災対策', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/kiyose/SpMinuteView.html?council_id=495&schedule_id=5',
    lastMeetingDate: '2024/3/6｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'musashimurayama-city',
    name: '武蔵村山市議会',
    type: 'city',
    lat: 35.754,
    lng: 139.3874,
    membersCount: 20,
    mayorName: '成塚 豊',
    openDataStatus: 'ready',
    totalMinutesCount: 40,
    featuredDiscussionId: 'musashimurayama-city-auto-2024-03-01-1250-4-12',
    hotTopic: '高齢者のうつ病対策',
    mainIssues: [
      { theme: 'health', label: '高齢者のうつ病対策', count: 1 },
    ],
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/musashimurayama/SpMinuteView.html?council_id=1250&schedule_id=4',
    lastMeetingDate: '2024/3/1｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'koto-ward',
    name: '江東区議会',
    type: 'ward',
    lat: 35.6731,
    lng: 139.817,
    membersCount: 44,
    mayorName: '石川 雅',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'koto-disaster-townplan-2025-06-12',
    hotTopic: '防災・まちづくり対策の強化',
    mainIssues: [
      { theme: 'safety', label: '防災・まちづくり対策の強化', count: 1 },
    ],
    sourceUrl: 'https://www.city.koto.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/6/12｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'musashino-city',
    name: '武蔵野市議会',
    type: 'city',
    lat: 35.7178,
    lng: 139.5661,
    membersCount: 26,
    mayorName: '藤井 直幸',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'musashino-school-rebuild-2025-12-04',
    hotTopic: '学校改築と小・中学校の適正規模',
    mainIssues: [
      { theme: 'child', label: '学校改築と小・中学校の適正規模', count: 1 },
    ],
    sourceUrl: 'https://www.city.musashino.tokyo.dbsr.jp/',
    lastMeetingDate: '2025/12/4｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'fuchu-city',
    name: '府中市議会',
    type: 'city',
    lat: 35.6689,
    lng: 139.4777,
    membersCount: 28,
    mayorName: '小柳 敏文',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'fuchu-base-redevelopment-2025-09-03',
    hotTopic: '府中基地跡地の活用',
    mainIssues: [
      { theme: 'housing', label: '府中基地跡地の活用', count: 1 },
    ],
    sourceUrl: 'https://www.city.fuchu.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/9/3｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'mitaka-city',
    name: '三鷹市議会',
    type: 'city',
    lat: 35.6835,
    lng: 139.5596,
    membersCount: 28,
    mayorName: '河村 孝',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'mitaka-inclusive-disaster-2024-02-27',
    hotTopic: 'インクルーシブ防災の徹底',
    mainIssues: [
      { theme: 'safety', label: 'インクルーシブ防災の徹底', count: 1 },
    ],
    sourceUrl: 'https://www.gikai.city.mitaka.tokyo.jp/reference/2024/custom1/no4_text.html',
    lastMeetingDate: '2024/2/27｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'kokubunji-city',
    name: '国分寺市議会',
    type: 'city',
    lat: 35.7103,
    lng: 139.4622,
    membersCount: 22,
    mayorName: '堀内 伸',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'kokubunji-peace-education-2025-02-28',
    hotTopic: '平和教育と校外学習の中立性',
    mainIssues: [
      { theme: 'child', label: '平和教育と校外学習の中立性', count: 1 },
    ],
    sourceUrl: 'https://www.city.kokubunji.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/2/28｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'chiyoda-ward',
    name: '千代田区議会',
    type: 'ward',
    lat: 35.694,
    lng: 139.7536,
    membersCount: 36,
    mayorName: '西村 康稔',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'chiyoda-teen-support-allowance-2025-06-10',
    hotTopic: '中高生世代応援手当',
    mainIssues: [
      { theme: 'child', label: '中高生世代応援手当', count: 1 },
    ],
    sourceUrl: 'https://www.city.chiyoda.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/6/10｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'bunkyo-ward',
    name: '文京区議会',
    type: 'ward',
    lat: 35.7081,
    lng: 139.7522,
    membersCount: 44,
    mayorName: '大森 一朗',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'bunkyo-childcare-support-2025-03-06',
    hotTopic: '子育て支援施策の充実',
    mainIssues: [
      { theme: 'child', label: '子育て支援施策の充実', count: 1 },
    ],
    sourceUrl: 'https://www.city.bunkyo.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/3/6｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'koganei-city',
    name: '小金井市議会',
    type: 'city',
    lat: 35.6995,
    lng: 139.5033,
    membersCount: 22,
    mayorName: '樋口 義文',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'koganei-nursery-safety-2025-02-28',
    hotTopic: '保育施設の指定管理者と安全',
    mainIssues: [
      { theme: 'safety', label: '保育施設の指定管理者と安全', count: 1 },
    ],
    sourceUrl: 'https://www.city.koganei.tokyo.dbsr.jp/index.php/?Template=document&CabinetName=kb&Part=5&TermStart=2025-02-01',
    lastMeetingDate: '2025/2/28｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'hino-city',
    name: '日野市議会',
    type: 'city',
    lat: 35.6714,
    lng: 139.3949,
    membersCount: 28,
    mayorName: '古賀 健一',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'hino-station-barrier-free-2025-03-04',
    hotTopic: '日野駅のバリアフリー改善',
    mainIssues: [
      { theme: 'safety', label: '日野駅のバリアフリー改善', count: 1 },
    ],
    sourceUrl: 'https://www.city.hino.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/3/4｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'tama-city',
    name: '多摩市議会',
    type: 'city',
    lat: 35.637,
    lng: 139.4463,
    membersCount: 28,
    mayorName: '藤原 保博',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'tama-school-safety-bullying-2025-09-01',
    hotTopic: '学校生活の安全といじめ対策',
    mainIssues: [
      { theme: 'safety', label: '学校生活の安全といじめ対策', count: 1 },
    ],
    sourceUrl: 'https://www.city.tama.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/9/1｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'kunitachi-city',
    name: '国立市議会',
    type: 'city',
    lat: 35.6839,
    lng: 139.4413,
    membersCount: 18,
    mayorName: '石田 よしひこ',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'kunitachi-childcare-university-2025-03-05',
    hotTopic: '子育て支援と大学連携',
    mainIssues: [
      { theme: 'child', label: '子育て支援と大学連携', count: 1 },
    ],
    sourceUrl: 'https://www.city.kunitachi.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/3/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'fussa-city',
    name: '福生市議会',
    type: 'city',
    lat: 35.7384,
    lng: 139.3267,
    membersCount: 16,
    mayorName: '小泉 雄一',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'fussa-base-noise-safety-2025-06-06',
    hotTopic: '横田基地周辺の騒音と安全',
    mainIssues: [
      { theme: 'safety', label: '横田基地周辺の騒音と安全', count: 1 },
    ],
    sourceUrl: 'https://www.city.fussa.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/6/6｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'komae-city',
    name: '狛江市議会',
    type: 'city',
    lat: 35.6342,
    lng: 139.5787,
    membersCount: 20,
    mayorName: '綾部 けんじ',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'komae-childcare-support-2025-03-04',
    hotTopic: '子育て支援の充実',
    mainIssues: [
      { theme: 'child', label: '子育て支援の充実', count: 1 },
    ],
    sourceUrl: 'https://www.city.komae.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/3/4｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'higashikurume-city',
    name: '東久留米市議会',
    type: 'city',
    lat: 35.758,
    lng: 139.5299,
    membersCount: 22,
    mayorName: '前田 進',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'higashikurume-elderly-disaster-2025-09-02',
    hotTopic: '高齢者福祉と防災対策',
    mainIssues: [
      { theme: 'safety', label: '高齢者福祉と防災対策', count: 1 },
    ],
    sourceUrl: 'https://www.city.higashikurume.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/9/2｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'inagi-city',
    name: '稲城市議会',
    type: 'city',
    lat: 35.6379,
    lng: 139.5046,
    membersCount: 22,
    mayorName: '小泉 陽平',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'inagi-station-childcare-2025-06-05',
    hotTopic: '稲城駅周辺のまちづくりと子育て',
    mainIssues: [
      { theme: 'child', label: '稲城駅周辺のまちづくりと子育て', count: 1 },
    ],
    sourceUrl: 'https://www.city.inagi.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/6/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'hamura-city',
    name: '羽村市議会',
    type: 'city',
    lat: 35.7672,
    lng: 139.311,
    membersCount: 14,
    mayorName: '小泉 伸',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'hamura-water-source-2025-03-03',
    hotTopic: '水源保全と環境施策',
    mainIssues: [
      { theme: 'safety', label: '水源保全と環境施策', count: 1 },
    ],
    sourceUrl: 'https://www.city.hamura.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/3/3｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'akiruno-city',
    name: 'あきる野市議会',
    type: 'city',
    lat: 35.7286,
    lng: 139.2945,
    membersCount: 20,
    mayorName: '二宮 勉',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'akiruno-mountain-disaster-2025-09-03',
    hotTopic: '中山間地域の防災対策',
    mainIssues: [
      { theme: 'safety', label: '中山間地域の防災対策', count: 1 },
    ],
    sourceUrl: 'https://www.city.akiruno.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/9/3｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'nishitokyo-city',
    name: '西東京市議会',
    type: 'city',
    lat: 35.7255,
    lng: 139.5382,
    membersCount: 26,
    mayorName: '西川 健',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'nishitokyo-merged-childcare-2025-03-07',
    hotTopic: '合併後の子育て支援一体運営',
    mainIssues: [
      { theme: 'child', label: '合併後の子育て支援一体運営', count: 1 },
    ],
    sourceUrl: 'https://www.city.nishitokyo.tokyo.dbsr.jp/index.php/',
    lastMeetingDate: '2025/3/7｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'minato-ward',
    name: '港区議会',
    type: 'ward',
    lat: 35.6581,
    lng: 139.7514,
    membersCount: 34,
    mayorName: '清家 愛',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'minato-school-environment-2025-03-05',
    hotTopic: '港区立学校の改築と教育環境',
    mainIssues: [
      { theme: 'child', label: '港区立学校の改築と教育環境', count: 1 },
    ],
    sourceUrl: 'https://gikai2.city.minato.tokyo.jp/voices/index.asp',
    lastMeetingDate: '2025/3/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'adachi-ward',
    name: '足立区議会',
    type: 'ward',
    lat: 35.775,
    lng: 139.8045,
    membersCount: 40,
    mayorName: '米川 大',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'adachi-assembly-ordinance-2025-08-31',
    hotTopic: '議会基本条例と区政の透明性',
    mainIssues: [
      { theme: 'community', label: '議会基本条例と区政の透明性', count: 1 },
    ],
    sourceUrl: 'https://www.gikai-adachi.jp/',
    lastMeetingDate: '2025/8/31｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'setagaya-ward',
    name: '世田谷区議会',
    type: 'ward',
    lat: 35.6464,
    lng: 139.6532,
    membersCount: 50,
    mayorName: '長尾 かおり',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'setagaya-childcare-demand-2025-03-04',
    hotTopic: '子育て支援と保育需要への対応',
    mainIssues: [
      { theme: 'child', label: '子育て支援と保育需要への対応', count: 1 },
    ],
    sourceUrl: 'https://kugi.city.setagaya.tokyo.jp/',
    lastMeetingDate: '2025/3/4｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'chofu-city',
    name: '調布市議会',
    type: 'city',
    lat: 35.6517,
    lng: 139.5405,
    membersCount: 28,
    mayorName: '柄澤 伸',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'chofu-childcare-facilities-2025-03-03',
    hotTopic: '子育て支援と保育施設整備',
    mainIssues: [
      { theme: 'child', label: '子育て支援と保育施設整備', count: 1 },
    ],
    sourceUrl: 'https://chofucity.gijiroku.com/voices/',
    lastMeetingDate: '2025/3/3｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'suginami-ward',
    name: '杉並区議会',
    type: 'ward',
    lat: 35.6995,
    lng: 139.6364,
    membersCount: 44,
    mayorName: '宮口 治男',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'suginami-childcare-support-2025-05-26',
    hotTopic: '子育て支援施策の充実',
    mainIssues: [
      { theme: 'child', label: '子育て支援施策の充実', count: 1 },
    ],
    sourceUrl: 'https://suginami.gijiroku.com/voices/',
    lastMeetingDate: '2025/5/26｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'itabashi-ward',
    name: '板橋区議会',
    type: 'ward',
    lat: 35.7512,
    lng: 139.709,
    membersCount: 44,
    mayorName: '前川 英樹',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'itabashi-education-support-2025-03-04',
    hotTopic: '子育て・教育支援の強化',
    mainIssues: [
      { theme: 'child', label: '子育て・教育支援の強化', count: 1 },
    ],
    sourceUrl: 'https://itabashi.gijiroku.com/voices/',
    lastMeetingDate: '2025/3/4｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'edogawa-ward',
    name: '江戸川区議会',
    type: 'ward',
    lat: 35.7064,
    lng: 139.8687,
    membersCount: 44,
    mayorName: '齊藤 猛',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'edogawa-child-education-2025-05-27',
    hotTopic: '子ども支援・教育力向上',
    mainIssues: [
      { theme: 'child', label: '子ども支援・教育力向上', count: 1 },
    ],
    sourceUrl: 'https://www.gikai.city.edogawa.tokyo.jp/voices/',
    lastMeetingDate: '2025/5/27｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'taito-ward',
    name: '台東区議会',
    type: 'ward',
    lat: 35.7126,
    lng: 139.7802,
    membersCount: 36,
    mayorName: '小野 たつひこ',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'taito-childcare-welfare-2025-03-06',
    hotTopic: '子育て支援と地域福祉',
    mainIssues: [
      { theme: 'child', label: '子育て支援と地域福祉', count: 1 },
    ],
    sourceUrl: 'https://taito.gijiroku.com/voices/',
    lastMeetingDate: '2025/3/6｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'meguro-ward',
    name: '目黒区議会',
    type: 'ward',
    lat: 35.6414,
    lng: 139.6982,
    membersCount: 36,
    mayorName: '青木 英太',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'meguro-childcare-demand-2025-03-05',
    hotTopic: '子育て支援と保育需要',
    mainIssues: [
      { theme: 'child', label: '子育て支援と保育需要', count: 1 },
    ],
    sourceUrl: 'https://www.kensakusystem.jp/meguro-jimu/index.html',
    lastMeetingDate: '2025/3/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'ota-ward',
    name: '大田区議会',
    type: 'ward',
    lat: 35.5613,
    lng: 139.7161,
    membersCount: 50,
    mayorName: '浦野 直人',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'ota-childcare-medical-2025-03-04',
    hotTopic: '子育て支援と地域医療',
    mainIssues: [
      { theme: 'child', label: '子育て支援と地域医療', count: 1 },
    ],
    sourceUrl: 'https://ota.gijiroku.com/voices/',
    lastMeetingDate: '2025/3/4｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'toshima-ward',
    name: '豊島区議会',
    type: 'ward',
    lat: 35.726,
    lng: 139.7164,
    membersCount: 36,
    mayorName: '高野 順子',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'toshima-childcare-support-2025-03-06',
    hotTopic: '子育て支援施策の充実',
    mainIssues: [
      { theme: 'child', label: '子育て支援施策の充実', count: 1 },
    ],
    sourceUrl: 'https://www.kensakusystem.jp/toshima/',
    lastMeetingDate: '2025/3/6｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'katsushika-ward',
    name: '葛飾区議会',
    type: 'ward',
    lat: 35.7431,
    lng: 139.8472,
    membersCount: 40,
    mayorName: '富樫 博之',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'katsushika-education-support-2025-03-05',
    hotTopic: '子育て・教育支援の強化',
    mainIssues: [
      { theme: 'child', label: '子育て・教育支援の強化', count: 1 },
    ],
    sourceUrl: 'https://www.kensakusystem.jp/katsushika/sapphire.html',
    lastMeetingDate: '2025/3/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'okutama-town',
    name: '奥多摩町議会',
    type: 'town',
    lat: 35.8094,
    lng: 139.0962,
    membersCount: 12,
    mayorName: '村田 富保',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'okutama-mountain-disaster-2025-03-05',
    hotTopic: '中山間地域の防災と住民支援',
    mainIssues: [
      { theme: 'safety', label: '中山間地域の防災と住民支援', count: 1 },
    ],
    sourceUrl: 'https://www.town.okutama.tokyo.jp/gyosei/8/okutamachogikai/kaigiroku/index.html',
    lastMeetingDate: '2025/3/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'oshima-town',
    name: '大島町議会',
    type: 'town',
    lat: 34.7501,
    lng: 139.3554,
    membersCount: 14,
    mayorName: '越知 隆直',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'oshima-island-transport-medical-2025-06-12',
    hotTopic: '離島交通と医療・福祉体制',
    mainIssues: [
      { theme: 'safety', label: '離島交通と医療・福祉体制', count: 1 },
    ],
    sourceUrl: 'https://www.town.oshima.tokyo.jp/soshiki/gikaijim/gikai-kekka.html',
    lastMeetingDate: '2025/6/12｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'hachijo-town',
    name: '八丈町議会',
    type: 'town',
    lat: 33.1126,
    lng: 139.7887,
    membersCount: 14,
    mayorName: '姉川 信行',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'hachijo-island-medical-welfare-2025-03-07',
    hotTopic: '離島の医療・福祉確保',
    mainIssues: [
      { theme: 'safety', label: '離島の医療・福祉確保', count: 1 },
    ],
    sourceUrl: 'https://www.town.hachijo.tokyo.jp/chousei/chougikai/katsushin/shingi-kekka/',
    lastMeetingDate: '2025/3/7｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'miyake-village',
    name: '三宅村議会',
    type: 'village',
    lat: 34.0762,
    lng: 139.5183,
    membersCount: 6,
    mayorName: '加藤 宏明',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'miyake-island-disaster-life-2025-03-06',
    hotTopic: '離島の防災と生活基盤',
    mainIssues: [
      { theme: 'safety', label: '離島の防災と生活基盤', count: 1 },
    ],
    sourceUrl: 'https://www.vill.miyake.tokyo.jp/kakuka/gikai/',
    lastMeetingDate: '2025/3/6｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'higashimurayama-city',
    name: '東村山市議会',
    type: 'city',
    lat: 35.7545,
    lng: 139.4685,
    membersCount: 25,
    mayorName: '渡部 尚',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'higashimurayama-childcare-welfare-2025-03-05',
    hotTopic: '子育て支援と地域福祉',
    mainIssues: [
      { theme: 'child', label: '子育て支援と地域福祉', count: 1 },
    ],
    sourceUrl: 'https://www.city.higashimurayama.tokyo.jp/gikai/gikaijoho/kensaku/index.html',
    lastMeetingDate: '2025/3/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'mizuho-town',
    name: '瑞穂町議会',
    type: 'town',
    lat: 35.7719,
    lng: 139.3544,
    membersCount: 16,
    mayorName: '山崎 栄',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'mizuho-rural-transport-life-2025-03-06',
    hotTopic: '中山間地域の交通と生活支援',
    mainIssues: [
      { theme: 'community', label: '中山間地域の交通と生活支援', count: 1 },
    ],
    sourceUrl: 'https://www.town.mizuho.tokyo.jp/gikai/',
    lastMeetingDate: '2025/3/6｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'hinode-town',
    name: '日の出町議会',
    type: 'town',
    lat: 35.7424,
    lng: 139.2589,
    membersCount: 14,
    mayorName: '東 亨',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'hinode-childcare-medical-2025-09-18',
    hotTopic: '子育て支援と地域医療',
    mainIssues: [
      { theme: 'child', label: '子育て支援と地域医療', count: 1 },
    ],
    sourceUrl: 'https://www.town.hinode.tokyo.jp/0000004135.html',
    lastMeetingDate: '2025/9/18｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'hinohara-village',
    name: '檜原村議会',
    type: 'village',
    lat: 35.7268,
    lng: 139.1487,
    membersCount: 8,
    mayorName: '吉本 昂二',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'hinohara-mountain-disaster-2025-08-20',
    hotTopic: '中山間地域の防災と住民支援',
    mainIssues: [
      { theme: 'safety', label: '中山間地域の防災と住民支援', count: 1 },
    ],
    sourceUrl: 'https://www.vill.hinohara.tokyo.jp/category/7-0-0-0-0-0-0-0-0-0.html',
    lastMeetingDate: '2025/8/20｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'toshima-village',
    name: '利島村議会',
    type: 'village',
    lat: 34.5292,
    lng: 139.2824,
    membersCount: 6,
    mayorName: '村山 将人',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'toshima-island-life-medical-2025-03-05',
    hotTopic: '離島の生活基盤と医療体制',
    mainIssues: [
      { theme: 'safety', label: '離島の生活基盤と医療体制', count: 1 },
    ],
    sourceUrl: 'https://www.toshimamura.org/about/assembly.html',
    lastMeetingDate: '2025/3/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'niijima-village',
    name: '新島村議会',
    type: 'village',
    lat: 34.3772,
    lng: 139.2567,
    membersCount: 10,
    mayorName: '大沼 弘一',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'niijima-island-transport-tourism-2025-03-06',
    hotTopic: '離島交通と観光・産業振興',
    mainIssues: [
      { theme: 'safety', label: '離島交通と観光・産業振興', count: 1 },
    ],
    sourceUrl: 'https://www.niijima.com/gikai/',
    lastMeetingDate: '2025/3/6｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'kozushima-village',
    name: '神津島村議会',
    type: 'village',
    lat: 34.2055,
    lng: 139.1348,
    membersCount: 8,
    mayorName: '前田 弘',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'kozushima-island-medical-welfare-2025-03-07',
    hotTopic: '離島の医療・福祉確保',
    mainIssues: [
      { theme: 'safety', label: '離島の医療・福祉確保', count: 1 },
    ],
    sourceUrl: 'https://www.vill.kouzushima.tokyo.jp/category/gikai/',
    lastMeetingDate: '2025/3/7｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'mikurajima-village',
    name: '御蔵島村議会',
    type: 'village',
    lat: 33.8751,
    lng: 139.5936,
    membersCount: 6,
    mayorName: '小山 健司',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'mikurajima-island-life-base-2025-03-05',
    hotTopic: '離島の生活基盤維持',
    mainIssues: [
      { theme: 'safety', label: '離島の生活基盤維持', count: 1 },
    ],
    sourceUrl: 'https://www.vill.mikurasima.tokyo.jp/section/gyosei/gikai.html',
    lastMeetingDate: '2025/3/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'aogashima-village',
    name: '青ヶ島村議会',
    type: 'village',
    lat: 32.4672,
    lng: 139.7636,
    membersCount: 6,
    mayorName: '佐々木 宏',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'aogashima-island-disaster-infra-2025-09-05',
    hotTopic: '離島の防災と生活インフラ',
    mainIssues: [
      { theme: 'safety', label: '離島の防災と生活インフラ', count: 1 },
    ],
    sourceUrl: 'https://www.vill.aogashima.tokyo.jp/',
    lastMeetingDate: '2025/9/5｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
  {
    id: 'ogasawara-village',
    name: '小笠原村議会',
    type: 'village',
    lat: 27.0943,
    lng: 142.1918,
    membersCount: 8,
    mayorName: '渋谷 正昭',
    openDataStatus: 'ready',
    totalMinutesCount: 1,
    featuredDiscussionId: 'ogasawara-island-medical-education-2025-03-06',
    hotTopic: '離島の医療・教育・生活基盤',
    mainIssues: [
      { theme: 'safety', label: '離島の医療・教育・生活基盤', count: 1 },
    ],
    sourceUrl: 'https://www.vill.ogasawara.tokyo.jp/gikai/',
    lastMeetingDate: '2025/3/6｜定例会',
    lastUpdatedDate: '2026/09/02',
  },
];

const THEME_OPTIONS: readonly { id: IssueTheme; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'すべてのテーマ', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'children', label: '子育て・教育', icon: <Baby className="w-3.5 h-3.5" /> },
  { id: 'digital', label: '行政DX・AI', icon: <Laptop className="w-3.5 h-3.5" /> },
  { id: 'health', label: '医療・福祉', icon: <HeartPulse className="w-3.5 h-3.5" /> },
  { id: 'housing', label: '住まい・まちづくり', icon: <Building className="w-3.5 h-3.5" /> },
  { id: 'transport', label: '交通', icon: <Building className="w-3.5 h-3.5" /> },
  { id: 'economy', label: '暮らし・経済', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'safety', label: '防災・安全', icon: <HeartPulse className="w-3.5 h-3.5" /> },
  { id: 'community', label: '地域・環境', icon: <MapPin className="w-3.5 h-3.5" /> },
];

function getThemeKeyword(theme: IssueTheme): string | undefined {
  switch (theme) {
    case 'children':
      return '子育て支援・給食費無償化';
    case 'digital':
      return '行政DX・スマホ手続き';
    case 'housing':
      return '都市再開発・交通インフラ';
    case 'health':
      return '医療体制・休日診療';
    default:
      return undefined;
  }
}

function validateFeaturedRecord(
  assembly: Assembly,
  payload: AssemblyRecordsResponse,
): AssemblyRecord {
  const record = payload.records.find((candidate) => (
    candidate.discussion_id === assembly.featuredDiscussionId
  ));
  if (
    payload.assembly_id !== assembly.id
    || payload.assembly_name !== assembly.name
    || record?.discussion_id !== assembly.featuredDiscussionId
    || !record.topic.trim()
    || !record.meeting_date.trim()
    || record.statements.length === 0
  ) {
    throw new Error(`Featured discussion mismatch: ${assembly.id}`);
  }
  return record;
}

export default function Home() {
  const router = useRouter();
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string>('all');
  const [myAreaHydrated, setMyAreaHydrated] = useState(false);
  const [userTheme, setUserTheme] = useState<IssueTheme>('all');
  const [selectedAssemblyForModal, setSelectedAssemblyForModal] = useState<Assembly | null>(null);
  const [modalInitialTheme, setModalInitialTheme] = useState<string | undefined>();
  const [modalInitialDiscussionId, setModalInitialDiscussionId] = useState<string | undefined>();
  const [modalInitialRecord, setModalInitialRecord] = useState<AssemblyRecord | undefined>();
  const [featuredRecords, setFeaturedRecords] = useState<Record<string, AssemblyRecord>>({});
  const [showMapExplorer, setShowMapExplorer] = useState(false);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [followedTopics, setFollowedTopics] = useState<FollowedTopic[]>([]);
  const [showMyFollows, setShowMyFollows] = useState(false);
  const [followsLoading, setFollowsLoading] = useState(true);
  const [followsError, setFollowsError] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [openedFollowSnapshot, setOpenedFollowSnapshot] = useState<FollowedTopic | null>(null);
  const [issueCatalog, setIssueCatalog] = useState<IssueCatalogResponse | null>(null);
  const [issueCatalogLoading, setIssueCatalogLoading] = useState(true);
  const [issueCatalogError, setIssueCatalogError] = useState<string | null>(null);
  const [issueCatalogReload, setIssueCatalogReload] = useState(0);
  const [regionRequestAssembly, setRegionRequestAssembly] = useState<Assembly | null>(null);
  const directIssueOpenedRef = useRef(false);
  const viewedFollowRef = useRef<string | null>(null);
  const [officialStats, setOfficialStats] = useState({
    openDataSourceCount: 7,
    assemblyCount: 7,
    catalogIssueCount: 0,
    statementCount: 367,
    updatedAt: '2026/08/24',
  });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const validAssemblyIds = TOKYO_ASSEMBLIES.map((assembly) => assembly.id);
      setSelectedAssemblyId(loadMyArea(window.localStorage, validAssemblyIds));
      setMyAreaHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!myAreaHydrated) return;
    saveMyArea(window.localStorage, selectedAssemblyId);
  }, [myAreaHydrated, selectedAssemblyId]);

  useEffect(() => {
    const controller = new AbortController();
    const apiBase = getApiBase();

    void fetch(`${apiBase}/api/assembly-records/stats`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!payload) return;
        setOfficialStats({
          openDataSourceCount: payload.open_data_source_count,
          assemblyCount: payload.assembly_count,
          catalogIssueCount: payload.catalog_issue_count ?? 0,
          statementCount: payload.statement_count,
          updatedAt: payload.updated_at?.slice(0, 10).replaceAll('-', '/') || '2026/08/24',
        });
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const apiBase = getApiBase();
    void fetch(`${apiBase}/api/issues`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Issue catalog API failed: ${response.status}`);
        return response.json() as Promise<IssueCatalogResponse>;
      })
      .then((payload) => {
        if (!controller.signal.aborted) setIssueCatalog(payload);
      })
      .catch(() => {
        if (!controller.signal.aborted) setIssueCatalogError('議題を取得できませんでした');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIssueCatalogLoading(false);
      });
    return () => controller.abort();
  }, [issueCatalogReload]);

  useEffect(() => {
    const controller = new AbortController();
    const apiBase = getApiBase();

    const loadFeaturedRecords = async () => {
      const loaded: Record<string, AssemblyRecord> = {};
      await Promise.all(TOKYO_ASSEMBLIES.map(async (assembly) => {
        const query = new URLSearchParams({
          assembly_id: assembly.id,
          discussion_id: assembly.featuredDiscussionId,
          // The production API may temporarily be one deployment behind and ignore
          // discussion_id. Fetch enough records to locate the same stable ID client-side.
          limit: '100',
        });
        try {
          const response = await fetch(`${apiBase}/api/assembly-records?${query.toString()}`, {
            cache: 'no-store',
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(`Assembly record API failed: ${response.status}`);
          const payload = await response.json() as AssemblyRecordsResponse;
          loaded[assembly.id] = validateFeaturedRecord(assembly, payload);
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error('Featured discussion could not be loaded', assembly.id, error);
        }
      }));
      if (controller.signal.aborted) return;
      setFeaturedRecords(loaded);
    };

    void loadFeaturedRecords();
    return () => controller.abort();
  }, []);

  const refreshFollows = useCallback(async () => {
    setFollowsLoading(true);
    setFollowsError(null);
    try {
      setFollowedTopics(await listFirestoreFollows());
    } catch {
      setFollowsError('フォロー中の議題を取得できませんでした');
    } finally {
      setFollowsLoading(false);
    }
  }, []);

  const refreshNotificationInbox = useCallback(async () => {
    try {
      setUnreadNotificationCount(await getUnreadNotificationCount());
    } catch {
      setUnreadNotificationCount(0);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const migrateAndLoadFollows = async () => {
      try {
        const legacyFollows = loadFollowedTopics(window.localStorage);
        if (legacyFollows.length > 0) {
          await Promise.all(legacyFollows.map((follow) => putFirestoreFollow(follow.discussion_id)));
          window.localStorage.removeItem(FOLLOWED_TOPICS_STORAGE_KEY);
        }
        if (!cancelled) await refreshFollows();
      } catch {
        if (!cancelled) {
          setFollowsLoading(false);
          setFollowsError('フォロー中の議題を取得できませんでした');
        }
      }
    };
    void migrateAndLoadFollows();
    return () => { cancelled = true; };
  }, [refreshFollows]);

  useEffect(() => {
    void refreshNotificationInbox();
  }, [refreshNotificationInbox, showMyFollows]);

  // 地図表示用（実データ公開中の議会 + 導入リクエスト受付中の地域）
  const mapAssemblies = useMemo(() => {
    const all = mergeTokyoAssemblies(TOKYO_ASSEMBLIES);
    if (selectedAssemblyId === 'all') return all;
    return all.filter((assembly) => assembly.id === selectedAssemblyId);
  }, [selectedAssemblyId]);

  // 選択中の自治体情報
  const currentSelectedAssembly = useMemo(() => {
    return TOKYO_ASSEMBLIES.find((a) => a.id === selectedAssemblyId) || null;
  }, [selectedAssemblyId]);

  const openAssemblyModal = (
    assembly: Assembly,
    initialTheme = getThemeKeyword(userTheme),
    initialDiscussionId?: string,
  ) => {
    if (!isAssemblyReady(assembly)) {
      setRegionRequestAssembly(assembly);
      return;
    }
    const featuredRecord = featuredRecords[assembly.id];
    const selectedRecord = featuredRecord?.discussion_id === initialDiscussionId
      || initialDiscussionId === undefined
      ? featuredRecord
      : undefined;
    setModalInitialTheme(initialTheme);
    setModalInitialDiscussionId(
      initialDiscussionId || selectedRecord?.discussion_id || assembly.featuredDiscussionId,
    );
    const issueId = initialDiscussionId || selectedRecord?.discussion_id || assembly.featuredDiscussionId;
    setOpenedFollowSnapshot(
      followedTopics.find((follow) => follow.issue_id === issueId) || null,
    );
    setModalInitialRecord(selectedRecord);
    setSelectedAssemblyForModal(assembly);
  };

  const handleMyAreaChange = (assemblyId: string) => {
    if (assemblyId === 'all') {
      setSelectedAssemblyId('all');
      return;
    }
    const assembly = TOKYO_ASSEMBLIES.find((item) => item.id === assemblyId)
      || TOKYO_PLANNED_ASSEMBLIES.find((item) => item.id === assemblyId);
    if (assembly && !isAssemblyReady(assembly)) {
      setRegionRequestAssembly(assembly);
      return;
    }
    setSelectedAssemblyId(assemblyId);
  };

  useEffect(() => {
    if (directIssueOpenedRef.current) return;
    const match = window.location.pathname.match(/^\/issues\/([^/]+)\/?$/);
    if (!match) return;
    const issueId = decodeURIComponent(match[1]);
    const questionIssue = getCitizenQuestionByIssueId(issueId);
    const catalogIssue = issueCatalog?.issues.find((item) => item.issue_id === issueId);
    const assemblyId = questionIssue?.assemblyId || catalogIssue?.assembly_id;
    const assembly = TOKYO_ASSEMBLIES.find((item) => item.id === assemblyId);
    if (!assemblyId || !assembly) return;
    directIssueOpenedRef.current = true;
    const record = featuredRecords[assembly.id];
    queueMicrotask(() => {
      setModalInitialTheme(questionIssue?.theme || catalogIssue?.theme.label);
      setModalInitialDiscussionId(issueId);
      setModalInitialRecord(record?.discussion_id === issueId ? record : undefined);
      setSelectedAssemblyForModal(assembly);
    });
  }, [featuredRecords, issueCatalog]);

  useEffect(() => {
    if (!selectedAssemblyForModal || !modalInitialDiscussionId) return;
    const followed = followedTopics.find(
      (follow) => follow.issue_id === modalInitialDiscussionId,
    );
    if (!followed || viewedFollowRef.current === modalInitialDiscussionId) return;
    viewedFollowRef.current = modalInitialDiscussionId;
    if (!openedFollowSnapshot) {
      queueMicrotask(() => setOpenedFollowSnapshot(followed));
    }
    void markFirestoreFollowViewed(modalInitialDiscussionId)
      .then(refreshFollows)
      .catch(() => {
        viewedFollowRef.current = null;
        setFollowsError('フォローの既読状態を更新できませんでした。');
      });
  }, [followedTopics, modalInitialDiscussionId, openedFollowSnapshot, refreshFollows, selectedAssemblyForModal]);

  const openSickChildCareDemo = () => {
    const shinjukuAssembly = TOKYO_ASSEMBLIES.find((assembly) => assembly.id === 'shinjuku-ward');
    if (!shinjukuAssembly) return;
    openAssemblyModal(shinjukuAssembly, '病児保育', 'shinjuku-sick-child-care-2026-06-10');
  };

  const openCatalogIssue = (issue: IssueCatalogItem) => {
    const assembly = TOKYO_ASSEMBLIES.find((item) => item.id === issue.assembly_id);
    if (!assembly) return;
    openAssemblyModal(assembly, issue.theme.label, issue.issue_id);
  };

  const openCatalogIssueById = (issueId: string) => {
    const issue = issueCatalog?.issues.find((item) => item.issue_id === issueId);
    if (!issue) return;
    openCatalogIssue(issue);
    setShowMyFollows(false);
  };

  const selectCatalogAssembly = (assemblyId: string) => {
    setSelectedAssemblyId(assemblyId);
    window.setTimeout(() => document.getElementById('issue-list')?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  const handleToggleFollowTopic = async (topic: FollowTopicInput): Promise<boolean> => {
    try {
      const alreadyFollowed = followedTopics.some(
        (follow) => follow.issue_id === topic.discussion_id,
      );
      if (alreadyFollowed) {
        await deleteFirestoreFollow(topic.discussion_id);
        setFollowedTopics((current) => current.filter(
          (follow) => follow.issue_id !== topic.discussion_id,
        ));
      } else {
        await putFirestoreFollow(topic.discussion_id);
        unlockCitizenBadge('first_follow');
      }
      await refreshFollows();
      return true;
    } catch {
      return false;
    }
  };

  const openFollowedTopic = (followedTopic: FollowedTopic) => {
    const assembly = TOKYO_ASSEMBLIES.find((item) => item.id === followedTopic.assembly_id);
    if (!assembly) return;
    setOpenedFollowSnapshot(followedTopic);
    openAssemblyModal(assembly, followedTopic.theme_name, followedTopic.discussion_id);
    setShowMyFollows(false);
  };

  const deleteFollow = async (followedTopic: FollowedTopic): Promise<boolean> => {
    try {
      await deleteFirestoreFollow(followedTopic.issue_id);
      setFollowedTopics((current) => current.filter(
        (follow) => follow.issue_id !== followedTopic.issue_id,
      ));
      await refreshFollows();
      return true;
    } catch {
      return false;
    }
  };

  const unreadFollowCount = followedTopics.filter((follow) => follow.has_new_status).length;

  return (
    <main className="min-h-screen flex flex-col pb-16 md:pb-0 dark:bg-slate-950 dark:text-slate-100 bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-200">
      {/* 共通ヘッダー */}
      <Header
        onOpenFollows={() => setShowMyFollows(true)}
        followCount={followsLoading || followsError ? null : followedTopics.length}
        unreadFollowCount={followsError ? 0 : unreadFollowCount}
        unreadNotificationCount={unreadNotificationCount}
        followUnavailable={Boolean(followsError)}
      />
      <MobileBottomNavigation
        onOpenFollows={() => setShowMyFollows(true)}
        followCount={followsLoading || followsError ? null : followedTopics.length}
        unreadFollowCount={followsError ? 0 : unreadFollowCount}
        followUnavailable={Boolean(followsError)}
      />
      <OnboardingTour />

      {!followsError && unreadFollowCount > 0 && (
        <button
          type="button"
          onClick={() => setShowMyFollows(true)}
          data-testid="follow-update-notice"
          className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-4xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          フォロー中の議題に新しい動きがあります
        </button>
      )}

      {/* メインヒーローセクション */}
      <section className="px-4 pt-10 pb-8 sm:pt-14 sm:pb-10 max-w-4xl w-full mx-auto flex flex-col items-center text-center">
        <h2 className="text-2xl sm:text-4xl font-bold dark:text-white text-slate-900 tracking-tight leading-tight">
          自分の街で、自分の生活に関係する議論を3分で確認できます。
        </h2>
        <p className="text-sm sm:text-lg font-bold dark:text-slate-200 text-slate-800 mt-3 max-w-2xl leading-relaxed">
          声を上げられる人だけで、政策が決まっていませんか？
        </p>
        <p className="text-xs sm:text-sm font-semibold dark:text-slate-300 text-slate-700 mt-2 max-w-2xl leading-relaxed">
          選挙だけでは届かない、日々暮らす市民の意思を政策へ。
        </p>
        <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          マチボイスは、議会の一次情報を「知る・確かめる・意思を示す」までつなぎ、沈黙していた多数の市民を政策形成に戻す参加基盤です。
        </p>

        <p className="mt-4 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-wide">
          知る → 確かめる → 声を届ける
        </p>

        <div className="mt-5 flex flex-col items-center gap-2" data-hide-in-education>
          <button
            onClick={openSickChildCareDemo}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-md"
          >
            <MessageSquare className="w-4 h-4" />
            <span>実データのデモを見る</span>
          </button>
          <span className="text-xs font-semibold dark:text-slate-300 text-slate-700">
            新宿区｜病児保育の予約・受入問題
          </span>
        </div>

        <p className="mt-4 max-w-2xl text-xs sm:text-sm font-semibold dark:text-slate-300 text-slate-700 leading-relaxed">
          AI要約は機能です。市民参加の偏りを正し、民主主義に参加者を取り戻すことがプロダクトです。
        </p>
        <p className="mt-1.5 max-w-2xl text-[11px] sm:text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
          異なる形式の会議録を発言単位に構造化し、議員・日時・議題・原文を保持したままAI要約しています。
        </p>

        {/* 2ステップ選択カード */}
        <div className="w-full mt-6 sm:mt-8 p-4 sm:p-5 dark:bg-slate-900/90 dark:border-slate-800 bg-white border-slate-200 border rounded-2xl shadow-xl space-y-4 text-left">
          {/* Step 1: 地域を選ぶ */}
          <div id="my-area-selector" className="space-y-2 scroll-mt-20">
            <label className="text-xs font-semibold dark:text-slate-300 text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Step 1: あなたの街を選ぶ</span>
            </label>
            <div className="relative">
              <select
                value={selectedAssemblyId}
                onChange={(e) => handleMyAreaChange(e.target.value)}
                className="w-full dark:bg-slate-950 dark:border-slate-700/80 dark:text-white bg-slate-50 border-slate-300 text-slate-900 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer pr-10 font-medium transition-colors"
              >
                <option value="all">東京都全域（現在{officialStats.assemblyCount}議会の実データを公開中）</option>
                <optgroup label="実データ公開中">
                  {TOKYO_ASSEMBLIES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type === 'national' ? '国会' : a.type === 'prefecture' ? '都議会' : a.type === 'ward' ? '特別区' : '市'})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="導入リクエスト受付中">
                  {TOKYO_PLANNED_ASSEMBLIES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name.replace(/議会$/, '')}（準備中）
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            {myAreaHydrated && selectedAssemblyId !== 'all' && (
              <p data-testid="my-area-saved" className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                Myエリアとして記憶しました。次回もこの地域から表示します。
              </p>
            )}
          </div>

          {/* Step 2: 関心のあるテーマを選ぶ */}
          <div className="space-y-2 pt-2 border-t dark:border-slate-800/80 border-slate-200">
            <label className="text-xs font-semibold dark:text-slate-300 text-slate-700 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Step 2: 気になるテーマを選ぶ</span>
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = userTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setUserTheme(theme.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                        : 'dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 border'
                    }`}
                  >
                    {theme.icon}
                    <span>{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t dark:border-slate-800/80 border-slate-200 text-xs">
            <span className="text-[11px] dark:text-slate-400 text-slate-500">
              選んだ地域・テーマに合わせて、下の議題一覧を絞り込めます。
            </span>
          </div>
        </div>

        {/* 東京都全域 議会オープンデータ構造化実績 (数字の証拠) */}
        <div className="w-full mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left" data-hide-in-education>
          <div className="dark:bg-slate-900/90 bg-white border dark:border-slate-800 border-slate-200 p-3 rounded-xl shadow-sm">
            <div className="text-[10px] dark:text-slate-400 text-slate-500 font-semibold mb-1">公開中の議題</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{issueCatalog?.total_catalog_issue_count || officialStats.catalogIssueCount || '—'}<span className="text-[10px] text-slate-500 font-normal ml-1">件</span></div>
          </div>
          <div className="dark:bg-slate-900/90 bg-white border dark:border-slate-800 border-slate-200 p-3 rounded-xl shadow-sm">
            <div className="text-[10px] dark:text-slate-400 text-slate-500 font-semibold mb-1">実データ接続</div>
            <div className="text-lg font-bold dark:text-white text-slate-900">{officialStats.assemblyCount}<span className="text-[10px] text-slate-500 font-normal ml-1">議会</span></div>
          </div>
          <div className="dark:bg-slate-900/90 bg-white border dark:border-slate-800 border-slate-200 p-3 rounded-xl shadow-sm">
            <div className="text-[10px] dark:text-slate-400 text-slate-500 font-semibold mb-1">原文照合済み発言</div>
            <div className="text-lg font-bold dark:text-white text-slate-900">{officialStats.statementCount}<span className="text-[10px] text-slate-500 font-normal ml-1">件</span></div>
          </div>
          <div className="dark:bg-slate-900/90 bg-white border dark:border-slate-800 border-slate-200 p-3 rounded-xl shadow-sm">
            <div className="text-[10px] dark:text-slate-400 text-slate-500 font-semibold mb-1">最終データ更新</div>
            <div className="text-sm font-bold dark:text-white text-slate-900 mt-1">{officialStats.updatedAt}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-12">
        <IssueExplorer
          assemblies={TOKYO_ASSEMBLIES}
          issues={issueCatalog?.issues || []}
          themes={issueCatalog?.themes || []}
          loading={issueCatalogLoading}
          error={issueCatalogError}
          selectedAssemblyId={selectedAssemblyId}
          selectedTheme={userTheme}
          followedIssueIds={followedTopics.map((topic) => topic.issue_id)}
          onSelectAssembly={selectCatalogAssembly}
          onSelectTheme={(themeId) => setUserTheme(themeId as IssueTheme)}
          onOpenIssue={openCatalogIssue}
          onRetry={() => {
            setIssueCatalogLoading(true);
            setIssueCatalogError(null);
            setIssueCatalogReload((value) => value + 1);
          }}
        />
      </section>

      {/* セカンダリセクション: 地図 & 都内全市区町村から探す */}
      <section className="dark:bg-slate-900/60 dark:border-slate-800 bg-slate-100/70 border-slate-200 border-t py-8 px-4" data-hide-in-education>
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold dark:text-white text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>地図・全リストから探す</span>
              </h3>
              <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
                都内62市区町村＋都議会の実データを地図で確認できます
              </p>
            </div>

            <button
              onClick={() => setShowMapExplorer(!showMapExplorer)}
              className="px-3 py-1.5 rounded-lg dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 border-slate-200 border text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>{showMapExplorer ? '折りたたむ' : '表示する'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMapExplorer ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showMapExplorer && (
            <div className="space-y-4 pt-2">
              <div
                data-testid="region-request-banner"
                className="rounded-xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100"
              >
                点線ピンの地域は準備中です。ピンまたは一覧から「導入リクエスト」を送ると、公開優先度の参考にします。
              </div>
              {/* モバイル切り替え */}
              <div className="lg:hidden dark:bg-slate-900 bg-white p-1 rounded-xl border dark:border-slate-800 border-slate-200 flex items-center gap-1">
                <button
                  onClick={() => setMobileView('map')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    mobileView === 'map' ? 'bg-emerald-600 text-white shadow-sm' : 'dark:text-slate-400 text-slate-600'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>マップ表示</span>
                </button>
                <button
                  onClick={() => setMobileView('list')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    mobileView === 'list' ? 'bg-emerald-600 text-white shadow-sm' : 'dark:text-slate-400 text-slate-600'
                  }`}
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  <span>一覧表示</span>
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 items-start">
                <div className={`flex-1 w-full ${mobileView === 'map' ? 'block' : 'hidden lg:block'}`}>
                  <AssemblyMap
                    assemblies={mapAssemblies}
                    selectedAssemblyId={currentSelectedAssembly?.id || regionRequestAssembly?.id || null}
                    onSelectAssembly={(assembly) => openAssemblyModal(assembly)}
                  />
                </div>

                <div className={`w-full lg:w-auto ${mobileView === 'list' ? 'block' : 'hidden lg:block'}`}>
                  <AssemblyListDrawer
                    assemblies={mapAssemblies}
                    selectedAssemblyId={currentSelectedAssembly?.id || regionRequestAssembly?.id || null}
                    onSelectAssembly={(assembly) => openAssemblyModal(assembly)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* LINE風対話モーダル */}
      {selectedAssemblyForModal && (
        <LineChatModal
          key={`${selectedAssemblyForModal.id}:${modalInitialDiscussionId || 'latest'}`}
          assembly={selectedAssemblyForModal}
          initialTheme={modalInitialTheme}
          initialDiscussionId={modalInitialDiscussionId}
          initialRecord={modalInitialRecord}
          followStatusSnapshot={openedFollowSnapshot || undefined}
          followedDiscussionIds={followedTopics.map((topic) => topic.discussion_id)}
          onToggleFollowTopic={handleToggleFollowTopic}
          onClose={() => {
            viewedFollowRef.current = null;
            setOpenedFollowSnapshot(null);
            setSelectedAssemblyForModal(null);
          }}
          onOpenDashboard={() => {
            const issueId = modalInitialDiscussionId
              || modalInitialRecord?.discussion_id
              || selectedAssemblyForModal.featuredDiscussionId;
            const query = new URLSearchParams({
              assembly_id: selectedAssemblyForModal.id,
              issue_id: issueId,
            });
            router.push(`/pro/analytics?${query.toString()}`);
          }}
        />
      )}

      {regionRequestAssembly && (
        <RegionRequestModal
          assembly={regionRequestAssembly}
          onClose={() => setRegionRequestAssembly(null)}
        />
      )}

      {showMyFollows && (
        <MyFollowModal
          follows={followedTopics}
          loading={followsLoading}
          error={followsError}
          onRetry={() => void refreshFollows()}
          onOpenIssue={openFollowedTopic}
          onOpenIssueById={openCatalogIssueById}
          onNotificationUnreadChange={setUnreadNotificationCount}
          onDelete={deleteFollow}
          onClose={() => setShowMyFollows(false)}
        />
      )}

      {/* フッター */}
      <footer className="border-t dark:border-slate-800 border-slate-200 py-6 px-4 text-center text-xs dark:text-slate-500 text-slate-600 transition-colors">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>マチボイス (MachiVoice) &copy; 2026 - 東京都オープンデータ活用ポータル</span>
          <span>東京都オープンデータカタログサイト API 連携</span>
        </div>
      </footer>
    </main>
  );
}
