import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';
import { installIssueCatalogMock } from './issueCatalogMock';

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
  follows?: Map<string, { issue_id: string; created_at: string; last_viewed_status_at: string }>;
  statusUpdatedAt?: string;
  statusSummary?: string;
  failFollowReads?: boolean;
  failFollowWrites?: boolean;
  failFollowDeletes?: boolean;
  failReads: boolean;
  failWrites: boolean;
  legacyReactionRequests: number;
}

function publicFollow(store: MockStore, follow: { issue_id: string; created_at: string; last_viewed_status_at: string }) {
  const statusUpdatedAt = store.statusUpdatedAt || '2026-06-10T00:00:00+09:00';
  const statusSummary = store.statusSummary || '受入体制とICTツールを検討・研究する方針が答弁されました。';
  return {
    ...follow,
    assembly_id: 'shinjuku-ward',
    municipality: '新宿区',
    title: '病児保育の利用拒否と予約・空き状況の改善',
    current_status: '議会で質問・答弁済み',
    status_summary: statusSummary,
    status_updated_at: statusUpdatedAt,
    status_checked_at: '2026-08-24T15:03:35+09:00',
    problem_summary: '病児保育の空き状況が分かりにくいことが課題です。',
    government_response_summary: '新宿区はICTツールを研究すると答弁しました。',
    share_summary: '病児保育の予約改善について意見を集めています。',
    source_url: 'https://example.test/shinjuku-minutes',
    question_id: QUESTION_ID,
    notification_enabled: false,
    current_response_count: store.responses.size,
    has_new_status: Date.parse(statusUpdatedAt) > Date.parse(follow.last_viewed_status_at),
    status_updates: [{
      updated_at: statusUpdatedAt,
      status: '公式ページを更新',
      summary: statusSummary,
      source_url: 'https://example.test/shinjuku-status-update',
    }],
  };
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
    if (store.failWrites) {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Firestore unavailable"}' });
      return;
    }
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
        issue_id: ISSUE_ID,
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
      issue_id: ISSUE_ID,
      question_id: QUESTION_ID,
      my_response: store.responses.get(anonymousUserId) || null,
      aggregate: aggregate(store),
    }),
  });
}

