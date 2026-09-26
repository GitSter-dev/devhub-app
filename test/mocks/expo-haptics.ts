import { vi } from "vitest";

export const ImpactFeedbackStyle = { Light: "light", Medium: "medium", Heavy: "heavy" } as const;
export const NotificationFeedbackType = { Success: "success", Warning: "warning", Error: "error" } as const;
export const impactAsync = vi.fn(async () => undefined);
export const notificationAsync = vi.fn(async () => undefined);
export const selectionAsync = vi.fn(async () => undefined);
