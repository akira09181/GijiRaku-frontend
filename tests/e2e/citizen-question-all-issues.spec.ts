import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';
import {
  CITIZEN_QUESTIONS,
  type CitizenQuestionDefinition,
} from '../../app/data/citizenQuestions';

interface StoredResponse {
  readonly issue_id: string;
  readonly question_id: string;
  readonly selected_answer: string;
  readonly selected_reasons: readonly string[];
  readonly free_text: string;
  readonly created_at: string;
  readonly updated_at: string;
}

interface MockFirestore {
  readonly responses: Map<string, StoredResponse>;
}

const ASSEMBLY_NAMES: Readonly<Record<string, string>> = {
  'tokyo-metropolitan': '東京都議会',
  'shinjuku-ward': '新宿区議会',
  'machida-city': '町田市議会',
  'shinagawa-ward': '品川区議会',
  'shibuya-ward': '渋谷区議会',
  'arakawa-ward': '荒川区議会',
  'hachioji-city': '八王子市議会',
};

const RECORD_TOPICS: Readonly<Record<string, string>> = {
  'tokyo-app-2026-06-16': '東京アプリの機能強化',
  'shinjuku-sick-child-care-2026-06-10': '病児保育の利用拒否と予約・空き状況の改善',
  'machida-regional-transport-2026-03-26': '交通不便地域の新しい地域交通モデル',
  'shinagawa-inclusive-education-2026-02-19': '深い学び・多様性の包摂と教員負担軽減',
  'shibuya-inflation-support-2026-01-16': '物価高騰緊急支援給付金と子育て応援手当',
  'arakawa-ward-auto-2026-03-17-685-6-267': '当初予算の内容や我が党の予算に関する特別委員会等で要望した事項',
  'hachioji-rag-ai-2026-06-11': '検索拡張生成AIの行政利用',
};

const EXPECTED_QUESTION_TERMS: Readonly<Record<string, readonly string[]>> = {
  'tokyo-app-2026-06-16': ['東京アプリ', '支援情報', '行政手続'],
  'shinjuku-sick-child-care-2026-06-10': ['病児保育', '空き状況', '予約'],
  'machida-regional-transport-2026-03-26': ['交通不便地域', '新しい移動手段'],
  'shinagawa-inclusive-education-2026-02-19': ['教員の負担', '支援人材', '教育DX'],
  'shibuya-inflation-support-2026-01-16': ['物価高騰支援', '全区民', '子育て世帯'],
  'arakawa-ward-auto-2026-03-17-685-6-267': ['令和8年度予算', '目標と成果', '区民の声'],
  'hachioji-rag-ai-2026-06-11': ['検索拡張生成AI', '回答根拠', '職員の確認'],
};

function responseKey(questionId: string, anonymousUserId: string) {
  return `${questionId}\u001f${anonymousUserId}`;
}

function definitionForQuestion(questionId: string) {
  return CITIZEN_QUESTIONS.find((definition) => definition.questionId === questionId);
}

function responsesForQuestion(store: MockFirestore, questionId: string) {
  return Array.from(store.responses.values()).filter(
    (response) => response.question_id === questionId,
  );
}

function aggregate(store: MockFirestore, definition: CitizenQuestionDefinition) {
  const responses = responsesForQuestion(store, definition.questionId);
  const answerCounts = new Map(definition.answers.map((answer) => [answer.id, 0]));
  const reasonCounts = new Map(definition.reasons.map((reason) => [reason.id, 0]));
  responses.forEach((response) => {
    answerCounts.set(
      response.selected_answer,
      (answerCounts.get(response.selected_answer) || 0) + 1,
    );
    response.selected_reasons.forEach((reasonId) => {
      reasonCounts.set(reasonId, (reasonCounts.get(reasonId) || 0) + 1);
    });
  });
  const total = responses.length;
  const aggregateReasons = definition.reasons.map((reason) => ({
    ...reason,
    count: reasonCounts.get(reason.id) || 0,
  }));
  return {
    total_responses: total,
    answers: definition.answers.map((answer) => ({
      ...answer,
      count: answerCounts.get(answer.id) || 0,
      percentage: total > 0
        ? Math.round(((answerCounts.get(answer.id) || 0) * 1000) / total) / 10
        : 0,
    })),
    reasons: aggregateReasons,
    top_reasons: aggregateReasons
      .filter((reason) => reason.count > 0)
      .sort((left, right) => right.count - left.count),
    updated_at: new Date().toISOString(),
  };
}

