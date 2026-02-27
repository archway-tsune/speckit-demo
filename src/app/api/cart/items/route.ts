/**
 * カート追加API
 */
import { NextRequest, NextResponse } from 'next/server';
import { addToCart } from '@/domains/cart/api';
import { cartRepository, productFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const { handler } = createRouteHandler<Session>({ getSession: getServerSession });

export async function POST(request: NextRequest) {
  return handler(request, async (req, ctx) => {
    const body = await req.json();
    const result = await addToCart(body, {
      session: ctx.session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result), { status: 201 });
  });
}
