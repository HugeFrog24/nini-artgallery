# Known Issues

## OpenGraph Images Removed

**Issue:** OpenGraph image tags have been intentionally removed from all metadata.

**Why:** Next.js static generation + Docker is fundamentally broken for OpenGraph images.

**The Problem:**

- `NEXT_PUBLIC_*` variables are embedded at **build time**, not runtime
- Static pages get URLs baked in permanently during Docker build
- No way to change URLs after build without rebuilding entire image
- `metadataBase` doesn't work in Docker builds (only works with `npm run build && npm run start`)
- Results in hardcoded `localhost:3000` URLs in production

**Next.js Design Flaws:**

- Treats `NEXT_PUBLIC_*` as "client-side" but uses them for server-side metadata generation
- Static generation breaks basic containerization patterns
- Framework optimized for Vercel's walled garden, not real-world Docker deployments
- No proper runtime environment variable support for metadata

**Attempted Solutions (All Failed):**

- Runtime header detection → breaks static generation
- Dynamic rendering → metadata renders in `<body>` instead of `<head>`
- Build arguments → breaks universal Docker distribution
- Placeholder replacement → hacky and unreliable

**Current Solution:**
Removed OpenGraph images entirely. All other metadata (title, description, etc.) works perfectly and provides excellent social media previews without the architectural nightmare.

**Impact:**
Social platforms still show beautiful previews with title/description. Only missing the large preview image, which isn't worth the engineering complexity.

**Recommendation:**
Don't use Next.js for projects requiring universal Docker distribution with OpenGraph images. Consider SvelteKit, Nuxt, or Remix instead.
