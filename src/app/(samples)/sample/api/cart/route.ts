/**
 * カート取得API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCart } from '@/samples/domains/cart/api';
import { cartRepository, productFetcher } from '@/samples/infrastructure/repositories';
import { getServerSession } from '@/samples/infrastructure/auth';
import { success } from '@/foundation/errors/response';
import { createRouteHandler } from '@/templates/api/route-handler';
import type { Session } from '@/foundation/auth/session';

const { handler } = createRouteHandler<Session>({ getSession: getServerSession });

export async function GET(request: NextRequest) {
  return handler(request, async (_req, ctx) => {
    const result = await getCart({}, {
      session: ctx.session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result));
  });
}
