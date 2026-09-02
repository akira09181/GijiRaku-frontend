import { Skeleton } from './Skeleton';

interface ChatBubbleSkeletonProps {
  readonly count?: number;
}

export function ChatBubbleSkeleton({ count = 3 }: ChatBubbleSkeletonProps) {
  return (
    <div
      aria-label="議題の詳細を読み込み中"
      data-testid="chat-bubble-skeleton"
      className="space-y-4 py-2"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-start gap-2.5 max-w-[92%]">
          <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-11/12" />
              <Skeleton className="mt-2 h-3 w-4/5" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-7 w-20 rounded-lg" />
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
