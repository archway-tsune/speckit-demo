/**
 * ナビゲーション設定ファイルの単体テスト（本番）
 *
 * テスト対象:
 * - src/app/(buyer)/nav.ts — 本番 buyer ナビ
 * - src/app/admin/nav.ts — 本番 admin ナビ（空配列）
 */
import { describe, test, expect, beforeEach } from 'vitest';

describe('ナビゲーション設定ファイル（本番）', () => {
  beforeEach(() => {
    // 各テスト前にモジュールキャッシュをクリア
  });

  describe('本番 buyer nav.ts', () => {
    test('buyerNavLinks が /catalog エントリを含む', async () => {
      const { buyerNavLinks } = await import('@/app/(buyer)/nav');
      expect(buyerNavLinks).toContainEqual({ href: '/catalog', label: '商品一覧' });
    });
  });

  describe('本番 admin nav.ts', () => {
    test('adminNavLinks が /admin/orders エントリを含む', async () => {
      const { adminNavLinks } = await import('@/app/admin/nav');
      expect(adminNavLinks).toContainEqual({ href: '/admin/orders', label: '注文管理' });
    });

    test('adminNavLinks が /admin/products エントリを含む', async () => {
      const { adminNavLinks } = await import('@/app/admin/nav');
      expect(adminNavLinks).toContainEqual({ href: '/admin/products', label: '商品管理' });
    });
  });
});
