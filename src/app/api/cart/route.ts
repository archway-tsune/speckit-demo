/**
 * カート取得API
 */
import { NextResponse } from 'next/server';
import { getCart } from '@/domains/cart/api';
import { cartRepository, productFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';
import { handleError } from '@/foundation/errors/handler';
import { logger } from '@/foundation/logging/logger';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const result = await getCart({}, {
      session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const result = handleError(err);
    logger.error('GET /api/cart error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}
