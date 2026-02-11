/**
 * スモークテスト — 基盤機能の疎通確認
 * 本番ドメインが未実装（スタブ状態）でも動作する最小限のE2Eテスト
 */
import { test, expect } from '@playwright/test';

test.describe('基盤機能スモークテスト', () => {
  test('ホームページが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('ECサイト');
  });

  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('ログイン');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('buyerとしてログインできる', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'buyer@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/catalog');
  });

  test('adminとしてログインできる', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**');
  });
});
