import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { edgeProofHeader } from "./server/request-perimeter-core";

import { config, proxy } from "./proxy";

const originalEnvironment = {
  abuseSubjectHmacKey: process.env.NITIPCUY_ABUSE_SUBJECT_HMAC_KEY_BASE64,
  appOrigin: process.env.NITIPCUY_APP_ORIGIN,
  edgeProof: process.env.NITIPCUY_EDGE_REQUEST_SECRET,
  nodeEnvironment: process.env.NODE_ENV,
  proxyMode: process.env.NITIPCUY_PROXY_MODE,
};

describe.sequential("Next.js request perimeter proxy", () => {
  beforeEach(() => {
    process.env.NITIPCUY_ABUSE_SUBJECT_HMAC_KEY_BASE64 = Buffer.alloc(
      32,
      11,
    ).toString("base64");
    process.env.NITIPCUY_APP_ORIGIN = "http://localhost:3000";
    delete process.env.NITIPCUY_EDGE_REQUEST_SECRET;
    process.env.NITIPCUY_PROXY_MODE = "LOCAL_DIRECT";
  });

  afterEach(() => {
    restoreEnvironment(
      "NITIPCUY_ABUSE_SUBJECT_HMAC_KEY_BASE64",
      originalEnvironment.abuseSubjectHmacKey,
    );
    restoreEnvironment("NITIPCUY_APP_ORIGIN", originalEnvironment.appOrigin);
    restoreEnvironment(
      "NITIPCUY_EDGE_REQUEST_SECRET",
      originalEnvironment.edgeProof,
    );
    restoreEnvironment("NODE_ENV", originalEnvironment.nodeEnvironment);
    restoreEnvironment("NITIPCUY_PROXY_MODE", originalEnvironment.proxyMode);
  });

  it("adds a fresh CSP and browser headers to canonical local pages", () => {
    const first = proxy(localRequest("/"));
    const second = proxy(localRequest("/"));

    expect(first.status).toBe(200);
    expect(first.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(first.headers.get("x-frame-options")).toBe("DENY");
    expect(first.headers.get("x-content-type-options")).toBe("nosniff");
    expect(first.headers.get("content-security-policy")).not.toBe(
      second.headers.get("content-security-policy"),
    );
  });

  it("marks auth and API responses private and non-cacheable", () => {
    for (const pathname of ["/auth/google/start", "/api/account/session"]) {
      const response = proxy(localRequest(pathname));
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.get("pragma")).toBe("no-cache");
    }
  });

  it("rejects host confusion without redirecting", async () => {
    const request = new NextRequest("http://localhost:3000/auth/google/start", {
      headers: { host: "evil.example" },
    });
    const response = proxy(request);

    expect(response.status).toBe(421);
    await expect(response.json()).resolves.toEqual({ error: "REQUEST_DENIED" });
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("does not allow prefetch markers to bypass the request decision", async () => {
    expect(config.matcher[0]).not.toHaveProperty("missing");
    const request = new NextRequest(
      "http://localhost:3000/api/account/session",
      {
        headers: {
          host: "evil.example",
          "next-router-prefetch": "1",
          purpose: "prefetch",
        },
      },
    );
    const response = proxy(request);

    expect(response.status).toBe(421);
    await expect(response.json()).resolves.toEqual({ error: "REQUEST_DENIED" });
  });

  it("fails closed with restrictive headers when configuration is absent", async () => {
    delete process.env.NITIPCUY_APP_ORIGIN;
    delete process.env.NITIPCUY_PROXY_MODE;
    const response = proxy(localRequest("/"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "SERVICE_UNAVAILABLE",
    });
    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'none'",
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("requires exact edge proof and canonical forwarding in trusted mode", () => {
    const edgeProof = "a-secure-edge-proof-with-at-least-32-characters";
    process.env.NITIPCUY_APP_ORIGIN = "https://preview.nitipcuy.example";
    process.env.NITIPCUY_EDGE_REQUEST_SECRET = edgeProof;
    process.env.NITIPCUY_PROXY_MODE = "TRUSTED_PROXY";
    const response = proxy(
      new NextRequest("http://internal-origin.example/", {
        headers: {
          [edgeProofHeader]: edgeProof,
          host: "internal-origin.example",
          "x-forwarded-for": "203.0.113.10",
          "x-forwarded-host": "preview.nitipcuy.example",
          "x-forwarded-port": "443",
          "x-forwarded-proto": "https",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("strict-transport-security")).toBe(
      "max-age=86400",
    );
  });

  it("preserves an actual 404 for unknown demo trips", () => {
    expect(config.matcher[0]?.source).toContain("_not-found");
    const response = proxy(localRequest("/trips/not-a-known-demo-trip"));
    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toContain(
      "/_not-found",
    );
  });
});

function localRequest(pathname: string): NextRequest {
  return new NextRequest(`http://localhost:3000${pathname}`, {
    headers: { host: "localhost:3000" },
  });
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
