'use client';

import React from 'react';
import { Building, ChevronRight, Info } from 'lucide-react';
import { Assembly } from '../types/assembly';

interface AssemblyListDrawerProps {
  readonly assemblies: readonly Assembly[];
  readonly selectedAssemblyId: string | null;
  readonly onSelectAssembly: (assembly: Assembly) => void;
}

/**
 * 自治体議会一覧ドロワー / リスト
 * - PCでは右側サイドバー、モバイルでは一覧ビューとして活用
 * - 型安全でクリーンなUIデザイン
 */
export default function AssemblyListDrawer({
  assemblies,
  selectedAssemblyId,
  onSelectAssembly,
}: AssemblyListDrawerProps) {
  return (
    <div className="w-full lg:w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-3.5">
      {/* ドロワーヘッダー */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-400" />
          <span>自治体・議会一覧</span>
        </h3>
        <span className="px-2.5 py-0.5 text-xs font-medium bg-slate-800 text-slate-300 rounded-full border border-slate-700">
          {assemblies.length}自治体
        </span>
      </div>

      {/* 自治体カードリスト */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 max-h-[60vh] lg:max-h-[65vh] scrollbar-none">
        {assemblies.map((assembly) => {
          const isSelected = selectedAssemblyId === assembly.id;
          const isTokyoMet = assembly.id === 'tokyo-metropolitan';

          return (
            <div
              key={assembly.id}
              onClick={() => onSelectAssembly(assembly)}
              className={`p-3.5 rounded-xl cursor-pointer border transition-all duration-150 text-left ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500 text-white shadow-sm'
                  : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                  {assembly.name}
                  {isTokyoMet && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded font-medium">
                      都庁本庁
                    </span>
                  )}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium border border-slate-700/50">
                  {assembly.type === 'prefecture' ? '都議会' : assembly.type === 'ward' ? '特別区' : '市町村'}
                </span>
              </div>

              <div className="text-[11px] sm:text-xs text-slate-300 font-medium truncate mb-2">
                {assembly.hotTopic}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-slate-400 truncate max-w-[140px]">
                  {assembly.mayorName} 首長
                </span>
                <span className="text-emerald-400 font-medium flex items-center gap-0.5 shrink-0">
                  <span>見る</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* フッター情報 */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[10px] sm:text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-semibold">データ連携:</span> 東京都議会は公式会議録に接続済み、その他はデモデータを含みます
        </div>
      </div>
    </div>
  );
}
