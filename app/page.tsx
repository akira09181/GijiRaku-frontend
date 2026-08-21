'use client';

import React, { useState, useMemo } from 'react';
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
    totalMinutesCount: 12450,
    hotTopic: '第2子保育料無償化・高校授業料実質無償化・018サポート',
    mainIssues: [
      { theme: 'child', label: '第2子保育料無償化・018サポート給付', count: 320 },
      { theme: 'dx', label: 'GovTech東京連携・都民ポータル推進', count: 180 },
      { theme: 'redevelop', label: '多摩モノレール延伸・東京ベイeSG', count: 145 },
      { theme: 'medical', label: '休日夜間こども初期診療拡充', count: 110 },
    ],
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
    totalMinutesCount: 4210,
    hotTopic: 'インバウンド対策・繁華街安全推進・子育て家庭支援',
    mainIssues: [
      { theme: 'child', label: '認可外保育施設利用料補助', count: 85 },
      { theme: 'dx', label: '住民票・税証明のLINE申請対応', count: 120 },
      { theme: 'redevelop', label: '新宿駅西口・東口地下広場再編', count: 95 },
      { theme: 'medical', label: '区立健康センター休日診療', count: 45 },
    ],
  },
  {
    id: 'machida-city',
    name: '町田市議会',
    type: 'city',
    lat: 35.5467,
    lng: 139.4386,
    membersCount: 36,
    mayorName: '石阪 丈一',
    openDataStatus: 'ready',
    totalMinutesCount: 3890,
    hotTopic: '多摩モノレール町田方面延伸・中学校給食全員喫食',
    mainIssues: [
      { theme: 'child', label: '中学校給食全員喫食・食育推進', count: 112 },
      { theme: 'dx', label: '電子申請サービス導入・市役所DX', count: 78 },
      { theme: 'redevelop', label: '多摩都市モノレール町田延伸早期着工', count: 134 },
      { theme: 'medical', label: '南多摩急病医療体制の確保', count: 52 },
    ],
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
    totalMinutesCount: 3650,
    hotTopic: '区立小中学校の給食費完全無償化・おむつ定額支給',
    mainIssues: [
      { theme: 'child', label: '小中学校給食費の完全無償化', count: 140 },
      { theme: 'dx', label: 'スマート区役所・マイナポータル連携', count: 90 },
      { theme: 'redevelop', label: '大井町駅周辺・品川駅西口基盤整備', count: 68 },
      { theme: 'medical', label: '病児・病後児保育の区内全域予約', count: 58 },
    ],
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
    totalMinutesCount: 3980,
    hotTopic: 'スタートアップ育成特区・スマートシティ渋谷DX',
    mainIssues: [
      { theme: 'child', label: '渋谷版シブヤフォント・放課後クラブ', count: 76 },
      { theme: 'dx', label: 'LINEによる区民手続き・スマート認証', count: 165 },
      { theme: 'redevelop', label: '渋谷駅周辺100年に一度の再開発', count: 120 },
      { theme: 'medical', label: '地域医療連携・休日夜間診療所', count: 40 },
    ],
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
    totalMinutesCount: 4520,
    hotTopic: '医療用物資備蓄・圏央道インター周辺産業拠点化',
    mainIssues: [
      { theme: 'child', label: '学童保育受入拡大・子ども医療費助成', count: 95 },
      { theme: 'dx', label: '八王子スマートシティ構想推進', count: 82 },
      { theme: 'redevelop', label: '八王子駅南口・集約型都市構造化', count: 88 },
      { theme: 'medical', label: '夜間小児救急医療支援センター', count: 72 },
    ],
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
                <option value="all">東京都（全62市区町村）</option>
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
      </section>

      {/* メインコンテンツ: あなたに関係する議論カードフィード */}
      <section className="px-4 pb-12 max-w-4xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold dark:text-white text-slate-900 flex items-center gap-2">
            <span>あなたの生活に関係する議論</span>
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
                    <span>定例会</span>
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
                    href="https://catalog.data.metro.tokyo.lg.jp/"
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
                都内62市区町村の位置情報および会議録データを地図上で探索できます
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
