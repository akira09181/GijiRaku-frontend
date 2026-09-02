const LINE_OAUTH_NONCE_KEY = 'machivoice_line_oauth_nonce_v1';

export function getLineCallbackUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/line/callback`;
  }
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return configured ? `${configured}/line/callback` : 'http://localhost:3000/line/callback';
}

export function getLineLoginChannelId(): string | null {
  const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID?.trim();
  return channelId || null;
}

export function encodeLineOAuthState(anonymousUserId: string): string {
  const nonce = globalThis.crypto?.randomUUID?.()
    || `nonce-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(LINE_OAUTH_NONCE_KEY, nonce);
  }
  const payload = JSON.stringify({ uid: anonymousUserId, n: nonce });
  return typeof window !== 'undefined'
    ? window.btoa(payload)
    : Buffer.from(payload, 'utf8').toString('base64');
}

export function decodeLineOAuthState(state: string): { uid: string; n: string } | null {
  try {
    const decoded = typeof window !== 'undefined'
      ? window.atob(state)
      : Buffer.from(state, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as { uid?: unknown; n?: unknown };
    if (typeof parsed.uid !== 'string' || typeof parsed.n !== 'string') return null;
    return { uid: parsed.uid, n: parsed.n };
  } catch {
    return null;
  }
}

export function verifyLineOAuthNonce(expectedNonce: string): boolean {
  if (typeof window === 'undefined') return false;
  const stored = window.sessionStorage.getItem(LINE_OAUTH_NONCE_KEY);
  window.sessionStorage.removeItem(LINE_OAUTH_NONCE_KEY);
  return Boolean(stored && stored === expectedNonce);
}

export function buildLineLoginUrl(anonymousUserId: string): string | null {
  const channelId = getLineLoginChannelId();
  if (!channelId) return null;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: getLineCallbackUrl(),
    state: encodeLineOAuthState(anonymousUserId),
    scope: 'profile openid',
    bot_prompt: 'normal',
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}
