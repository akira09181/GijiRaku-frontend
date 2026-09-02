import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type BrowserContext } from '@playwright/test';

interface Statement {
  readonly statement_id: string;
  readonly speaker_name: string;
}

interface RecordDetail {
  readonly discussion_id: string;
  readonly publication_status: string;
  readonly topic: string;
  readonly meeting_date: string;
  readonly meeting_name: string;
  readonly source_url: string;
  readonly what_changes: string;
  readonly current_stage: string;
  readonly statements: readonly Statement[];
}

interface Dataset {
  readonly updated_at: string;
  readonly assemblies: Readonly<Record<string, {
    readonly assembly_name: string;
    readonly records: readonly RecordDetail[];
  }>>;
}

const VERIFIED_AUTO_IDS = new Set([
  'arakawa-ward-auto-2026-03-17-685-6-194',
  'arakawa-ward-auto-2026-03-17-685-6-267',
  'arakawa-ward-auto-2026-02-17-685-3-111',
  'arakawa-ward-auto-2026-02-16-685-2-62',
  'arakawa-ward-auto-2026-02-16-685-2-99',
]);

const PUBLIC_TITLE_OVERRIDES: Readonly<Record<string, string>> = {
  'arakawa-ward-auto-2026-03-17-685-6-194': 'こども誰でも通園制度の運営基準と保育体制',
  'arakawa-ward-auto-2026-03-17-685-6-267': '令和8年度当初予算の重点施策',
  'arakawa-ward-auto-2026-02-17-685-3-111': '町会・自治会の担い手確保と区との連携',
  'arakawa-ward-auto-2026-02-16-685-2-62': '令和8年度予算と物価高への生活支援',
  'arakawa-ward-auto-2026-02-16-685-2-99': '子どもに寄り添う支援施策の拡充',
};

const siblingDatasetPath = resolve(process.cwd(), '../gijiraku-api/data/assembly_records.json');
const ciDatasetPath = resolve(process.cwd(), 'gijiraku-api/data/assembly_records.json');
const datasetPath = existsSync(siblingDatasetPath) ? siblingDatasetPath : ciDatasetPath;
const dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as Dataset;

const catalogIssues = Object.entries(dataset.assemblies).flatMap(([assemblyId, assembly]) => (
  assembly.records
    .filter((record) => record.publication_status === 'published' && (
      !record.discussion_id.includes('-auto-') || VERIFIED_AUTO_IDS.has(record.discussion_id)
    ))
    .map((record) => ({
      issue_id: record.discussion_id,
      assembly_id: assemblyId,
      assembly_name: assembly.assembly_name,
      meeting_name: record.meeting_name,
      meeting_date: record.meeting_date,
      title: PUBLIC_TITLE_OVERRIDES[record.discussion_id] || record.topic,
      theme: { id: 'administration', label: '行政・議会' },
      summary: record.what_changes,
      people: [...new Set(record.statements.map((statement) => statement.speaker_name))],
      speaker_count: new Set(record.statements.map((statement) => statement.speaker_name)).size,
      stage: record.current_stage.includes('答弁済み') ? '答弁済み' : '審議中',
      stage_detail: record.current_stage,
      answer_count: null,
      question_id: null,
      source_url: record.source_url,
      source_dataset: { title: '公式会議録', catalog_url: record.source_url, resource_url: record.source_url },
      detail: { ...record, topic: PUBLIC_TITLE_OVERRIDES[record.discussion_id] || record.topic },
    }))
)).sort((left, right) => right.meeting_date.localeCompare(left.meeting_date));

