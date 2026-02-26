/**
 * 商品詳細・更新・削除API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/domains/catalog/api';
import { productRepository } from '@/infrastructure/repositories';
import { getServerSession, createGuestSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { handleError, ErrorCode } from '@/foundation/errors/handler';
import { logger } from '@/foundation/logging/logger';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    // 商品詳細は公開API（認証不要）
    const session = await getServerSession();

    const { id } = await params;
    const result = await getProductById({ id }, {
      session: session || createGuestSession(),
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const result = handleError(err);
    logger.error('GET /api/catalog/products/[id] error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
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
    const result = await updateProduct({ ...body, id }, {
      session,
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const result = handleError(err);
    logger.error('PUT /api/catalog/products/[id] error:', err instanceof Error ? err : undefined);
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

    const { id } = await params;
    const result = await deleteProduct({ id }, {
      session,
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const result = handleError(err);
    logger.error('DELETE /api/catalog/products/[id] error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}
