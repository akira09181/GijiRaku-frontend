import { expect, test, type BrowserContext } from '@playwright/test';

async function mockHomeApis(context: BrowserContext) {
  await context.route('**/api/issues**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      updated_at: '2026-08-24',
      issue_count: 1,
      total_catalog_issue_count: 1,
      counts_by_assembly: { 'shinjuku-ward': 1 },
      themes: [{ id: 'child', label: '子育て・教育' }],
      issues: [{
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
      }],
    }),
  }));
  await context.route('**/api/assembly-records**', async (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', assembly_count: 1, statement_count: 1, updated_at: '2026-08-24' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', records: [], total: 0 }),
    });
  });
  await context.route('**/api/follows**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', storage_backend: 'firestore', follows: [], total: 0, unread_total: 0 }),
  }));
  await context.route('**/api/reactions**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', aggregates: [], user_reactions: [] }),
  }));
  await context.route('**/api/citizen-question-responses**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', aggregate: { total_responses: 0, answers: [], reasons: [], top_reasons: [] } }),
  }));
  await context.route('**/api/notifications/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/line/status')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          storage_backend: 'firestore',
          line: {
            linked: false,
            line_push_enabled: false,
            configured: true,
            login_configured: false,
          },
        }),
      });
      return;
    }
    await route.continue();
  });
}

test('通知条件パネルにLINE連携UIが表示される', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mockHomeApis(context);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.getByLabel('フォロー中 0件').click();
    const myFollows = page.getByRole('dialog', { name: 'マイフォロー' });
    await myFollows.getByText('関心テーマの通知条件').click();
    const lineConnect = myFollows.getByTestId('line-notification-connect');
    await expect(lineConnect).toBeVisible();
    await expect(lineConnect).toContainText('LINEでプッシュ通知');
    await expect(lineConnect).toContainText('LINEログイン未設定');
  } finally {
    await context.close();
  }
});
