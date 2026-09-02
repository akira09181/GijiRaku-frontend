import { getApiBase } from '../../../lib/apiBase';

type LeadPayload = {
  readonly organization?: unknown;
  readonly name?: unknown;
  readonly email?: unknown;
  readonly purpose?: unknown;
  readonly website?: unknown;
};

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(request: Request) {
  let input: LeadPayload;
  try {
    input = await request.json() as LeadPayload;
  } catch {
    return Response.json({ message: 'JSON形式で送信してください。' }, { status: 400 });
  }

  // Honeypot submissions receive a generic success without storing personal data.
  if (text(input.website, 200)) return Response.json({ status: 'success' }, { status: 202 });

  const payload = {
    organization: text(input.organization, 120),
    name: text(input.name, 80),
    email: text(input.email, 254).toLowerCase(),
    purpose: text(input.purpose, 1000),
  };
  if (!payload.organization || !payload.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return Response.json({ message: '入力内容を確認してください。' }, { status: 400 });
  }

  const apiBase = getApiBase();
  try {
    const response = await fetch(new URL('/api/pro/leads', apiBase), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Lead API failed: ${response.status}`);
    return Response.json(await response.json(), { status: 201 });
  } catch (error) {
    console.error('Pro lead proxy failed', error);
    return Response.json({ message: 'お問い合わせを送信できませんでした。' }, { status: 502 });
  }
}
