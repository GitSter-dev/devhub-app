import { useRef } from "react";

import { newIdempotencyKey } from "@/api/idempotency";

type Entry = { fingerprint: string; key: string };

export function useIdempotencyKey(): { keyFor: (payload: unknown) => string; rotate: () => void } {
  const last = useRef<Entry | null>(null);

  return {
    keyFor(payload) {
      const fingerprint = JSON.stringify(payload);
      if (last.current?.fingerprint !== fingerprint) {
        last.current = { fingerprint, key: newIdempotencyKey() };
      }
      return last.current.key;
    },
    rotate() {
      last.current = null;
    },
  };
}
