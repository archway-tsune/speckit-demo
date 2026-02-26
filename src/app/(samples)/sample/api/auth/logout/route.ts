/**
 * ログアウトAPI（サンプル）
 */
import { createLogoutHandler } from '@/templates/api/auth/logout';
import { destroyServerSession } from '@/samples/infrastructure/auth';

export const { POST, GET } = createLogoutHandler({
  destroySession: destroyServerSession,
  redirectUrl: '/sample/catalog',
});
