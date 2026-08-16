'use client';

import { useState, useEffect } from 'react';
import AssemblyMap, { Assembly } from './components/AssemblyMap';
import LineChatModal from './components/LineChatModal';
import AssemblyListDrawer from './components/AssemblyListDrawer';
import AnalyticsDashboardModal from './components/AnalyticsDashboardModal';

const FALLBACK_ASSEMBLIES: Assembly[] = [
  {
    id: 'machida-shi',
    name: '町田市議会',
    org_name: '町田市',
    lat: 35.5467,
    lng: 139.4386,
    badge: '重点モデル自治体',
    hot_topic: 'おむつ代補助・多摩モノレール延伸・学童保育',
    survey_stat: '若者(10-20代)の84.8%が議会に関心なし(町田市市民意識調査)',
    dataset_url: 'https://www.opendata.metro.tokyo.lg.jp/machida/132098_machidashi_gikaidayori.csv',
    avatar_theme: 'teal',
  },
  {
    id: 'shinagawa-ku',
    name: '品川区議会',
    org_name: '品川区',
    lat: 35.6092,
    lng: 139.7302,
    badge: '重点モデル自治体',
    hot_topic: '給食無償化・羽田新ルート・病児保育予約',
    survey_stat: '若者の72.9%が関心なし・45.9%が情報入手方法不明(品川区世論調査)',
    dataset_url: 'https://www.opendata.metro.tokyo.lg.jp/shinagawa/131091_shinagawaku_gikaidayori.csv',
    avatar_theme: 'rose',
  },
  {
    id: 'tokyo-metropolitan',
    name: '東京都議会',
    org_name: '東京都',
    lat: 35.6895,
    lng: 139.6917,
    badge: '都庁・本庁',
    hot_topic: 'スマホ行政手続95%化・築地スタジアムMICE',
    dataset_url: 'https://www.opendata.metro.tokyo.lg.jp/gikai/130001_tokyoto_gikaidayori.csv',
    avatar_theme: 'blue',
  },
  {
    id: 'chuo-ku',
    name: '中央区議会',
    org_name: '中央区',
    lat: 35.6707,
    lng: 139.7719,
    badge: '中央区役所',
    hot_topic: '晴海BRTバス連節車両・給食無償化・タワマン防災',
    dataset_url: 'https://www.opendata.metro.tokyo.lg.jp/chuo/131024_chuoku_gikaidayori.csv',
    avatar_theme: 'indigo',
  },
  {
    id: 'chiyoda-ku',
    name: '千代田区議会',
    org_name: '千代田区',
    lat: 35.6940,
    lng: 139.7536,
    badge: '千代田区役所',
    hot_topic: '皇居周辺環境・高齢者福祉・景観保護',
    dataset_url: 'https://www.opendata.metro.tokyo.lg.jp/chiyoda/131016_chiyodaku_gikaidayori.csv',
    avatar_theme: 'emerald',
  },
  {
    id: 'koto-ku',
    name: '江東区議会',
    org_name: '江東区',
    lat: 35.6727,
    lng: 139.8174,
    badge: '江東区役所',
    hot_topic: '防災強化・地下鉄8号線延伸・豊洲スマートシティ',
    dataset_url: 'https://www.opendata.metro.tokyo.lg.jp/koto/131083_kotoku_gikaidayori.csv',
    avatar_theme: 'purple',
  },
  {
    id: 'katsushika-ku',
    name: '葛飾区議会',
    org_name: '葛飾区',
    lat: 35.7432,
    lng: 139.8472,
    badge: '葛飾区役所',
    hot_topic: '下町商店街活性化・水害タイムライン・交通補正',
    dataset_url: 'https://www.opendata.metro.tokyo.lg.jp/katsushika/131229_katsushikaku_gikaidayori.csv',
    avatar_theme: 'amber',
  },
  {
    id: 'ota-ku',
    name: '大田区議会',
    org_name: '大田区',
    lat: 35.5612,
    lng: 139.7161,
    badge: '大田区役所',
    hot_topic: '羽田空港連携・町工場DX・スタートアップ支援',
    dataset_url: 'https://www.opendata.metro.tokyo.lg.jp/ota/131113_otaku_gikaidayori.csv',
    avatar_theme: 'rose',
  },
  {
    id: 'nakano-ku',
    name: '中野区議会',
    org_name: '中野区',
    lat: 35.7074,
    lng: 139.6638,
    badge: '中野区役所',
    hot_topic: '駅前再開発・文化芸術支援',
    dataset_url: 'https://www2.wagmap.jp/nakanodatamap/nakanodatamap/opendatafile/map_1/CSV/opendata_57001289.csv',
    avatar_theme: 'cyan',
  },
  {
    id: 'koganei-shi',
    name: '小金井市議会',
    org_name: '小金井市',
    lat: 35.7008,
    lng: 139.5033,
    badge: '小金井市役所',
    hot_topic: '緑地保全・ゴミ減量化',
    dataset_url: 'https://www.opendata.metro.tokyo.lg.jp/koganei/132101_gikaidayori.csv',
    avatar_theme: 'green',
  },
];

