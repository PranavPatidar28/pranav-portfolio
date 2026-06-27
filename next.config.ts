import type { NextConfig } from "next";

// Security headers applied to every route. No strict CSP yet — the inline
// `no-js` bootstrap script and the WebGL data-URI textures make a tight policy
// fiddly; revisit with a nonce-based CSP if needed.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    // The app ships WebP art; emit WebP from the optimizer (skip AVIF for
    // broader device support and faster builds).
    formats: ["image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