function apiRecord(definition: CitizenQuestionDefinition) {
  const assemblyName = ASSEMBLY_NAMES[definition.assemblyId];
  return {
    discussion_id: definition.issueId,
    topic: RECORD_TOPICS[definition.issueId],
    meeting_date: '2026-01-01',
    meeting_name: '令和8年定例会',
    source_url: `https://example.test/${definition.issueId}`,
    what_changes: `${RECORD_TOPICS[definition.issueId]}について審議しました。`,
    target_audience: `${assemblyName}の住民`,
    current_stage: '審議済み',
    budget_info: '公式会議録を確認',
    original_quote: `${RECORD_TOPICS[definition.issueId]}について質問しました。`,
    publication_status: 'published',
    statements: [{
      statement_id: `${definition.issueId}-statement`,
      speaker_name: `${definition.municipality}議員`,
      speaker_role: '議員',
      stance_label: '課題提起',
      summary_quote: `${RECORD_TOPICS[definition.issueId]}について質問しました。`,
      full_summary: `${RECORD_TOPICS[definition.issueId]}について質問しました。`,
      source_excerpt: `${RECORD_TOPICS[definition.issueId]}について質問しました。`,
      question_type: '一般質問',
      avatar_color: 'sky',
    }],
  };
}

async function fulfillAssemblyApi(route: Route) {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith('/stats')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        open_data_source_count: 7,
        assembly_count: 7,
        statement_count: 7,
      }),
    });
    return;
  }
  const assemblyId = url.searchParams.get('assembly_id') || '';
  const discussionId = url.searchParams.get('discussion_id');
  const definition = CITIZEN_QUESTIONS.find((candidate) => (
    candidate.assemblyId === assemblyId
    && (!discussionId || candidate.issueId === discussionId)
  ));
  if (!definition) {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    return;
  }
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      assembly_id: definition.assemblyId,
      assembly_name: ASSEMBLY_NAMES[definition.assemblyId],
      records: [apiRecord(definition)],
    }),
  });
}

async function fulfillCitizenApi(route: Route, store: MockFirestore) {
  const request = route.request();
  if (request.method() === 'PUT') {
    const body = request.postDataJSON() as {
      issue_id: string;
      question_id: string;
      anonymous_user_id: string;
      selected_answer: string;
      selected_reasons: string[];
      free_text: string;
    };
    const definition = definitionForQuestion(body.question_id);
    if (!definition || definition.issueId !== body.issue_id) {
      await route.fulfill({ status: 422, contentType: 'application/json', body: '{}' });
      return;
    }
    const key = responseKey(body.question_id, body.anonymous_user_id);
    const previous = store.responses.get(key);
    const now = new Date().toISOString();
    const saved: StoredResponse = {
      issue_id: body.issue_id,
      question_id: body.question_id,
      selected_answer: body.selected_answer,
      selected_reasons: body.selected_reasons,
      free_text: body.free_text,
      created_at: previous?.created_at || now,
      updated_at: now,
    };
    store.responses.set(key, saved);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        storage_backend: 'firestore',
        question_id: definition.questionId,
        my_response: saved,
        aggregate: aggregate(store, definition),
      }),
    });
    return;
  }

  const url = new URL(request.url());
  const questionId = url.searchParams.get('question_id') || '';
  const issueId = url.searchParams.get('issue_id') || '';
  const anonymousUserId = url.searchParams.get('anonymous_user_id') || '';
  const definition = definitionForQuestion(questionId);
  if (!definition || definition.issueId !== issueId) {
    await route.fulfill({ status: 422, contentType: 'application/json', body: '{}' });
    return;
  }
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      storage_backend: 'firestore',
      question_id: questionId,
      my_response: store.responses.get(responseKey(questionId, anonymousUserId)) || null,
      aggregate: aggregate(store, definition),
    }),
  });
}

