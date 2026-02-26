/**
 * 商品詳細・更新・削除API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/samples/domains/catalog/api';
import { productRepository } from '@/samples/infrastructure/repositories';
import { getServerSession } from '@/samples/infrastructure/auth';
import { createGuestSession } from '@/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const publicHandler = createRouteHandler<Session>({ getSession: getServerSession, requireAuth: false });
const authHandler = createRouteHandler<Session>({ getSession: getServerSession });

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

export async function PUT(request: NextRequest, routeParams: Params) {
  return authHandler.handler(request, async (req, ctx) => {
    const body = await req.json();
    const result = await updateProduct({ ...body, id: ctx.params.id }, {
      session: ctx.session,
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}

export async function DELETE(request: NextRequest, routeParams: Params) {
  return authHandler.handler(request, async (_req, ctx) => {
    const result = await deleteProduct({ id: ctx.params.id }, {
      session: ctx.session,
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}
