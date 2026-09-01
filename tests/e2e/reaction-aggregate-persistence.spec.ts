import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';
import { installIssueCatalogMock } from './issueCatalogMock';

type ReactionType = 'agree' | 'concern' | 'helpful';
type ReactionCounts = Record<ReactionType, number>;

interface MockReactionStore {
  readonly countsByStatement: Map<string, ReactionCounts>;
  readonly userState: Map<string, Map<string, ReactionType>>;
  readonly aggregateOnlyRequests: URL[];
}

const emptyCounts = (): ReactionCounts => ({ agree: 0, concern: 0, helpful: 0 });

async function fulfillReactionApi(route: Route, store: MockReactionStore) {
  const request = route.request();
  const url = new URL(request.url());

  if (request.method() === 'PUT') {
    const body = request.postDataJSON() as {
      statement_id: string;
      reaction_type: ReactionType | null;
      anonymous_user_id: string;
    };
    const userReactions = store.userState.get(body.anonymous_user_id)
      || new Map<string, ReactionType>();
    const previousReaction = userReactions.get(body.statement_id) || null;
    const counts = { ...(store.countsByStatement.get(body.statement_id) || emptyCounts()) };

    if (previousReaction !== body.reaction_type) {
      if (previousReaction) counts[previousReaction] -= 1;
      if (body.reaction_type) counts[body.reaction_type] += 1;
    }
    if (body.reaction_type) {
      userReactions.set(body.statement_id, body.reaction_type);
    } else {
      userReactions.delete(body.statement_id);
    }
    store.userState.set(body.anonymous_user_id, userReactions);
    store.countsByStatement.set(body.statement_id, counts);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        storage_backend: 'firestore',
        discussion_id: 'tokyo-metropolitan',
        statement_id: body.statement_id,
        previous_reaction_type: previousReaction,
        reaction_type: body.reaction_type,
        changed: previousReaction !== body.reaction_type,
        counts,
        live_counts: counts,
      }),
    });
    return;
  }

  const includeUserState = url.searchParams.get('include_user_state') !== 'false';
  const anonymousUserId = url.searchParams.get('anonymous_user_id');
  if (!includeUserState) store.aggregateOnlyRequests.push(url);

  const aggregates = Array.from(store.countsByStatement, ([statement_id, counts]) => ({
    statement_id,
    counts,
    live_counts: counts,
  }));
  const selectedReactions = anonymousUserId
    ? store.userState.get(anonymousUserId) || new Map<string, ReactionType>()
    : new Map<string, ReactionType>();
  const user_reactions = Array.from(selectedReactions, ([statement_id, reaction_type]) => ({
    statement_id,
    reaction_type,
  }));

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      storage_backend: 'firestore',
      discussion_id: 'tokyo-metropolitan',
      aggregates,
      user_reactions: includeUserState ? user_reactions : [],
      data: aggregates.map((aggregate) => ({
        ...aggregate,
        reaction_type: selectedReactions.get(aggregate.statement_id) || null,
      })),
    }),
  });
}

async function installApiMock(context: BrowserContext, store: MockReactionStore) {
  await installIssueCatalogMock(context);
  await context.route('**/api/reactions**', (route) => fulfillReactionApi(route, store));
  await context.route('**/api/assembly-records**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          open_data_source_count: 7,
          assembly_count: 7,
          statement_count: 367,
          updated_at: '2026-08-31',
        }),
      });
      return;
    }
    const assemblyId = url.searchParams.get('assembly_id') || '';
    const discussionId = url.searchParams.get('discussion_id') || '';
    const assemblyNames: Record<string, string> = {
      'tokyo-metropolitan': '東京都議会',
      'shinjuku-ward': '新宿区議会',
      'machida-city': '町田市議会',
      'shinagawa-ward': '品川区議会',
      'shibuya-ward': '渋谷区議会',
      'arakawa-ward': '荒川区議会',
      'hachioji-city': '八王子市議会',
    };
    const record = {
      discussion_id: discussionId,
      topic: `${assemblyNames[assemblyId]}の注目議題`,
      meeting_date: '2026-06-16',
      meeting_name: '令和8年定例会',
      source_url: 'https://example.test/minutes',
      what_changes: '市民向け施策について議論しました。',
      target_audience: '地域住民',
      current_stage: '審議済み',
      budget_info: '会議録を確認',
      original_quote: '施策について質問しました。',
      statements: [{
        statement_id: `${assemblyId}-statement`,
        speaker_name: 'テスト議員',
        speaker_role: '議員',
        stance_label: '課題提起',
        summary_quote: '施策について質問しました。',
      }],
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        assembly_id: assemblyId,
        assembly_name: assemblyNames[assemblyId],
        records: [record],
      }),
    });
  });
}

