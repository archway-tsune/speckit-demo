/** Orders US5 - アクセス制御とリダイレクト E2E テスト (AC-1, AC-2, FR-014) */
import { test, expect } from '@playwright/test';

test.describe('US5: アクセス制御とリダイレクト', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('未ログインで /checkout にアクセスするとログインページにリダイレクトされる (AC-1)', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/, { timeout: 0 });
  });

  test('未ログインで /orders にアクセスするとログインページにリダイレクトされる (AC-1)', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/, { timeout: 0 });
  });

  test('未ログインで /orders/:id にアクセスするとログインページにリダイレクトされる (AC-1)', async ({ page }) => {
    await page.goto('/orders/550e8400-e29b-41d4-a716-446655440200');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/, { timeout: 0 });
  });

  test('購入者が管理者ページにアクセスするとアクセス拒否される (AC-2)', async ({ page }) => {
    // 購入者としてログイン
    await page.goto('/login');
    await page.locator('#email').fill('buyer@example.com');
    await page.locator('#password').fill('demo');
    await page.getByRole('button', { name: /ログイン/i }).click();
    await page.waitForURL(/\/catalog/);

    // 管理者ページにアクセス
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // /admin/login にリダイレクトされる
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 0 });
  });
});
