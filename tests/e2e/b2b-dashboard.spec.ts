import { expect, test } from '@playwright/test';

test('B2CとProの動線が分離され、旧URLは新ダッシュボードへ移る', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /B2B dashboard/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /議員・行政向け/ })).toHaveCount(0);

  await page.goto('/pro');
  await expect(page.getByRole('heading', { name: /議会の変化を/ })).toBeVisible();
  await expect(page.getByRole('link', { name: '市民向けサイト' })).toBeVisible();

  await page.goto('/b2b-dashboard');
  await expect(page).toHaveURL(/\/pro\/dashboard$/);
  await expect(page.getByRole('heading', { name: '複数議会トレンド' })).toBeVisible();
  await expect(page.getByText('A市議会')).toBeVisible();
  await expect(page.getByText('防災', { exact: true })).toBeVisible();
});

test('トレンド0件と不正なAPI応答をエラーと区別する', async ({ page }) => {
  await page.goto('/pro/dashboard');
  const month = page.getByLabel('対象月');

  await month.fill('2026-07');
  await expect(page.getByRole('heading', { name: 'この期間の公開議題はありません' })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);

  await month.fill('2026-06');
  await expect(page.locator('main').getByRole('alert')).toContainText('議会トレンドを取得できませんでした', { timeout: 15_000 });
});

test('Pro導入相談をBFF経由で送信できる', async ({ page }) => {
  await page.goto('/pro#contact');
  await page.getByLabel('組織名').fill('テスト市役所');
  await page.getByLabel('お名前').fill('議会担当');
  await page.getByLabel('メールアドレス').fill('test@example.com');
  await page.getByLabel('利用目的').fill('複数議会の比較');
  await page.getByRole('button', { name: '相談内容を送信' }).click();

  await expect(page.getByRole('status')).toContainText('お問い合わせを受け付けました');
});
