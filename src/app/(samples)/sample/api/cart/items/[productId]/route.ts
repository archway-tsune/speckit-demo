/**
 * カート更新・削除API
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateCartItem, removeFromCart } from '@/samples/domains/cart/api';
import { cartRepository, productFetcher } from '@/samples/infrastructure/repositories';
import { getServerSession } from '@/samples/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const { handler } = createRouteHandler<Session>({ getSession: getServerSession });

type Params = { params: Promise<{ productId: string }> };

export async function PUT(request: NextRequest, routeParams: Params) {
  return handler(request, async (req, ctx) => {
    const body = await req.json();
    const result = await updateCartItem({ ...body, productId: ctx.params.productId }, {
      session: ctx.session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}

export async function DELETE(request: NextRequest, routeParams: Params) {
  return handler(request, async (_req, ctx) => {
    const result = await removeFromCart({ productId: ctx.params.productId }, {
      session: ctx.session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result));
  }, routeParams);
}
