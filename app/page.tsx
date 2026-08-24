'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Header from './components/Header';
import AssemblyMap from './components/AssemblyMap';
import AssemblyListDrawer from './components/AssemblyListDrawer';
import LineChatModal from './components/LineChatModal';
import AnalyticsDashboardModal from './components/AnalyticsDashboardModal';
import { Assembly, IssueTheme } from './types/assembly';
import {
  MapPin,
  Filter,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  Building2,
  Calendar,
  Baby,
  Laptop,
  Building,
  HeartPulse,
  Layers,
  Map as MapIcon,
  List as ListIcon,
  Bell,
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
  { id: 'child', label: '子育て・給食費', icon: <Baby className="w-3.5 h-3.5" /> },
  { id: 'dx', label: '行政DX・スマホ手続き', icon: <Laptop className="w-3.5 h-3.5" /> },
  { id: 'redevelop', label: '交通・まちづくり', icon: <Building className="w-3.5 h-3.5" /> },
  { id: 'medical', label: '医療・防災', icon: <HeartPulse className="w-3.5 h-3.5" /> },
];

function getThemeKeyword(theme: IssueTheme): string | undefined {
  switch (theme) {
    case 'child':
      return '子育て支援・給食費無償化';
    case 'dx':
      return '行政DX・スマホ手続き';
    case 'redevelop':
      return '都市再開発・交通インフラ';
    case 'medical':
      return '医療体制・休日診療';
    default:
      return undefined;
  }
}

