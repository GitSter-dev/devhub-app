import type { ErrorCode } from "./envelope";

const clientMessages = {
  NETWORK_ERROR: "You're offline or the server can't be reached. Check your connection and try again.",
  TIMEOUT: "The server took too long to answer. Try again in a moment.",
  UNEXPECTED: "Something went wrong on our side. Try again in a moment.",
} as const;

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fieldErrors: Record<string, string>;
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    fieldErrors: Record<string, string> = {},
    retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  static network(): ApiError {
    return new ApiError(0, "NETWORK_ERROR", clientMessages.NETWORK_ERROR);
  }

  static timeout(): ApiError {
    return new ApiError(0, "TIMEOUT", clientMessages.TIMEOUT);
  }

  static unexpected(status: number): ApiError {
    return new ApiError(status, "UNEXPECTED", clientMessages.UNEXPECTED);
  }

  get isConnectivity(): boolean {
    return this.code === "NETWORK_ERROR" || this.code === "TIMEOUT";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function toApiError(error: unknown): ApiError {
  return isApiError(error) ? error : ApiError.unexpected(0);
}