async function installApiMock(context: BrowserContext, store: MockFirestore) {
  await context.route('**/api/assembly-records**', fulfillAssemblyApi);
  await context.route(
    '**/api/citizen-question-responses**',
    (route) => fulfillCitizenApi(route, store),
  );
  await context.route('**/api/admin/citizen-question-results**', async (route) => {
    const url = new URL(route.request().url());
    const questionId = url.searchParams.get('question_id') || '';
    const issueId = url.searchParams.get('issue_id') || '';
    const definition = definitionForQuestion(questionId);
    if (!definition || definition.issueId !== issueId) {
      await route.fulfill({ status: 422, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        storage_backend: 'firestore',
        municipality: definition.municipality,
        theme: definition.theme,
        aggregate: aggregate(store, definition),
        responses: responsesForQuestion(store, questionId).map((response) => ({
          selected_answer: response.selected_answer,
          selected_reasons: response.selected_reasons,
          free_text: response.free_text,
          created_at: response.created_at,
          updated_at: response.updated_at,
        })),
      }),
    });
  });
  await context.route('**/api/reactions**', async (route) => {
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
}

async function openQuestion(page: Page, definition: CitizenQuestionDefinition) {
  await page.goto('/');
  const card = page.locator(
    `[data-testid="discussion-card"][data-assembly-id="${definition.assemblyId}"]`,
  );
  await expect(card).toHaveAttribute('data-discussion-id', definition.issueId);
  await expect(card.getByTestId('card-topic')).toHaveText(RECORD_TOPICS[definition.issueId]);
  await card.getByRole('button', { name: /この議論を見る/ }).click();
  const modal = page.getByTestId('discussion-modal');
  await expect(modal).toHaveAttribute('data-discussion-id', definition.issueId);
  await expect(modal.getByTestId('detail-topic')).toHaveText(RECORD_TOPICS[definition.issueId]);
  const panel = modal.getByTestId('citizen-question-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { level: 3 })).toHaveText(definition.question);
  for (const term of EXPECTED_QUESTION_TERMS[definition.issueId]) {
    await expect(panel.getByRole('heading', { level: 3 })).toContainText(term);
  }
  return panel;
}

test('全7議題で回答・復元・別ブラウザ集計・回答変更・行政画面反映が成立する', async ({ browser }) => {
  test.setTimeout(180_000);
  const store: MockFirestore = { responses: new Map() };
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    await Promise.all([installApiMock(contextA, store), installApiMock(contextB, store)]);
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    for (const definition of CITIZEN_QUESTIONS) {
      let panelA = await openQuestion(pageA, definition);
      await expect(panelA.getByTestId('aggregate-total')).toHaveText('回答総数：0件');

      const firstAnswer = definition.answers[0];
      const changedAnswer = definition.answers[1];
      const firstReason = definition.reasons[0];
      const experienceReason = definition.reasons[definition.reasons.length - 2];
      await panelA.getByTestId(`question-answer-${firstAnswer.id}`).click();
      await panelA.getByTestId(`question-reason-${firstReason.id}`).click();
      await panelA.getByTestId(`question-reason-${experienceReason.id}`).click();
      await panelA.getByTestId('question-free-text').fill(`${definition.municipality}のE2E回答`);
      await panelA.getByTestId('submit-citizen-response').click();
      await expect(panelA.getByTestId('citizen-response-success')).toBeVisible();
      await expect(panelA.getByTestId('aggregate-total')).toHaveText('回答総数：1件');

      let panelB = await openQuestion(pageB, definition);
      await expect(panelB.getByTestId('aggregate-total')).toHaveText('回答総数：1件');
      await expect(panelB.getByTestId(`aggregate-answer-${firstAnswer.id}`)).toContainText('1件（100%）');
      await expect(panelB.getByTestId(`question-answer-${firstAnswer.id}`)).not.toBeChecked();

      panelA = await openQuestion(pageA, definition);
      await expect(panelA.getByTestId(`question-answer-${firstAnswer.id}`)).toBeChecked();
      await expect(panelA.getByTestId(`question-reason-${firstReason.id}`)).toBeChecked();
      await expect(panelA.getByTestId(`question-reason-${experienceReason.id}`)).toBeChecked();
      await panelA.getByTestId(`question-answer-${changedAnswer.id}`).click();
      await panelA.getByTestId('submit-citizen-response').click();
      await expect(panelA.getByTestId(`aggregate-answer-${changedAnswer.id}`)).toContainText('1件（100%）');
      expect(responsesForQuestion(store, definition.questionId)).toHaveLength(1);

      panelB = await openQuestion(pageB, definition);
      await expect(panelB.getByTestId(`aggregate-answer-${firstAnswer.id}`)).toContainText('0件（0%）');
      await expect(panelB.getByTestId(`aggregate-answer-${changedAnswer.id}`)).toContainText('1件（100%）');

      await pageB.getByRole('button', { name: '議員ダッシュボード' }).click();
      await pageB.getByRole('button', { name: /市民世論フィードバック/ }).click();
      const adminResults = pageB.getByTestId('admin-citizen-question-results');
      await expect(adminResults).toContainText(definition.municipality);
      await expect(adminResults).toContainText(definition.theme);
      await expect(adminResults).toContainText(definition.question);
      await expect(adminResults.getByTestId('admin-aggregate-total')).toHaveText('回答総数 1件');
      await expect(adminResults.getByTestId(`admin-reason-${firstReason.id}`)).toContainText('1件');
      await expect(adminResults.getByTestId('admin-citizen-response')).toContainText(
        `${definition.municipality}のE2E回答`,
      );
    }
  } finally {
    await Promise.all([contextA.close(), contextB.close()]);
  }
});
