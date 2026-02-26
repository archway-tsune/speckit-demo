/**
 * ログアウトAPI
 */
import { NextRequest, NextResponse } from 'next/server';
import { destroyServerSession } from '@/infrastructure/auth';

function buildRedirectUrl(path: string, request: NextRequest): URL {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.url;
  return new URL(path, baseUrl);
}

export async function POST(request: NextRequest) {
  await destroyServerSession();
  return NextResponse.redirect(buildRedirectUrl('/catalog', request));
}

// GETリクエストへの対応（リダイレクト）
export async function GET(request: NextRequest) {
  await destroyServerSession();
  return NextResponse.redirect(buildRedirectUrl('/catalog', request));
}
