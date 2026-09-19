import ky, { isHTTPError, isNetworkError, isTimeoutError, type KyInstance, type ResponsePromise } from "ky";

import { env } from "@/config/env";

import { ApiError } from "./api-error";
import { isErrorEnvelope, type ApiEnvelope } from "./envelope";
import { platformFetch } from "./platform-fetch";
import { retryPolicy, retryAfterSeconds } from "./retry-policy";

const REQUEST_TIMEOUT_MS = 15_000;
const REPLAYED_AFTER_REFRESH = "X-Replayed-After-Refresh";

function toApiError(error: Error): Error {
  if (isTimeoutError(error)) return ApiError.timeout();
  if (isNetworkError(error)) return ApiError.network();
  if (!isHTTPError(error)) return error;

  const { status } = error.response;
  if (!isErrorEnvelope(error.data)) return ApiError.unexpected(status);

  const { code, message, fieldErrors } = error.data.error;
  return new ApiError(status, code, message, fieldErrors ?? {}, retryAfterSeconds(error.response));
}

export const publicClient: KyInstance = ky.create({
  baseUrl: env.apiUrl,
  fetch: platformFetch,
  timeout: REQUEST_TIMEOUT_MS,
  retry: retryPolicy,
  hooks: {
    beforeError: [({ error }) => toApiError(error)],
  },
});

export type AccessTokenSource = {
  currentAccessToken(): Promise<string | null>;
  refreshedAccessToken(): Promise<string | null>;
  reportConnectivity(online: boolean): void;
};

function withBearer(request: Request, token: string): void {
  request.headers.set("Authorization", `Bearer ${token}`);
}

export function createAuthedClient(source: AccessTokenSource): KyInstance {
  return publicClient.extend({
    hooks: {
      beforeRequest: [
        async ({ request }) => {
          const token = await source.currentAccessToken();
          if (token) withBearer(request, token);
        },
      ],
      afterResponse: [
        async ({ request, response }) => {
          source.reportConnectivity(true);
          if (response.status !== 401 || request.headers.has(REPLAYED_AFTER_REFRESH)) return;

          const token = await source.refreshedAccessToken();
          if (!token) return;

          const headers = new Headers(request.headers);
          headers.set("Authorization", `Bearer ${token}`);
          headers.set(REPLAYED_AFTER_REFRESH, "1");
          return ky.retry({ request: new Request(request, { headers }), code: "TOKEN_REFRESHED" });
        },
      ],
      beforeError: [
        ({ error }) => {
          if (isNetworkError(error) || isTimeoutError(error)) source.reportConnectivity(false);
          return error;
        },
      ],
    },
  });
}

export async function unwrap<T>(response: ResponsePromise): Promise<T> {
  const envelope = await response.json<ApiEnvelope<T>>();
  return envelope.data as T;
}
