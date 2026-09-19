const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

export function reconnectDelay(attempt: number): number {
  const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1));
  return Math.random() * ceiling;
}
