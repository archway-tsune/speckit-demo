/**
 * 商品一覧・登録API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/domains/catalog/api';
import { productRepository } from '@/infrastructure/repositories';
import { getServerSession, createGuestSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { handleError, ErrorCode } from '@/foundation/errors/handler';
import { logger } from '@/foundation/logging/logger';

export async function GET(request: NextRequest) {
  try {
    // 商品一覧は公開API（認証不要）
    const session = await getServerSession();

    const { searchParams } = new URL(request.url);
    const input = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      // 未認証の場合はpublishedのみ表示
      status: session ? (searchParams.get('status') || undefined) : 'published',
    };

    const result = await getProducts(input, {
      session: session || createGuestSession(),
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const result = handleError(err);
    logger.error('GET /api/catalog/products error:', err instanceof Error ? err : undefined);
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
    const result = await createProduct(body, {
      session,
      repository: productRepository,
    });

    return NextResponse.json(success(result), { status: 201 });
  } catch (err) {
    const result = handleError(err);
    logger.error('POST /api/catalog/products error:', err instanceof Error ? err : undefined);
    return NextResponse.json(
      error(result.code, result.message, result.fieldErrors),
      { status: result.httpStatus }
    );
  }
}