async function mockCatalogApis(context: BrowserContext) {
  await context.route('**/api/search/semantic**', async (route) => {
    const url = new URL(route.request().url());
    const assemblyId = url.searchParams.get('assembly_id');
    const issue = catalogIssues.find((item) => (
      (!assemblyId || item.assembly_id === assemblyId)
      && item.detail.statements.length > 0
    ));
    const statement = issue?.detail.statements[0];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      status: 'success',
      query: url.searchParams.get('q') || '',
      assembly_id: assemblyId,
      result_count: issue && statement ? 1 : 0,
      results: issue && statement ? [{
        issue_id: issue.issue_id,
        statement_id: statement.statement_id,
        assembly_id: issue.assembly_id,
        assembly_name: issue.assembly_name,
        title: issue.title,
        meeting_name: issue.meeting_name,
        meeting_date: issue.meeting_date,
        speaker_name: statement.speaker_name,
        speaker_role: '議員',
        summary: issue.summary,
        source_excerpt: issue.summary,
        source_url: issue.source_url,
        relevance_score: 0.91,
      }] : [],
    }) });
  });
  await context.route('**/api/issues**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      status: 'success', updated_at: dataset.updated_at, issue_count: catalogIssues.length,
      total_catalog_issue_count: catalogIssues.length,
      counts_by_assembly: Object.fromEntries(Object.keys(dataset.assemblies).map((assemblyId) => [assemblyId, catalogIssues.filter((issue) => issue.assembly_id === assemblyId).length])),
      themes: [{ id: 'administration', label: '行政・議会' }],
      issues: catalogIssues.map(({ detail, ...issue }) => {
        expect(detail.discussion_id).toBe(issue.issue_id);
        return issue;
      }),
    }) });
  });
  await context.route('**/api/assembly-records**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/stats')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        status: 'success', open_data_source_count: 7, assembly_count: 7,
        record_count: 179, catalog_issue_count: catalogIssues.length,
        statement_count: 386, updated_at: dataset.updated_at,
      }) });
      return;
    }
    const issue = catalogIssues.find((item) => item.assembly_id === url.searchParams.get('assembly_id') && item.issue_id === url.searchParams.get('discussion_id'));
    await route.fulfill({
      status: issue ? 200 : 404,
      contentType: 'application/json',
      body: JSON.stringify(issue ? {
        status: 'success', assembly_id: issue.assembly_id,
        assembly_name: issue.assembly_name, records: [issue.detail],
      } : {}),
    });
  });
  await context.route('**/api/follows**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', follows: [], total: 0, unread_total: 0 }) }));
  await context.route('**/api/reactions**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', storage_backend: 'firestore', aggregates: [], user_reactions: [] }) }));
  await context.route('**/api/citizen-question-responses**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', storage_backend: 'firestore', my_response: null, total: 0, aggregate: { total_responses: 0, answers: [], reasons: [], top_reasons: [] } }) }));
}

test('文脈検索結果がissue_id・statement_idを保ったまま同じ議題を開く', async ({ browser }) => {
  const context = await browser.newContext();
  await mockCatalogApis(context);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.getByLabel('議事録を文脈で検索').fill('子どもが急に熱を出した時の預け先');
    await page.getByRole('button', { name: '検索', exact: true }).click();
    const result = page.getByTestId('semantic-search-results').locator('li').first();
    const issueId = await result.getAttribute('data-issue-id');
    const statementId = await result.getAttribute('data-statement-id');
    expect(issueId).toBeTruthy();
    expect(statementId).toBeTruthy();
    await expect(result).toContainText('関連度 91%');
    await result.getByRole('button', { name: 'この議題を見る' }).click();
    await expect(page.getByTestId('discussion-modal')).toHaveAttribute('data-discussion-id', issueId!);
    await expect(page.getByTestId('discussion-modal').locator(`[data-statement-id="${statementId}"]`)).toBeVisible();
  } finally {
    await context.close();
  }
});

