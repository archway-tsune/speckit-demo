/** 共通セッションモックヘルパー */
import type { Session } from '@/foundation/auth/session';

export function createMockSession(role: 'buyer' | 'admin' = 'buyer'): Session {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}
