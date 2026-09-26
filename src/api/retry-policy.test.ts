import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, fail, ok, server } from "../../test/server";
import { ApiError } from "./api-error";
import { publicClient } from "./http-client";
import { idempotencyHeaders } from "./idempotency";
import { retryAfterSeconds } from "./retry-policy";

function countingHandler(method: "get" | "post", responses: (() => Response)[]): { attempts: () => number } {
  let attempts = 0;
  server.use(
    http[method](`${API}/thing`, () => {
      const next = responses[Math.min(attempts, responses.length - 1)];
      attempts++;
      return next();
    }),
  );
  return { attempts: () => attempts };
}

describe("retry policy", () => {
  it("retries a GET after a server error", async () => {
    const calls = countingHandler("get", [() => fail(503, "INTERNAL_ERROR"), () => ok({ n: 1 })]);

    await expect(publicClient.get("thing").json()).resolves.toMatchObject({ data: { n: 1 } });
    expect(calls.attempts()).toBe(2);
  });

  it("never repeats a POST that carries no idempotency key", async () => {
    const calls = countingHandler("post", [() => fail(503, "INTERNAL_ERROR"), () => ok({})]);

    await expect(publicClient.post("thing").json()).rejects.toBeInstanceOf(ApiError);
    expect(calls.attempts()).toBe(1);
  });

  it("repeats a POST that carries an idempotency key", async () => {
    const calls = countingHandler("post", [() => fail(502, "INTERNAL_ERROR"), () => ok({ saved: true })]);

    await expect(publicClient.post("thing", { headers: idempotencyHeaders("k1") }).json()).resolves.toMatchObject({
      data: { saved: true },
    });
    expect(calls.attempts()).toBe(2);
  });

  it("retries a 409 only while the same idempotent request is still in progress", async () => {
    const inProgress = countingHandler("post", [() => fail(409, "IDEMPOTENCY_IN_PROGRESS"), () => ok({})]);
    await publicClient.post("thing", { headers: idempotencyHeaders("k2") }).json();
    expect(inProgress.attempts()).toBe(2);

    const conflict = countingHandler("post", [() => fail(409, "EMAIL_TAKEN"), () => ok({})]);
    const error = await publicClient.post("thing", { headers: idempotencyHeaders("k3") }).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 409, code: "EMAIL_TAKEN" });
    expect(conflict.attempts()).toBe(1);
  });

  it("waits out a short Retry-After but surfaces a long one to the user", async () => {
    const short = countingHandler("get", [
      () => fail(429, "TOO_MANY_REQUESTS", "slow down", { headers: { "Retry-After": "0" } }),
      () => ok({}),
    ]);
    await publicClient.get("thing").json();
    expect(short.attempts()).toBe(2);

    const long = countingHandler("get", [
      () => fail(429, "TOO_MANY_REQUESTS", "slow down", { headers: { "Retry-After": "120" } }),
    ]);
    const error = await publicClient.get("thing").catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 429, code: "TOO_MANY_REQUESTS", retryAfterSeconds: 120 });
    expect(long.attempts()).toBe(1);
  });

  it("does not retry client errors", async () => {
    const calls = countingHandler("get", [() => fail(404, "NOT_FOUND")]);

    await expect(publicClient.get("thing").json()).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(calls.attempts()).toBe(1);
  });
});

describe("retryAfterSeconds", () => {
  it("reads a numeric Retry-After header", () => {
    expect(retryAfterSeconds(new Response(null, { headers: { "Retry-After": "7" } }))).toBe(7);
  });

  it("ignores a missing or non-numeric header", () => {
    expect(retryAfterSeconds(new Response(null))).toBeNull();
    expect(retryAfterSeconds(new Response(null, { headers: { "Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT" } }))).toBeNull();
  });
});

describe("error mapping", () => {
  it("maps an error envelope to its code, message and field errors", async () => {
    server.use(
      http.post(`${API}/thing`, () =>
        fail(400, "VALIDATION_FAILED", "Check the form", { fieldErrors: { email: "must be valid" } }),
      ),
    );

    const error = await publicClient.post("thing").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_FAILED",
      message: "Check the form",
      fieldErrors: { email: "must be valid" },
    });
  });

  it("maps a body that is not an envelope to UNEXPECTED with its status", async () => {
    server.use(http.get(`${API}/thing`, () => new HttpResponse("<html>bad gateway</html>", { status: 418 })));

    await expect(publicClient.get("thing")).rejects.toMatchObject({ status: 418, code: "UNEXPECTED" });
  });

  it("maps an unreachable server to NETWORK_ERROR", async () => {
    server.use(http.get(`${API}/thing`, () => HttpResponse.error()));

    await expect(publicClient.extend({ retry: 0 }).get("thing")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });

  it("maps a request that outlives its timeout to TIMEOUT", async () => {
    server.use(http.get(`${API}/thing`, () => new Promise<Response>(() => {})));

    await expect(publicClient.extend({ retry: 0, timeout: 50 }).get("thing")).rejects.toMatchObject({
      code: "TIMEOUT",
    });
  });
});
