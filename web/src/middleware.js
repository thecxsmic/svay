import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api(.*)', '/docs(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  // We allow most routes to render so we can show a modal in the layout,
  // but we might still want to protect API routes or specific paths.
  if (!isPublicRoute(request)) {
    // For now, we'll let the layout handle the "Gate" for a better UX (popup feel)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
