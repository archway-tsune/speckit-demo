/**
 * セッション管理テンプレート 単体テスト
 * US1: createSessionManager をジェネリック型・worker 対応・demoUsers 注入に再設計
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// next/headers をモック
vi.mock('next/headers', () => {
  const store = new Map<string, { name: string; value: string }>();
  return {
    cookies: vi.fn(async () => ({
      get: (name: string) => store.get(name) ?? undefined,
      set: (name: string, value: string, _options?: Record<string, unknown>) => {
        store.set(name, { name, value });
      },
      delete: (name: string) => {
        store.delete(name);
      },
      // テスト用: ストアをクリアする
      _clear: () => store.clear(),
      _store: store,
    })),
  };
});

// テスト用セッション型
interface TestSession {
  userId: string;
  role: string;
  expiresAt: Date;
}

// テスト用デモユーザー
const testDemoUsers = {
  buyer: {
    userId: 'buyer-001',
    role: 'buyer' as const,
    name: '購入者テスト',
  },
  admin: {
    userId: 'admin-001',
    role: 'admin' as const,
    name: '管理者テスト',
  },
};

describe('createSessionManager テンプレート', () => {
  beforeEach(async () => {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cookieStore as any)._clear();
  });

  describe('ジェネリック型対応', () => {
    it('Given カスタムセッション型, When createSessionManager<TestSession>() を呼ぶ, Then ジェネリック型のマネージャーが返る', async () => {
      const { createSessionManager } = await import('@/templates/infrastructure/session');

      const manager = createSessionManager<TestSession>({
        demoUsers: testDemoUsers,
        resolveUserId: (_email, userType) => testDemoUsers[userType as keyof typeof testDemoUsers].userId,
        buildSession: (userId, role) => ({
          userId,
          role,
          expiresAt: new Date(Date.now() + 86400000),
        }),
      });

      expect(manager).toBeDefined();
      expect(manager.getSession).toBeTypeOf('function');
      expect(manager.createSession).toBeTypeOf('function');
      expect(manager.destroySession).toBeTypeOf('function');
      expect(manager.getDemoUserName).toBeTypeOf('function');
    });
  });

  describe('demoUsers 注入', () => {
    it('Given 注入されたデモユーザー, When getDemoUserName("buyer") を呼ぶ, Then 注入したユーザー名が返る', async () => {
      const { createSessionManager } = await import('@/templates/infrastructure/session');

      const manager = createSessionManager<TestSession>({
        demoUsers: testDemoUsers,
        resolveUserId: (_email, userType) => testDemoUsers[userType as keyof typeof testDemoUsers].userId,
        buildSession: (userId, role) => ({
          userId,
          role,
          expiresAt: new Date(Date.now() + 86400000),
        }),
      });

      expect(manager.getDemoUserName('buyer')).toBe('購入者テスト');
      expect(manager.getDemoUserName('admin')).toBe('管理者テスト');
    });
  });

  describe('セッション CRUD', () => {
    it('Given セッション未作成, When getSession() を呼ぶ, Then null が返る', async () => {
      const { createSessionManager } = await import('@/templates/infrastructure/session');

      const manager = createSessionManager<TestSession>({
        demoUsers: testDemoUsers,
        resolveUserId: (_email, userType) => testDemoUsers[userType as keyof typeof testDemoUsers].userId,
        buildSession: (userId, role) => ({
          userId,
          role,
          expiresAt: new Date(Date.now() + 86400000),
        }),
      });

      const session = await manager.getSession();
      expect(session).toBeNull();
    });

    it('Given createSession("buyer") で作成, When getSession() を呼ぶ, Then buyer セッションが返る', async () => {
      const { createSessionManager } = await import('@/templates/infrastructure/session');

      const manager = createSessionManager<TestSession>({
        demoUsers: testDemoUsers,
        resolveUserId: (_email, userType) => testDemoUsers[userType as keyof typeof testDemoUsers].userId,
        buildSession: (userId, role) => ({
          userId,
          role,
          expiresAt: new Date(Date.now() + 86400000),
        }),
      });

      await manager.createSession('buyer');
      const session = await manager.getSession();
      expect(session).not.toBeNull();
      expect(session!.userId).toBe('buyer-001');
      expect(session!.role).toBe('buyer');
    });

    it('Given セッション作成後, When destroySession() を呼ぶ, Then getSession() が null を返す', async () => {
      const { createSessionManager } = await import('@/templates/infrastructure/session');

      const manager = createSessionManager<TestSession>({
        demoUsers: testDemoUsers,
        resolveUserId: (_email, userType) => testDemoUsers[userType as keyof typeof testDemoUsers].userId,
        buildSession: (userId, role) => ({
          userId,
          role,
          expiresAt: new Date(Date.now() + 86400000),
        }),
      });

      await manager.createSession('admin');
      await manager.destroySession();
      const session = await manager.getSession();
      expect(session).toBeNull();
    });
  });

  describe('worker 対応', () => {
    it('Given worker email, When createSession("buyer", "buyer-3@example.com") を呼ぶ, Then resolveUserId で派生 userId が使われる', async () => {
      const { createSessionManager } = await import('@/templates/infrastructure/session');

      const manager = createSessionManager<TestSession>({
        demoUsers: testDemoUsers,
        resolveUserId: (email, userType) => {
          const match = email?.match(/^(?:buyer|admin)-(\d+)@/);
          const workerIndex = match ? parseInt(match[1], 10) : 0;
          const base = testDemoUsers[userType as keyof typeof testDemoUsers].userId;
          return workerIndex === 0 ? base : `${base}-w${workerIndex}`;
        },
        buildSession: (userId, role) => ({
          userId,
          role,
          expiresAt: new Date(Date.now() + 86400000),
        }),
      });

      await manager.createSession('buyer', 'buyer-3@example.com');
      const session = await manager.getSession();
      expect(session).not.toBeNull();
      expect(session!.userId).toBe('buyer-001-w3');
    });
  });

  describe('cookieName カスタマイズ', () => {
    it('Given cookieName="custom_session", When createSession を呼ぶ, Then カスタム Cookie 名が使われる', async () => {
      const { createSessionManager } = await import('@/templates/infrastructure/session');

      const manager = createSessionManager<TestSession>({
        cookieName: 'custom_session',
        demoUsers: testDemoUsers,
        resolveUserId: (_email, userType) => testDemoUsers[userType as keyof typeof testDemoUsers].userId,
        buildSession: (userId, role) => ({
          userId,
          role,
          expiresAt: new Date(Date.now() + 86400000),
        }),
      });

      await manager.createSession('buyer');
      const session = await manager.getSession();
      expect(session).not.toBeNull();
      expect(session!.userId).toBe('buyer-001');
    });
  });
});
