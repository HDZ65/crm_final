import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  PUBLIC_ROUTES,
  COOKIE_NAMES,
  AUTH_URLS,
  AUTH_ERRORS,
} from "@/lib/auth/constants";

// =============================================================================
// Middleware Configuration
// =============================================================================

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - static files
     * - images
     * - favicon
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};

// =============================================================================
// Middleware Handler
// =============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check authentication
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to login if not authenticated or token refresh failed
  if (!token || token.error === AUTH_ERRORS.REFRESH_TOKEN_ERROR) {
    return redirectToLogin(request, pathname);
  }

  return NextResponse.next();
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if the path is a public route
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Create redirect response to login page with session cleanup
 */
function redirectToLogin(request: NextRequest, callbackUrl: string): NextResponse {
  const loginUrl = new URL(AUTH_URLS.LOGIN, request.url);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);

  const response = NextResponse.redirect(loginUrl);

  // Clear session cookies
  response.cookies.delete(COOKIE_NAMES.SESSION_TOKEN);
  response.cookies.delete(COOKIE_NAMES.CSRF_TOKEN);

  return response;
}
