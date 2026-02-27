/**
 * 管理者向け商品一覧・登録API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminProducts, createProduct } from '@/domains/products/api';
import { productCommandRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const { handler } = createRouteHandler<Session>({ getSession: getServerSession });

export async function GET(request: NextRequest) {
  return handler(request, async (req, ctx) => {
    const { searchParams } = new URL(req.url);
    const input = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || undefined,
      q: searchParams.get('q') || undefined,
    };

    const result = await getAdminProducts(input, {
      session: ctx.session,
      repository: productCommandRepository,
    });

    return NextResponse.json(success(result));
  });
}

export async function POST(request: NextRequest) {
  return handler(request, async (req, ctx) => {
    const body = await req.json();
    const result = await createProduct(body, {
      session: ctx.session,
      repository: productCommandRepository,
    });

    return NextResponse.json(success(result), { status: 201 });
  });
}
