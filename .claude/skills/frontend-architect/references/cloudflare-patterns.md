# Advanced Cloudflare Patterns

Deep dive into Cloudflare Pages and Workers patterns for frontend applications.

## OpenNext for Next.js on Cloudflare

Next.js on Cloudflare Pages requires OpenNext adapter:

### Setup

```bash
npm install @opennext/cloudflare
```

### open-next.config.ts

```typescript
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      // Use for KV caching
      incrementalCache: async () => (await import("./cache.mjs")).default,
    },
  },
};

export default config;
```

### Build and Deploy

```bash
# Build with OpenNext
npx @opennext/cloudflare build

# Deploy
npx wrangler pages deploy .open-next
```

---

## Multi-Environment Setup

### wrangler.toml

```toml
name = "my-app"
compatibility_date = "2026-01-31"

# Production
[env.production]
vars = { ENVIRONMENT = "production" }
routes = [{ pattern = "app.example.com/*", zone_name = "example.com" }]

# Staging
[env.staging]
vars = { ENVIRONMENT = "staging" }
routes = [{ pattern = "staging.example.com/*", zone_name = "example.com" }]

# Preview (default for branch deploys)
[vars]
ENVIRONMENT = "preview"
```

### Deploy Commands

```bash
# Deploy to production
npx wrangler pages deploy .open-next --env production

# Deploy to staging
npx wrangler pages deploy .open-next --env staging

# Deploy preview (automatic on PR)
npx wrangler pages deploy .open-next
```

---

## Caching Patterns

### KV-Based ISR Cache

```typescript
// cache.mjs
import { KVNamespace } from "@cloudflare/workers-types";

export default class CloudflareKVCache {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async get(key: string) {
    const value = await this.kv.get(key, "json");
    if (!value) return null;
    return value;
  }

  async set(key: string, value: any, options?: { ttl?: number }) {
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: options?.ttl || 86400,
    });
  }

  async delete(key: string) {
    await this.kv.delete(key);
  }
}
```

### Edge Caching with Cache API

```typescript
// functions/_middleware.ts
export async function onRequest(context: EventContext<Env, string, unknown>) {
  const cache = caches.default;
  const cacheKey = new Request(context.request.url, context.request);

  // Check cache first
  let response = await cache.match(cacheKey);

  if (response) {
    // Add cache hit header
    response = new Response(response.body, response);
    response.headers.set("X-Cache", "HIT");
    return response;
  }

  // Get fresh response
  response = await context.next();

  // Cache if cacheable
  if (response.status === 200) {
    const responseToCache = new Response(response.body, response);
    responseToCache.headers.set("Cache-Control", "public, max-age=3600");

    context.waitUntil(cache.put(cacheKey, responseToCache.clone()));

    responseToCache.headers.set("X-Cache", "MISS");
    return responseToCache;
  }

  return response;
}
```

---

## Authentication Patterns

### Cloudflare Access Integration

```typescript
// lib/auth.ts
export function getAccessEmail(request: Request): string | null {
  // Cloudflare Access sets this header
  return request.headers.get("Cf-Access-Authenticated-User-Email");
}

export function getAccessIdentity(request: Request): string | null {
  // JWT from Access
  return request.headers.get("Cf-Access-Jwt-Assertion");
}

// In your middleware or API route
export async function onRequest(context: EventContext<Env, string, unknown>) {
  const email = getAccessEmail(context.request);

  if (!email) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check if user is allowed
  const allowedEmails = (context.env.ALLOWED_EMAILS || "").split(",");
  if (!allowedEmails.includes(email)) {
    return new Response("Forbidden", { status: 403 });
  }

  return context.next();
}
```

### Setting Up Cloudflare Access

1. Go to Zero Trust dashboard
2. Create an Access Application
3. Set application domain (e.g., `internal.example.com`)
4. Configure identity providers (GitHub, Google, etc.)
5. Create Access policies (email domain, specific emails, etc.)

