/**
 * Normalise a raw Host header value for deterministic lookup:
 * - lowercase
 * - strip port
 * - strip trailing dot (DNS root)
 *
 * Extracted to its own module so both the Edge proxy (`proxy.ts`) and
 * the Node-only tenant resolver (`lib/tenant.ts`) can share the same
 * implementation without runtime restrictions.
 */
export function normalizeHost(raw: string): string {
  return raw.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}
