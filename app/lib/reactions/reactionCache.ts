import type { ReactionSnapshotResponse } from '../../types/reaction';

const CACHE_PREFIX = 'gijiraku_reaction_snapshot_v1:';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedSnapshot {
  readonly saved_at: number;
  readonly payload: ReactionSnapshotResponse;
}

export function readCachedReactionSnapshot(
  discussionId: string,
): ReactionSnapshotResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(`${CACHE_PREFIX}${discussionId}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedSnapshot;
    if (Date.now() - cached.saved_at > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(`${CACHE_PREFIX}${discussionId}`);
      return null;
    }
    return cached.payload;
  } catch {
    return null;
  }
}

export function writeCachedReactionSnapshot(
  discussionId: string,
  payload: ReactionSnapshotResponse,
): void {
  if (typeof window === 'undefined') return;
  try {
    const cached: CachedSnapshot = { saved_at: Date.now(), payload };
    window.sessionStorage.setItem(
      `${CACHE_PREFIX}${discussionId}`,
      JSON.stringify(cached),
    );
  } catch {
    // ignore quota errors
  }
}

export function invalidateCachedReactionSnapshot(discussionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(`${CACHE_PREFIX}${discussionId}`);
  } catch {
    // ignore
  }
}
