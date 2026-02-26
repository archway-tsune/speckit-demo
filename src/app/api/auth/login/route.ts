/**
 * ログインAPI
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSession, getDemoUserName } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { handleError } from '@/foundation/errors/handler';
import { logger } from '@/foundation/logging/logger';

export async function POST(request: NextRequest) {
  try {
    let body: { email?: string } = {};
    try {
      body = await request.json();
    } catch {
      // 空のボディは許容（デモ用自動ログイン）
    }
    const { email } = body;

    // デモ認証: メールアドレスでロールを判定
    const isAdmin = email?.includes('admin');
    const userType = isAdmin ? 'admin' : 'buyer';

    const session = await createServerSession(userType);

    return NextResponse.json(success({
      userId: session.userId,
      role: session.role,
      name: getDemoUserName(userType),
    }));
  } catch (err) {
    const result = handleError(err);
    logger.error('POST /api/auth/login error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}
