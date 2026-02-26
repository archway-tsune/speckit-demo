/**
 * ナビゲーション設定ファイルの単体テスト（サンプル）
 *
 * テスト対象:
 * - src/app/(samples)/sample/(buyer)/nav.ts — サンプル buyer ナビ（3項目）
 * - src/app/(samples)/sample/admin/nav.ts — サンプル admin ナビ（3項目）
 */
import { describe, test, expect, beforeEach } from 'vitest';

describe('ナビゲーション設定ファイル（サンプル）', () => {
  beforeEach(() => {
    // 各テスト前にモジュールキャッシュをクリア
  });

  describe('サンプル buyer nav.ts', () => {
    test('buyerNavLinks が 3 項目の NavLink[] をエクスポートする', async () => {
      const { buyerNavLinks } = await import('@/app/(samples)/sample/(buyer)/nav');
      expect(buyerNavLinks).toHaveLength(3);
    });

    test('各 NavLink の href が / で始まる', async () => {
      const { buyerNavLinks } = await import('@/app/(samples)/sample/(buyer)/nav');
      for (const link of buyerNavLinks) {
        expect(link.href).toMatch(/^\//);
      }
    });

    test('各 NavLink の label が空文字でない', async () => {
      const { buyerNavLinks } = await import('@/app/(samples)/sample/(buyer)/nav');
      for (const link of buyerNavLinks) {
        expect(link.label).not.toBe('');
      }
    });

    test('商品一覧・カート・注文履歴のリンクを含む', async () => {
      const { buyerNavLinks } = await import('@/app/(samples)/sample/(buyer)/nav');
      const labels = buyerNavLinks.map((l: { label: string }) => l.label);
      expect(labels).toContain('商品一覧');
      expect(labels).toContain('カート');
      expect(labels).toContain('注文履歴');
    });
  });

  describe('サンプル admin nav.ts', () => {
    test('adminNavLinks が 3 項目の NavLink[] をエクスポートする', async () => {
      const { adminNavLinks } = await import('@/app/(samples)/sample/admin/nav');
      expect(adminNavLinks).toHaveLength(3);
    });

    test('各 NavLink の href が / で始まる', async () => {
      const { adminNavLinks } = await import('@/app/(samples)/sample/admin/nav');
      for (const link of adminNavLinks) {
        expect(link.href).toMatch(/^\//);
      }
    });

    test('各 NavLink の label が空文字でない', async () => {
      const { adminNavLinks } = await import('@/app/(samples)/sample/admin/nav');
      for (const link of adminNavLinks) {
        expect(link.label).not.toBe('');
      }
    });

    test('ダッシュボード・商品管理・注文管理のリンクを含む', async () => {
      const { adminNavLinks } = await import('@/app/(samples)/sample/admin/nav');
      const labels = adminNavLinks.map((l: { label: string }) => l.label);
      expect(labels).toContain('ダッシュボード');
      expect(labels).toContain('商品管理');
      expect(labels).toContain('注文管理');
    });
  });
});