async function installApiMock(context: BrowserContext, store: MockStore) {
  await installIssueCatalogMock(context);
  await context.route('**/api/follows**', async (route) => {
    const request = route.request();
    const follows = store.follows ||= new Map();
    if (request.method() === 'PUT' || request.method() === 'PATCH') {
      if (store.failFollowWrites) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Firestore unavailable"}' });
        return;
      }
      const body = request.postDataJSON() as { anonymous_user_id: string; issue_id: string };
      const key = `${body.anonymous_user_id}:${body.issue_id}`;
      const previous = follows.get(key);
      const now = new Date().toISOString();
      const saved = {
        issue_id: body.issue_id,
        created_at: previous?.created_at || now,
        last_viewed_status_at: request.method() === 'PATCH'
          ? now
          : previous?.last_viewed_status_at || store.statusUpdatedAt || '2026-06-10T00:00:00+09:00',
      };
      follows.set(key, saved);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', storage_backend: 'firestore', created: !previous, follow: publicFollow(store, saved) }),
      });
      return;
    }
    const url = new URL(request.url());
    const anonymousUserId = url.searchParams.get('anonymous_user_id') || '';
    const issueId = url.searchParams.get('issue_id') || '';
    if (request.method() === 'DELETE') {
      if (store.failFollowDeletes) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Firestore unavailable"}' });
        return;
      }
      follows.delete(`${anonymousUserId}:${issueId}`);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', storage_backend: 'firestore', deleted: true }) });
      return;
    }
    if (store.failFollowReads) {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Firestore unavailable"}' });
      return;
    }
    const items = Array.from(follows.entries())
      .filter(([key]) => key.startsWith(`${anonymousUserId}:`))
      .map(([, follow]) => ({
        ...publicFollow(store, follow),
        my_response: store.responses.get(anonymousUserId) || null,
      }));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        storage_backend: 'firestore',
        follows: items,
        total: items.length,
        unread_total: items.filter((item) => item.has_new_status).length,
      }),
    });
  });
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
  const store: MockStore = { responses: new Map(), failReads: false, failWrites: false, legacyReactionRequests: 0 };
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    await Promise.all([installApiMock(contextA, store), installApiMock(contextB, store)]);
    const pageA = await contextA.newPage();
    await pageA.goto('/');
    const listCardA = pageA.locator(`[data-testid="issue-card"][data-issue-id="${ISSUE_ID}"]`);
    await expect(listCardA.getByTestId('answer-count')).toHaveText('市民回答 0件');
    await listCardA.getByRole('button', { name: '詳細を見る' }).click();
    const panelA = pageA.getByTestId('citizen-question-panel');
    await expect(panelA).toBeVisible();
    await expect(panelA.getByTestId('aggregate-total')).toHaveText('市民回答 0件');
    await panelA.getByTestId('question-answer-needed').click();
    await panelA.getByTestId('question-reason-availability_unknown').click();
    await panelA.getByTestId('question-reason-capacity_shortage').click();
    await expect(panelA.getByTestId('opinion-draft')).toContainText('空き状況が分かりにくいこと');
    await expect(panelA.getByTestId('opinion-draft')).not.toContainText('利用経験がなく');
    await panelA.getByTestId('skip-opinion-draft').click();
    await panelA.getByTestId('submit-citizen-response').click();
    await expect(panelA.getByTestId('citizen-response-success')).toBeVisible();
    await expect(panelA.getByTestId('aggregate-total')).toHaveText('市民回答 1件');
    await pageA.getByTestId('close-discussion-modal').click();
    await expect(listCardA.getByTestId('answer-count')).toHaveText('市民回答 1件');
    await listCardA.getByRole('button', { name: '詳細を見る' }).click();

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
  const store: MockStore = { responses: new Map(), failReads: true, failWrites: false, legacyReactionRequests: 0 };
  const context = await browser.newContext();
  try {
    await installApiMock(context, store);
    const page = await context.newPage();
    const panel = await openShinjukuQuestion(page);
    await expect(panel.getByTestId('aggregate-error')).toContainText('回答状況を確認できません');
    await expect(panel.getByTestId('retry-aggregate')).toBeVisible();
    await expect(panel.getByTestId('aggregate-total')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('回答APIがnull・空配列・タイムアウトでも一覧と詳細がクラッシュしない', async ({ browser }) => {
  const cases = [
    { name: 'null', fulfill: (route: Route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }) },
    { name: 'empty-array', fulfill: (route: Route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }) },
    { name: 'timeout', fulfill: (route: Route) => route.abort('timedout') },
  ] as const;

  for (const testCase of cases) {
    const store: MockStore = { responses: new Map(), failReads: false, failWrites: false, legacyReactionRequests: 0 };
    const context = await browser.newContext();
    try {
      await installApiMock(context, store);
      await context.unroute('**/api/citizen-question-responses**');
      await context.route('**/api/citizen-question-responses**', (route) => testCase.fulfill(route));
      const page = await context.newPage();
      await page.goto('/');
      const card = page.locator(`[data-testid="issue-card"][data-issue-id="${ISSUE_ID}"]`);
      await expect(card.getByTestId('answer-count-error'), testCase.name).toHaveText('回答状況を確認できません');
      await card.getByRole('button', { name: '詳細を見る' }).click();
      await expect(page.getByTestId('discussion-modal')).toHaveAttribute('data-discussion-id', ISSUE_ID);
      await expect(page.getByTestId('aggregate-error')).toContainText('回答状況を確認できません');
      await expect(page.getByTestId('detail-topic')).toHaveText('病児保育の利用拒否と予約・空き状況の改善');
    } finally {
      await context.close();
    }
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
    failWrites: false,
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
    await expect(results.getByTestId('admin-aggregate-total')).toHaveText('市民回答 1件');
    await expect(results.getByTestId('admin-reason-availability_unknown')).toContainText('1件');
    await expect(results.getByTestId('admin-citizen-response')).toContainText('朝に空きが確認できると助かります。');
    await expect(results).not.toContainText('hidden-anonymous-id');
  } finally {
    await context.close();
  }
});

