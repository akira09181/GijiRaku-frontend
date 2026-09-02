import { expect, test, type BrowserContext } from '@playwright/test';

async function mockHomeApis(context: BrowserContext) {
  await context.route('**/api/issues**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      updated_at: '2026-08-24',
      issue_count: 0,
      total_catalog_issue_count: 0,
      counts_by_assembly: {},
      themes: [],
      issues: [],
    }),
  }));
  await context.route('**/api/assembly-records**', async (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          open_data_source_count: 7,
          assembly_count: 7,
          catalog_issue_count: 0,
          statement_count: 386,
          updated_at: '2026-08-24',
        }),
      });
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await context.route('**/api/follows**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', follows: [], total: 0, unread_total: 0 }),
  }));
}

test('未対応地域の導入リクエストを送信できる', async ({ browser }) => {
  const context = await browser.newContext();
  await mockHomeApis(context);
  await context.route('**/api/region-requests', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const body = route.request().postDataJSON() as {
      municipality_id: string;
      municipality_name: string;
      email?: string;
      message?: string;
    };
    expect(body.municipality_id).toBe('chiyoda-ward');
    expect(body.municipality_name).toContain('千代田');
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', request_id: 'test-request' }),
    });
  });

  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.getByRole('button', { name: '表示する' }).click();
    await page.getByTestId('assembly-list-item').filter({ hasText: '千代田区議会' }).click();

    const modal = page.getByTestId('region-request-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: /千代田区議会の導入をリクエスト/ })).toBeVisible();

    await modal.getByPlaceholder('公開時にお知らせを受け取る').fill('citizen@example.com');
    await modal.getByPlaceholder('例：子育て支援の議論を追いかけたいです').fill('子育ての議題を見たいです');
    await modal.getByRole('button', { name: '導入をリクエストする' }).click();

    await expect(modal.getByRole('status')).toContainText('リクエストを受け付けました');
  } finally {
    await context.close();
  }
});

test('Step1の準備中地域を選ぶと導入リクエストモーダルが開く', async ({ browser }) => {
  const context = await browser.newContext();
  await mockHomeApis(context);
  await context.route('**/api/region-requests', async (route) => route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success' }),
  }));

  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.locator('#my-area-selector select').selectOption('setagaya-ward');
    await expect(page.getByTestId('region-request-modal')).toBeVisible();
    await expect(page.getByRole('heading', { name: /世田谷区議会の導入をリクエスト/ })).toBeVisible();
  } finally {
    await context.close();
  }
});
