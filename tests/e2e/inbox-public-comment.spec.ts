import { expect, test, type BrowserContext } from '@playwright/test';
import { installIssueCatalogMock } from './issueCatalogMock';

const ISSUE_ID = 'shinjuku-sick-child-care-2026-06-10';

const ASSEMBLY_NAMES: Record<string, string> = {
  'tokyo-metropolitan': '東京都議会',
  'shinjuku-ward': '新宿区議会',
  'machida-city': '町田市議会',
  'shinagawa-ward': '品川区議会',
  'shibuya-ward': '渋谷区議会',
  'arakawa-ward': '荒川区議会',
  'hachioji-city': '八王子市議会',
};

async function mockSharedApis(context: BrowserContext) {
  await installIssueCatalogMock(context);
  await context.route('**/api/assembly-records**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/stats')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', assembly_count: 7, statement_count: 1, updated_at: '2026-08-24' }) });
      return;
    }
    const discussionId = url.searchParams.get('discussion_id');
    const assemblyId = url.searchParams.get('assembly_id') || 'shinjuku-ward';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        assembly_id: assemblyId,
        assembly_name: ASSEMBLY_NAMES[assemblyId] || 'テスト議会',
        records: discussionId ? [{
          discussion_id: discussionId,
          assembly_id: assemblyId,
          topic: 'テスト議題',
          meeting_date: '2026-06-10',
          statements: [{ speaker_name: 'テスト議員', text: 'テスト発言', utt_id: 'utt-1' }],
        }] : [],
        total: discussionId ? 1 : 0,
      }),
    });
  });
  await context.route('**/api/follows**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', storage_backend: 'firestore', follows: [], total: 0, unread_total: 0 }),
  }));
  await context.route('**/api/citizen-question-responses**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', aggregate: { total_responses: 0, answers: [], reasons: [], top_reasons: [] } }),
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
  await context.route('**/api/notifications**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/read') && request.method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', storage_backend: 'firestore', marked_count: 1, unread_total: 0, total: 1 }),
      });
      return;
    }
    if (url.pathname.endsWith('/notifications') && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          storage_backend: 'firestore',
          total: 1,
          unread_total: 1,
          notifications: [{
            notification_id: 'n1',
            issue_id: ISSUE_ID,
            message: '新しい議題「病児保育」が公開されました',
            read: false,
            title: '病児保育',
            municipality: '新宿区',
            summary: '答弁済み',
            source_url: 'https://example.com/a',
            created_at: '2026-09-01T00:00:00+00:00',
            updated_at: '2026-09-01T00:00:00+00:00',
          }],
        }),
      });
      return;
    }
    if (url.pathname.endsWith('/preferences')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          storage_backend: 'firestore',
          preferences: { interest_themes: [], municipalities: [], keywords: [] },
        }),
      });
      return;
    }
    if (url.pathname.endsWith('/line/status')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          storage_backend: 'firestore',
          line: { linked: false, line_push_enabled: false, configured: false, login_configured: false },
        }),
      });
      return;
    }
    await route.continue();
  });
}

test('通知センターが未読件数を表示する', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mockSharedApis(context);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.getByLabel('フォロー中 0件').click();
    const myFollows = page.getByRole('dialog', { name: 'マイフォロー' });
    await expect(myFollows.getByTestId('notification-center')).toBeVisible();
    await expect(myFollows.getByTestId('notification-unread-badge')).toContainText('未読 1件');
  } finally {
    await context.close();
  }
});
