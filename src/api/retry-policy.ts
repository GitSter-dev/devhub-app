import { isHTTPError, isNetworkError, isTimeoutError, type RetryOptions } from "ky";

import { isErrorEnvelope } from "./envelope";
import { IDEMPOTENCY_HEADER } from "./idempotency";

const BASE_DELAY_MS = 300;
const MAX_DELAY_MS = 8_000;
const MAX_AUTOMATIC_WAIT_SECONDS = 5;

function requestOf(error: Error): Request | undefined {
  if (isHTTPError(error) || isNetworkError(error) || isTimeoutError(error)) {
    return error.request;
  }
  return undefined;
}

function isUnsafeToRepeat(request: Request | undefined): boolean {
  if (!request) return true;
  return request.method.toUpperCase() === "POST" && !request.headers.has(IDEMPOTENCY_HEADER);
}

function retryAfterSeconds(response: Response): number | null {
  const header = response.headers.get("Retry-After");
  const seconds = header == null ? NaN : Number(header);
  return Number.isFinite(seconds) ? seconds : null;
}

export const retryPolicy: RetryOptions = {
  limit: 4,
  methods: ["get", "put", "delete", "head", "options", "post"],
  statusCodes: [408, 409, 429, 500, 502, 503, 504],
  afterStatusCodes: [429, 503],
  maxRetryAfter: MAX_AUTOMATIC_WAIT_SECONDS * 1000,
  delay: (attempt) => BASE_DELAY_MS * 2 ** (attempt - 1),
  backoffLimit: MAX_DELAY_MS,
  jitter: true,
  retryOnTimeout: true,
  shouldRetry: ({ error }) => {
    if (isUnsafeToRepeat(requestOf(error))) return false;
    if (!isHTTPError(error)) return undefined;

    const { status } = error.response;
    if (status === 409) {
      return isErrorEnvelope(error.data) && error.data.error.code === "IDEMPOTENCY_IN_PROGRESS";
    }
    if (status === 429) {
      const wait = retryAfterSeconds(error.response);
      return wait != null && wait <= MAX_AUTOMATIC_WAIT_SECONDS;
    }
    return undefined;
  },
};

export { retryAfterSeconds };
