/**
 * 注文一覧・作成API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/domains/orders/api';
import { orderRepository, cartFetcher } from '@/infrastructure/repositories';
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
      userId: searchParams.get('userId') || undefined,
    };

    const result = await getOrders(input, {
      session: ctx.session,
      repository: orderRepository,
      cartFetcher,
    });

    return NextResponse.json(success(result));
  });
}

export async function POST(request: NextRequest) {
  return handler(request, async (req, ctx) => {
    const body = await req.json();
    const result = await createOrder(body, {
      session: ctx.session,
      repository: orderRepository,
      cartFetcher,
    });

    return NextResponse.json(success(result), { status: 201 });
  });
}
