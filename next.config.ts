import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  [
    "script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://challenges.cloudflare.com",
    isProd ? "" : "'unsafe-eval'",
  ]
    .filter(Boolean)
    .join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  [
    "connect-src 'self' https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com https://accounts.google.com https://www.googleapis.com https://challenges.cloudflare.com",
    isProd ? "" : "ws: wss:",
  ]
    .filter(Boolean)
    .join(" "),
  "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://*.web.app https://www.google.com https://challenges.cloudflare.com",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Ekspos hanya kunci publik klien ke bundle browser tanpa awalan NEXT_PUBLIC_
  env: {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ?? "",
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ?? "",
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? "",
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ?? "",
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ?? "",
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ?? "",
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY ?? "",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspDirectives,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
      {
        source: "/api/images/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; sandbox",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
