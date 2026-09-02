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

  // 地図表示用（実データ7議会 + 導入リクエスト受付中55地域）
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
                      {a.name} ({a.type === 'prefecture' ? '都議会' : a.type === 'ward' ? '特別区' : '市'})
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
                都内62市区町村への展開を想定。実データ7議会と、導入リクエスト受付中の地域を地図で確認できます
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
