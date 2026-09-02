import type { ReactionCounts, ReactionType } from '../../types/reaction';

export function applyOptimisticReaction(
  counts: ReactionCounts,
  previousReaction: ReactionType | null,
  nextReaction: ReactionType | null,
): ReactionCounts {
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
