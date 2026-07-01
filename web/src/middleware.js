import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rateLimit';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/api(.*)', 
  '/docs(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/cookies(.*)',
  '/refund(.*)'
])

export default clerkMiddleware(async (auth, request) => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  const url = request.nextUrl;
  const pathname = url.pathname;

  // Rate limit API routes, except for internal jobs and Razorpay webhooks
  let rateLimitHeaders = null;
  if (pathname.startsWith('/api') && 
      !pathname.startsWith('/api/razorpay/webhook') && 
      !pathname.startsWith('/api/jobs')) {
    
    const { userId } = await auth();
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitKey = userId ? `user:${userId}` : `ip:${ip}`;
    
    // 1. Check Global IP/User limit across all API endpoints (120 requests per minute)
    const globalKey = `global:${rateLimitKey}`;
    const globalLimitResult = checkRateLimit(globalKey, 120, 60000);
    if (globalLimitResult.limited) {
      console.warn(`[Rate Limiter] Global API rate limit exceeded for key: ${globalKey}`);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: "Too many requests. Please wait a minute and try again." 
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(globalLimitResult.limit),
            'X-RateLimit-Remaining': String(globalLimitResult.remaining),
            'X-RateLimit-Reset': String(globalLimitResult.reset),
          } 
        }
      );
    }

    // 2. Check specific route limit
    let limit = 60; // default 60 requests per minute per route
    const isHeavyEndpoint = 
      (pathname === '/api/trends' && request.method === 'POST') ||
      (pathname === '/api/competitors/save' && request.method === 'POST') ||
      (pathname === '/api/competitors/email' && request.method === 'POST') ||
      (pathname === '/api/trends/email' && request.method === 'POST');

    if (isHeavyEndpoint) {
      limit = 10; // Max 10 requests per minute for heavy tasks
    }

    const routeKey = `${rateLimitKey}:${pathname}:${request.method}`;
    const routeLimitResult = checkRateLimit(routeKey, limit, 60000);
    if (routeLimitResult.limited) {
      console.warn(`[Rate Limiter] Route rate limit exceeded for key: ${routeKey}`);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: "Too many requests to this endpoint. Please slow down." 
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(routeLimitResult.limit),
            'X-RateLimit-Remaining': String(routeLimitResult.remaining),
            'X-RateLimit-Reset': String(routeLimitResult.reset),
          } 
        }
      );
    }

    // Save the route rate-limiting headers to append to the successful response
    rateLimitHeaders = {
      'X-RateLimit-Limit': String(routeLimitResult.limit),
      'X-RateLimit-Remaining': String(routeLimitResult.remaining),
      'X-RateLimit-Reset': String(routeLimitResult.reset),
    };
  }

  // We allow most routes to render so we can show a modal in the layout,
  // but we might still want to protect API routes or specific paths.
  if (!isPublicRoute(request)) {
    // For now, we'll let the layout handle the "Gate" for a better UX (popup feel)
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });

  // Inject rate-limiting headers if this was an API request
  if (rateLimitHeaders) {
    Object.entries(rateLimitHeaders).forEach(([name, value]) => {
      response.headers.set(name, value);
    });
  }

  return response;
})


export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

