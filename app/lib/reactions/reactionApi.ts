import { getOrCreateAnonymousUserId } from '../anonymousUser';
import { getApiBase } from '../apiBase';
import { fetchWithRetry } from '../fetchWithRetry';
import {
  invalidateCachedReactionSnapshot,
  readCachedReactionSnapshot,
  writeCachedReactionSnapshot,
} from './reactionCache';
import type {
  ReactionCounts,
  ReactionSnapshotResponse,
  ReactionStateResponse,
  ReactionType,
} from '../../types/reaction';

export function reactionAggregatesFrom(payload: ReactionSnapshotResponse) {
  return payload.aggregates || payload.data || [];
}

export function userReactionStatesFrom(payload: ReactionSnapshotResponse) {
  return payload.user_reactions
    || (payload.data || []).flatMap((state) => (
      state.reaction_type
        ? [{ statement_id: state.statement_id, reaction_type: state.reaction_type }]
        : []
    ));
}

export async function putReactionState(
  discussionId: string,
  statementId: string,
  reactionType: ReactionType | null,
  baseCounts: ReactionCounts,
  anonymousUserId?: string,
): Promise<ReactionStateResponse> {
  const apiBase = getApiBase();
  const response = await fetchWithRetry(`${apiBase}/api/reactions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      discussion_id: discussionId,
      statement_id: statementId,
      reaction_type: reactionType,
      anonymous_user_id: anonymousUserId ?? getOrCreateAnonymousUserId(),
      base_counts: baseCounts,
    }),
  }, 5);
  if (!response.ok) throw new Error(`Reaction API failed: ${response.status}`);
  invalidateCachedReactionSnapshot(discussionId);
  return response.json();
}

export async function fetchReactionSnapshot(
  discussionId: string,
  includeUserState: boolean,
  anonymousUserId?: string,
): Promise<ReactionSnapshotResponse> {
  const cached = readCachedReactionSnapshot(discussionId);
  if (cached) return cached;

  const apiBase = getApiBase();
  const query = new URLSearchParams({
    discussion_id: discussionId,
    include_user_state: String(includeUserState),
  });
  if (includeUserState) {
    query.set('anonymous_user_id', anonymousUserId ?? getOrCreateAnonymousUserId());
  }
  const response = await fetchWithRetry(`${apiBase}/api/reactions?${query.toString()}`, {
    cache: 'no-store',
  }, 5);
  if (!response.ok) throw new Error(`Reaction API failed: ${response.status}`);
  const payload = await response.json() as ReactionSnapshotResponse;
  writeCachedReactionSnapshot(discussionId, payload);
  return payload;
}

export function findReactionAggregate(
  payload: ReactionSnapshotResponse,
  statementId: string,
): ReactionCounts | null {
  const aggregate = reactionAggregatesFrom(payload).find((item) => item.statement_id === statementId);
  return aggregate?.counts ?? null;
}

export function findUserReaction(
  payload: ReactionSnapshotResponse,
  statementId: string,
): ReactionType | null {
  const state = userReactionStatesFrom(payload).find((item) => item.statement_id === statementId);
  return state?.reaction_type ?? null;
}
