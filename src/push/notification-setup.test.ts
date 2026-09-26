import * as Notifications from "expo-notifications";
import { afterEach, describe, expect, it, vi } from "vitest";

import { openConversation } from "@/chat/open-conversation";

import { presentNotificationsInForeground } from "./notification-setup";

type Handler = { handleNotification: (notification: unknown) => Promise<{ shouldShowBanner: boolean }> };

function installedHandler(): Handler {
  presentNotificationsInForeground();
  return vi.mocked(Notifications.setNotificationHandler).mock.calls.at(-1)?.[0] as unknown as Handler;
}

function notification(data: Record<string, string>) {
  return { request: { content: { data } } };
}

describe("foreground notifications", () => {
  afterEach(() => openConversation.set(null));

  it("does not show a banner for the chat that is already open", async () => {
    openConversation.set("c1");

    const shown = await installedHandler().handleNotification(notification({ kind: "chat", conversationId: "c1" }));

    expect(shown.shouldShowBanner).toBe(false);
  });

  it("shows banners for other chats and other kinds of activity", async () => {
    openConversation.set("c1");
    const handler = installedHandler();

    expect((await handler.handleNotification(notification({ kind: "chat", conversationId: "c2" }))).shouldShowBanner).toBe(true);
    expect((await handler.handleNotification(notification({ kind: "activity" }))).shouldShowBanner).toBe(true);
  });
});
