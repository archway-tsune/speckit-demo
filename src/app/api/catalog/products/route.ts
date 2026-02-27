/**
 * 商品一覧・登録API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/domains/catalog/api';
import { productRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { createGuestSession } from '@/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const publicHandler = createRouteHandler<Session>({ getSession: getServerSession, requireAuth: false });

export async function GET(request: NextRequest) {
  return publicHandler.handler(request, async (req, ctx) => {
    const session = ctx.session as Session | null;
    const { searchParams } = new URL(req.url);
    const input = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: session ? (searchParams.get('status') || undefined) : 'published',
      q: searchParams.get('q') ?? undefined,
    };

    const result = await getProducts(input, {
      session: session || createGuestSession(),
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  });
}

