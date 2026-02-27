/**
 * 注文詳細・ステータス更新API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/domains/orders/api';
import { orderRepository, cartFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const { handler } = createRouteHandler<Session>({ getSession: getServerSession });

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, routeParams: Params) {
  return handler(request, async (_req, ctx) => {
    const result = await getOrderById({ id: ctx.params.id }, {
      session: ctx.session,
      repository: orderRepository,
      cartFetcher,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}

export async function PATCH(request: NextRequest, routeParams: Params) {
  return handler(request, async (req, ctx) => {
    const body = await req.json();
    const result = await updateOrderStatus({ ...body, id: ctx.params.id }, {
      session: ctx.session,
      repository: orderRepository,
      cartFetcher,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}
