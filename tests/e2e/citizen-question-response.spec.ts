import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

const ISSUE_ID = 'shinjuku-sick-child-care-2026-06-10';
const QUESTION_ID = 'shinjuku-sick-child-care-realtime-booking-v1';

const answers = [
  { id: 'needed', label: '必要だと思う' },
  { id: 'current_is_enough', label: '現状の案内で十分' },
  { id: 'need_more_information', label: '判断材料が足りない' },
] as const;

const reasons = [
  { id: 'availability_unknown', label: '空き状況が分からず困る' },
  { id: 'same_day_booking_unknown', label: '当日予約できるか分からない' },
  { id: 'capacity_shortage', label: '施設や定員が足りない' },
  { id: 'criteria_unclear', label: '症状別の受入基準が分かりにくい' },
  { id: 'never_used', label: '利用したことがない' },
  { id: 'other', label: 'その他' },
] as const;

interface StoredResponse {
  readonly selected_answer: string;
  readonly selected_reasons: readonly string[];
  readonly free_text: string;
  readonly created_at: string;
  readonly updated_at: string;
}

interface MockStore {
  readonly responses: Map<string, StoredResponse>;
  failReads: boolean;
  legacyReactionRequests: number;
}

function aggregate(store: MockStore) {
  const answerCounts = new Map(answers.map((answer) => [answer.id, 0]));
  const reasonCounts = new Map(reasons.map((reason) => [reason.id, 0]));
  store.responses.forEach((response) => {
    answerCounts.set(
      response.selected_answer as typeof answers[number]['id'],
      (answerCounts.get(response.selected_answer as typeof answers[number]['id']) || 0) + 1,
    );
    response.selected_reasons.forEach((reason) => {
      reasonCounts.set(
        reason as typeof reasons[number]['id'],
        (reasonCounts.get(reason as typeof reasons[number]['id']) || 0) + 1,
      );
    });
  });
  const total = store.responses.size;
  const aggregateReasons = reasons.map((reason) => ({
    ...reason,
    count: reasonCounts.get(reason.id) || 0,
  }));
  return {
    total_responses: total,
    answers: answers.map((answer) => ({
      ...answer,
      count: answerCounts.get(answer.id) || 0,
      percentage: total > 0 ? Math.round(((answerCounts.get(answer.id) || 0) * 1000) / total) / 10 : 0,
    })),
    reasons: aggregateReasons,
    top_reasons: aggregateReasons
      .filter((reason) => reason.count > 0)
      .sort((left, right) => right.count - left.count),
    updated_at: new Date().toISOString(),
  };
}

async function fulfillCitizenApi(route: Route, store: MockStore) {
  const request = route.request();
  if (request.method() === 'PUT') {
    const body = request.postDataJSON() as {
      anonymous_user_id: string;
      selected_answer: string;
      selected_reasons: string[];
      free_text: string;
    };
    const previous = store.responses.get(body.anonymous_user_id);
    const now = new Date().toISOString();
    const saved: StoredResponse = {
      selected_answer: body.selected_answer,
      selected_reasons: body.selected_reasons,
      free_text: body.free_text,
      created_at: previous?.created_at || now,
      updated_at: now,
    };
    store.responses.set(body.anonymous_user_id, saved);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        storage_backend: 'firestore',
        question_id: QUESTION_ID,
        my_response: saved,
        aggregate: aggregate(store),
      }),
    });
    return;
  }

  if (store.failReads) {
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Firestore unavailable"}' });
    return;
  }
  const url = new URL(request.url());
  const anonymousUserId = url.searchParams.get('anonymous_user_id') || '';
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      storage_backend: 'firestore',
      question_id: QUESTION_ID,
      my_response: store.responses.get(anonymousUserId) || null,
      aggregate: aggregate(store),
    }),
  });
}

async function installApiMock(context: BrowserContext, store: MockStore) {
  await context.route('**/api/citizen-question-responses**', (route) => fulfillCitizenApi(route, store));
  await context.route('**/api/admin/citizen-question-results**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        storage_backend: 'firestore',
        municipality: '新宿区',
        theme: '病児保育の利用拒否と予約・空き状況の改善',
        aggregate: aggregate(store),
        responses: Array.from(store.responses.values()),
      }),
    });
  });
  await context.route('**/api/reactions**', async (route) => {
    store.legacyReactionRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        storage_backend: 'firestore',
        aggregates: [],
        user_reactions: [],
      }),
    });
  });
  await context.route('**/api/assembly-records**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ open_data_source_count: 7, assembly_count: 7, statement_count: 7 }),
      });
      return;
    }
    const assemblyId = url.searchParams.get('assembly_id') || '';
    const discussionId = url.searchParams.get('discussion_id') || '';
    const isShinjuku = assemblyId === 'shinjuku-ward' && discussionId === ISSUE_ID;
    await route.fulfill({
      status: isShinjuku ? 200 : 404,
      contentType: 'application/json',
      body: JSON.stringify(isShinjuku ? {
        status: 'success',
        assembly_id: 'shinjuku-ward',
        assembly_name: '新宿区議会',
        records: [{
          discussion_id: ISSUE_ID,
          topic: '病児保育の利用拒否と予約・空き状況の改善',
          meeting_date: '2026-06-10',
          meeting_name: '令和8年6月定例会（第2回）第5号',
          source_url: 'https://example.test/shinjuku-minutes',
          what_changes: '病児保育の受入体制と予約案内を改善します。',
          target_audience: '病児保育を利用する新宿区民',
          current_stage: '審議済み',
          budget_info: '公式会議録を確認',
          original_quote: '予約方法の改善を求めました。',
          statements: [{
            statement_id: 'shinjuku-statement',
            speaker_name: '新宿区議',
            speaker_role: '議員',
            stance_label: '課題提起',
            summary_quote: '予約方法の改善を求めました。',
          }],
        }],
      } : {}),
    });
  });
}

