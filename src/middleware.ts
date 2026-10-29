import { NextRequest, NextResponse } from 'next/server';

/**
 * Temporary Basic Auth for staging-only admin CSV preview.
 * Configure ADMIN_PREVIEW_USER and ADMIN_PREVIEW_PASSWORD in Render.
 * Never use this as the final authorization layer for database writes.
 */
export async function middleware(request: NextRequest) {
  const username = process.env.ADMIN_PREVIEW_USER;
  const password = process.env.ADMIN_PREVIEW_PASSWORD;
  const unauthorized = () => new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="RPM Custom Admin Preview", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
  if (!username || !password) return new NextResponse('Admin preview not configured', { status: 503 });
  const auth = request.headers.get('authorization') ?? '';
  if (!auth.startsWith('Basic ')) return unauthorized();
  let credentials: string;
  try { credentials = atob(auth.slice(6)); } catch { return unauthorized(); }
  const separator = credentials.indexOf(':');
  if (separator < 0) return unauthorized();
  const actualUser = credentials.slice(0, separator);
  const actualPass = credentials.slice(separator + 1);
  const encoder = new TextEncoder();
  async function digest(value: string) {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  }
  const [a, b, c, d] = await Promise.all([
    digest(actualUser), digest(username), digest(actualPass), digest(password),
  ]);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  for (let i = 0; i < c.length; i++) mismatch |= c[i] ^ d[i];
  if (mismatch !== 0) return unauthorized();
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
export const config = { matcher: ['/admin-import/:path*'] };
