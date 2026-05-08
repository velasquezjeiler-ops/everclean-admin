import { NextRequest, NextResponse } from 'next/server';

// Ordered list — first backend that responds wins
const BACKENDS = [
  process.env.BACKEND_API_URL,
  process.env.NEXT_PUBLIC_API_URL,
  'https://commercial-clean-setup--velasquezjeiler.replit.app/api',
  'https://commercial-clean-setup.replit.app/api',
].filter(Boolean) as string[];

async function tryBackend(
  base: string,
  path: string,
  search: string,
  method: string,
  headers: Headers,
  body: ArrayBuffer | undefined
): Promise<Response | null> {
  const target = new URL(`${base.replace(/\/$/, '')}/${path}`);
  target.search = search;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    return await fetch(target, { method, headers, body, cache: 'no-store', signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  const path = (params.path || []).join('/');
  const search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  const method = request.method;
  const hasBody = !['GET', 'HEAD'].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  for (const base of BACKENDS) {
    const response = await tryBackend(base, path, search, method, headers, body);
    if (response) {
      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete('content-encoding');
      responseHeaders.delete('transfer-encoding');
      responseHeaders.set('x-backend', base);
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }
  }

  return NextResponse.json(
    { error: 'Backend unavailable. Check that Replit is running.' },
    { status: 502 }
  );
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
