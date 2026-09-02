'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Search, MessageSquare, Compass, CheckCircle2 } from 'lucide-react';
import { Assembly } from '../types/assembly';
import { isAssemblyReady } from '../data/tokyoPlannedAssemblies';

// Leaflet types
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
    selectGijiAssembly?: (id: string) => void;
  }
}

interface AssemblyMapProps {
  readonly assemblies: readonly Assembly[];
  readonly selectedAssemblyId: string | null;
  readonly onSelectAssembly: (assembly: Assembly) => void;
}

/**
 * 東京都自治体議会マップ
 * - Leaflet 地図レンダリング
 * - モバイル/デスクトップ対応のレスポンシブマップコントロール
 * - クリーンなSVGピンマーカー
 */
export default function AssemblyMap({
  assemblies,
  selectedAssemblyId,
  onSelectAssembly,
}: AssemblyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<{ [key: string]: any }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');

  // グローバルコールバック（LeafletのHTML Marker用）
  useEffect(() => {
    window.selectGijiAssembly = (id: string) => {
      const target = assemblies.find((a) => a.id === id);
      if (target) onSelectAssembly(target);
    };
    return () => {
      delete window.selectGijiAssembly;
    };
  }, [assemblies, onSelectAssembly]);

  // Leaflet JS/CSS のロード
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      queueMicrotask(() => setMapLoaded(true));
    }
  }, []);

  // マップ初期化
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    // 東京都中心（新宿・都庁付近）
    const map = L.map(mapContainerRef.current, {
      center: [35.6895, 139.54],
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const tileLayers: Record<string, string> = {
      streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    };

    const tileLayer = L.tileLayer(tileLayers[mapStyle], {
      attribution: '&copy; OpenStreetMap contributors, Esri, CartoDB',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = { map, tileLayer };

    // リサイズ監視（スマホ回転やレイアウト変化への追従）
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapLoaded, mapStyle]);

  // タイルレイヤースタイル切り替え
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map, tileLayer } = mapInstanceRef.current;
    const L = window.L;

    map.removeLayer(tileLayer);
    const tileLayers: Record<string, string> = {
      streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    };

    const newLayer = L.tileLayer(tileLayers[mapStyle], {
      attribution: '&copy; OpenStreetMap contributors, Esri, CartoDB',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current.tileLayer = newLayer;
  }, [mapStyle]);

  // 検索フィルタリング
  const filteredAssemblies = useMemo(() => {
    if (!searchTerm.trim()) return assemblies;
    const term = searchTerm.toLowerCase();
    return assemblies.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.hotTopic.toLowerCase().includes(term) ||
        a.mayorName.toLowerCase().includes(term)
    );
  }, [assemblies, searchTerm]);

  // マーカー配置
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const { map } = mapInstanceRef.current;
    const L = window.L;

    // 既存マーカークリア
    Object.values(markersRef.current).forEach((marker: unknown) => map.removeLayer(marker));
    markersRef.current = {};

    filteredAssemblies.forEach((assembly) => {
      const isSelected = selectedAssemblyId === assembly.id;
      const isTokyoMet = assembly.id === 'tokyo-metropolitan';
      const isNational = assembly.id === 'national-diet';
      const isReady = isAssemblyReady(assembly);
      const shortName = assembly.name.replace(/(区|市|町|村)?議会$/, '').replace(/^国会$/, '国会');
      const typeLabel = assembly.type === 'national'
        ? '国'
        : assembly.type === 'prefecture'
        ? '都'
        : assembly.type === 'ward'
          ? '区'
          : assembly.type === 'city'
            ? '市'
            : '町';

      const iconHtml = `
        <div onclick="if(window.selectGijiAssembly) window.selectGijiAssembly('${assembly.id}')" style="pointer-events: auto; cursor: pointer;" class="custom-marker-pin group transition-transform duration-150 ${
          isSelected ? 'scale-105 z-50' : 'hover:scale-102'
        }" data-testid="map-marker" data-assembly-id="${assembly.id}" data-assembly-ready="${isReady}">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-md border text-xs font-semibold whitespace-nowrap ${
            isSelected
              ? isReady
                ? 'bg-slate-900 border-emerald-500 text-white shadow-emerald-950/40'
                : 'bg-slate-900 border-amber-500 text-white shadow-amber-950/40'
              : isReady
                ? isTokyoMet || isNational
                  ? 'bg-slate-900/95 border-amber-500/70 text-slate-100 hover:border-amber-400'
                  : 'bg-slate-900/95 border-slate-700/80 text-slate-100 hover:border-slate-500'
                : 'bg-slate-900/90 border-dashed border-amber-500/50 text-slate-200 hover:border-amber-400'
          }">
            <span class="w-4 h-4 rounded-md ${
              isReady
                ? isTokyoMet || isNational ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 text-amber-300'
            } flex items-center justify-center font-bold text-[10px] shrink-0">
              ${typeLabel}
            </span>
            <div class="flex flex-col text-left leading-tight">
              <span class="font-bold text-xs text-white">
                ${shortName}
              </span>
              <span class="text-[10px] ${isReady ? 'text-slate-400' : 'text-amber-300/90'} font-normal truncate max-w-[110px]">
                ${isReady ? assembly.hotTopic : '導入リクエスト受付中'}
              </span>
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'leaflet-custom-marker',
        iconSize: [140, 36],
        iconAnchor: [70, 18],
      });

      const marker = L.marker([assembly.lat, assembly.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        onSelectAssembly(assembly);
      });

      markersRef.current[assembly.id] = marker;
    });
  }, [filteredAssemblies, selectedAssemblyId, mapLoaded, onSelectAssembly]);

  return (
    <div className="relative w-full h-[55vh] sm:h-[65vh] lg:h-[75vh] bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex flex-col">
      {/* マップ上部コントロールバー */}
      <div className="relative z-20 p-3 sm:p-4 flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-emerald-400 shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate flex items-center gap-1.5">
              <span>東京都議会・自治体マップ</span>
              <span className="hidden xs:inline-block px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                62市区町村
              </span>
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">
              実データ公開中の議会と、導入リクエスト受付中の地域を表示
            </p>
          </div>
        </div>

        {/* スタイル切替 & 検索ボックス */}
        <div className="flex items-center gap-2">
          {/* レイヤー切替 */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px] shrink-0">
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                mapStyle === 'streets'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              標準
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                mapStyle === 'satellite'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              航空写真
            </button>
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                mapStyle === 'dark'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ダーク
            </button>
          </div>

          {/* 検索入力 */}
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              placeholder="議会名・話題で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Leaflet 地図本体 */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* フローティング対話ボタン */}
        <button
          onClick={() => {
            const target = assemblies.find((a) => a.id === selectedAssemblyId) || assemblies[0];
            onSelectAssembly(target);
          }}
          className="absolute bottom-4 right-4 z-30 px-3.5 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 border border-emerald-400/30 flex items-center gap-2 transition-all active:scale-95"
        >
          <MessageSquare className="w-4 h-4" />
          <span>議事録対話を開く</span>
        </button>
      </div>

      {/* マップフッター凡例 */}
      <div className="relative z-20 px-4 py-2 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> 都議会（本庁）
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> 各区市議会
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> オープンデータAPI連携
          </span>
        </div>
        <div className="text-slate-500 hidden md:block">
          ピンをクリックするとLINE風対話モーダルが起動します
        </div>
      </div>
    </div>
  );
}
