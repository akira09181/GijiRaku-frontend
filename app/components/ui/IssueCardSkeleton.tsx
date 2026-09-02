import { Skeleton } from './Skeleton';

export function IssueCardSkeleton() {
  return (
    <article
      aria-label="議題を読み込み中"
      data-testid="issue-card-skeleton"
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-14 rounded" />
      </div>
      <Skeleton className="mt-3 h-3 w-2/3" />
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-3 w-16" />
      </div>
    </article>
  );
}
