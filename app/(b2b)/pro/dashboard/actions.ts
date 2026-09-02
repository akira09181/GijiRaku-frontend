'use server';

import type { ProTrendData, TrendResult } from '../../../types/proTrends';
import { getApiBase } from '../../../lib/apiBase';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isTrendData(value: unknown): value is ProTrendData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<ProTrendData>;
  return Boolean(
    data.period
    && typeof data.period.from === 'string'
    && typeof data.period.to === 'string'
    && data.totals
    && Number.isFinite(data.totals.assembly_count)
    && Number.isFinite(data.totals.issue_count)
    && Number.isFinite(data.totals.speaker_count)
    && Array.isArray(data.keywords)
    && Array.isArray(data.themes)
    && Array.isArray(data.assemblies),
  );
}

export async function getTrendDashboard(input: {
  readonly from: string;
  readonly to: string;
}): Promise<TrendResult> {
  if (!ISO_DATE.test(input.from) || !ISO_DATE.test(input.to) || input.from > input.to) {
    return { ok: false, message: '集計期間が正しくありません。' };
  }

  const apiBase = getApiBase();
  const url = new URL('/api/pro/trends', apiBase);
  url.searchParams.set('from_date', input.from);
  url.searchParams.set('to_date', input.to);

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Trend API failed: ${response.status}`);
    const payload = await response.json() as { data?: unknown };
    if (!isTrendData(payload.data)) throw new Error('Trend API returned an invalid response');
    return { ok: true, data: payload.data };
  } catch (error) {
    console.error('Pro trend dashboard could not be loaded', error);
    return { ok: false, message: '議会トレンドを取得できませんでした。時間をおいて再度お試しください。' };
  }
}
