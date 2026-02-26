/** 管理者アクセス制御 - E2Eテスト: 権限不足・未ログインで管理者ページへアクセス時の動作を検証 */
import { test, expect } from '@playwright/test';
import { loginAsBuyer, resetForWorker } from '../helpers/login-helper';

test.describe('管理者アクセス制御リダイレクト', () => {
  test.describe('buyer ロール', () => {
    test.beforeEach(async ({ page, request }) => {
      const wi = test.info().parallelIndex;
      await resetForWorker(request, wi);
      await loginAsBuyer(page, wi);
    });

    test('buyer で管理者ページにアクセスすると管理者ログインにリダイレクトされる', async ({ page }) => {
      await page.goto('/sample/admin/dashboard');
      // middleware による HTTP リダイレクトは goto が追跡するため networkidle 後に即判定可能
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/admin\/login/, { timeout: 0 });
    });
  });

  test.describe('未ログイン', () => {
    test.beforeEach(async ({ request }) => {
      const wi = test.info().parallelIndex;
      await resetForWorker(request, wi);
    });

    test('未ログインで管理者ページにアクセスすると管理者ログインにリダイレクトされる', async ({ page }) => {
      await page.goto('/sample/admin/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/admin\/login/, { timeout: 0 });
    });
  });
});
