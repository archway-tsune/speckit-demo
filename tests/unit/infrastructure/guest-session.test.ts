/**
 * createGuestSession() 単体テスト
 * TDD: RED — Session 型に準拠し userId: 'guest', role: 'buyer' を返すことを検証
 */
import { describe, it, expect } from 'vitest';
import { createGuestSession } from '@/infrastructure/auth/session';
import type { Session } from '@/foundation/auth/session';

describe('createGuestSession', () => {
  it('Given createGuestSession, When 呼び出し, Then userId が guest である', () => {
    const session = createGuestSession();
    expect(session.userId).toBe('guest');
  });

  it('Given createGuestSession, When 呼び出し, Then role が buyer である', () => {
    const session = createGuestSession();
    expect(session.role).toBe('buyer');
  });

  it('Given createGuestSession, When 呼び出し, Then expiresAt が Date インスタンスである', () => {
    const session = createGuestSession();
    expect(session.expiresAt).toBeInstanceOf(Date);
  });

  it('Given createGuestSession, When 呼び出し, Then Session 型のプロパティを全て持つ', () => {
    const session: Session = createGuestSession();
    expect(session).toHaveProperty('userId');
    expect(session).toHaveProperty('role');
    expect(session).toHaveProperty('expiresAt');
  });

  it('Given createGuestSession, When 2回呼び出し, Then 異なる expiresAt を返す可能性がある', () => {
    const session1 = createGuestSession();
    const session2 = createGuestSession();
    // ファクトリ関数なので毎回新しいオブジェクトを返す
    expect(session1).not.toBe(session2);
  });
});