---

## Image Optimization

### Using Cloudflare Images

```typescript
// lib/images.ts
export function getOptimizedUrl(
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    fit?: "contain" | "cover" | "crop" | "pad";
    quality?: number;
  }
): string {
  const params = new URLSearchParams();

  if (options.width) params.set("w", String(options.width));
  if (options.height) params.set("h", String(options.height));
  if (options.fit) params.set("fit", options.fit);
  if (options.quality) params.set("q", String(options.quality));

  // Cloudflare Images transform URL
  return `https://imagedelivery.net/${ACCOUNT_ID}/${imageUrl}/public?${params}`;
}
```

### next/image with Cloudflare

```typescript
// next.config.js
module.exports = {
  images: {
    loader: "custom",
    loaderFile: "./lib/cloudflare-image-loader.ts",
  },
};

// lib/cloudflare-image-loader.ts
export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const params = [`width=${width}`];
  if (quality) params.push(`quality=${quality}`);

  // Using Cloudflare Image Resizing
  return `https://your-domain.com/cdn-cgi/image/${params.join(",")}/${src}`;
}
```

---

## A/B Testing at Edge

```typescript
// functions/_middleware.ts
const EXPERIMENT_COOKIE = "experiment_variant";

export async function onRequest(context: EventContext<Env, string, unknown>) {
  const request = context.request;
  const url = new URL(request.url);

  // Only run experiment on specific paths
  if (!url.pathname.startsWith("/pricing")) {
    return context.next();
  }

  // Get or assign variant
  const cookies = request.headers.get("Cookie") || "";
  let variant = getCookie(cookies, EXPERIMENT_COOKIE);

  if (!variant) {
    // 50/50 split
    variant = Math.random() < 0.5 ? "control" : "variant";
  }

  // Rewrite to variant
  const response = await context.next();

  // Set cookie for consistency
  if (!getCookie(cookies, EXPERIMENT_COOKIE)) {
    const newResponse = new Response(response.body, response);
    newResponse.headers.append(
      "Set-Cookie",
      `${EXPERIMENT_COOKIE}=${variant}; Path=/; Max-Age=86400`
    );
    return newResponse;
  }

  return response;
}

function getCookie(cookies: string, name: string): string | null {
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}
```

---

## Analytics at Edge

```typescript
// functions/_middleware.ts
export async function onRequest(context: EventContext<Env, string, unknown>) {
  const start = Date.now();
  const response = await context.next();
  const duration = Date.now() - start;

  // Log to Analytics Engine (Cloudflare)
  context.waitUntil(
    context.env.ANALYTICS.writeDataPoint({
      blobs: [context.request.url, context.request.method],
      doubles: [duration, response.status],
      indexes: [context.request.headers.get("CF-Connecting-IP") || "unknown"],
    })
  );

  return response;
}
```

---

## Error Handling

### Custom Error Pages

```typescript
// functions/_middleware.ts
export async function onRequest(context: EventContext<Env, string, unknown>) {
  try {
    const response = await context.next();

    // Handle 404s with custom page
    if (response.status === 404) {
      return context.env.ASSETS.fetch(
        new Request(new URL("/404.html", context.request.url))
      );
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);

    // Return custom 500 page
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}
```

### Error Tracking

```typescript
// lib/error-tracking.ts
export async function trackError(
  error: Error,
  context: { url: string; userAgent: string }
) {
  // Send to your error tracking service
  await fetch("https://your-error-service.com/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      url: context.url,
      userAgent: context.userAgent,
      timestamp: new Date().toISOString(),
    }),
  });
}
```

---

## Performance Monitoring

### Core Web Vitals Collection

```typescript
// app/layout.tsx (Next.js) or main entry
"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/vitals", body);
    } else {
      fetch("/api/vitals", { body, method: "POST", keepalive: true });
    }
  });

  return null;
}
```
