export type ServerErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "CONFLICT"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  | "EMAIL_TAKEN"
  | "USERNAME_TAKEN"
  | "INVALID_VERIFICATION_CODE"
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_REFRESH_TOKEN"
  | "INVALID_RESET_CODE"
  | "SESSION_REPLACED"
  | "IDEMPOTENCY_IN_PROGRESS"
  | "IDEMPOTENCY_KEY_REUSED"
  | "SESSION_ENDED"
  | "CANNOT_FOLLOW_SELF"
  | "TOPICS_REQUIRED"
  | "USERNAME_CHANGE_TOO_SOON"
  | "GROUP_TOO_LARGE"
  | "NOT_GROUP_OWNER"
  | "CANNOT_MESSAGE_YOURSELF"
  | "CONVERSATION_REQUEST_PENDING"
  | "CANNOT_BLOCK_SELF"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_BANNED"
  | "ACCOUNT_DEACTIVATED";

export type ClientErrorCode = "NETWORK_ERROR" | "TIMEOUT" | "UNEXPECTED";

export type ErrorCode = ServerErrorCode | ClientErrorCode;

export type ApiErrorBody = {
  code: ServerErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
  timestamp: string;
};

export function isErrorEnvelope(value: unknown): value is ApiEnvelope<never> & { error: ApiErrorBody } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: { code?: unknown } }).error?.code === "string"
  );
}
