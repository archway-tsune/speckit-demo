/** 購入者ログアウト - E2Eテスト: ログアウトページ遷移・メッセージ表示・リダイレクトを検証 */
import { test, expect } from '@playwright/test';
import { loginAsBuyer, resetForWorker } from '../helpers/login-helper';

test.describe('購入者ログアウト', () => {
  test.beforeEach(async ({ page, request }) => {
    const wi = test.info().parallelIndex;
    await resetForWorker(request, wi);
    await loginAsBuyer(page, wi);
  });

  test('カタログからログアウトするとカタログに戻る', async ({ page }) => {
    await page.goto('/sample/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('商品', { timeout: 0 });

    // ヘッダーのログアウトリンクをクリック
    await page.getByRole('link', { name: /ログアウト/i }).click();

    // ログアウトページに遷移（callbackUrl 付き）
    await expect(page).toHaveURL(/\/sample\/logout\?callbackUrl=/, { timeout: 5000 });
    await expect(page.locator('h1')).toContainText('ログアウト', { timeout: 5000 });

    // ログアウト完了後、元いたカタログページへリダイレクト
    await expect(page).toHaveURL(/\/sample\/catalog/, { timeout: 5000 });
  });

  test('直接ログアウトURLにアクセスするとログインページへリダイレクトされる', async ({ page }) => {
    await page.goto('/sample/logout');
    // ログアウト処理中の中間状態は React レンダリング依存のため waitForLoadState 不使用

    // ログアウト処理中
    await expect(page.locator('text=ログアウト中...')).toBeVisible({ timeout: 5000 });

    // ログアウト完了メッセージ
    await expect(page.locator('text=ログアウトしました')).toBeVisible({ timeout: 5000 });

    // callbackUrl なし → デフォルトのログインページへリダイレクト
    await expect(page).toHaveURL(/\/sample\/login/, { timeout: 5000 });
  });
});
