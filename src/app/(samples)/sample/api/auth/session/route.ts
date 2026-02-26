/**
 * セッション確認API（サンプル）
 */
import { createSessionHandler } from '@/templates/api/auth/session';
import { getServerSession, getDemoUserName } from '@/samples/infrastructure/auth';

export const GET = createSessionHandler({
  getSession: getServerSession as () => Promise<Record<string, unknown> | null>,
  getUserName: (session) => getDemoUserName(session.role as string),
});