export default function Home() {
  const [assemblies, setAssemblies] = useState<Assembly[]>(FALLBACK_ASSEMBLIES);
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [analyticsAssembly, setAnalyticsAssembly] = useState<Assembly | null>(null);
  const [userTheme, setUserTheme] = useState<string>('all');

  // Fetch assemblies list from FastAPI backend
  useEffect(() => {
    async function loadAssemblies() {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      try {
        const res = await fetch(`${apiBase}/api/assemblies`);
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            setAssemblies(data.data);
          }
        }
      } catch (err) {
        console.log('FastAPI not reachable yet, using static fallback:', err);
      }
    }
    loadAssemblies();
  }, []);

  const getThemeKeyword = (themeKey: string) => {
    switch (themeKey) {
      case 'child':
        return 'おむつ';
      case 'dx':
        return 'スマホ';
      case 'disaster':
        return '防災';
      case 'redevelop':
        return 'モノレール';
      case 'medical':
        return '病児';
      default:
        return undefined;
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Navbar Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400 font-black text-lg">
                G
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                わたしの議会ナビ <span className="text-emerald-400">（旧 GijiRaku）</span>
              </h1>
              <p className="text-xs text-slate-400">東京都オープンデータ × 議員・行政向けEBPM双方向プラットフォーム</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Analytics Dashboard CTA */}
            <button
              onClick={() => setAnalyticsAssembly(assemblies[0])}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-transform hover:scale-105 active:scale-95"
            >
              <span>👔</span>
              <span>議員向け EBPM分析ダッシュボード</span>
            </button>

            {/* LINE Chat CTA */}
            <button
              onClick={() => setSelectedAssembly(assemblies[0])}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#06C755] to-emerald-500 hover:from-[#05b34c] hover:to-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-transform hover:scale-105 active:scale-95"
            >
              <span>💬</span>
              <span>LINE風会話を開く</span>
            </button>
          </div>
        </div>
      </header>

      {/* Open Data Problem Statement Callout Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-b border-emerald-500/30 py-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-emerald-300 font-bold">
            <span className="bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 rounded font-black">オープンデータ調査</span>
            <span>東京都調査: 若者(10-20代)の84.8%が「自分に関係ない」と議会未関心 ➔ 超翻訳と双方向FBで「届く政治」へ</span>
          </div>
          <a
            href="https://catalog.data.metro.tokyo.lg.jp/dataset/702f11cf-a3a4-4187-a25d-0fbe98dfcd70/resource/687d4377-84cf-4eda-b672-ec49c004d83d"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-slate-400 hover:text-white underline shrink-0 hidden md:inline"
          >
            町田市・品川区オープンデータ参照 ➔
          </a>
        </div>
      </div>

      {/* User Theme Selector Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 py-3 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-left">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
            <span>🎯</span>
            <span className="text-white font-extrabold">My 生活テーマ設定:</span>
            <span className="text-slate-400 font-normal">関心のある具象イシューを選ぶと議事録を直接抽出します</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setUserTheme('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                userTheme === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              ✨ すべて表示
            </button>
            <button
              onClick={() => setUserTheme('child')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                userTheme === 'child'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              👶 おむつ代補助・給食ゼロ
            </button>
            <button
              onClick={() => setUserTheme('dx')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                userTheme === 'dx'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              💻 スマホ行政手続95%化
            </button>
            <button
              onClick={() => setUserTheme('redevelop')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                userTheme === 'redevelop'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              🏗️ 多摩モノレール・街づくり
            </button>
            <button
              onClick={() => setUserTheme('medical')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                userTheme === 'medical'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              🏥 病児保育スマホ即時予約
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Workspace Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Map View */}
        <div className="flex-1 w-full">
          <AssemblyMap
            assemblies={assemblies}
            selectedAssemblyId={selectedAssembly?.id || null}
            onSelectAssembly={(assembly) => setSelectedAssembly(assembly)}
          />
        </div>

        {/* Assembly Quick Drawer */}
        <AssemblyListDrawer
          assemblies={assemblies}
          selectedAssemblyId={selectedAssembly?.id || null}
          onSelectAssembly={(assembly) => setSelectedAssembly(assembly)}
        />
      </div>

      {/* LINE Chat Modal Overlay when an assembly marker is clicked */}
      {selectedAssembly && (
        <LineChatModal
          assembly={selectedAssembly}
          initialTheme={getThemeKeyword(userTheme)}
          onClose={() => setSelectedAssembly(null)}
        />
      )}

      {/* Analytics Dashboard Modal Overlay */}
      {analyticsAssembly && (
        <AnalyticsDashboardModal
          assembly={analyticsAssembly}
          onClose={() => setAnalyticsAssembly(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        わたしの議会ナビ &copy; 2026 - Powered by Tokyo Open Data Catalog API & FastAPI EBPM Suite
      </footer>
    </main>
  );
}