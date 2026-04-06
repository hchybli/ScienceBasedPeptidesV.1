import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-this-to-a-long-random-secret-minimum-32-chars",
);
const COOKIE_NAME = "peptide_session_v2";

/**
 * `/products/[slug]` catches URLs like `/products/dsip-clean-2.png` (slug = filename) → 404.
 * Product art lives under `public/product-media/`; we rewrite image requests so static files win.
 */
const PRODUCT_IMAGE = /^\/products\/(.+\.(?:png|jpe?g|webp|svg))$/i;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const imageMatch = PRODUCT_IMAGE.exec(pathname);
  if (imageMatch) {
    const url = req.nextUrl.clone();
    url.pathname = `/product-media/${imageMatch[1]}`;
    return NextResponse.rewrite(url);
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (pathname.startsWith("/account")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login?redirect=" + encodeURIComponent(pathname), req.url));
    }
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/products/:path*", "/account/:path*", "/admin/:path*"],
};
