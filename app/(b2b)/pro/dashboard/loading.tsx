export default function DashboardLoading() {
  return <main className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 lg:px-8"><div className="h-10 w-72 rounded bg-slate-800" /><div className="mt-8 grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-28 rounded-2xl bg-slate-900" />)}</div></main>;
}
