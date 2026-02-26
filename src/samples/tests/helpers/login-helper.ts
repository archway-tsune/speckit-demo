/** E2E ログインヘルパー（並列実行対応） */
import type { Page, APIRequestContext } from '@playwright/test';

export async function loginAsBuyer(page: Page, workerIndex = 0) {
  const email = workerIndex === 0 ? 'buyer@example.com' : `buyer-${workerIndex}@example.com`;
  await page.goto('/sample/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/sample\/catalog/);
  await page.waitForLoadState('networkidle');
}

export async function loginAsAdmin(page: Page, workerIndex = 0) {
  const email = workerIndex === 0 ? 'admin@example.com' : `admin-${workerIndex}@example.com`;
  await page.goto('/sample/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/sample\/admin(?!\/login)/);
  await page.waitForLoadState('networkidle');
}

/** ワーカー単位のストアリセット（並列 E2E 用） */
export async function resetForWorker(request: APIRequestContext, workerIndex = 0) {
  await request.post('/sample/api/test/reset', { data: { workerIndex } });
}
