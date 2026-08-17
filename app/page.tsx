'use client';

import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import ThemeSelector from './components/ThemeSelector';
import AssemblyMap from './components/AssemblyMap';
import AssemblyListDrawer from './components/AssemblyListDrawer';
import LineChatModal from './components/LineChatModal';
import AnalyticsDashboardModal from './components/AnalyticsDashboardModal';
import { Assembly, IssueTheme } from './types/assembly';
import { Map, List, ExternalLink, Info, CheckCircle2 } from 'lucide-react';

/**
 * 東京都内 議会・自治体マスターデータ
 * - 東京都オープンデータカタログ準拠
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

/**
 * テーマ選択に基づくキーワード取得
 */
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
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [analyticsAssembly, setAnalyticsAssembly] = useState<Assembly | null>(null);
  const [userTheme, setUserTheme] = useState<IssueTheme>('all');
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  // テーマ絞り込みに該当する自治体ハイライト
  const filteredAssemblies = useMemo(() => {
    if (userTheme === 'all') return TOKYO_ASSEMBLIES;
    return TOKYO_ASSEMBLIES.filter((a) =>
      a.mainIssues.some((issue) => issue.theme === userTheme)
    );
  }, [userTheme]);

  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* 共通ヘッダー */}
      <Header
        onOpenAnalytics={() => setAnalyticsAssembly(TOKYO_ASSEMBLIES[0])}
        onOpenChat={() => setSelectedAssembly(TOKYO_ASSEMBLIES[0])}
        defaultAssembly={TOKYO_ASSEMBLIES[0]}
      />

      {/* オープンデータバナー */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 text-slate-300 min-w-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              東京都オープンデータ
            </span>
            <span className="truncate text-[11px] sm:text-xs">
              都内自治体の公式議会会議録オープンデータを解析し、わかりやすい対話形式で提供しています
            </span>
          </div>
          <a
            href="https://catalog.data.metro.tokyo.lg.jp/"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 shrink-0 transition-colors"
          >
            <span className="hidden sm:inline">カタログサイト</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 生活テーマ設定バー（横スワイプ対応） */}
      <ThemeSelector selectedTheme={userTheme} onSelectTheme={setUserTheme} />

      {/* モバイル向け表示切り替えタブ (マップ / リスト) */}
      <div className="lg:hidden px-4 pt-3 max-w-7xl w-full mx-auto">
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
          <button
            onClick={() => setMobileView('map')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileView === 'map'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>マップ表示</span>
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileView === 'list'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>自治体一覧 ({filteredAssemblies.length})</span>
          </button>
        </div>
      </div>

      {/* メインインタラクティブエリア */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
        {/* 地図コンポーネント (モバイル時はタブ連動) */}
        <div className={`flex-1 w-full ${mobileView === 'map' ? 'block' : 'hidden lg:block'}`}>
          <AssemblyMap
            assemblies={filteredAssemblies}
            selectedAssemblyId={selectedAssembly?.id || null}
            onSelectAssembly={(assembly) => setSelectedAssembly(assembly)}
          />
        </div>

        {/* 自治体一覧ドロワー (モバイル時はタブ連動) */}
        <div className={`w-full lg:w-auto ${mobileView === 'list' ? 'block' : 'hidden lg:block'}`}>
          <AssemblyListDrawer
            assemblies={filteredAssemblies}
            selectedAssemblyId={selectedAssembly?.id || null}
            onSelectAssembly={(assembly) => setSelectedAssembly(assembly)}
          />
        </div>
      </div>

      {/* LINE風対話モーダル */}
      {selectedAssembly && (
        <LineChatModal
          assembly={selectedAssembly}
          initialTheme={getThemeKeyword(userTheme)}
          onClose={() => setSelectedAssembly(null)}
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
      <footer className="border-t border-slate-800/80 py-4 sm:py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GijiRaku 議会ナビ &copy; 2026 - 東京都オープンデータ活用推進プロジェクト</span>
          <span>Powered by Tokyo Open Data Catalog API & EBPM Suite</span>
        </div>
      </footer>
    </main>
  );
}
