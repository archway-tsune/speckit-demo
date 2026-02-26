/**
 * callbackUrl バリデーションの単体テスト
 *
 * テスト対象: src/foundation/auth/callback-url.ts
 * - 相対パスのみ許可
 * - 外部URL・protocol-relative URL 拒否
 * - ロール適切性検証
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { validateCallbackUrl } from '@/foundation/auth/callback-url';

describe('validateCallbackUrl', () => {
  const buyerDefault = '/catalog';
  const adminDefault = '/admin';

  beforeEach(() => {
    // 各テスト前にクリーンな状態を保証
  });

  describe('基本動作', () => {
    test('null の場合はデフォルトURL を返す', () => {
      expect(validateCallbackUrl(null, { defaultUrl: buyerDefault, role: 'buyer' }))
        .toBe(buyerDefault);
    });

    test('有効な相対パスはそのまま返す', () => {
      expect(validateCallbackUrl('/orders', { defaultUrl: buyerDefault, role: 'buyer' }))
        .toBe('/orders');
    });

    test('ルートパスはそのまま返す', () => {
      expect(validateCallbackUrl('/', { defaultUrl: buyerDefault, role: 'buyer' }))
        .toBe('/');
    });
  });

  describe('セキュリティ: 外部URL 拒否', () => {
    test('外部URL はデフォルトにフォールバックする', () => {
      expect(validateCallbackUrl('https://evil.com', { defaultUrl: buyerDefault, role: 'buyer' }))
        .toBe(buyerDefault);
    });

    test('protocol-relative URL はデフォルトにフォールバックする', () => {
      expect(validateCallbackUrl('//evil.com', { defaultUrl: buyerDefault, role: 'buyer' }))
        .toBe(buyerDefault);
    });

    test('先頭が / でないパスはデフォルトにフォールバックする', () => {
      expect(validateCallbackUrl('orders', { defaultUrl: buyerDefault, role: 'buyer' }))
        .toBe(buyerDefault);
    });

    test('空文字はデフォルトにフォールバックする', () => {
      expect(validateCallbackUrl('', { defaultUrl: buyerDefault, role: 'buyer' }))
        .toBe(buyerDefault);
    });
  });

  describe('ロール適切性検証', () => {
    test('admin ロールで buyer パス (/cart) はデフォルトにフォールバックする', () => {
      expect(validateCallbackUrl('/cart', { defaultUrl: adminDefault, role: 'admin' }))
        .toBe(adminDefault);
    });

    test('buyer ロールで admin パス (/admin) はデフォルトにフォールバックする', () => {
      expect(validateCallbackUrl('/admin', { defaultUrl: buyerDefault, role: 'buyer' }))
        .toBe(buyerDefault);
    });

    test('admin ロールで admin パス (/admin/products) はそのまま返す', () => {
      expect(validateCallbackUrl('/admin/products', { defaultUrl: adminDefault, role: 'admin' }))
        .toBe('/admin/products');
    });

    test('buyer ロールで buyer パス (/orders) はそのまま返す', () => {
      expect(validateCallbackUrl('/orders', { defaultUrl: buyerDefault, role: 'buyer' }))
        .toBe('/orders');
    });

    test('buyer ロールで公開パス (/catalog) はそのまま返す', () => {
      expect(validateCallbackUrl('/catalog', { defaultUrl: buyerDefault, role: 'buyer' }))
        .toBe('/catalog');
    });

    test('admin ロールで公開パス (/catalog) はそのまま返す', () => {
      expect(validateCallbackUrl('/catalog', { defaultUrl: adminDefault, role: 'admin' }))
        .toBe('/catalog');
    });
  });

  describe('サンプルパス', () => {
    test('buyer ロールで /sample/orders はそのまま返す', () => {
      expect(validateCallbackUrl('/sample/orders', { defaultUrl: '/sample/catalog', role: 'buyer' }))
        .toBe('/sample/orders');
    });

    test('admin ロールで /sample/cart はデフォルトにフォールバックする', () => {
      expect(validateCallbackUrl('/sample/cart', { defaultUrl: '/sample/admin', role: 'admin' }))
        .toBe('/sample/admin');
    });

    test('admin ロールで /sample/admin/products はそのまま返す', () => {
      expect(validateCallbackUrl('/sample/admin/products', { defaultUrl: '/sample/admin', role: 'admin' }))
        .toBe('/sample/admin/products');
    });
  });
});
