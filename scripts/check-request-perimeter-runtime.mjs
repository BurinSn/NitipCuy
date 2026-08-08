import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const safeKey = Buffer.alloc(32, 7).toString("base64");
const edgeProof = "runtime-probe-edge-proof-with-at-least-32-characters";
const trustedProxyOrigin = "https://preview.nitipcuy.invalid";
const trustedProxyHeaders = Object.freeze({
  "X-Forwarded-Host": new URL(trustedProxyOrigin).host,
  "X-Forwarded-Port": "443",
  "X-Forwarded-Proto": "https",
  "X-NitipCuy-Edge-Proof": edgeProof,
});

const localResult = await withApplication(
  {
    mode: "LOCAL_DIRECT",
  },
  async ({ port, request }) => {
    const first = await request("/");
    const second = await request("/");
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);

    const firstPolicy = requiredHeader(first, "content-security-policy");
    const secondPolicy = requiredHeader(second, "content-security-policy");
    assert.doesNotMatch(firstPolicy, /'unsafe-inline'|'unsafe-eval'/);
    assert.match(firstPolicy, /frame-ancestors 'none'/);
    assert.match(firstPolicy, /object-src 'none'/);
    const headerNonce = /'nonce-([^']+)'/.exec(firstPolicy)?.[1];
    const htmlNonce = /nonce="([^"]+)"/.exec(first.body)?.[1];
    assert.ok(headerNonce && htmlNonce && headerNonce === htmlNonce);
    assert.notEqual(firstPolicy, secondPolicy);
    assert.match(requiredHeader(first, "cache-control"), /no-store/);

    const api = await request("/api/account/session");
    assert.equal(api.status, 401);
    assert.match(requiredHeader(api, "cache-control"), /no-store/);

    const badHost = await request("/", { Host: "evil.example" });
    assert.equal(badHost.status, 421);
    assert.equal(badHost.headers.location, undefined);
    assert.match(requiredHeader(badHost, "cache-control"), /no-store/);

    const badForwarding = await request("/", {
      "X-Forwarded-Host": "evil.example",
    });
    assert.equal(badForwarding.status, 421);

    const prefetchBypass = await request("/api/account/session", {
      Host: "evil.example",
      "Next-Router-Prefetch": "1",
      Purpose: "prefetch",
    });
    assert.equal(prefetchBypass.status, 421);

    const unknownTrip = await request("/trips/not-a-known-demo-trip");
    assert.equal(unknownTrip.status, 404);

    return Object.freeze({
      api: api.status,
      badForwarding: badForwarding.status,
      badHost: badHost.status,
      nonceFresh: true,
      nonceMatched: true,
      port,
      prefetchBypass: prefetchBypass.status,
      root: first.status,
      unknownTrip: unknownTrip.status,
    });
  },
);

const trustedProxyResult = await withApplication(
  {
    mode: "TRUSTED_PROXY",
  },
  async ({ port, request }) => {
    const approved = await request("/", trustedProxyHeaders);
    assert.equal(approved.status, 200);
    assert.equal(
      requiredHeader(approved, "strict-transport-security"),
      "max-age=86400",
    );
    assert.match(
      requiredHeader(approved, "content-security-policy"),
      /upgrade-insecure-requests/,
    );
    assert.equal(approved.headers["x-nitipcuy-edge-proof"], undefined);

    const missingProof = await request("/", {
      "X-Forwarded-Host": "preview.nitipcuy.invalid",
      "X-Forwarded-Proto": "https",
    });
    assert.equal(missingProof.status, 421);

    const wrongHost = await request("/", {
      ...trustedProxyHeaders,
      "X-Forwarded-Host": "evil.example",
    });
    assert.equal(wrongHost.status, 421);
    assert.match(requiredHeader(wrongHost, "cache-control"), /no-store/);

    return Object.freeze({
      edgeProofResponseLeak: false,
      hsts: approved.headers["strict-transport-security"],
      missingProof: missingProof.status,
      port,
      trustedProxy: approved.status,
      wrongForwardedHost: wrongHost.status,
    });
  },
);

console.log(
  JSON.stringify({
    local: localResult,
    trustedProxy: trustedProxyResult,
  }),
);

async function withApplication(options, verify) {
  const port = await availablePort();
  const localOrigin = `http://127.0.0.1:${port}`;
  const trustedProxy = options.mode === "TRUSTED_PROXY";
  const appOrigin = trustedProxy ? trustedProxyOrigin : localOrigin;
  const environment = {
    ...runtimeEnvironmentAllowlist(),
    DATABASE_URL:
      "postgresql://runtime_probe:runtime_probe@127.0.0.1:1/runtime_probe",
    GOOGLE_CLIENT_ID: "runtime-probe-client",
    GOOGLE_CLIENT_SECRET: "runtime-probe-client-secret",
    NITIPCUY_APP_ORIGIN: appOrigin,
    NITIPCUY_EDGE_REQUEST_SECRET: trustedProxy ? edgeProof : "",
    NITIPCUY_PROXY_MODE: options.mode,
    NODE_ENV: "production",
    OAUTH_ATTEMPT_ENCRYPTION_KEY_BASE64: safeKey,
    SESSION_TOKEN_HMAC_KEY_BASE64: safeKey,
  };
  const child = spawn(
    "pnpm",
    [
      "--filter=@nitipcuy/web",
      "exec",
      "next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: repositoryRoot,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  const request = (pathname, headers = {}) =>
    httpRequest(port, pathname, headers);

  try {
    await waitUntilReady(child, request, trustedProxy);
    return await verify({ port, request });
  } catch (error) {
    if (output.trim()) {
      console.error(output.trim());
    }
    throw error;
  } finally {
    await stopChild(child);
  }
}

function httpRequest(port, pathname, headers) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        headers,
        hostname: "127.0.0.1",
        path: pathname,
        port,
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({
            body,
            headers: response.headers,
            status: response.statusCode,
          });
        });
      },
    );
    request.on("error", reject);
    request.end();
  });
}

async function waitUntilReady(child, request, trustedProxy) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Request-perimeter runtime exited with ${child.exitCode}.`,
      );
    }
    try {
      const response = await request(
        "/",
        trustedProxy ? trustedProxyHeaders : {},
      );
      if (response.status !== undefined) {
        return;
      }
    } catch {
      // The listener is not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Request-perimeter runtime did not become ready.");
}

function stopChild(child) {
  if (child.exitCode !== null) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
    }, 2_000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill("SIGTERM");
  });
}

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to reserve a local runtime-probe port."));
        return;
      }
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve(address.port);
        }
      });
    });
  });
}

function requiredHeader(response, name) {
  const value = response.headers[name];
  assert.equal(typeof value, "string", `Missing ${name} header.`);
  return value;
}

function runtimeEnvironmentAllowlist() {
  const environment = {};
  for (const name of [
    "CI",
    "HOME",
    "LANG",
    "LC_ALL",
    "PATH",
    "PNPM_HOME",
    "TMPDIR",
    "XDG_CACHE_HOME",
  ]) {
    const value = process.env[name];
    if (value !== undefined) {
      environment[name] = value;
    }
  }
  return environment;
}