test('要約をクリックすると同じstatement_idの原文抜粋だけを展開して強調する', async ({ browser }) => {
  const issue = catalogIssues.find((item) => item.detail.statements.length > 1);
  expect(issue).toBeTruthy();
  const context = await browser.newContext();
  await mockCatalogApis(context);
  const page = await context.newPage();
  try {
    await page.goto('/');
    while (await page.getByTestId('load-more-issues').isVisible().catch(() => false)) {
      await page.getByTestId('load-more-issues').click();
    }
    await page.locator(`[data-testid="issue-card"][data-issue-id="${issue!.issue_id}"]`).getByRole('button', { name: '詳細を見る' }).click();
    const modal = page.getByTestId('discussion-modal');
    const targetStatement = modal.getByTestId('discussion-statement').first();
    const otherStatement = modal.getByTestId('discussion-statement').nth(1);
    await targetStatement.getByTestId('summary-source-link').click();
    const targetExcerpt = targetStatement.getByTestId('source-excerpt');
    await expect(targetExcerpt).toBeVisible();
    await expect(targetExcerpt).toBeFocused();
    await expect(targetExcerpt).toHaveClass(/ring-4/);
    await expect(otherStatement.getByTestId('source-excerpt')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('リアクションを即時反映し、保存失敗時は選択と件数をロールバックする', async ({ browser }) => {
  const issue = catalogIssues.find((item) => item.detail.statements.length > 0);
  expect(issue).toBeTruthy();
  const context = await browser.newContext();
  await mockCatalogApis(context);
  let selected: 'agree' | null = null;
  let completedPuts = 0;
  await context.route('**/api/reactions**', async (route) => {
    const request = route.request();
    if (request.method() === 'PUT') {
      const body = request.postDataJSON() as { statement_id: string; reaction_type: 'agree' | null };
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 700));
      completedPuts += 1;
      if (completedPuts === 2) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'temporary failure' }) });
        return;
      }
      const previous = selected;
      selected = body.reaction_type;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        status: 'success', statement_id: body.statement_id,
        previous_reaction_type: previous, reaction_type: selected,
        changed: previous !== selected,
        counts: { agree: selected ? 1 : 0, concern: 0, helpful: 0 },
      }) });
      return;
    }
    const url = new URL(request.url());
    const statementId = `${issue!.assembly_id}-speaker-${issue!.detail.statements[0].statement_id}`;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      status: 'success', discussion_id: issue!.issue_id,
      aggregates: selected ? [{ statement_id: statementId, counts: { agree: 1, concern: 0, helpful: 0 } }] : [],
      user_reactions: url.searchParams.get('include_user_state') === 'false' || !selected
        ? []
        : [{ statement_id: statementId, reaction_type: selected }],
    }) });
  });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.locator(`[data-testid="issue-card"][data-issue-id="${issue!.issue_id}"]`).getByRole('button', { name: '詳細を見る' }).click();
    const statement = page.getByTestId('discussion-modal').getByTestId('discussion-statement').first();
    const agreeButton = statement.getByRole('button', { name: /賛成/ });

    await agreeButton.click();
    await expect(agreeButton).toHaveAttribute('aria-pressed', 'true', { timeout: 300 });
    await expect(agreeButton).toContainText('(1)', { timeout: 300 });
    await expect.poll(() => completedPuts).toBe(1);

    await agreeButton.click();
    await expect(agreeButton).toHaveAttribute('aria-pressed', 'false', { timeout: 300 });
    await expect(agreeButton).toContainText('(0)', { timeout: 300 });
    await expect(agreeButton).toHaveAttribute('aria-pressed', 'true', { timeout: 2_000 });
    await expect(agreeButton).toContainText('(1)');
    await expect(page.getByText('リアクションを保存できませんでした。通信状況を確認して、もう一度お試しください。')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('実データ52議題を一覧化し、全カードの詳細・出典・内部ID非表示を検証する', async ({ browser }) => {
  test.setTimeout(120_000);
  expect(catalogIssues.length).toBe(52);
  const context = await browser.newContext();
  await mockCatalogApis(context);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect(page.getByText('公開中の議題').locator('..')).toContainText('52');
    await expect(page.getByText('原文照合済み発言').locator('..')).toContainText('386');
    while (await page.getByTestId('load-more-issues').isVisible().catch(() => false)) {
      await page.getByTestId('load-more-issues').click();
    }
    await expect(page.getByTestId('issue-card')).toHaveCount(52);

    for (const issue of catalogIssues) {
      const card = page.locator(`[data-testid="issue-card"][data-issue-id="${issue.issue_id}"]`);
      await expect(card.getByTestId('issue-card-title')).toHaveText(issue.title);
      await expect(card.getByRole('link', { name: '公式原文' })).toHaveAttribute('href', issue.source_url);
      await card.getByRole('button', { name: '詳細を見る' }).click();
      const modal = page.getByTestId('discussion-modal');
      await expect(modal).toHaveAttribute('data-assembly-id', issue.assembly_id);
      await expect(modal).toHaveAttribute('data-discussion-id', issue.issue_id);
      await expect(modal.getByTestId('detail-topic')).toHaveText(issue.title);
      await expect(modal.getByTestId('detail-date')).toHaveText(`${issue.meeting_date.replaceAll('-', '/')}｜${issue.meeting_name}`);
      await expect(modal).not.toContainText(issue.issue_id);
      await modal.getByTestId('close-discussion-modal').click();
    }
  } finally {
    await context.close();
  }
});

