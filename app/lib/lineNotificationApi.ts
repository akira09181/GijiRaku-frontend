import { getOrCreateAnonymousUserId } from './anonymousUser';
import { getApiBase } from './apiBase';

export interface LineLinkStatus {
  readonly linked: boolean;
  readonly line_push_enabled: boolean;
  readonly display_name?: string | null;
  readonly configured: boolean;
  readonly login_configured: boolean;
}

const apiBase = () => getApiBase();

function assertFirestore(response: Response, payload: { storage_backend?: unknown }) {
  if (!response.ok || payload.storage_backend !== 'firestore') {
    throw new Error(`LINE notification API failed: ${response.status}`);
  }
}

function normalizeLineStatus(value: unknown): LineLinkStatus {
  const line = value && typeof value === 'object'
    ? value as Partial<LineLinkStatus>
    : {};
  return {
    linked: Boolean(line.linked),
    line_push_enabled: Boolean(line.line_push_enabled),
    display_name: typeof line.display_name === 'string' ? line.display_name : null,
    configured: Boolean(line.configured),
    login_configured: Boolean(line.login_configured),
  };
}

export async function getLineLinkStatus(): Promise<LineLinkStatus> {
  const query = new URLSearchParams({ anonymous_user_id: getOrCreateAnonymousUserId() });
  const response = await fetch(`${apiBase()}/api/notifications/line/status?${query.toString()}`, {
    cache: 'no-store',
  });
  const payload = await response.json() as { storage_backend?: unknown; line?: unknown };
  assertFirestore(response, payload);
  return normalizeLineStatus(payload.line);
}

export async function unlinkLineNotification(): Promise<LineLinkStatus> {
  const query = new URLSearchParams({ anonymous_user_id: getOrCreateAnonymousUserId() });
  const response = await fetch(`${apiBase()}/api/notifications/line/link?${query.toString()}`, {
    method: 'DELETE',
  });
  const payload = await response.json() as { storage_backend?: unknown; line?: unknown };
  assertFirestore(response, payload);
  return normalizeLineStatus(payload.line);
}

export async function completeLineOAuth(
  code: string,
  redirectUri: string,
): Promise<LineLinkStatus> {
  const response = await fetch(`${apiBase()}/api/notifications/line/oauth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
      anonymous_user_id: getOrCreateAnonymousUserId(),
    }),
  });
  const payload = await response.json() as { storage_backend?: unknown; line?: unknown; detail?: string };
  if (!response.ok || payload.storage_backend !== 'firestore') {
    throw new Error(typeof payload.detail === 'string' ? payload.detail : 'LINE連携に失敗しました');
  }
  return normalizeLineStatus(payload.line);
}
