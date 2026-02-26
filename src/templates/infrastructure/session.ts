/**
 * セッション管理テンプレート
 *
 * Cookie ベースのセッション管理ファクトリを提供。
 * デモ・開発環境での簡易認証に使用。
 *
 * 注意:
 * - 本番環境では適切な暗号化・署名を実装すること
 * - このテンプレートはデモ用の簡易実装
 */
import { cookies } from 'next/headers';

// ─────────────────────────────────────────────────────────────────
// 内部定数
// ─────────────────────────────────────────────────────────────────

/** セッションCookie名（デフォルト） */
const SESSION_COOKIE_NAME = 'session';

/** セッション有効期限（秒）（デフォルト） */
const SESSION_MAX_AGE = 60 * 60 * 24; // 24時間

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** ユーザータイプ別設定 */
export interface UserTypeConfig {
  userId: string;
  role: string;
  name: string;
}

/** ジェネリック型セッションマネージャー設定 */
export interface GenericSessionManagerConfig<T> {
  /** Cookie 名（デフォルト: 'session'） */
  cookieName?: string;
  /** セッション有効期限（秒） */
  maxAge?: number;
  /** デモユーザー設定 */
  demoUsers: Record<string, UserTypeConfig>;
  /** email + userType から userId を解決するコールバック（worker 対応） */
  resolveUserId: (email: string | undefined, userType: string) => string;
  /** セッションデータを構築するコールバック */
  buildSession: (userId: string, role: string) => T;
}

// ─────────────────────────────────────────────────────────────────
// セッションファクトリ
// ─────────────────────────────────────────────────────────────────

/**
 * カスタムセッションマネージャーを生成
 *
 * @example
 * ```typescript
 * const manager = createSessionManager<MySession>({
 *   cookieName: 'ec_session',
 *   demoUsers: { buyer: { userId: 'b-001', role: 'buyer', name: '購入者' } },
 *   resolveUserId: (email, userType) => demoUsers[userType].userId,
 *   buildSession: (userId, role) => ({ userId, role, expiresAt: new Date() }),
 * });
 *
 * export const { getSession, createSession, destroySession, getDemoUserName } = manager;
 * ```
 */
export function createSessionManager<T>(config: GenericSessionManagerConfig<T>) {
  const {
    cookieName = SESSION_COOKIE_NAME,
    maxAge = SESSION_MAX_AGE,
    demoUsers: users,
    resolveUserId,
    buildSession,
  } = config;

  return {
    async getSession(): Promise<T | null> {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(cookieName);

      if (!sessionCookie?.value) {
        return null;
      }

      try {
        return JSON.parse(sessionCookie.value) as T;
      } catch {
        return null;
      }
    },

    async createSession(userType: string, email?: string): Promise<T> {
      const user = users[userType];
      if (!user) {
        throw new Error(`Unknown user type: ${userType}`);
      }

      const userId = resolveUserId(email, userType);
      const session = buildSession(userId, user.role);

      const cookieStore = await cookies();
      cookieStore.set(cookieName, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/',
      });

      return session;
    },

    async destroySession(): Promise<void> {
      const cookieStore = await cookies();
      cookieStore.delete(cookieName);
    },

    getDemoUserName(role: string): string {
      const user = Object.values(users).find((u) => u.role === role);
      return user?.name || '不明なユーザー';
    },
  };
}
