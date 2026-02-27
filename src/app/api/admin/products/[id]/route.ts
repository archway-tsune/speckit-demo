/**
 * 管理者向け商品詳細・更新・削除API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminProductById, updateProduct, deleteProduct } from '@/domains/products/api';
import { productCommandRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const { handler } = createRouteHandler<Session>({ getSession: getServerSession });

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, routeParams: Params) {
  return handler(request, async (_req, ctx) => {
    const result = await getAdminProductById({ id: ctx.params.id }, {
      session: ctx.session,
      repository: productCommandRepository,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}

export async function PUT(request: NextRequest, routeParams: Params) {
  return handler(request, async (req, ctx) => {
    const body = await req.json();
    const result = await updateProduct({ ...body, id: ctx.params.id }, {
      session: ctx.session,
      repository: productCommandRepository,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}

export async function DELETE(request: NextRequest, routeParams: Params) {
  return handler(request, async (_req, ctx) => {
    const result = await deleteProduct({ id: ctx.params.id }, {
      session: ctx.session,
      repository: productCommandRepository,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}