test('下書きを編集でき、参加レシートは保存と集計取得の成功後だけ表示する', async ({ browser }) => {
  const store: MockStore = {
    responses: new Map(),
    failReads: false,
    failWrites: false,
    legacyReactionRequests: 0,
  };
  const context = await browser.newContext();
  try {
    await installApiMock(context, store);
    const page = await context.newPage();
    const panel = await openShinjukuQuestion(page);
    await panel.getByTestId('question-answer-needed').click();
    await panel.getByTestId('question-reason-availability_unknown').click();
    await expect(panel.getByTestId('participation-receipt')).toHaveCount(0);
    await panel.getByTestId('edit-opinion-draft').click();
    await expect(panel.getByTestId('question-free-text')).toContainText('病児保育');
    await panel.getByTestId('question-free-text').fill('下書きを確認して追記した意見です。');
    await panel.getByTestId('submit-citizen-response').click();
    const receipt = panel.getByTestId('participation-receipt');
    await expect(receipt).toBeVisible();
    await expect(receipt).toContainText('回答を受け付けました');
    await expect(receipt).toContainText('新宿区｜病児保育');
    await expect(receipt).toContainText('自由記述');
    await expect(receipt).toContainText('送信あり');

    await panel.getByTestId('receipt-change-response').click();
    store.failWrites = true;
    await panel.getByTestId('submit-citizen-response').click();
    await expect(panel.getByText('回答を保存できませんでした。入力内容を保持したまま再試行できます。')).toBeVisible();
    await expect(panel.getByTestId('participation-receipt')).toHaveCount(0);
    await expect(panel.getByTestId('question-free-text')).toHaveValue('下書きを確認して追記した意見です。');
  } finally {
    await context.close();
  }
});