async function openApp(page: Page, anonymousUserId: string) {
  await page.goto('/');
  await page.evaluate((userId) => {
    localStorage.setItem('gijiraku_anonymous_user_id', userId);
  }, anonymousUserId);
}

async function getLegacyReactions(
  page: Page,
  options: { readonly includeUserState: boolean; readonly anonymousUserId?: string },
) {
  return page.evaluate(async ({ includeUserState, anonymousUserId }) => {
    const query = new URLSearchParams({
      discussion_id: 'legacy-discussion',
      include_user_state: String(includeUserState),
    });
    if (anonymousUserId) query.set('anonymous_user_id', anonymousUserId);
    const response = await fetch(`/api/reactions?${query.toString()}`);
    if (!response.ok) throw new Error(`Legacy reaction GET failed: ${response.status}`);
    return response.json();
  }, options) as Promise<{
    readonly aggregates: readonly { readonly statement_id: string; readonly live_counts: ReactionCounts }[];
    readonly user_reactions: readonly { readonly statement_id: string; readonly reaction_type: ReactionType }[];
  }>;
}

async function putLegacyReaction(page: Page, anonymousUserId: string) {
  return page.evaluate(async (userId) => {
    const response = await fetch('/api/reactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discussion_id: 'legacy-discussion',
        statement_id: 'legacy-statement',
        reaction_type: 'agree',
        anonymous_user_id: userId,
      }),
    });
    if (!response.ok) throw new Error(`Legacy reaction PUT failed: ${response.status}`);
    return response.json();
  }, anonymousUserId) as Promise<{
    readonly live_counts: ReactionCounts;
    readonly reaction_type: ReactionType;
  }>;
}

test('既存リアクションAPIの全体集計とユーザー別状態を別ブラウザ・再読込で共有する', async ({ browser }) => {
  const store: MockReactionStore = {
    countsByStatement: new Map(),
    userState: new Map(),
    aggregateOnlyRequests: [],
  };
  const regularContext = await browser.newContext();
  const otherBrowserContext = await browser.newContext();
  const privateContext = await browser.newContext();

  try {
    await Promise.all([
      installApiMock(regularContext, store),
      installApiMock(otherBrowserContext, store),
      installApiMock(privateContext, store),
    ]);

    const regularPage = await regularContext.newPage();
    await openApp(regularPage, 'legacy-browser-a');
    const initial = await getLegacyReactions(regularPage, { includeUserState: false });
    expect(initial.aggregates).toHaveLength(0);
    const saved = await putLegacyReaction(regularPage, 'legacy-browser-a');
    expect(saved.live_counts.agree).toBe(1);
    expect(saved.reaction_type).toBe('agree');

    expect(store.aggregateOnlyRequests.length).toBeGreaterThan(0);
    expect(
      store.aggregateOnlyRequests.every((url) => !url.searchParams.has('anonymous_user_id')),
    ).toBe(true);

    const otherPage = await otherBrowserContext.newPage();
    await openApp(otherPage, 'legacy-browser-b');
    const otherSnapshot = await getLegacyReactions(otherPage, { includeUserState: false });
    expect(otherSnapshot.aggregates[0].live_counts.agree).toBe(1);
    expect(otherSnapshot.user_reactions).toHaveLength(0);

    const privatePage = await privateContext.newPage();
    await openApp(privatePage, 'legacy-private-browser');
    const privateSnapshot = await getLegacyReactions(privatePage, { includeUserState: false });
    expect(privateSnapshot.aggregates[0].live_counts.agree).toBe(1);
    expect(privateSnapshot.user_reactions).toHaveLength(0);

    const regularUserId = await regularPage.evaluate(() => (
      localStorage.getItem('gijiraku_anonymous_user_id')
    ));
    const privateUserId = await privatePage.evaluate(() => (
      localStorage.getItem('gijiraku_anonymous_user_id')
    ));
    expect(regularUserId).toBeTruthy();
    expect(privateUserId).toBeTruthy();
    expect(privateUserId).not.toBe(regularUserId);

    await regularPage.reload();
    const reloaded = await getLegacyReactions(regularPage, {
      includeUserState: true,
      anonymousUserId: 'legacy-browser-a',
    });
    expect(reloaded.aggregates[0].live_counts.agree).toBe(1);
    expect(reloaded.user_reactions).toEqual([{
      statement_id: 'legacy-statement',
      reaction_type: 'agree',
    }]);
  } finally {
    await Promise.all([
      regularContext.close(),
      otherBrowserContext.close(),
      privateContext.close(),
    ]);
  }
});
