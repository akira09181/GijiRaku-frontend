import { getApiBase } from '../../lib/apiBase';

type RegionRequestPayload = {
  readonly municipality_id?: unknown;
  readonly municipality_name?: unknown;
  readonly email?: unknown;
  readonly message?: unknown;
  readonly anonymous_user_id?: unknown;
  readonly website?: unknown;
};

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(request: Request) {
  let input: RegionRequestPayload;
  try {
    input = await request.json() as RegionRequestPayload;
  } catch {
    return Response.json({ message: 'JSON形式で送信してください。' }, { status: 400 });
  }

  if (text(input.website, 200)) {
    return Response.json({ status: 'success' }, { status: 202 });
  }

  const payload = {
    municipality_id: text(input.municipality_id, 80),
    municipality_name: text(input.municipality_name, 120),
    email: text(input.email, 254).toLowerCase(),
    message: text(input.message, 500),
    anonymous_user_id: text(input.anonymous_user_id, 80),
  };

  if (!payload.municipality_id || !payload.municipality_name) {
    return Response.json({ message: '対象地域を確認してください。' }, { status: 400 });
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return Response.json({ message: 'メールアドレスを確認してください。' }, { status: 400 });
  }

  const apiBase = getApiBase();
  try {
    const response = await fetch(new URL('/api/region-requests', apiBase), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Region request API failed: ${response.status}`);
    return Response.json(await response.json(), { status: 201 });
  } catch (error) {
    console.error('Region request proxy failed', error);
    return Response.json({ message: 'リクエストを送信できませんでした。' }, { status: 502 });
  }
}
