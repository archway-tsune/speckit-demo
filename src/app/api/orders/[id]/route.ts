/**
 * 注文詳細・ステータス更新API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/domains/orders/api';
import { orderRepository, cartFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { handleError, ErrorCode } from '@/foundation/errors/handler';
import { logger } from '@/foundation/logging/logger';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await getOrderById({ id }, {
      session,
      repository: orderRepository,
      cartFetcher,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const result = handleError(err);
    logger.error('GET /api/orders/[id] error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const result = await updateOrderStatus({ ...body, id }, {
      session,
      repository: orderRepository,
      cartFetcher,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const result = handleError(err);
    logger.error('PATCH /api/orders/[id] error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}
