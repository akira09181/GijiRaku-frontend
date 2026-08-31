import type { FollowedTopic } from '../types/follow';
import { getOrCreateAnonymousUserId } from './anonymousUser';
import { isFollowUnread } from './followStatus.js';

interface FollowApiItem {
  readonly issue_id: string;
  readonly assembly_id: string;
  readonly municipality: string;
  readonly title: string;
  readonly current_status: string;
  readonly status_summary: string;
  readonly status_updated_at: string;
  readonly status_checked_at: string;
  readonly problem_summary: string;
  readonly government_response_summary: string;
  readonly share_summary: string;
  readonly source_url: string;
  readonly question_id: string;
  readonly created_at: string;
  readonly last_viewed_status_at: string;
  readonly notification_enabled: boolean;
  readonly has_new_status: boolean;
  readonly my_response: FollowedTopic['my_response'];
}

interface FollowListResponse {
  readonly storage_backend: 'firestore';
  readonly follows: readonly FollowApiItem[];
}

const apiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function assertFirestore(response: Response, payload: { storage_backend?: string }) {
  if (!response.ok || payload.storage_backend !== 'firestore') {
    throw new Error(`Firestore follow API failed: ${response.status}`);
  }
}

function normalizeFollow(item: FollowApiItem): FollowedTopic {
  return {
    ...item,
    discussion_id: item.issue_id,
    municipality_name: item.municipality,
    theme_name: item.title,
    followed_at: item.created_at,
    has_new_status: isFollowUnread(item.status_updated_at, item.last_viewed_status_at),
  };
}

export async function listFirestoreFollows(): Promise<FollowedTopic[]> {
  const query = new URLSearchParams({ anonymous_user_id: getOrCreateAnonymousUserId() });
  const response = await fetch(`${apiBase()}/api/follows?${query.toString()}`, { cache: 'no-store' });
  const payload = await response.json() as FollowListResponse;
  assertFirestore(response, payload);
  return payload.follows.map(normalizeFollow);
}

export async function putFirestoreFollow(issueId: string): Promise<void> {
  const response = await fetch(`${apiBase()}/api/follows`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      issue_id: issueId,
      anonymous_user_id: getOrCreateAnonymousUserId(),
    }),
  });
  const payload = await response.json() as { storage_backend?: string };
  assertFirestore(response, payload);
}

export async function markFirestoreFollowViewed(issueId: string): Promise<void> {
  const response = await fetch(`${apiBase()}/api/follows/viewed`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      issue_id: issueId,
      anonymous_user_id: getOrCreateAnonymousUserId(),
    }),
  });
  const payload = await response.json() as { storage_backend?: string };
  assertFirestore(response, payload);
}

export async function deleteFirestoreFollow(issueId: string): Promise<void> {
  const query = new URLSearchParams({
    issue_id: issueId,
    anonymous_user_id: getOrCreateAnonymousUserId(),
  });
  const response = await fetch(`${apiBase()}/api/follows?${query.toString()}`, {
    method: 'DELETE',
  });
  const payload = await response.json() as { storage_backend?: string };
  assertFirestore(response, payload);
}
