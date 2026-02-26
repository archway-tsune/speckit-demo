/**
 * カート更新・削除API
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateCartItem, removeFromCart } from '@/domains/cart/api';
import { cartRepository, productFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { handleError, ErrorCode } from '@/foundation/errors/handler';
import { logger } from '@/foundation/logging/logger';

type Params = { params: Promise<{ productId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const { productId } = await params;
    const body = await request.json();
    const result = await updateCartItem({ ...body, productId }, {
      session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const result = handleError(err);
    logger.error('PUT /api/cart/items/[productId] error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const { productId } = await params;
    const result = await removeFromCart({ productId }, {
      session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const result = handleError(err);
    logger.error('DELETE /api/cart/items/[productId] error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}
