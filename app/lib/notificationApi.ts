import { getOrCreateAnonymousUserId } from './anonymousUser';

import { getApiBase } from './apiBase';

export interface NotificationPreferences {
  readonly interest_themes: readonly string[];
  readonly municipalities: readonly string[];
  readonly keywords: readonly string[];
}

export interface NotificationMatch {
  readonly issue_id: string;
  readonly title: string;
  readonly municipality?: string;
  readonly summary?: string;
  readonly source_url?: string;
}

const apiBase = () => getApiBase();

function assertFirestore(response: Response, payload: { storage_backend?: unknown }) {
  if (!response.ok || payload.storage_backend !== 'firestore') {
    throw new Error(`Notification API failed: ${response.status}`);
  }
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const query = new URLSearchParams({ anonymous_user_id: getOrCreateAnonymousUserId() });
  const response = await fetch(`${apiBase()}/api/notifications/preferences?${query.toString()}`, {
    cache: 'no-store',
  });
  const payload = await response.json() as {
    storage_backend?: unknown;
    preferences?: Partial<NotificationPreferences>;
  };
  assertFirestore(response, payload);
  return {
    interest_themes: normalizeList(payload.preferences?.interest_themes),
    municipalities: normalizeList(payload.preferences?.municipalities),
    keywords: normalizeList(payload.preferences?.keywords),
  };
}

export async function putNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const query = new URLSearchParams({ anonymous_user_id: getOrCreateAnonymousUserId() });
  const response = await fetch(`${apiBase()}/api/notifications/preferences?${query.toString()}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  const payload = await response.json() as {
    storage_backend?: unknown;
    preferences?: Partial<NotificationPreferences>;
  };
  assertFirestore(response, payload);
  return {
    interest_themes: normalizeList(payload.preferences?.interest_themes),
    municipalities: normalizeList(payload.preferences?.municipalities),
    keywords: normalizeList(payload.preferences?.keywords),
  };
}

export async function getNotificationMatches(): Promise<NotificationMatch[]> {
  const query = new URLSearchParams({ anonymous_user_id: getOrCreateAnonymousUserId() });
  const response = await fetch(`${apiBase()}/api/notifications/matches?${query.toString()}`, {
    cache: 'no-store',
  });
  const payload = await response.json() as {
    storage_backend?: unknown;
    matches?: unknown;
  };
  assertFirestore(response, payload);
  if (!Array.isArray(payload.matches)) return [];
  return payload.matches.filter((item): item is NotificationMatch => (
    Boolean(item)
    && typeof item === 'object'
    && typeof (item as NotificationMatch).issue_id === 'string'
    && typeof (item as NotificationMatch).title === 'string'
  ));
}
