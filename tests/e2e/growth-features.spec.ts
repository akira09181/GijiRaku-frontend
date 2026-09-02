import { expect, test, type BrowserContext } from '@playwright/test';

async function mockHomeApis(context: BrowserContext) {
  await context.route('**/api/issues**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      updated_at: '2026-08-24',
      issue_count: 2,
      total_catalog_issue_count: 2,
      counts_by_assembly: { 'shinjuku-ward': 1, 'machida-city': 1 },
      themes: [{ id: 'child', label: '子育て・教育' }],
      issues: [
        {
          issue_id: 'shinjuku-sick-child-care-2026-06-10',
          assembly_id: 'shinjuku-ward',
          assembly_name: '新宿区議会',
          meeting_name: '定例会',
          meeting_date: '2026-06-10',
          title: '病児保育',
          theme: { id: 'child', label: '子育て・教育' },
          summary: '病児保育の利用拒否が論点',
          people: ['議員A'],
          speaker_count: 1,
          stage: '答弁済み',
          stage_detail: '答弁済み',
          answer_count: null,
          question_id: 'q1',
          source_url: 'https://example.com/a',
          source_dataset: { title: '公式', catalog_url: 'https://example.com/a', resource_url: 'https://example.com/a' },
        },
        {
          issue_id: 'machida-regional-transport-2026-03-26',
          assembly_id: 'machida-city',
          assembly_name: '町田市議会',
          meeting_name: '定例会',
          meeting_date: '2026-03-26',
          title: '地域交通',
          theme: { id: 'child', label: '子育て・教育' },
          summary: '交通不便地域の議論',
          people: ['議員B'],
          speaker_count: 1,
          stage: '審議中',
          stage_detail: '審議中',
          answer_count: null,
          question_id: null,
          source_url: 'https://example.com/b',
          source_dataset: { title: '公式', catalog_url: 'https://example.com/b', resource_url: 'https://example.com/b' },
        },
      ],
    }),
  }));
  await context.route('**/api/assembly-records**', async (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/stats')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', assembly_count: 7, statement_count: 386, updated_at: '2026-08-24' }) });
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await context.route('**/api/follows**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', follows: [], total: 0, unread_total: 0 }) }));
  await context.route('**/api/reactions**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', aggregates: [], user_reactions: [] }) }));
  await context.route('**/api/citizen-question-responses**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', aggregate: { total_responses: 0, answers: [], reasons: [], top_reasons: [] } }) }));
}

test('主権者教育モードで地図セクションを非表示にする', async ({ browser }) => {
  const context = await browser.newContext();
  await mockHomeApis(context);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect(page.getByRole('button', { name: '表示する' })).toBeVisible();
    await page.getByTestId('education-mode-toggle').click();
    await expect(page.getByRole('button', { name: '表示する' })).toHaveCount(0);
    await expect(page.locator('#my-area-selector')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('議題ページが動的OGPメタデータを返す', async ({ request }) => {
  const response = await request.get('/issues/shinjuku-sick-child-care-2026-06-10');
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('新宿区');
  expect(html).toContain('og:image');
});

test('関連議題パネルが表示される', async ({ browser }) => {
  const context = await browser.newContext();
  await mockHomeApis(context);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect(page.getByTestId('related-issues-panel')).toBeVisible();
    await expect(page.getByTestId('related-issues-panel')).toContainText('町田市議会');
  } finally {
    await context.close();
  }
});
