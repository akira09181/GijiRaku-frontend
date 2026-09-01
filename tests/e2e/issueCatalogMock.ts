import type { BrowserContext } from '@playwright/test';

const ISSUES = [
  ['tokyo-metropolitan', '東京都議会', 'tokyo-app-2026-06-16', '東京アプリの機能強化', '2026-06-16', '令和8年第2回定例会 東京都議会会議録第8号（速報版）'],
  ['shinjuku-ward', '新宿区議会', 'shinjuku-sick-child-care-2026-06-10', '病児保育の利用拒否と予約・空き状況の改善', '2026-06-10', '令和8年6月定例会（第2回）第5号'],
  ['machida-city', '町田市議会', 'machida-regional-transport-2026-03-26', '交通不便地域の新しい地域交通モデル', '2026-03-26', '令和8年3月定例会（第1回）'],
  ['shinagawa-ward', '品川区議会', 'shinagawa-inclusive-education-2026-02-19', '深い学び・多様性の包摂と教員負担軽減', '2026-02-19', '令和8年第1回品川区議会定例会（第2日目）'],
  ['shibuya-ward', '渋谷区議会', 'shibuya-inflation-support-2026-01-16', '物価高騰緊急支援給付金と子育て応援手当', '2026-01-16', '令和8年1月臨時会（第1回）'],
  ['arakawa-ward', '荒川区議会', 'arakawa-ward-auto-2026-03-17-685-6-267', '令和8年度当初予算の重点施策', '2026-03-17', '令和8年度荒川区議会定例会・2月会議'],
  ['hachioji-city', '八王子市議会', 'hachioji-rag-ai-2026-06-11', '検索拡張生成AIの行政利用', '2026-06-11', '令和8年第2回八王子市議会定例会（第4日目）'],
] as const;

export async function installIssueCatalogMock(context: BrowserContext) {
  await context.route('**/api/issues**', async (route) => {
    const issues = ISSUES.map(([assemblyId, assemblyName, issueId, title, meetingDate, meetingName]) => ({
      issue_id: issueId,
      assembly_id: assemblyId,
      assembly_name: assemblyName,
      meeting_name: meetingName,
      meeting_date: meetingDate,
      title,
      theme: { id: 'administration', label: '行政・議会' },
      summary: `${title}について公式会議録で議論されました。`,
      people: ['テスト議員'],
      speaker_count: 1,
      stage: '答弁済み',
      stage_detail: '会議で質問と答弁済み',
      answer_count: null,
      question_id: issueId === 'shinjuku-sick-child-care-2026-06-10' ? 'shinjuku-sick-child-care-realtime-booking-v1' : null,
      source_url: `https://example.test/${issueId}`,
      source_dataset: { title: '公式会議録', catalog_url: 'https://example.test/catalog', resource_url: 'https://example.test/resource' },
    }));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success', updated_at: '2026-08-31', issue_count: issues.length,
        total_catalog_issue_count: issues.length,
        counts_by_assembly: Object.fromEntries(ISSUES.map(([id]) => [id, 1])),
        themes: [{ id: 'administration', label: '行政・議会' }], issues,
      }),
    });
  });
}
