import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import tenantsMap from "../data/tenants.json";
import { normalizeHost } from "./lib/normalize-host";

// ── next-intl locale middleware (created once at module load) ─────────

const handleI18nRouting = createMiddleware(routing);

/** Pre-normalise the tenants map keys once at module load. */
const normalisedTenants: Record<string, string> = Object.fromEntries(
  Object.entries(tenantsMap).map(([host, id]) => [normalizeHost(host), id]),
);

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "nini";

// ── Proxy ────────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Tenant resolution (runs for every matched request) ───────────
  const rawHost = request.headers.get("host") ?? "";
  const host = normalizeHost(rawHost);
  let tenantId = normalisedTenants[host] ?? null;

  if (!tenantId) {
    if (process.env.NODE_ENV !== "production") {
      // Dev / staging fallback — prevents "why is localhost broken?" confusion
      tenantId = DEFAULT_TENANT_ID;
    } else {
      // Unknown host in production → 404
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  // Inject x-tenant-id into the request headers for downstream consumption
  // (server components can read this via headers())
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", tenantId);

  // ── Admin route authentication (now under locale structure) ──────
  const adminPathMatch = pathname.match(/^\/[a-z]{2}\/admin/);
  if (
    adminPathMatch &&
    !pathname.includes("/login") &&
    pathname !== "/api/admin/config"
  ) {
    const cookieToken = request.cookies.get("admin-token")?.value;
    const authHeader = request.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      // Extract locale from the path for redirect
      const locale = pathname.split("/")[1];
      return NextResponse.redirect(
        new URL(`/${locale}/admin/login`, request.url),
      );
    }
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Skip locale handling for API routes and static assets (anything with a
  // file extension like .mp3, .woff2, .svg, .ico, etc. that lives in public/).
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    /\.[\w]+$/.test(pathname)
  ) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // ── Locale routing (delegated to next-intl) ──────────────────────
  // Handles: accept-language negotiation, locale cookie, URL prefix
  // detection, and redirects for missing/invalid locale prefixes.
  const response = handleI18nRouting(request);

  // Forward x-tenant-id to the app via the middleware request header
  // convention so server components can read it via headers().
  response.headers.set("x-middleware-request-x-tenant-id", tenantId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - files with extensions (static assets in public/: .ico, .svg, .mp3, .woff2, etc.)
     *
     * Note: API routes ARE matched now so they receive the x-tenant-id header,
     * but locale handling still skips them (handled inside the function).
     */
    "/((?!_next/static|_next/image)(?!.*\\.\\w+$).*)",
  ],
};
