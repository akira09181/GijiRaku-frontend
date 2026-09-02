import Link from 'next/link';
import { Landmark } from 'lucide-react';

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/pro" className="flex items-center gap-3 font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <Landmark className="h-5 w-5" />
            </span>
            <span>マチボイス Pro</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm" aria-label="法人向けナビゲーション">
            <Link href="/pro/dashboard" className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
              トレンド分析
            </Link>
            <Link href="/pro/analytics?assembly_id=tokyo-metropolitan" className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
              議会別分析
            </Link>
            <Link href="/" className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300">
              市民向けサイト
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