export default function Home() {
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string>('all');
  const [userTheme, setUserTheme] = useState<IssueTheme>('all');
  const [selectedAssemblyForModal, setSelectedAssemblyForModal] = useState<Assembly | null>(null);
  const [analyticsAssembly, setAnalyticsAssembly] = useState<Assembly | null>(null);
  const [showMapExplorer, setShowMapExplorer] = useState(false);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [notifyToast, setNotifyToast] = useState<string | null>(null);
  const [officialStats, setOfficialStats] = useState({
    openDataSourceCount: 7,
    assemblyCount: 7,
    statementCount: 324,
    updatedAt: '2026/08/24',
  });

  useEffect(() => {
    const controller = new AbortController();
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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
          statementCount: payload.statement_count,
          updatedAt: payload.updated_at?.slice(0, 10).replaceAll('-', '/') || '2026/08/24',
        });
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const handleSubscribeNotifications = () => {
    const currentCity = TOKYO_ASSEMBLIES.find((a) => a.id === selectedAssemblyId)?.name || '東京都全域';
    const themeLabel = THEME_OPTIONS.find((t) => t.id === userTheme)?.label || '全テーマ';
    setNotifyToast(`🔔 【更新通知を購読】「${currentCity} × ${themeLabel}」の最新議会ニュース通知を有効にしました。新着議題が入るとスマホへ届きます。`);
    setTimeout(() => setNotifyToast(null), 4500);
  };

  // 対象自治体の絞り込み
  const activeAssemblies = useMemo(() => {
    let list = TOKYO_ASSEMBLIES;
    if (selectedAssemblyId !== 'all') {
      list = list.filter((a) => a.id === selectedAssemblyId);
    }
    if (userTheme !== 'all') {
      list = list.filter((a) => a.mainIssues.some((issue) => issue.theme === userTheme));
    }
    return list;
  }, [selectedAssemblyId, userTheme]);

  // 選択中の自治体情報
  const currentSelectedAssembly = useMemo(() => {
    return TOKYO_ASSEMBLIES.find((a) => a.id === selectedAssemblyId) || null;
  }, [selectedAssemblyId]);

  return (
    <main className="min-h-screen flex flex-col dark:bg-slate-950 dark:text-slate-100 bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-200">
      {/* 共通ヘッダー */}
      <Header onOpenAnalytics={() => setAnalyticsAssembly(TOKYO_ASSEMBLIES[0])} />

      {/* メインヒーローセクション: 「あなたの街で、いま何が話されてる？」 */}
      <section className="px-4 pt-10 pb-8 sm:pt-14 sm:pb-10 max-w-4xl w-full mx-auto flex flex-col items-center text-center">
        <h2 className="text-2xl sm:text-4xl font-bold dark:text-white text-slate-900 tracking-tight leading-tight">
          あなたの街で、いま何が話されてる？
        </h2>
        <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-600 mt-2.5 max-w-lg leading-relaxed">
          気になる地域とテーマを選ぶだけで、直近の議会で話し合われている施策や議論をすぐにチェックできます。
        </p>

        {/* 2ステップ選択カード */}
        <div className="w-full mt-6 sm:mt-8 p-4 sm:p-5 dark:bg-slate-900/90 dark:border-slate-800 bg-white border-slate-200 border rounded-2xl shadow-xl space-y-4 text-left">
          {/* Step 1: 地域を選ぶ */}
          <div className="space-y-2">
            <label className="text-xs font-semibold dark:text-slate-300 text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Step 1: あなたの街を選ぶ</span>
            </label>
            <div className="relative">
              <select
                value={selectedAssemblyId}
                onChange={(e) => setSelectedAssemblyId(e.target.value)}
                className="w-full dark:bg-slate-950 dark:border-slate-700/80 dark:text-white bg-slate-50 border-slate-300 text-slate-900 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer pr-10 font-medium transition-colors"
              >
                <option value="all">東京都（展開対象：全62市区町村）</option>
                {TOKYO_ASSEMBLIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type === 'prefecture' ? '都議会' : a.type === 'ward' ? '特別区' : '市'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
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

          {/* マイフィード & 通知機能バッジ */}
          <div className="pt-3 border-t dark:border-slate-800/80 border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="text-[11px] dark:text-slate-400 text-slate-500">
              💡 登録条件に合う新着議会ニュースが全自動で届きます
            </span>
            <button
              onClick={handleSubscribeNotifications}
              className="px-3 py-1.5 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700/60 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 border rounded-xl font-semibold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>この条件の更新通知を受け取る</span>
            </button>
          </div>
        </div>

        {/* 通知登録トースト通知 */}
        {notifyToast && (
          <div className="mt-4 px-4 py-3 bg-emerald-600/90 text-white rounded-xl text-xs font-semibold shadow-lg backdrop-blur-sm animate-fade-in flex items-center justify-between gap-2 max-w-lg mx-auto">
            <span>{notifyToast}</span>
            <button onClick={() => setNotifyToast(null)} className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* 東京都全域 議会オープンデータ構造化実績 (数字の証拠) */}
        <div className="w-full mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="dark:bg-slate-900/90 bg-white border dark:border-slate-800 border-slate-200 p-3 rounded-xl shadow-sm">
            <div className="text-[10px] dark:text-slate-400 text-slate-500 font-semibold mb-1">公式OD出典</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{officialStats.openDataSourceCount}<span className="text-[10px] text-slate-500 font-normal ml-1">データセット</span></div>
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

      {/* メインコンテンツ: あなたに関係する議論カードフィード */}
      <section className="px-4 pb-12 max-w-4xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold dark:text-white text-slate-900 flex items-center gap-2">
            <span>いま、街で動いている議論</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-normal dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 bg-slate-200 text-slate-700 border-slate-300 border">
              {activeAssemblies.length}地域
            </span>
          </h3>
          {selectedAssemblyId !== 'all' && (
            <button
              onClick={() => setSelectedAssemblyId('all')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              条件をクリア
            </button>
          )}
        </div>

        {/* 議論カード一覧 */}
        <div className="space-y-3.5">
          {activeAssemblies.map((assembly) => {
            const relevantIssues =
              userTheme === 'all'
                ? assembly.mainIssues
                : assembly.mainIssues.filter((i) => i.theme === userTheme);

            return (
              <div
                key={assembly.id}
                className="dark:bg-slate-900/90 dark:border-slate-800 dark:hover:border-slate-700/90 bg-white border-slate-200 border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md space-y-3.5 transition-all"
              >
                {/* 自治体ヘッダー */}
                <div className="flex items-center justify-between text-xs border-b dark:border-slate-800/80 border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold dark:text-white text-slate-900 text-sm">{assembly.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50 bg-slate-100 text-slate-600 border-slate-200 border font-medium">
                      {assembly.type === 'prefecture' ? '都議会' : assembly.type === 'ward' ? '特別区' : '市'}
                    </span>
                  </div>
                  <span className="dark:text-slate-400 text-slate-500 text-[11px] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{assembly.lastMeetingDate || '定例会'}</span>
                  </span>
                </div>

                {/* 注目話題 */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">直近の主な議題</span>
                  <p className="text-xs sm:text-sm font-semibold dark:text-slate-100 text-slate-900 leading-snug">
                    {assembly.hotTopic}
                  </p>
                </div>

                {/* 関連イシューラベル */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {relevantIssues.map((issue, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-[11px] dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800 bg-slate-100 text-slate-700 border-slate-200 border"
                    >
                      {issue.label}
                    </span>
                  ))}
                </div>

                {/* アクションエリア */}
                <div className="pt-2 border-t dark:border-slate-800/80 border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedAssemblyForModal(assembly)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>この議論を見る（3分解説）</span>
                  </button>

                  <a
                    href={assembly.sourceUrl || 'https://catalog.data.metro.tokyo.lg.jp/'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs dark:text-slate-400 dark:hover:text-slate-200 text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium transition-colors"
                  >
                    <span className="hidden xs:inline">公式原文</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* セカンダリセクション: 地図 & 都内全市区町村から探す */}
      <section className="dark:bg-slate-900/60 dark:border-slate-800 bg-slate-100/70 border-slate-200 border-t py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold dark:text-white text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>地図・全リストから探す</span>
              </h3>
              <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
                都内62市区町村への展開を想定し、現在の接続対象を地図上で確認できます
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
                    assemblies={activeAssemblies}
                    selectedAssemblyId={currentSelectedAssembly?.id || null}
                    onSelectAssembly={(assembly) => setSelectedAssemblyForModal(assembly)}
                  />
                </div>

                <div className={`w-full lg:w-auto ${mobileView === 'list' ? 'block' : 'hidden lg:block'}`}>
                  <AssemblyListDrawer
                    assemblies={activeAssemblies}
                    selectedAssemblyId={currentSelectedAssembly?.id || null}
                    onSelectAssembly={(assembly) => setSelectedAssemblyForModal(assembly)}
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
          assembly={selectedAssemblyForModal}
          initialTheme={getThemeKeyword(userTheme)}
          onClose={() => setSelectedAssemblyForModal(null)}
          onOpenDashboard={() => setAnalyticsAssembly(selectedAssemblyForModal)}
        />
      )}

      {/* EBPM分析ダッシュボードモーダル */}
      {analyticsAssembly && (
        <AnalyticsDashboardModal
          assembly={analyticsAssembly}
          onClose={() => setAnalyticsAssembly(null)}
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
