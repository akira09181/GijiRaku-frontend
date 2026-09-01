import { expect, test, type BrowserContext, type Route } from '@playwright/test';
import { installIssueCatalogMock } from './issueCatalogMock';

interface FeaturedDiscussion {
  readonly assemblyId: string;
  readonly assemblyName: string;
  readonly discussionId: string;
  readonly topic: string;
  readonly meetingDate: string;
  readonly meetingName: string;
  readonly summary: string;
  readonly statementId: string;
  readonly speakerName: string;
  readonly statementSummary: string;
}

const FEATURED_DISCUSSIONS: readonly FeaturedDiscussion[] = [
  {
    assemblyId: 'tokyo-metropolitan',
    assemblyName: '東京都議会',
    discussionId: 'tokyo-app-2026-06-16',
    topic: '東京アプリの機能強化',
    meetingDate: '2026-06-16',
    meetingName: '令和8年第2回定例会 東京都議会会議録第8号（速報版）',
    summary: '東京アプリで行政サービスと支援情報を届けます。',
    statementId: 'tokyo-statement',
    speakerName: '東京議員',
    statementSummary: '東京アプリの機能強化を提案しました。',
  },
  {
    assemblyId: 'shinjuku-ward',
    assemblyName: '新宿区議会',
    discussionId: 'shinjuku-sick-child-care-2026-06-10',
    topic: '病児保育の利用拒否と予約・空き状況の改善',
    meetingDate: '2026-06-10',
    meetingName: '令和8年6月定例会（第2回）第5号',
    summary: '病児保育の受入体制と予約案内を改善します。',
    statementId: 'shinjuku-statement',
    speakerName: '新宿区議',
    statementSummary: '病児保育を利用できない事例を質問しました。',
  },
  {
    assemblyId: 'machida-city',
    assemblyName: '町田市議会',
    discussionId: 'machida-regional-transport-2026-03-26',
    topic: '交通不便地域の新しい地域交通モデル',
    meetingDate: '2026-03-26',
    meetingName: '令和8年3月定例会（第1回）',
    summary: '地域に合った新しい移動手段を検討します。',
    statementId: 'machida-statement',
    speakerName: '町田市議',
    statementSummary: '交通不便地域への対応を求めました。',
  },
  {
    assemblyId: 'shinagawa-ward',
    assemblyName: '品川区議会',
    discussionId: 'shinagawa-inclusive-education-2026-02-19',
    topic: '深い学び・多様性の包摂と教員負担軽減',
    meetingDate: '2026-02-19',
    meetingName: '令和8年第1回品川区議会定例会（第2日目）',
    summary: '教育の包摂と教員負担軽減を進めます。',
    statementId: 'shinagawa-statement',
    speakerName: '品川区議',
    statementSummary: '教育環境の改善を質問しました。',
  },
  {
    assemblyId: 'shibuya-ward',
    assemblyName: '渋谷区議会',
    discussionId: 'shibuya-inflation-support-2026-01-16',
    topic: '物価高騰緊急支援給付金と子育て応援手当',
    meetingDate: '2026-01-16',
    meetingName: '令和8年1月臨時会（第1回）',
    summary: '物価高対策の給付と子育て手当を実施します。',
    statementId: 'shibuya-statement',
    speakerName: '渋谷区議',
    statementSummary: '緊急支援給付金を審議しました。',
  },
  {
    assemblyId: 'arakawa-ward',
    assemblyName: '荒川区議会',
    discussionId: 'arakawa-ward-auto-2026-03-17-685-6-267',
    topic: '令和8年度当初予算の重点施策',
    meetingDate: '2026-03-17',
    meetingName: '令和8年度荒川区議会定例会・2月会議',
    summary: '令和8年度当初予算への要望を確認します。',
    statementId: 'arakawa-statement',
    speakerName: '荒川区議',
    statementSummary: '当初予算の重点項目を討論しました。',
  },
  {
    assemblyId: 'hachioji-city',
    assemblyName: '八王子市議会',
    discussionId: 'hachioji-rag-ai-2026-06-11',
    topic: '検索拡張生成AIの行政利用',
    meetingDate: '2026-06-11',
    meetingName: '令和8年第2回八王子市議会定例会（第4日目）',
    summary: '検索拡張生成AIで行政事務を効率化します。',
    statementId: 'hachioji-statement',
    speakerName: '八王子市議',
    statementSummary: '行政での生成AI利用を質問しました。',
  },
];

