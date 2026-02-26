/**
 * createStore() 単体テスト
 * TDD: RED — HMR 対応ストアが正しく初期化され、同一名で呼び出すと同じインスタンスを返すことを検証
 */
import { describe, it, expect } from 'vitest';
import { createStore } from '@/infrastructure/store';

describe('createStore', () => {
  it('Given createStore, When 名前を指定して呼び出し, Then Map インスタンスを返す', () => {
    const store = createStore<string>('test-store-1');
    expect(store).toBeInstanceOf(Map);
  });

  it('Given createStore, When 同一名で2回呼び出し, Then 同じインスタンスを返す', () => {
    const store1 = createStore<string>('test-store-same');
    const store2 = createStore<string>('test-store-same');
    expect(store1).toBe(store2);
  });

  it('Given createStore, When 異なる名前で呼び出し, Then 異なるインスタンスを返す', () => {
    const storeA = createStore<string>('test-store-a');
    const storeB = createStore<string>('test-store-b');
    expect(storeA).not.toBe(storeB);
  });

  it('Given createStore with initializer, When 呼び出し, Then 初期化関数の結果を使用する', () => {
    const store = createStore<string>('test-store-init', () => {
      const m = new Map<string, string>();
      m.set('key1', 'value1');
      return m;
    });
    expect(store.get('key1')).toBe('value1');
  });

  it('Given createStore, When データを追加して再度取得, Then データが保持される', () => {
    const store = createStore<number>('test-store-persist');
    store.set('count', 42);
    const same = createStore<number>('test-store-persist');
    expect(same.get('count')).toBe(42);
  });
});
