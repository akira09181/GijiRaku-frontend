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

export interface UserNotification {
  readonly notification_id: string;
  readonly issue_id: string;
  readonly message: string;
  readonly read: boolean;
  readonly title: string;
  readonly municipality: string;
  readonly summary?: string;
  readonly source_url?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
}

export interface NotificationInbox {
  readonly total: number;
  readonly unread_total: number;
  readonly notifications: readonly UserNotification[];
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

function normalizeNotification(value: unknown): UserNotification | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<UserNotification>;
  if (
    typeof item.notification_id !== 'string'
    || typeof item.issue_id !== 'string'
    || typeof item.message !== 'string'
  ) {
    return null;
  }
  return {
    notification_id: item.notification_id,
    issue_id: item.issue_id,
    message: item.message,
    read: Boolean(item.read),
    title: typeof item.title === 'string' ? item.title : item.issue_id,
    municipality: typeof item.municipality === 'string' ? item.municipality : '',
    summary: typeof item.summary === 'string' ? item.summary : undefined,
    source_url: typeof item.source_url === 'string' ? item.source_url : undefined,
    created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
    updated_at: typeof item.updated_at === 'string' ? item.updated_at : undefined,
  };
}

export async function listNotifications(limit = 50): Promise<NotificationInbox> {
  const query = new URLSearchParams({
    anonymous_user_id: getOrCreateAnonymousUserId(),
    limit: String(limit),
  });
  const response = await fetch(`${apiBase()}/api/notifications?${query.toString()}`, {
    cache: 'no-store',
  });
  const payload = await response.json() as {
    storage_backend?: unknown;
    total?: unknown;
    unread_total?: unknown;
    notifications?: unknown;
  };
  assertFirestore(response, payload);
  const notifications = Array.isArray(payload.notifications)
    ? payload.notifications.map(normalizeNotification).filter((item): item is UserNotification => Boolean(item))
    : [];
  return {
    total: typeof payload.total === 'number' ? payload.total : notifications.length,
    unread_total: typeof payload.unread_total === 'number' ? payload.unread_total : 0,
    notifications,
  };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const inbox = await listNotifications(1);
  return inbox.unread_total;
}

export async function markNotificationsRead(
  notificationIds: readonly string[] = [],
): Promise<{ readonly unread_total: number; readonly marked_count?: number }> {
  const response = await fetch(`${apiBase()}/api/notifications/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      anonymous_user_id: getOrCreateAnonymousUserId(),
      notification_ids: [...notificationIds],
    }),
  });
  const payload = await response.json() as {
    storage_backend?: unknown;
    unread_total?: unknown;
    marked_count?: unknown;
  };
  assertFirestore(response, payload);
  return {
    unread_total: typeof payload.unread_total === 'number' ? payload.unread_total : 0,
    marked_count: typeof payload.marked_count === 'number' ? payload.marked_count : undefined,
  };
}
