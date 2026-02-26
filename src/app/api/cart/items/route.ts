/**
 * カート追加API
 */
import { NextRequest, NextResponse } from 'next/server';
import { addToCart } from '@/domains/cart/api';
import { cartRepository, productFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';
import { handleError } from '@/foundation/errors/handler';
import { logger } from '@/foundation/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await addToCart(body, {
      session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result), { status: 201 });
  } catch (err) {
    const result = handleError(err);
    logger.error('POST /api/cart/items error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}
