import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

const PUBLIC_URL = 'https://giji-raku-frontend.vercel.app/';
const API_PATH = '/api/citizen-question-responses';
const TEST_QUESTION_ID = 'shinjuku-sick-child-care-realtime-booking-public-e2e-v1';
const USER_A = 'machivoice-public-e2e-browser-a-v1';
const USER_B = 'machivoice-public-e2e-browser-b-v1';

test.skip(
  process.env.RUN_PUBLIC_CITIZEN_E2E !== '1',
  'requires explicit opt-in against the public deployment',
);

async function useDedicatedQuestion(route: Route) {
  const request = route.request();
  if (request.method() === 'PUT') {
    const body = request.postDataJSON() as Record<string, unknown>;
    await route.continue({
      postData: JSON.stringify({ ...body, question_id: TEST_QUESTION_ID }),
      headers: { ...request.headers(), 'content-type': 'application/json' },
    });
    return;
  }
  const url = new URL(request.url());
  url.searchParams.set('question_id', TEST_QUESTION_ID);
  await route.continue({ url: url.toString() });
}

async function configureContext(context: BrowserContext, userId: string) {
  await context.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, value);
  }, { key: 'gijiraku_anonymous_user_id', value: userId });
  await context.route(`**${API_PATH}**`, useDedicatedQuestion);
}

async function openQuestion(page: Page) {
  await page.goto(PUBLIC_URL);
  const card = page.locator('[data-testid="discussion-card"][data-assembly-id="shinjuku-ward"]');
  await card.getByRole('button', { name: /この議論を見る/ }).click();
  const panel = page.getByTestId('citizen-question-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByTestId('aggregate-error')).toHaveCount(0);
  return panel;
}

test('公開環境で回答作成・復元・別ブラウザ集計・回答変更が動作する', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  await configureContext(contextA, USER_A);
  await configureContext(contextB, USER_B);

  try {
    const pageA = await contextA.newPage();
    let panelA = await openQuestion(pageA);
    await panelA.getByTestId('question-answer-needed').click();
    const availability = panelA.getByTestId('question-reason-availability_unknown');
    if (!(await availability.isChecked())) await availability.click();
    await panelA.getByTestId('submit-citizen-response').click();
    await expect(panelA.getByTestId('citizen-response-success')).toBeVisible();
    await expect(panelA.getByTestId('aggregate-total')).toHaveText('回答総数：1件');
    await expect(panelA.getByTestId('aggregate-answer-needed')).toContainText('1件（100%）');

    await pageA.reload();
    panelA = await openQuestion(pageA);
    await expect(panelA.getByTestId('question-answer-needed')).toBeChecked();

    const pageB = await contextB.newPage();
    let panelB = await openQuestion(pageB);
    await expect(panelB.getByTestId('aggregate-total')).toHaveText('回答総数：1件');
    await expect(panelB.getByTestId('aggregate-answer-needed')).toContainText('1件（100%）');

    await panelA.getByTestId('question-answer-current_is_enough').click();
    await panelA.getByTestId('submit-citizen-response').click();
    await expect(panelA.getByTestId('citizen-response-success')).toBeVisible();

    await pageB.reload();
    panelB = await openQuestion(pageB);
    await expect(panelB.getByTestId('aggregate-answer-needed')).toContainText('0件（0%）');
    await expect(panelB.getByTestId('aggregate-answer-current_is_enough')).toContainText('1件（100%）');
  } finally {
    await Promise.all([contextA.close(), contextB.close()]);
  }
});
