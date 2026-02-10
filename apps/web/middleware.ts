import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  const pathname = request.nextUrl.pathname;

  try {
    const res = await fetch(`${apiBase}/me`, { cache: "no-store" });

    // If user already has a profile, prevent visiting onboarding again.
    if (pathname.startsWith("/onboarding")) {
      if (res.ok) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.searchParams.delete("from");
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    // Protected routes: no profile yet -> force onboarding
    if (res.status === 404) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      // Helpful for debugging / future "return to" behavior
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  } catch {
    // If the API is down/unreachable, don't block navigation.
    // The page itself can surface the error in dev.
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/explore/:path*",
    "/saved/:path*",
  ],
};

