import { vi } from "vitest";

export const openBrowserAsync = vi.fn(async () => ({ type: "opened" }));
