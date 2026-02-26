/**
 * リポジトリテンプレート 単体テスト
 * US1: createHmrSafeStore を Layer 2 構成に再設計、BaseEntity → { id: string } 型制約緩和
 */
import { describe, it, expect, beforeEach } from 'vitest';

// テスト用エンティティ型（{ id: string } のみ要求）
interface SimpleEntity {
  id: string;
  name: string;
}

// BaseEntity 互換型（既存互換確認用）
interface FullEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

describe('createHmrSafeStore テンプレート', () => {
  beforeEach(() => {
    // globalThis のストアをクリア（テスト間隔で隔離）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    delete g['__store___test_simple'];
    delete g['__store___test_full'];
    delete g['__store___test_empty'];
    delete g['__store___test_user'];
  });

  describe('型制約緩和: { id: string } のみ要求', () => {
    it('Given { id: string } のみのエンティティ型, When createHmrSafeStore() を呼ぶ, Then Map が返る', async () => {
      const { createHmrSafeStore } = await import('@/templates/infrastructure/repository');

      const store = createHmrSafeStore<SimpleEntity>('__test_simple', () =>
        new Map([['1', { id: '1', name: 'Test' }]])
      );

      expect(store).toBeInstanceOf(Map);
      expect(store.get('1')).toEqual({ id: '1', name: 'Test' });
    });

    it('Given BaseEntity 互換型, When createHmrSafeStore() を呼ぶ, Then 既存互換で動作する', async () => {
      const { createHmrSafeStore } = await import('@/templates/infrastructure/repository');

      const now = new Date();
      const store = createHmrSafeStore<FullEntity>('__test_full', () =>
        new Map([['1', { id: '1', name: 'Full', createdAt: now, updatedAt: now }]])
      );

      expect(store.get('1')?.createdAt).toEqual(now);
    });
  });

  describe('Layer 2: @/infrastructure/store の createStore() を内部利用', () => {
    it('Given createHmrSafeStore() を呼ぶ, When globalThis を確認, Then __store_ プレフィックス付きキーで保存される', async () => {
      const { createHmrSafeStore } = await import('@/templates/infrastructure/repository');

      createHmrSafeStore<SimpleEntity>('__test_empty', () => new Map());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = globalThis as any;
      // Layer 1 (createStore) は __store_ プレフィックスを付ける
      expect(g['__store___test_empty']).toBeInstanceOf(Map);
    });
  });

  describe('initializer コールバック', () => {
    it('Given initializer 関数, When 初回呼び出し, Then initializer が実行されデータが格納される', async () => {
      const { createHmrSafeStore } = await import('@/templates/infrastructure/repository');

      const store = createHmrSafeStore<SimpleEntity>('__test_simple', () =>
        new Map([
          ['a', { id: 'a', name: 'Alpha' }],
          ['b', { id: 'b', name: 'Beta' }],
        ])
      );

      expect(store.size).toBe(2);
      expect(store.get('a')?.name).toBe('Alpha');
    });

    it('Given 既にストアが存在, When 2回目の呼び出し, Then 既存ストアが返る（initializer は再実行されない）', async () => {
      const { createHmrSafeStore } = await import('@/templates/infrastructure/repository');

      const store1 = createHmrSafeStore<SimpleEntity>('__test_simple', () =>
        new Map([['1', { id: '1', name: 'First' }]])
      );
      store1.set('2', { id: '2', name: 'Added' });

      const store2 = createHmrSafeStore<SimpleEntity>('__test_simple', () =>
        new Map([['1', { id: '1', name: 'Should Not Appear' }]])
      );

      expect(store2.size).toBe(2);
      expect(store2.get('2')?.name).toBe('Added');
    });
  });

  describe('createHmrSafeUserStore', () => {
    it('Given ユーザーIDベースストア, When createHmrSafeUserStore() を呼ぶ, Then 空の Map が返る', async () => {
      const { createHmrSafeUserStore } = await import('@/templates/infrastructure/repository');

      const store = createHmrSafeUserStore<{ items: string[] }>('__test_user');

      expect(store).toBeInstanceOf(Map);
      expect(store.size).toBe(0);
    });
  });
});
