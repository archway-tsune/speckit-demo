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

});