async function openShinjukuQuestion(page: Page) {
  await page.goto('/');
  const card = page.locator('[data-testid="discussion-card"][data-assembly-id="shinjuku-ward"]');
  await card.getByRole('button', { name: /この議論を見る/ }).click();
  const panel = page.getByTestId('citizen-question-panel');
  await expect(panel).toBeVisible();
  return panel;
}

test('Aの回答作成・変更をBの全体集計へ反映し、A再読込で自分の回答を復元する', async ({ browser }) => {
  const store: MockStore = { responses: new Map(), failReads: false, legacyReactionRequests: 0 };
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    await Promise.all([installApiMock(contextA, store), installApiMock(contextB, store)]);
    const pageA = await contextA.newPage();
    const panelA = await openShinjukuQuestion(pageA);
    await expect(panelA.getByTestId('aggregate-total')).toHaveText('回答総数：0件');
    await panelA.getByTestId('question-answer-needed').click();
    await panelA.getByTestId('question-reason-availability_unknown').click();
    await panelA.getByTestId('question-reason-capacity_shortage').click();
    await panelA.getByTestId('submit-citizen-response').click();
    await expect(panelA.getByTestId('citizen-response-success')).toBeVisible();
    await expect(panelA.getByTestId('aggregate-total')).toHaveText('回答総数：1件');

    expect(store.responses.size).toBe(1);
    expect(Array.from(store.responses.values())[0].selected_reasons).toEqual([
      'availability_unknown',
      'capacity_shortage',
    ]);
    expect(Array.from(store.responses.values())[0].free_text).toBe('');

    const pageB = await contextB.newPage();
    let panelB = await openShinjukuQuestion(pageB);
    await expect(panelB.getByTestId('aggregate-answer-needed')).toContainText('1件（100%）');
    await expect(panelB.getByTestId('question-answer-needed')).not.toBeChecked();

    await panelA.getByTestId('question-answer-current_is_enough').click();
    await panelA.getByTestId('question-reason-availability_unknown').click();
    await panelA.getByTestId('question-reason-capacity_shortage').click();
    await panelA.getByTestId('question-reason-never_used').click();
    await panelA.getByTestId('submit-citizen-response').click();
    await expect(panelA.getByTestId('aggregate-answer-current_is_enough')).toContainText('1件（100%）');
    expect(store.responses.size).toBe(1);

    await pageB.reload();
    panelB = await openShinjukuQuestion(pageB);
    await expect(panelB.getByTestId('aggregate-answer-needed')).toContainText('0件（0%）');
    await expect(panelB.getByTestId('aggregate-answer-current_is_enough')).toContainText('1件（100%）');

    await pageA.reload();
    const reloadedPanelA = await openShinjukuQuestion(pageA);
    await expect(reloadedPanelA.getByTestId('question-answer-current_is_enough')).toBeChecked();
    await expect(reloadedPanelA.getByTestId('question-reason-never_used')).toBeChecked();

    await reloadedPanelA.getByTestId('question-free-text').fill('あ'.repeat(501));
    await expect(reloadedPanelA.getByText('自由記述は500文字以内で入力してください。')).toBeVisible();
    await expect(reloadedPanelA.getByTestId('submit-citizen-response')).toBeDisabled();
    expect(store.legacyReactionRequests).toBe(0);
  } finally {
    await Promise.all([contextA.close(), contextB.close()]);
  }
});

test('集計API失敗を0件表示にせず再試行を案内する', async ({ browser }) => {
  const store: MockStore = { responses: new Map(), failReads: true, legacyReactionRequests: 0 };
  const context = await browser.newContext();
  try {
    await installApiMock(context, store);
    const page = await context.newPage();
    const panel = await openShinjukuQuestion(page);
    await expect(panel.getByTestId('aggregate-error')).toContainText('集計を取得できませんでした');
    await expect(panel.getByTestId('retry-aggregate')).toBeVisible();
    await expect(panel.getByTestId('aggregate-total')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('行政画面で回答・理由・自由記述を匿名集計として確認できる', async ({ browser }) => {
  const now = new Date().toISOString();
  const store: MockStore = {
    responses: new Map([['hidden-anonymous-id', {
      selected_answer: 'needed',
      selected_reasons: ['availability_unknown', 'same_day_booking_unknown'],
      free_text: '朝に空きが確認できると助かります。',
      created_at: now,
      updated_at: now,
    }]]),
    failReads: false,
    legacyReactionRequests: 0,
  };
  const context = await browser.newContext();
  try {
    await installApiMock(context, store);
    const page = await context.newPage();
    await openShinjukuQuestion(page);
    await page.getByRole('button', { name: '議員ダッシュボード' }).click();
    await page.getByRole('button', { name: /市民世論フィードバック/ }).click();
    const results = page.getByTestId('admin-citizen-question-results');
    await expect(results.getByTestId('admin-aggregate-total')).toHaveText('回答総数 1件');
    await expect(results.getByTestId('admin-reason-availability_unknown')).toContainText('1件');
    await expect(results.getByTestId('admin-citizen-response')).toContainText('朝に空きが確認できると助かります。');
    await expect(results).not.toContainText('hidden-anonymous-id');
  } finally {
    await context.close();
  }
});
