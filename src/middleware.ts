import { NextResponse, type NextRequest } from "next/server";

import { AUTH_ROUTE_COOKIE } from "@/constants/authCookie";

const PUBLIC_PATHS = new Set([
  "/signin",
  "/signup",
  "/reset-password",
  "/error-404",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const p of PUBLIC_PATHS) {
    if (p !== "/" && pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}

function isStaticAsset(pathname: string): boolean {
  if (pathname.startsWith("/images/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  return /\.(ico|png|jpe?g|svg|webp|gif|woff2?|ttf|eot)$/i.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get(AUTH_ROUTE_COOKIE)?.value === "1";

  if (isPublicPath(pathname)) {
    if (
      hasSession &&
      (pathname === "/signin" || pathname === "/signup")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const signIn = new URL("/signin", request.url);
    signIn.searchParams.set("from", pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
