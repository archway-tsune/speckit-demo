/** Products US1 - 商品一覧表示 E2E テスト (AC-1, AC-2, AC-4, AC-5, AC-6) */
import { test, expect, type Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('admin@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL((url) => url.pathname === '/admin', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

async function loginAsBuyer(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/catalog/);
}

test.describe('US1: 商品一覧表示（管理者）', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('管理者が /admin/products にアクセスすると商品テーブルが表示される (AC-1, AC-2)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible({ timeout: 0 });
  });

  test('商品一覧に「新規登録」ボタンが表示される (AC-4)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('link', { name: /新規登録/i }).or(page.getByRole('button', { name: /新規登録/i }))).toBeVisible({ timeout: 0 });
  });

  test('buyer で /admin/products にアクセスすると管理者ログインにリダイレクトされる (AC-5)', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 0 });
  });

  test('未ログインで /admin/products にアクセスすると管理者ログインにリダイレクトされる (AC-6)', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 0 });
  });
});
