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
