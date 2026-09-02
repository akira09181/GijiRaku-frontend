interface SkeletonProps {
  readonly className?: string;
  readonly 'aria-label'?: string;
}

export function Skeleton({ className = '', 'aria-label': ariaLabel }: SkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label={ariaLabel}
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
}
