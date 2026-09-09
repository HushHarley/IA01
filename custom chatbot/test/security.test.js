import test from "node:test";
import assert from "node:assert/strict";
import { chatRateLimiter } from "../src/middleware/rateLimiter.js";
import { requireSameOrigin } from "../src/middleware/security.js";

test("rate limiter blocks requests above its per-IP window", () => {
  const request = { ip: "audit-test-client" };
  let nextCalls = 0;
  let statusCode;
  let responseBody;
  const headers = new Map();
  const response = {
    setHeader(name, value) { headers.set(name, value); },
    status(code) { statusCode = code; return this; },
    json(body) { responseBody = body; return this; }
  };

  for (let requestNumber = 1; requestNumber <= 31; requestNumber += 1) {
    chatRateLimiter(request, response, () => { nextCalls += 1; });
  }

  assert.equal(nextCalls, 30);
  assert.equal(statusCode, 429);
  assert.equal(responseBody.error, "RATE_LIMITED");
  assert.ok(Number(headers.get("Retry-After")) > 0);
});

test("same-origin protection accepts the public HTTPS host from a trusted proxy", () => {
  let nextCalls = 0;
  const request = {
    protocol: "https",
    hostname: "nexus-test.up.railway.app",
    app: { get: (name) => name === "trust proxy" ? 1 : undefined },
    get: (name) => ({
      origin: "https://nexus-test.up.railway.app",
      host: "internal-service:38127"
    })[name]
  };
  const response = {
    status() { throw new Error("A valid Railway origin must not be rejected."); },
    json() {}
  };

  requireSameOrigin(request, response, () => { nextCalls += 1; });
  assert.equal(nextCalls, 1);
});

test("same-origin protection still rejects a foreign origin behind a trusted proxy", () => {
  let statusCode;
  let responseBody;
  const request = {
    protocol: "https",
    hostname: "nexus-test.up.railway.app",
    app: { get: (name) => name === "trust proxy" ? 1 : undefined },
    get: (name) => ({
      origin: "https://malicious.example",
      host: "internal-service:38127"
    })[name]
  };
  const response = {
    status(code) { statusCode = code; return this; },
    json(body) { responseBody = body; return this; }
  };

  requireSameOrigin(request, response, () => {
    throw new Error("A foreign origin must not pass.");
  });
  assert.equal(statusCode, 403);
  assert.equal(responseBody.error, "CROSS_ORIGIN_BLOCKED");
});
