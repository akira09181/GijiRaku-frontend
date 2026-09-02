import { Skeleton } from './Skeleton';
import { IssueCardSkeleton } from './IssueCardSkeleton';

export function IssueExplorerSkeleton() {
  return (
    <div
      aria-label="議題一覧を読み込み中"
      data-testid="issue-explorer-skeleton"
      className="space-y-8"
    >
      <section>
        <Skeleton className="h-10 w-full rounded-2xl" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((item) => (
            <article
              key={item}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="mt-3 space-y-3">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0 dark:border-slate-800">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-2 h-3 w-3/4" />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <IssueCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
