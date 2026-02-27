/** Cart US1 - カートに商品を追加する E2E テスト (AC-1, AC-5) */
import { test, expect } from '@playwright/test';

test.describe('US1: カートに商品を追加する', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('ログイン済み購入者がカートに追加するとトーストが表示される (AC-1)', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('buyer@example.com');
    await page.locator('#password').fill('demo');
    await page.getByRole('button', { name: /ログイン/i }).click();
    await page.waitForURL(/\/catalog/);

    await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440000');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible({ timeout: 0 });

    await page.getByRole('button', { name: /カートに追加/i }).click();
    await expect(page.locator('text=カートに追加しました')).toBeVisible({ timeout: 5000 });
  });

  test('未ログインユーザーがカートに追加しようとするとログインページにリダイレクトされる (AC-5)', async ({ page }) => {
    await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440000');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible({ timeout: 0 });

    await page.getByRole('button', { name: /カートに追加/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
