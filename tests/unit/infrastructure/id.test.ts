/**
 * generateId() 単体テスト
 * TDD: RED — UUID 形式の文字列を返すこと、呼び出しごとに異なる値を返すことを検証
 */
import { describe, it, expect } from 'vitest';
import { generateId } from '@/infrastructure/id';

describe('generateId', () => {
  it('Given generateId, When 呼び出し, Then UUID 形式の文字列を返す', () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('Given generateId, When 2回呼び出し, Then 異なる値を返す', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('Given generateId, When 呼び出し, Then 文字列型を返す', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });
});