test('回答からフォロー・更新確認・固有URL共有までA/Bブラウザで継続できる', async ({ browser }) => {
  const store: MockStore = {
    responses: new Map(),
    follows: new Map(),
    failReads: false,
    failWrites: false,
    legacyReactionRequests: 0,
  };
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    await Promise.all([installApiMock(contextA, store), installApiMock(contextB, store)]);
    await contextA.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (card: unknown) => {
          (window as unknown as { __sharedIssueCard: unknown }).__sharedIssueCard = card;
        },
      });
    });

    const pageA = await contextA.newPage();
    await pageA.goto(`/issues/${ISSUE_ID}`);
    await expect(pageA).toHaveURL(new RegExp(`/issues/${ISSUE_ID}$`));
    const panelA = pageA.getByTestId('citizen-question-panel');
    await expect(panelA).toBeVisible();
    await expect(pageA.getByRole('button', { name: 'フォロー中の議題は0件です' })).toBeVisible();
    await expect(pageA.getByTestId('detail-municipality')).toContainText('新宿区議会');
    await panelA.getByTestId('question-answer-needed').click();
    await panelA.getByTestId('question-reason-availability_unknown').click();
    await panelA.getByTestId('edit-opinion-draft').click();
    await panelA.getByTestId('question-free-text').fill('E2Eで編集した公開しない個別意見');
    await panelA.getByTestId('submit-citizen-response').click();
    const receipt = panelA.getByTestId('participation-receipt');
    await expect(receipt).toContainText('回答を受け付けました');

    await receipt.getByTestId('share-issue-card').click();
    const shared = await pageA.evaluate(() => (
      window as unknown as { __sharedIssueCard: { text: string; url: string } }
    ).__sharedIssueCard);
    expect(shared.url).toContain(`/issues/${ISSUE_ID}`);
    expect(shared.text).toContain('新宿区');
    expect(shared.text).toContain('公式原文');
    expect(shared.text).not.toContain('E2Eで編集した公開しない個別意見');
    expect(shared.text).not.toMatch(/anonymous_user_id|gijiraku_anonymous/i);

    await receipt.getByTestId('receipt-follow-issue').click();
    await expect(receipt.getByTestId('receipt-follow-issue')).toContainText('フォロー中');
    await expect(receipt).toContainText('フォローしました。その後の変化をマイフォローで確認できます。');
    await expect(pageA.getByRole('button', { name: 'フォロー中の議題は1件です' })).toBeVisible();
    expect(store.follows?.size).toBe(1);

    await pageA.evaluate(async (issueId) => {
      const anonymousUserId = window.localStorage.getItem('gijiraku_anonymous_user_id');
      const request = () => fetch('/api/follows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: issueId, anonymous_user_id: anonymousUserId }),
      });
      await request();
      await request();
    }, ISSUE_ID);
    expect(store.follows?.size).toBe(1);

    await pageA.getByRole('button', { name: '閉じる' }).click();
    await pageA.getByRole('button', { name: 'フォロー中の議題は1件です' }).click();
    const myFollows = pageA.getByRole('dialog', { name: 'マイフォロー' });
    await expect(myFollows).toContainText('病児保育の利用拒否と予約・空き状況の改善');
    await expect(myFollows).toContainText('必要だと思う');
    await expect(myFollows.getByTestId('follow-current-response-count')).toHaveText('市民回答 1件');
    await expect(myFollows).toContainText('最終更新日');
    await expect(myFollows).toContainText('現在の状態');
    await myFollows.getByRole('button', { name: 'マイフォローを閉じる' }).click();

    await pageA.reload();
    const restoredPanel = pageA.getByTestId('citizen-question-panel');
    await expect(restoredPanel.getByTestId('question-answer-needed')).toBeChecked();
    await expect(restoredPanel.getByTestId('question-free-text')).toHaveValue('E2Eで編集した公開しない個別意見');

    const pageB = await contextB.newPage();
    await pageB.goto(`/issues/${ISSUE_ID}`);
    const panelB = pageB.getByTestId('citizen-question-panel');
    await expect(panelB.getByTestId('aggregate-total')).toHaveText('市民回答 1件');
    await expect(panelB.getByTestId('question-answer-needed')).not.toBeChecked();
    await expect(pageB.getByText('E2Eで編集した公開しない個別意見')).toHaveCount(0);
    await expect(pageB.getByRole('button', { name: 'フォロー中の議題は0件です' })).toBeVisible();
    await pageB.getByRole('button', { name: 'このテーマをフォローする' }).click();
    await expect(pageB.getByRole('button', { name: /フォロー中の議題は1件/ })).toBeVisible();
    expect(store.follows?.size).toBe(2);
    await expect(pageA.getByRole('button', { name: 'フォロー中の議題は1件です' })).toBeVisible();

    store.statusUpdatedAt = new Date().toISOString();
    store.statusSummary = '病児保育の空き状況ページが公式に更新されました。';
    await pageA.goto('/');
    await expect(pageA.getByTestId('follow-update-notice')).toBeVisible();
    await expect(pageA.getByRole('button', { name: 'フォロー中の議題は1件、新しい動きは1件です' })).toBeVisible();
    await pageA.getByTestId('follow-update-notice').click();
    const updatedFollows = pageA.getByRole('dialog', { name: 'マイフォロー' });
    await expect(updatedFollows.getByTestId('follow-update-badge')).toHaveText(/前回から更新あり/);
    await expect(updatedFollows.getByTestId('follow-update-details')).toContainText('病児保育の空き状況ページが公式に更新されました。');
    await updatedFollows.getByRole('button', { name: '詳しく見る' }).click();
    const statusDetail = pageA.getByTestId('follow-status-detail');
    await expect(statusDetail).toContainText('前回確認後の更新');
    await expect(statusDetail).toContainText('病児保育の空き状況ページが公式に更新されました。');
    await expect(pageA.getByTestId('header-follow-badge')).toHaveCount(0);
    await expect(pageA.getByRole('button', { name: 'フォロー中の議題は1件です' })).toBeVisible();

    await pageA.getByRole('button', { name: '閉じる' }).click();
    await pageA.getByRole('button', { name: 'フォロー中の議題は1件です' }).click();
    const followAfterRead = pageA.getByRole('dialog', { name: 'マイフォロー' });
    await followAfterRead.getByRole('button', { name: '解除' }).click();
    const confirmation = followAfterRead.getByTestId('unfollow-confirmation');
    await expect(confirmation).toContainText('この議題のフォローを解除しますか？');
    await confirmation.getByRole('button', { name: 'キャンセル' }).click();
    await expect(followAfterRead.getByText('病児保育の利用拒否と予約・空き状況の改善')).toBeVisible();

    await followAfterRead.getByRole('button', { name: '解除' }).click();
    store.failFollowDeletes = true;
    await followAfterRead.getByTestId('unfollow-confirmation').getByRole('button', { name: '解除する' }).click();
    await expect(followAfterRead.getByText('フォローを解除できませんでした。')).toBeVisible();
    expect(store.follows?.size).toBe(2);
    store.failFollowDeletes = false;
    await followAfterRead.getByTestId('unfollow-confirmation').getByRole('button', { name: '解除する' }).click();
    await expect(followAfterRead.getByTestId('my-follow-empty')).toBeVisible();
    await expect(pageA.getByRole('button', { name: 'フォロー中の議題は0件です' })).toBeVisible();
    expect(store.follows?.size).toBe(1);
    expect(store.responses.size).toBe(1);
    expect(aggregate(store).total_responses).toBe(1);
    await expect(pageB.getByRole('button', { name: /フォロー中の議題は1件/ })).toBeVisible();
  } finally {
    await Promise.all([contextA.close(), contextB.close()]);
  }
});

