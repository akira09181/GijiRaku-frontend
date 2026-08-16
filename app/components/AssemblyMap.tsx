'use client';

import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    L?: any;
    selectGijiAssembly?: any;
  }
}

export interface Assembly {
  id: string;
  name: string;
  org_name: string;
  lat: number;
  lng: number;
  badge: string;
  hot_topic: string;
  survey_stat?: string;
  dataset_url?: string;
  avatar_theme: string;
}

interface AssemblyMapProps {
  assemblies: Assembly[];
  selectedAssemblyId: string | null;
  onSelectAssembly: (assembly: Assembly) => void;
}

export default function AssemblyMap({
  assemblies,
  selectedAssemblyId,
  onSelectAssembly,
}: AssemblyMapProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  const filteredAssemblies = assemblies.filter((item) => {
    const matchesSearch =
      item.name.includes(searchTerm) ||
      item.org_name.includes(searchTerm) ||
      item.hot_topic.includes(searchTerm);
    if (activeCategory === 'all') return matchesSearch;
    if (activeCategory === 'child') return matchesSearch && item.hot_topic.includes('子育て');
    if (activeCategory === 'dx') return matchesSearch && (item.hot_topic.includes('デジタル') || item.hot_topic.includes('DX'));
    if (activeCategory === 'disaster') return matchesSearch && item.hot_topic.includes('防災');
    return matchesSearch;
  });

  // Dynamic Leaflet Map loading with Google Maps / OpenStreetMap / CartoDB tiles
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS dynamically if not present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS dynamically if not present
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapContainerRef.current || leafletMapRef.current || !window.L) return;

      const L = window.L;
      // Initialize map centered at Tokyo
      const map = L.map(mapContainerRef.current, {
        center: [35.6895, 139.6917],
        zoom: 11,
        zoomControl: false,
      });

      // Add zoom control top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      leafletMapRef.current = map;
      setMapLoaded(true);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update Map Tile Layer based on mapStyle
  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;
    const map = leafletMapRef.current;
    const L = window.L;

    // Remove existing tile layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'; // Google Maps-like Streets
    let attribution = '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap';

    if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri World Imagery';
    } else if (mapStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; CARTO Dark';
    }

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: attribution,
      subdomains: 'abcd',
    }).addTo(map);
  }, [mapStyle, mapLoaded]);

  // Register window event for direct marker element clicks
  useEffect(() => {
    (window as any).selectGijiAssembly = (id: string) => {
      const found = assemblies.find((a) => a.id === id);
      if (found) {
        onSelectAssembly(found);
      }
    };
  }, [assemblies, onSelectAssembly]);

  // Update Leaflet Markers when assemblies or filters change
  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;
    const map = leafletMapRef.current;
    const L = window.L;

    // Clear old markers
    Object.values(markersRef.current).forEach((m: any) => map.removeLayer(m));
    markersRef.current = {};

    filteredAssemblies.forEach((assembly) => {
      const isSelected = selectedAssemblyId === assembly.id;
      const isTokyoMet = assembly.id === 'tokyo-metropolitan';

      // Custom HTML Marker Pin
      const iconHtml = `
        <div onclick="if(window.selectGijiAssembly) window.selectGijiAssembly('${assembly.id}')" style="pointer-events: auto; cursor: pointer;" class="custom-marker-pin group cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110'
        }">
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl shadow-xl border text-xs font-bold whitespace-nowrap backdrop-blur-md ${
            isSelected
              ? 'bg-slate-900 border-emerald-400 text-white ring-2 ring-emerald-400/50 shadow-emerald-500/30'
              : isTokyoMet
              ? 'bg-slate-900/90 border-amber-400 text-amber-300 shadow-amber-500/20'
              : 'bg-slate-900/90 border-slate-700 text-slate-100 hover:border-emerald-400'
          }">
            <span class="w-6 h-6 rounded-lg ${
              isTokyoMet ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 text-slate-950'
            } flex items-center justify-center font-black text-xs shadow-sm">
              ${isTokyoMet ? '🏛️' : '💬'}
            </span>
            <div class="flex flex-col text-left">
              <span class="leading-tight flex items-center gap-1">
                ${assembly.name}
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </span>
              <span class="text-[9px] text-emerald-400 font-normal">🔥 ${assembly.hot_topic.slice(0, 10)}...</span>
            </div>
            <span class="ml-1 bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950">
              LINE会話
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'leaflet-custom-marker',
        iconSize: [160, 40],
        iconAnchor: [80, 20],
      });

      const marker = L.marker([assembly.lat, assembly.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        onSelectAssembly(assembly);
      });

      markersRef.current[assembly.id] = marker;
    });
  }, [filteredAssemblies, selectedAssemblyId, mapLoaded]);

  return (
    <div className="relative w-full h-[85vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
      {/* Top Map Control Header Bar */}
      <div className="relative z-20 p-4 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400 font-bold">
              🗺️
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              東京都議会 Google Maps連動マップ
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                実用マップ
              </span>
            </h2>
            <p className="text-xs text-slate-400">ピンを押すか右下のボタンでLINE風超翻訳会話が開きます</p>
          </div>
        </div>

        {/* Filter & Map Mode Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Map Style Selector */}
          <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                mapStyle === 'streets'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🗺️ ストリート
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                mapStyle === 'satellite'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🛰️ 航空写真
            </button>
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                mapStyle === 'dark'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🌌 ダーク
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-44 md:w-56">
            <input
              type="text"
              placeholder="議会名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {/* Main Leaflet Map Canvas Container */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Quick Action Button for LINE Chat Modal */}
        <button
          onClick={() => {
            const target = assemblies.find((a) => a.id === selectedAssemblyId) || assemblies[0];
            onSelectAssembly(target);
          }}
          className="absolute bottom-6 right-6 z-30 px-5 py-3.5 bg-gradient-to-r from-[#06C755] to-emerald-500 hover:from-[#05b34c] hover:to-emerald-600 text-white font-bold text-sm rounded-2xl shadow-2xl shadow-emerald-500/40 border border-white/20 flex items-center gap-2.5 group transition-all hover:scale-105 active:scale-95"
        >
          <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-base">💬</span>
          <span>LINE風 議事録超翻訳を開く</span>
          <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping"></span>
        </button>
      </div>

      {/* Footer Info Legend */}
      <div className="relative z-20 px-6 py-2.5 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 都議会 (本庁)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> 各区市議会
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> カタログAPI連動
          </span>
        </div>
        <div className="text-slate-400 hidden sm:block">
          地図ピンまたは右下ボタンをクリックでLINE会話が開始されます
        </div>
      </div>
    </div>
  );
}
