import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

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
  await context.route('**/api/reactions**', (route) => fulfillReactionApi(route, store));
  await context.route('**/api/assembly-records**', async (route) => {
    const url = new URL(route.request().url());
    const body = url.pathname.endsWith('/stats')
      ? {
          open_data_source_count: 7,
          assembly_count: 7,
          statement_count: 367,
          updated_at: '2026-08-31',
        }
      : { records: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

async function openFirstDiscussion(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /この議論を見る/ }).first().click();
  const agreeButton = page.getByRole('button', { name: /👍 賛成/ }).first();
  await expect(agreeButton).toBeVisible();
  return agreeButton;
}

test('全体集計を別ブラウザ・シークレットウィンドウ・再読込で共有する', async ({ browser }) => {
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
    const regularAgree = await openFirstDiscussion(regularPage);
    await expect(regularAgree).toHaveText(/\(0\)/);
    await regularAgree.click();
    await expect(regularAgree).toHaveText(/\(1\)/);
    await expect(regularAgree).toHaveAttribute('aria-pressed', 'true');

    expect(store.aggregateOnlyRequests.length).toBeGreaterThan(0);
    expect(
      store.aggregateOnlyRequests.every((url) => !url.searchParams.has('anonymous_user_id')),
    ).toBe(true);

    const otherPage = await otherBrowserContext.newPage();
    const otherAgree = await openFirstDiscussion(otherPage);
    await expect(otherAgree).toHaveText(/\(1\)/);
    await expect(otherAgree).toHaveAttribute('aria-pressed', 'false');

    const privatePage = await privateContext.newPage();
    const privateAgree = await openFirstDiscussion(privatePage);
    await expect(privateAgree).toHaveText(/\(1\)/);
    await expect(privateAgree).toHaveAttribute('aria-pressed', 'false');

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
    const reloadedAgree = await openFirstDiscussion(regularPage);
    await expect(reloadedAgree).toHaveText(/\(1\)/);
    await expect(reloadedAgree).toHaveAttribute('aria-pressed', 'true');
  } finally {
    await Promise.all([
      regularContext.close(),
      otherBrowserContext.close(),
      privateContext.close(),
    ]);
  }
});
