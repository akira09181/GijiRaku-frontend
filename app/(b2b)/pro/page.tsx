import Link from 'next/link';
import { ArrowRight, BellRing, ChartNoAxesCombined, DatabaseZap, ShieldCheck } from 'lucide-react';
import LeadForm from '../../components/pro/LeadForm';

const benefits = [
  {
    title: '複数議会の論点を横断把握',
    description: '自治体ごとに分散した議事録を、共通指標と頻出キーワードで比較できます。',
    icon: ChartNoAxesCombined,
  },
  {
    title: '関心テーマの変化を通知',
    description: '登録した自治体・テーマ・キーワードに合う新着議題を継続的に追えます。',
    icon: BellRing,
  },
  {
    title: '公式原文まで追跡可能',
    description: 'AI要約だけに閉じず、議題IDと出典URLを保ったまま原文を確認できます。',
    icon: ShieldCheck,
  },
];

export default function ProLandingPage() {
  return (
    <main>
      <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_42%)]">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Civic intelligence for public teams</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-white sm:text-5xl">
              議会の変化を、<br />施策判断に使える情報へ。
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
              マチボイス Proは、複数議会の公式会議録と市民の反応を横断し、政策トレンドの発見から継続モニタリングまで支援します。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400">
                導入相談をする <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/pro/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-100 transition hover:border-emerald-500">
                デモを見る
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/80 p-6 shadow-2xl shadow-emerald-950/40">
            <div className="flex items-center gap-3 text-emerald-300">
              <DatabaseZap className="h-6 w-6" />
              <span className="font-semibold">今月の議会トレンド</span>
            </div>
            <div className="mt-6 space-y-4">
              {['子育て支援', 'デジタル行政', '防災・地域安全'].map((label, index) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between text-sm"><span>{label}</span><span className="text-slate-400">{38 - index * 9}議題</span></div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${82 - index * 18}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">画面例。ダッシュボードでは公開中データを集計します。</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-white">政策情報を探す時間を、判断する時間へ</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {benefits.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <Icon className="h-6 w-6 text-emerald-400" />
              <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="border-t border-slate-800 bg-slate-900/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-emerald-300">導入相談</p>
            <h2 className="mt-3 text-3xl font-bold text-white">対象議会や利用目的をお聞かせください</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">行政、議員、調査・報道、地域事業者など、用途に合わせたデータ範囲をご案内します。</p>
          </div>
          <LeadForm />
        </div>
      </section>
    </main>
  );
}
