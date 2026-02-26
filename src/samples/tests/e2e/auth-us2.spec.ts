/** 認証リダイレクト - E2Eテスト: callbackUrl によるログイン後の元ページ復帰を検証 */
import { test, expect } from '@playwright/test';
import { resetForWorker } from '../helpers/login-helper';

test.describe('callbackUrl リダイレクト', () => {
  test.beforeEach(async ({ request }) => {
    const wi = test.info().parallelIndex;
    await resetForWorker(request, wi);
  });

  test('callbackUrl=/sample/cart でログインすると /sample/cart にリダイレクトされる', async ({ page }) => {
    await page.goto('/sample/login?callbackUrl=/sample/cart');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('buyer@example.com');
    await page.locator('#password').fill('demo');
    await page.getByRole('button', { name: /ログイン/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/sample\/cart/, { timeout: 0 });
  });

  test('callbackUrl=/sample/orders でログインすると /sample/orders にリダイレクトされる', async ({ page }) => {
    await page.goto('/sample/login?callbackUrl=/sample/orders');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('buyer@example.com');
    await page.locator('#password').fill('demo');
    await page.getByRole('button', { name: /ログイン/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/sample\/orders/, { timeout: 0 });
  });

  test('callbackUrl なしでログインするとデフォルトの /sample/catalog にリダイレクトされる', async ({ page }) => {
    await page.goto('/sample/login');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('buyer@example.com');
    await page.locator('#password').fill('demo');
    await page.getByRole('button', { name: /ログイン/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/sample\/catalog/, { timeout: 0 });
  });

  test('外部URL の callbackUrl はデフォルトにフォールバックされる', async ({ page }) => {
    await page.goto('/sample/login?callbackUrl=https://evil.com');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('buyer@example.com');
    await page.locator('#password').fill('demo');
    await page.getByRole('button', { name: /ログイン/i }).click();
    await page.waitForLoadState('networkidle');
    // 外部URLは拒否されデフォルトの /sample/catalog にリダイレクト
    await expect(page).toHaveURL(/\/sample\/catalog/, { timeout: 0 });
  });

  test('未認証で /sample/cart にアクセスするとログインページにリダイレクトされる', async ({ page }) => {
    await page.goto('/sample/cart');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/sample\/login/, { timeout: 0 });
  });
});
