import { Platform } from "react-native";
import { API_BASE_URL } from "../config";

/**
 * Resolves any image URL/path coming from the backend into a URL
 * the current device can actually reach.
 *
 * Rules:
 *  1. null / non-string  → return null (no image)
 *  2. Already a full Cloudinary / external HTTPS URL → return as-is
 *  3. A local-server URL whose host is "localhost" or "127.0.0.1":
 *       - On Android emulator the loopback alias is 10.0.2.2, so we
 *         swap the host to match API_BASE_URL so images load correctly.
 *  4. A relative path (e.g. "/uploads/foo.jpg") → prefix with API_BASE_URL
 */
export function resolveImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  // blob / data URIs are already usable inline
  if (rawUrl.startsWith("blob:") || rawUrl.startsWith("data:")) return rawUrl;

  // Full URL – may need host rewrite for local dev
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    // Only rewrite localhost / 127.0.0.1 URLs so they resolve on the device
    const isLocalhost =
      rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1");

    if (isLocalhost) {
      // Replace the origin portion with whatever API_BASE_URL is
      // e.g. http://localhost:5000/uploads/x.jpg
      //   → http://10.0.2.2:5000/uploads/x.jpg  (on Android emulator)
      //   → http://localhost:5000/uploads/x.jpg  (on iOS / web)
      try {
        const parsed = new URL(rawUrl);
        const base = new URL(API_BASE_URL);
        parsed.hostname = base.hostname;
        parsed.port = base.port;
        parsed.protocol = base.protocol;
        return parsed.toString();
      } catch {
        // URL parse failed – fall through to return as-is
      }
    }

    return rawUrl;
  }

  // Relative path → prefix with API base (strip trailing slash from base)
  const base = API_BASE_URL.replace(/\/+$/, "");
  const path = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `${base}${path}`;
}
