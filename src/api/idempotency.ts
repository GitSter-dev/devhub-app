import { randomUUID } from "expo-crypto";

export const IDEMPOTENCY_HEADER = "Idempotency-Key";

export function newIdempotencyKey(): string {
  return randomUUID();
}

export function idempotencyHeaders(key: string | undefined): Record<string, string> {
  return key ? { [IDEMPOTENCY_HEADER]: key } : {};
}