test('フォロー一覧取得失敗を0件と表示せず、再試行で回復する', async ({ browser }) => {
  const store: MockStore = {
    responses: new Map(),
    follows: new Map(),
    failReads: false,
    failWrites: false,
    failFollowReads: true,
    legacyReactionRequests: 0,
  };
  const context = await browser.newContext();
  try {
    await installApiMock(context, store);
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: 'フォロー中の議題を取得できませんでした' }).click();
    const myFollows = page.getByRole('dialog', { name: 'マイフォロー' });
    await expect(myFollows).toContainText('フォロー中の議題を取得できませんでした');
    await expect(myFollows.getByTestId('my-follow-empty')).toHaveCount(0);
    store.failFollowReads = false;
    await myFollows.getByRole('button', { name: '再試行' }).click();
    await expect(myFollows.getByTestId('my-follow-empty')).toBeVisible();
    await expect(page.getByRole('button', { name: 'フォロー中の議題は0件です' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('フォロー登録失敗を回答保存成功と分離し、入力・集計を維持する', async ({ browser }) => {
  const store: MockStore = {
    responses: new Map(),
    follows: new Map(),
    failReads: false,
    failWrites: false,
    legacyReactionRequests: 0,
  };
  const context = await browser.newContext();
  try {
    await installApiMock(context, store);
    const page = await context.newPage();
    const panel = await openShinjukuQuestion(page);
    await panel.getByTestId('question-answer-needed').click();
    await panel.getByTestId('question-reason-availability_unknown').click();
    await panel.getByTestId('skip-opinion-draft').click();
    await panel.getByTestId('submit-citizen-response').click();
    const receipt = panel.getByTestId('participation-receipt');
    await expect(receipt).toBeVisible();
    expect(store.responses.size).toBe(1);
    expect(store.follows?.size).toBe(0);

    store.failFollowWrites = true;
    await receipt.getByTestId('receipt-follow-issue').click();
    await expect(receipt).toContainText('回答は保存されましたが、フォローを登録できませんでした。');
    await expect(receipt).toContainText('回答を受け付けました');
    await expect(panel.getByTestId('aggregate-total')).toHaveText('市民回答 1件');
    expect(store.responses.size).toBe(1);
    expect(store.follows?.size).toBe(0);

    store.failFollowWrites = false;
    await receipt.getByTestId('receipt-follow-issue').click();
    await expect(receipt).toContainText('フォローしました。その後の変化をマイフォローで確認できます。');
    expect(store.follows?.size).toBe(1);
  } finally {
    await context.close();
  }
});
