import { expect, test } from '@playwright/test';

test('B2Bダッシュボードが議事録とリアクションを安全に集計する', async ({ page }) => {
  await page.route('**/api/assembly-records**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      records: [{
        discussion_id: 'tokyo-app-2026-06-16',
        meeting_date: '2026-06-16',
        meeting_name: '東京都議会',
        topic: '東京アプリの機能強化',
        source_url: 'https://example.test/minutes',
        what_changes: '行政手続をまとめて確認できるようにします。',
        target_audience: '都民',
        current_stage: '答弁済み',
        budget_info: '確認中',
        original_quote: '公式原文',
        statements: [{
          statement_id: 'statement-1',
          speaker_name: '議員A',
          speaker_role: '都議会議員',
          stance_label: '質問',
          summary_quote: '支援情報の改善を求めました。',
        }],
      }],
    }),
  }));
  await page.route('**/api/reactions**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      aggregates: [{
        statement_id: 'statement-1',
        counts: { agree: 3, concern: 2, helpful: 1 },
      }],
    }),
  }));

  await page.goto('/b2b-dashboard');

  await expect(page.getByRole('heading', { name: '東京都議会・施策分析ダッシュボード' })).toBeVisible();
  await expect(page.getByTestId('b2b-record-count')).toContainText('1');
  await expect(page.getByTestId('b2b-statement-count')).toContainText('1');
  await expect(page.getByTestId('b2b-agree-count')).toContainText('3');
  await expect(page.getByTestId('b2b-concern-count')).toContainText('2');
  await expect(page.getByRole('heading', { name: '東京アプリの機能強化' }).first()).toBeVisible();
});

test('B2B APIのnull応答でもクラッシュしない', async ({ page }) => {
  await page.route('**/api/assembly-records**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', records: null }),
  }));
  await page.route('**/api/reactions**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', aggregates: null }),
  }));

  await page.goto('/b2b-dashboard');

  await expect(page.getByRole('heading', { name: '東京都議会・施策分析ダッシュボード' })).toBeVisible();
  await expect(page.getByText('議事録の読み込み待ち')).toBeVisible();
  await expect(page.getByTestId('b2b-record-count')).toContainText('0');
});
