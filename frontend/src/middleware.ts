import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth.server";
import {
  PUBLIC_ROUTES,
  COOKIE_NAMES,
  AUTH_URLS,
  AUTH_ERRORS,
} from "@/lib/auth/auth.config";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};

export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const session = request.auth;

  if (!session || session.error === AUTH_ERRORS.REFRESH_TOKEN_ERROR) {
    return redirectToLogin(request, pathname);
  }

  return NextResponse.next();
});

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function redirectToLogin(request: NextRequest, callbackUrl: string): NextResponse {
  const loginUrl = new URL(AUTH_URLS.LOGIN, request.url);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);

  const response = NextResponse.redirect(loginUrl);

  response.cookies.delete(COOKIE_NAMES.SESSION_TOKEN);
  response.cookies.delete(COOKIE_NAMES.CSRF_TOKEN);

  return response;
}
