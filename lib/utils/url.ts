/**
 * Environment-aware helper to resolve the base application URL.
 * 
 * Precedence:
 * 1. NEXT_PUBLIC_SITE_URL (Explicit production / custom domain, e.g., https://threadify.in)
 * 2. NEXT_PUBLIC_VERCEL_URL (Automatic Vercel deployment URL)
 * 3. window.location.origin (Client-side browser origin)
 * 4. http://localhost:3000 (Development fallback)
 */
export function getURL(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    "http://localhost:3000"

  url = url.trim()

  // Ensure protocol is present
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`
  }

  // Remove any trailing slashes
  return url.replace(/\/+$/, "")
}
