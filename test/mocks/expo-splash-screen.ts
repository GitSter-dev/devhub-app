import { vi } from "vitest";

export const preventAutoHideAsync = vi.fn(async () => true);
export const hideAsync = vi.fn(async () => true);
