/**
 * 商品詳細API（読み取り専用）
 * admin CRUD は /api/admin/products を使用
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/domains/catalog/api';
import { productRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { createGuestSession } from '@/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const publicHandler = createRouteHandler<Session>({ getSession: getServerSession, requireAuth: false });

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, routeParams: Params) {
  return publicHandler.handler(request, async (_req, ctx) => {
    const session = ctx.session as Session | null;
    const result = await getProductById({ id: ctx.params.id }, {
      session: session || createGuestSession(),
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}
