import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { headers } from "next/headers";
import { normalizeHost } from "./normalize-host";

// ── Types ────────────────────────────────────────────────────────────────

/** hostname (normalised) → tenantId */
type TenantsMap = Record<string, string>;

// ── Tenants map (lazy-loaded, cached) ────────────────────────────────────

let tenantsMapCache: TenantsMap | null = null;

/**
 * Load and cache the hostname → tenantId mapping from `data/tenants.json`.
 * Keys are normalised (lowercased, port-stripped) at load time so lookups
 * are always consistent.
 */
async function loadTenantsMap(): Promise<TenantsMap> {
  if (tenantsMapCache) return tenantsMapCache;

  const filePath = path.resolve(process.cwd(), "data", "tenants.json");
  const raw: Record<string, string> = JSON.parse(
    await fs.readFile(filePath, "utf-8"),
  );

  // Normalise keys once at load time
  const normalised: TenantsMap = {};
  for (const [host, tenantId] of Object.entries(raw)) {
    normalised[normalizeHost(host)] = tenantId;
  }

  tenantsMapCache = normalised;
  return tenantsMapCache;
}

// ── Default / fallback tenant ────────────────────────────────────────────

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "nini";

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Resolve the tenant ID from the incoming `Host` header.
 *
 * In development (`NODE_ENV !== "production"`) an unknown host falls back
 * to `DEFAULT_TENANT_ID` so preview URLs and localhost variants keep working.
 *
 * In production an unknown host returns `null` (caller should 404).
 */
export async function resolveTenantFromHost(
  rawHost: string,
): Promise<string | null> {
  const host = normalizeHost(rawHost);
  const map = await loadTenantsMap();
  const tenantId = map[host];

  if (tenantId) return tenantId;

  // Dev/staging fallback
  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_TENANT_ID;
  }

  return null;
}

/**
 * Get the tenant ID inside a **server component or server action**.
 * Reads the `x-tenant-id` header that `proxy.ts` injected.
 *
 * During static prerendering (e.g. `_not-found`, `_global-error`)
 * there is no request context, so `headers()` throws an InvariantError.
 * Only that specific case falls back to `DEFAULT_TENANT_ID`.
 *
 * All other failures (bad tenants.json, unresolvable host at runtime)
 * throw immediately — fail-fast, never silently serve wrong tenant.
 */
export async function getTenantId(): Promise<string> {
  let h: Awaited<ReturnType<typeof headers>>;
  try {
    h = await headers();
  } catch {
    // Static prerendering — no request context. Safe to fall back.
    return DEFAULT_TENANT_ID;
  }

  // We have a live request — resolve tenant or fail.
  const tenantId = h.get("x-tenant-id");
  if (tenantId) return tenantId;

  // Fallback: resolve from Host directly (defensive)
  const host = h.get("host") ?? "";
  const resolved = await resolveTenantFromHost(host);
  if (resolved) return resolved;

  throw new Error(
    `[tenant] Unable to resolve tenant for host "${host}". ` +
      "Check data/tenants.json or proxy.ts configuration.",
  );
}

/**
 * Get the tenant ID inside an **API route handler**.
 * Resolves from the `Host` header directly — does not rely on
 * proxy-injected headers (unreliable across edge → node boundary).
 */
export async function getTenantIdFromRequest(
  req: Request,
): Promise<string | null> {
  const rawHost = req.headers.get("host") ?? "";
  return resolveTenantFromHost(rawHost);
}

/**
 * Build the absolute filesystem path to a tenant's data file.
 * Example: `tenantDataPath("nini", "artist.json")` →
 * `/app/data/tenants/nini/artist.json`
 */
export function tenantDataPath(tenantId: string, ...segments: string[]): string {
  return path.resolve(process.cwd(), "data", "tenants", tenantId, ...segments);
}

/**
 * Build the absolute filesystem path to a tenant's message file.
 * Example: `tenantMessagePath("artworks", "nini", "en.json")` →
 * `/app/messages/artworks/nini/en.json`
 */
export function tenantMessagePath(
  category: string,
  tenantId: string,
  ...segments: string[]
): string {
  return path.resolve(
    process.cwd(),
    "messages",
    category,
    tenantId,
    ...segments,
  );
}

/**
 * Clear the cached tenants map. Useful for testing or hot-reload.
 */
export function clearTenantsCache(): void {
  tenantsMapCache = null;
}
