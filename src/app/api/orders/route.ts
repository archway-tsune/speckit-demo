/**
 * 注文一覧・作成API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/domains/orders/api';
import { orderRepository, cartFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';
import { handleError } from '@/foundation/errors/handler';
import { logger } from '@/foundation/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const input = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || undefined,
      userId: searchParams.get('userId') || undefined,
    };

    const result = await getOrders(input, {
      session,
      repository: orderRepository,
      cartFetcher,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const result = handleError(err);
    logger.error('GET /api/orders error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}

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
    const result = await createOrder(body, {
      session,
      repository: orderRepository,
      cartFetcher,
    });

    return NextResponse.json(success(result), { status: 201 });
  } catch (err) {
    const result = handleError(err);
    logger.error('POST /api/orders error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}