test('スマートフォンでも地域＋テーマの複合絞り込みともっと見るを操作できる', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mockCatalogApis(context);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.getByLabel('地域で絞り込む').selectOption('shinjuku-ward');
    await page.getByLabel('テーマで絞り込む').selectOption('administration');
    await expect(page.getByTestId('filtered-issue-count')).toHaveText('該当 20件');
    await expect(page.getByTestId('issue-card').first()).toHaveAttribute('data-issue-id', /.+/);
    await expect(page.getByTestId('issue-card').first()).toBeVisible();
    await page.getByTestId('load-more-issues').click();
    await expect(page.getByTestId('issue-card')).toHaveCount(20);
  } finally {
    await context.close();
  }
});

test('FAQ・発言・公式原文をissue_idで分離し、議題切替後に前のFAQを残さない', async ({ browser }) => {
  const tokyoApp = catalogIssues.find((issue) => issue.issue_id === 'tokyo-app-2026-06-16');
  const teacherAi = catalogIssues.find((issue) => issue.issue_id === 'tokyo-teacher-generative-ai-2026-06-17');
  expect(tokyoApp).toBeTruthy();
  expect(teacherAi).toBeTruthy();

  const context = await browser.newContext();
  await mockCatalogApis(context);
  const page = await context.newPage();
  try {
    await page.goto('/');
    while (await page.getByTestId('load-more-issues').isVisible().catch(() => false)) {
      await page.getByTestId('load-more-issues').click();
    }

    const tokyoCard = page.locator(`[data-testid="issue-card"][data-issue-id="${tokyoApp!.issue_id}"]`);
    await tokyoCard.getByRole('button', { name: '詳細を見る' }).click();
    let modal = page.getByTestId('discussion-modal');
    await expect(modal).toHaveAttribute('data-discussion-id', tokyoApp!.issue_id);
    await expect(modal.getByTestId('issue-faq')).toHaveAttribute('data-issue-id', tokyoApp!.issue_id);
    await expect(modal.getByText('東京アプリで何が変わる？')).toBeVisible();
    await expect(modal.getByRole('link', { name: '公式会議録原文' })).toHaveAttribute('href', tokyoApp!.source_url);
    await modal.getByTestId('close-discussion-modal').click();

    const teacherCard = page.locator(`[data-testid="issue-card"][data-issue-id="${teacherAi!.issue_id}"]`);
    await teacherCard.getByRole('button', { name: '詳細を見る' }).click();
    modal = page.getByTestId('discussion-modal');
    await expect(modal).toHaveAttribute('data-discussion-id', teacherAi!.issue_id);
    await expect(modal.getByTestId('detail-topic')).toHaveText(teacherAi!.title);
    await expect(modal.getByTestId('issue-faq')).toHaveCount(0);
    await expect(modal.getByText('東京アプリで何が変わる？')).toHaveCount(0);
    await expect(modal.getByRole('link', { name: '公式会議録原文' })).toHaveAttribute('href', teacherAi!.source_url);
    for (const statement of teacherAi!.detail.statements) {
      await expect(modal.locator(`[data-testid="discussion-statement"][data-statement-id="${statement.statement_id}"]`)).toBeVisible();
    }
    await modal.getByRole('button', { name: '議員ダッシュボード' }).click();
    const analyticsModal = page.getByTestId('analytics-modal');
    await analyticsModal.getByRole('button', { name: /市民世論フィードバック/ }).click();
    await expect(analyticsModal.getByTestId('admin-citizen-question-results')).toHaveCount(0);
    await expect(analyticsModal).not.toContainText('東京アプリの機能強化');
  } finally {
    await context.close();
  }
});
