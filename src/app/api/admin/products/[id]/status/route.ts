/**
 * 管理者向け商品ステータス更新API（inline）
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateProductStatus } from '@/domains/products/api';
import { productCommandRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const { handler } = createRouteHandler<Session>({ getSession: getServerSession });

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, routeParams: Params) {
  return handler(request, async (req, ctx) => {
    const body = await req.json();
    const result = await updateProductStatus({ ...body, id: ctx.params.id }, {
      session: ctx.session,
      repository: productCommandRepository,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}
