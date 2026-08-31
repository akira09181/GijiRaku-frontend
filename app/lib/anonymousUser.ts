export const ANONYMOUS_USER_STORAGE_KEY = 'gijiraku_anonymous_user_id';

export function getOrCreateAnonymousUserId(): string {
  const existing = window.localStorage.getItem(ANONYMOUS_USER_STORAGE_KEY);
  if (existing) return existing;
  const generated = window.crypto?.randomUUID?.()
    || `anonymous-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(ANONYMOUS_USER_STORAGE_KEY, generated);
  return generated;
}
