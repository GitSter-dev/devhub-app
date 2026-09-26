import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Storage } from "expo-sqlite/kv-store";
import { http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/api/query-client";
import { useSetupStatus } from "@/setup/setup-status";

import { API, fail, ok, server } from "../../test/server";
import { signIn } from "../../test/signed-in";
import { lastUserStore } from "./last-user-store";
import { sessionManager } from "./session-manager";
import { useCurrentUser } from "./use-session";

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const me = { id: "me", username: "me", displayName: "Me", email: "me@devhub.dev", role: "USER", setupCompleted: false };

describe("current user", () => {
  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    await signIn();
  });

  it("remembers who is signed in for the next welcome-back screen", async () => {
    server.use(http.get(`${API}/users/me`, () => ok(me)));

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(me));
    expect(lastUserStore.read()).toEqual({ id: "me", username: "me", displayName: "Me" });
  });

  it("signs out when the account no longer exists", async () => {
    lastUserStore.write({ id: "me", username: "me", displayName: "Me" });
    server.use(http.get(`${API}/users/me`, () => fail(404, "NOT_FOUND")));

    renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(sessionManager.store.get()).toEqual({ status: "signedOut" }));
    expect(lastUserStore.read()).toBeNull();
  });
});

describe("setup status", () => {
  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    await signIn();
  });

  it("sends a new account through setup", async () => {
    server.use(http.get(`${API}/users/me`, () => ok(me)));

    const { result } = renderHook(() => useSetupStatus(), { wrapper });

    await waitFor(() => expect(result.current).toBe("pending"));
  });

  it("remembers a finished setup so the next cold start skips it", async () => {
    server.use(http.get(`${API}/users/me`, () => ok({ ...me, setupCompleted: true })));

    const { result } = renderHook(() => useSetupStatus(), { wrapper });

    await waitFor(() => expect(result.current).toBe("completed"));
    expect(Storage.getItemSync("devhub.setup.completed")).toBe("true");
  });

  it("forgets it on sign-out", async () => {
    server.use(http.get(`${API}/users/me`, () => ok({ ...me, setupCompleted: true })));
    renderHook(() => useSetupStatus(), { wrapper });
    await waitFor(() => expect(Storage.getItemSync("devhub.setup.completed")).toBe("true"));

    await sessionManager.signOut();

    await waitFor(() => expect(Storage.getItemSync("devhub.setup.completed")).toBeNull());
  });
});
