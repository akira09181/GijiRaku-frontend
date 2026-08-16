'use client';

import React from 'react';
import { Assembly } from './AssemblyMap';

interface AssemblyListDrawerProps {
  assemblies: Assembly[];
  selectedAssemblyId: string | null;
  onSelectAssembly: (assembly: Assembly) => void;
}

export default function AssemblyListDrawer({
  assemblies,
  selectedAssemblyId,
  onSelectAssembly,
}: AssemblyListDrawerProps) {
  return (
    <div className="w-full lg:w-80 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>🏛️</span> 東京都自治体議会一覧
        </h3>
        <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
          {assemblies.length}件
        </span>
      </div>

      {/* Assembly List Item Cards */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[70vh]">
        {assemblies.map((assembly) => {
          const isSelected = selectedAssemblyId === assembly.id;
          const isTokyoMet = assembly.id === 'tokyo-metropolitan';

          return (
            <div
              key={assembly.id}
              onClick={() => onSelectAssembly(assembly)}
              className={`p-3.5 rounded-2xl cursor-pointer border transition-all duration-200 text-left ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-400 text-white shadow-lg ring-1 ring-emerald-400/40'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  {assembly.name}
                  {isTokyoMet && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold">
                      都庁
                    </span>
                  )}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 font-medium">
                  {assembly.badge}
                </span>
              </div>

              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span>🔥</span>
                <span>{assembly.hot_topic}</span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                <span>オープンデータ連動</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAssembly(assembly);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs shadow flex items-center gap-1 transition-transform hover:scale-105 active:scale-95"
                >
                  💬 LINE会話を開く
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed text-left">
        💡 <strong className="text-slate-200">データソース:</strong> 東京都オープンデータカタログサイト (catalog.data.metro.tokyo.lg.jp) の議会データより生成
      </div>
    </div>
  );
}