function apiRecord(item: FeaturedDiscussion) {
  return {
    discussion_id: item.discussionId,
    topic: item.topic,
    meeting_date: item.meetingDate,
    meeting_name: item.meetingName,
    source_url: `https://example.test/${item.discussionId}`,
    what_changes: item.summary,
    target_audience: `${item.assemblyName}の住民`,
    current_stage: `${item.meetingDate}の会議で審議済み`,
    budget_info: '公式会議録に記載された内容を確認',
    original_quote: item.statementSummary,
    publication_status: 'published',
    statements: [{
      statement_id: item.statementId,
      speaker_name: item.speakerName,
      speaker_role: `${item.assemblyName}議員`,
      stance_label: '課題提起',
      summary_quote: item.statementSummary,
      full_summary: item.statementSummary,
      source_excerpt: item.statementSummary,
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
        updated_at: '2026-08-31',
      }),
    });
    return;
  }

  const assemblyId = url.searchParams.get('assembly_id');
  const discussionId = url.searchParams.get('discussion_id');
  const item = FEATURED_DISCUSSIONS.find((candidate) => (
    candidate.assemblyId === assemblyId && candidate.discussionId === discussionId
  ));
  if (!item) {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    return;
  }
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      assembly_id: item.assemblyId,
      assembly_name: item.assemblyName,
      records: [apiRecord(item)],
    }),
  });
}

async function installApiMock(context: BrowserContext) {
  await installIssueCatalogMock(context);
  await context.route('**/api/assembly-records**', fulfillAssemblyApi);
  await context.route('**/api/reactions**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        storage_backend: 'firestore',
        aggregates: [],
        user_reactions: [],
        data: [],
      }),
    });
  });
  await context.route('**/api/citizen-question-responses**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        storage_backend: 'firestore',
        my_response: null,
        aggregate: {
          total_responses: 0,
          answers: [],
          reasons: [],
          top_reasons: [],
        },
      }),
    });
  });
}

test('全7地域で一覧カードと詳細が同じ議題レコードを表示する', async ({ browser }) => {
  const context = await browser.newContext();
  await installApiMock(context);
  const page = await context.newPage();

  try {
    await page.goto('/');
    await expect(page.getByTestId('discussion-card')).toHaveCount(FEATURED_DISCUSSIONS.length);

    for (const item of FEATURED_DISCUSSIONS) {
      const card = page.locator(
        `[data-testid="discussion-card"][data-assembly-id="${item.assemblyId}"]`,
      );
      await expect(card).toHaveAttribute('data-discussion-id', item.discussionId);
      await expect(card.getByTestId('card-municipality')).toHaveText(item.assemblyName);
      await expect(card.getByTestId('card-topic')).toHaveText(item.topic);
      await expect(card.getByTestId('card-date')).toHaveText(
        `${item.meetingDate.replaceAll('-', '/')}｜${item.meetingName}`,
      );
      await card.getByRole('button', { name: /この議論を見る/ }).click();
      const modal = page.getByTestId('discussion-modal');
      await expect(modal).toHaveAttribute('data-assembly-id', item.assemblyId);
      await expect(modal).toHaveAttribute('data-discussion-id', item.discussionId);
      await expect(modal.getByTestId('detail-municipality')).toContainText(item.assemblyName);
      await expect(modal.getByTestId('detail-topic')).toHaveText(item.topic);
      await expect(modal.getByTestId('detail-date')).toHaveText(
        `${item.meetingDate.replaceAll('-', '/')}｜${item.meetingName}`,
      );
      await expect(modal.getByTestId('detail-summary')).toHaveText(item.summary);

      const statements = modal.getByTestId('discussion-statement');
      await expect(statements).toHaveCount(1);
      await expect(statements.first()).toHaveAttribute('data-statement-id', item.statementId);
      await expect(statements.first()).toContainText(item.speakerName);
      await expect(statements.first()).toContainText(item.statementSummary);
      await modal.getByTestId('close-discussion-modal').click();
      await expect(modal).toBeHidden();
    }
  } finally {
    await context.close();
  }
});
