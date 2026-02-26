/**
 * サーバーサイドセッション管理
 * デモ用：createSessionManager テンプレート利用
 */
import type { Session } from '@/foundation/auth/session';
import { createSessionManager } from '@/templates/infrastructure/session';
import type { UserTypeConfig } from '@/templates/infrastructure/session';

const sampleDemoUsers: Record<string, UserTypeConfig> = {
  buyer: {
    userId: '550e8400-e29b-41d4-a716-446655440100',
    role: 'buyer',
    name: '購入者テスト',
  },
  admin: {
    userId: '550e8400-e29b-41d4-a716-446655440101',
    role: 'admin',
    name: '管理者テスト',
  },
};

function resolveUserId(email: string | undefined, userType: string): string {
  const user = sampleDemoUsers[userType];
  const match = email?.match(/^(?:buyer|admin)-(\d+)@/);
  const workerIndex = match ? parseInt(match[1], 10) : 0;

  if (workerIndex === 0) return user.userId;

  const prefix = userType === 'buyer' ? 'b' : 'a';
  return `${user.userId.slice(0, -4)}${prefix}${String(workerIndex).padStart(3, '0')}`;
}

const manager = createSessionManager<Session>({
  cookieName: 'ec_session',
  demoUsers: sampleDemoUsers,
  resolveUserId,
  buildSession: (userId, role) => ({
    userId,
    role: role as 'buyer' | 'admin',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }),
});

export const getServerSession = manager.getSession;
export const createServerSession = manager.createSession;
export const destroyServerSession = manager.destroySession;
export const getDemoUserName = manager.getDemoUserName;

/** Worker index から buyer/admin の userId ペアを返す（E2E 並列実行用） */
export function getWorkerUserIds(workerIndex: number): { buyerUserId: string; adminUserId: string } {
  if (workerIndex === 0) {
    return { buyerUserId: sampleDemoUsers.buyer.userId, adminUserId: sampleDemoUsers.admin.userId };
  }
  const derive = (base: string, prefix: string) =>
    `${base.slice(0, -4)}${prefix}${String(workerIndex).padStart(3, '0')}`;
  return {
    buyerUserId: derive(sampleDemoUsers.buyer.userId, 'b'),
    adminUserId: derive(sampleDemoUsers.admin.userId, 'a'),
  };
}
