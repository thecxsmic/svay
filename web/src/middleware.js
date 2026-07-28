import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rateLimit';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/api(.*)', 
  '/docs(.*)',
  '/tools(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/cookies(.*)',
  '/refund(.*)',
  '/shared(.*)',
  '/affiliate(.*)',
  '/r(.*)',
  '/home(.*)',
  '/search(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  const url = request.nextUrl;
  const pathname = url.pathname;

  // Affiliate referral capture via ?ref=CODE or ?aff=CODE query param
  const refParam = url.searchParams.get("ref") || url.searchParams.get("aff");
  let affiliateCookie = null;
  if (refParam) {
    const code = refParam
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "")
      .slice(0, 24);
    if (code) {
      affiliateCookie = code;
    }
  }

  // Redirect authenticated users from / to /dashboard (the new default home)
  if (pathname === '/') {
    try {
      const { userId } = await auth();
      if (userId) {
        const dashUrl = new URL('/dashboard', url.origin);
        return NextResponse.redirect(dashUrl, { status: 302 });
      }
    } catch {}
  }

  // Affiliate referral capture via /r/CODE path — redirect to / with cookie
  const rMatch = pathname.match(/^\/r\/([A-Za-z0-9_-]{1,24})(?:\/.*)?$/);
  if (rMatch) {
    const code = rMatch[1].toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24);
    if (code) {
      const redirectUrl = new URL("/", url.origin);
      const redirectResponse = NextResponse.redirect(redirectUrl, { status: 302 });
      redirectResponse.cookies.set("svay_ref", code, {
        path: "/",
        maxAge: 60 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
      });
      return redirectResponse;
    }
  }

  // Rate limit API routes, except for internal jobs and Webhooks
  let rateLimitHeaders = null;
  if (pathname.startsWith('/api') && 
      !pathname.startsWith('/api/razorpay/webhook') && 
      !pathname.startsWith('/api/dodo/webhook') && 
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

    // 2. Per-user search limits: 20/hour and 30/day for both search endpoints
    const isSearchEndpoint =
      (pathname === '/api/youtube/search' || pathname === '/api/youtube/channel') &&
      request.method === 'GET';

    if (isSearchEndpoint) {
      const SEARCH_HOUR_LIMIT = 20;
      const SEARCH_DAY_LIMIT  = 30;
      const HOUR_MS = 60 * 60 * 1000;        // 1 hour
      const DAY_MS  = 24 * 60 * 60 * 1000;   // 24 hours

      const hourKey  = `search:hour:${rateLimitKey}`;
      const dayKey   = `search:day:${rateLimitKey}`;

      const hourResult = checkRateLimit(hourKey, SEARCH_HOUR_LIMIT, HOUR_MS);
      const dayResult  = checkRateLimit(dayKey,  SEARCH_DAY_LIMIT,  DAY_MS);

      if (hourResult.limited) {
        const resetIn = Math.ceil((hourResult.reset - Date.now()) / 1000 / 60);
        console.warn(`[Rate Limiter] Search hourly limit hit for: ${rateLimitKey}`);
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: `You've reached the 20 searches/hour limit. Resets in ~${resetIn} minute${resetIn !== 1 ? 's' : ''}.`,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(SEARCH_HOUR_LIMIT),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(hourResult.reset),
              'X-RateLimit-Window': 'hour',
            },
          }
        );
      }

      if (dayResult.limited) {
        const resetIn = Math.ceil((dayResult.reset - Date.now()) / 1000 / 60 / 60);
        console.warn(`[Rate Limiter] Search daily limit hit for: ${rateLimitKey}`);
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: `You've reached the 30 searches/day limit. Resets in ~${resetIn} hour${resetIn !== 1 ? 's' : ''}.`,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(SEARCH_DAY_LIMIT),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(dayResult.reset),
              'X-RateLimit-Window': 'day',
            },
          }
        );
      }
    }

    // 3. Check specific route limit
    let limit = 60; // default 60 requests per minute per route
    const isHeavyEndpoint = 
      (pathname === '/api/trends' && request.method === 'POST') ||
      (pathname === '/api/competitors/save' && request.method === 'POST') ||
      (pathname === '/api/competitors/email' && request.method === 'POST') ||
      (pathname === '/api/trends/email' && request.method === 'POST');

    if (isHeavyEndpoint) {
      limit = 10; // Max 10 requests per minute for heavy tasks
    }

    // Free tools: tighter edge limits (quota layer still enforces daily/tier caps)
    if (pathname.startsWith('/api/tools/run') && request.method === 'POST') {
      limit = 20;
    } else if (pathname.startsWith('/api/tools/status')) {
      limit = 40;
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

  // Persist affiliate ref for 60 days so checkout can attribute the sale
  if (affiliateCookie) {
    response.cookies.set("svay_ref", affiliateCookie, {
      path: "/",
      maxAge: 60 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
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

