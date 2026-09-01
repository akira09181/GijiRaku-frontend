import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

const PUBLIC_URL = 'https://giji-raku-frontend.vercel.app/';
const API_PATH = '/api/citizen-question-responses';
const ISSUE_ID = 'shinjuku-sick-child-care-2026-06-10';
const QUESTION_ID = 'shinjuku-sick-child-care-realtime-booking-v1';
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
  const response = await route.fetch({ url: url.toString() });
  const payload = await response.json() as Record<string, unknown>;
  const myResponse = payload.my_response && typeof payload.my_response === 'object'
    ? { ...payload.my_response as Record<string, unknown>, question_id: QUESTION_ID }
    : payload.my_response;
  await route.fulfill({
    response,
    json: { ...payload, question_id: QUESTION_ID, my_response: myResponse },
  });
}

async function configureContext(context: BrowserContext, userId: string) {
  await context.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, value);
  }, { key: 'gijiraku_anonymous_user_id', value: userId });
  await context.route(`**${API_PATH}**`, useDedicatedQuestion);
}

async function findIssueCard(page: Page, assemblyId: string, issueId: string) {
  await page.goto(PUBLIC_URL);
  await page.getByLabel('地域で絞り込む').selectOption(assemblyId);
  const card = page.locator(`[data-testid="issue-card"][data-issue-id="${issueId}"]`);
  while (await card.count() === 0) {
    const loadMore = page.getByTestId('load-more-issues');
    if (!(await loadMore.isVisible())) break;
    await loadMore.click();
  }
  await expect(card).toHaveCount(1);
  return card;
}

async function openQuestion(page: Page) {
  const card = await findIssueCard(page, 'shinjuku-ward', ISSUE_ID);
  await card.getByRole('button', { name: '詳細を見る' }).click();
  await expect(page.getByTestId('discussion-modal')).toHaveAttribute('data-discussion-id', ISSUE_ID);
  const panel = page.getByTestId('citizen-question-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByTestId('aggregate-error')).toHaveCount(0);
  await expect(panel.getByTestId('aggregate-total')).toBeVisible();
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
    await expect(panelA.getByTestId('aggregate-total')).toHaveText('市民回答 1件');
    await expect(panelA.getByTestId('aggregate-answer-needed')).toContainText('1件（100%）');

    await pageA.reload();
    panelA = await openQuestion(pageA);
    await expect(panelA.getByTestId('question-answer-needed')).toBeChecked();

    const pageB = await contextB.newPage();
    let panelB = await openQuestion(pageB);
    await expect(panelB.getByTestId('aggregate-total')).toHaveText('市民回答 1件');
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

test('公開環境で回答数とFAQをissue_idごとに表示する', async ({ page }) => {
  const tokyoAppId = 'tokyo-app-2026-06-16';
  const teacherAiId = 'tokyo-teacher-generative-ai-2026-06-17';

  const tokyoAppCard = await findIssueCard(page, 'tokyo-metropolitan', tokyoAppId);
  await expect(tokyoAppCard).toContainText(/市民回答 \d+件/);
  await expect(tokyoAppCard).not.toContainText('回答状況を確認できません');
  await tokyoAppCard.getByRole('button', { name: '詳細を見る' }).click();
  let modal = page.getByTestId('discussion-modal');
  await expect(modal).toHaveAttribute('data-discussion-id', tokyoAppId);
  await expect(modal.getByTestId('issue-faq')).toHaveAttribute('data-issue-id', tokyoAppId);
  await modal.getByRole('button', { name: '閉じる' }).click();

  const teacherAiCard = await findIssueCard(page, 'tokyo-metropolitan', teacherAiId);
  await expect(teacherAiCard).toContainText('市民質問は準備中');
  await teacherAiCard.getByRole('button', { name: '詳細を見る' }).click();
  modal = page.getByTestId('discussion-modal');
  await expect(modal).toHaveAttribute('data-discussion-id', teacherAiId);
  await expect(modal.getByTestId('issue-faq')).toHaveCount(0);
  await expect(modal.getByText('東京アプリで何が変わる？')).toHaveCount(0);
});
