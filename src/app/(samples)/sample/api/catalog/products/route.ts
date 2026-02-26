/**
 * 商品一覧・登録API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/samples/domains/catalog/api';
import { productRepository } from '@/samples/infrastructure/repositories';
import { getServerSession } from '@/samples/infrastructure/auth';
import { createGuestSession } from '@/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const publicHandler = createRouteHandler<Session>({ getSession: getServerSession, requireAuth: false });
const authHandler = createRouteHandler<Session>({ getSession: getServerSession });

export async function GET(request: NextRequest) {
  return publicHandler.handler(request, async (req, ctx) => {
    const session = ctx.session as Session | null;
    const { searchParams } = new URL(req.url);
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
  });
}

export async function POST(request: NextRequest) {
  return authHandler.handler(request, async (req, ctx) => {
    const body = await req.json();
    const result = await createProduct(body, {
      session: ctx.session,
      repository: productRepository,
    });

    return NextResponse.json(success(result), { status: 201 });
  });
}
