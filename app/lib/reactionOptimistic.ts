export type OptimisticReactionType = 'agree' | 'concern' | 'helpful';

export interface OptimisticReactionCounts {
  readonly agree: number;
  readonly concern: number;
  readonly helpful: number;
}

export function applyOptimisticReaction(
  counts: OptimisticReactionCounts,
  previousReaction: OptimisticReactionType | null,
  nextReaction: OptimisticReactionType | null,
): OptimisticReactionCounts {
  if (previousReaction === nextReaction) return counts;
  const nextCounts = {
    agree: Math.max(0, counts.agree),
    concern: Math.max(0, counts.concern),
    helpful: Math.max(0, counts.helpful),
  };
  if (previousReaction) {
    nextCounts[previousReaction] = Math.max(0, nextCounts[previousReaction] - 1);
  }
  if (nextReaction) {
    nextCounts[nextReaction] += 1;
  }
  return nextCounts;
}
