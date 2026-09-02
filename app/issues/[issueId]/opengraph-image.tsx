import { ImageResponse } from 'next/og';
import { resolveIssueOgMeta } from '../../lib/issueOgMeta';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const { issueId } = await params;
  const meta = resolveIssueOgMeta(issueId) || {
    issueId,
    title: 'マチボイス｜議会の一次情報',
    description: '議会を知る、原文を確かめる、声を届ける。',
    municipality: '東京都',
    theme: '市民参加',
    statusLabel: '公開中',
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background: 'linear-gradient(135deg, #020617 0%, #064e3b 100%)',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 700,
            }}
          >
            市
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>マチボイス</div>
            <div style={{ fontSize: '20px', color: '#a7f3d0' }}>MachiVoice</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#6ee7b7',
            }}
          >
            {meta.municipality}
          </div>
          <div
            style={{
              fontSize: '52px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              maxWidth: '1000px',
            }}
          >
            {meta.theme}
          </div>
          <div
            style={{
              fontSize: '28px',
              lineHeight: 1.4,
              color: '#cbd5e1',
              maxWidth: '980px',
            }}
          >
            {meta.description.slice(0, 120)}{meta.description.length > 120 ? '…' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid #34d399',
              fontSize: '22px',
              fontWeight: 700,
            }}
          >
            {meta.statusLabel}
          </div>
          <div style={{ fontSize: '22px', color: '#94a3b8' }}>
            知る → 確かめる → 声を届ける
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
