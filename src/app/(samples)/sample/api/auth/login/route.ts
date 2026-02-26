/**
 * ログインAPI（サンプル）
 */
import { createLoginHandler } from '@/templates/api/auth/login';
import { createServerSession, getDemoUserName } from '@/samples/infrastructure/auth';

export const POST = createLoginHandler({
  authenticate: async (body) => {
    const email = (body.email as string) || '';
    const isAdmin = email.includes('admin');
    const userType = isAdmin ? 'admin' : 'buyer';

    const session = await createServerSession(userType, email || undefined);

    return {
      userId: session.userId,
      role: session.role,
      name: getDemoUserName(userType),
    };
  },
});
