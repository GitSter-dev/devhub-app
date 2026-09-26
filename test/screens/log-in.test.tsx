import { screen, waitFor } from "@testing-library/react";
import { router } from "expo-router";
import { http } from "msw";
import { Alert } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/api/query-client";
import { lastUserStore } from "@/session/last-user-store";
import { pendingCredentials } from "@/session/pending-credentials";
import { sessionManager } from "@/session/session-manager";
import LogInScreen from "@/app/(auth)/log-in";

import { renderScreen } from "../render";
import { API, fail, ok, server } from "../server";
import { tokenPair } from "../tokens";

type Button = { text: string; onPress?: () => void };

function loginEndpoint(respond: () => Response): unknown[] {
  const bodies: unknown[] = [];
  server.use(
    http.post(`${API}/auth/login`, async ({ request }) => {
      bodies.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") });
      return respond();
    }),
  );
  return bodies;
}

async function signInWith(user: ReturnType<typeof renderScreen>["user"], identifier: string, password = "supersecret1") {
  await user.type(screen.getByLabelText("Email or username"), identifier);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("Log in screen", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await sessionManager.signOut();
    pendingCredentials.forget();
    queryClient.clear();
  });

  it("signs in with valid credentials and an idempotency key", async () => {
    const requests = loginEndpoint(() => ok(tokenPair("a")));
    const { user } = renderScreen(<LogInScreen />);

    await signInWith(user, "  ada  ");

    await waitFor(() => expect(sessionManager.store.get()).toEqual({ status: "signedIn", online: true }));
    expect(requests).toEqual([{ body: { identifier: "ada", password: "supersecret1" }, key: expect.stringMatching(/^[0-9a-f-]{36}$/) }]);
  });

  it("validates before calling the server", async () => {
    const requests = loginEndpoint(() => ok(tokenPair("a")));
    const { user } = renderScreen(<LogInScreen />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter your email or username")).toBeTruthy();
    expect(screen.getByText("Enter your password")).toBeTruthy();
    expect(requests).toEqual([]);
  });

  it("shows the server's reason when sign-in fails", async () => {
    loginEndpoint(() => fail(401, "INVALID_CREDENTIALS", "Invalid username, email or password"));
    const { user } = renderScreen(<LogInScreen />);

    await signInWith(user, "ada", "wrongpass");

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Invalid username, email or password"));
    expect(sessionManager.store.get()).not.toMatchObject({ status: "signedIn" });
  });

  it("counts down a rate limit before the user tries again", async () => {
    loginEndpoint(() => fail(429, "TOO_MANY_REQUESTS", "Too many attempts", { headers: { "Retry-After": "90" } }));
    const { user } = renderScreen(<LogInScreen />);

    await signInWith(user, "ada");

    expect(await screen.findByText(/Try again in 9\ds/)).toBeTruthy();
  });

  it("sends an unverified user to verify, resending the code to an email address", async () => {
    loginEndpoint(() => fail(403, "EMAIL_NOT_VERIFIED"));
    const resent: unknown[] = [];
    server.use(
      http.post(`${API}/auth/resend-verification`, async ({ request }) => {
        resent.push(await request.json());
        return ok(null);
      }),
    );
    const { user } = renderScreen(<LogInScreen />);

    await signInWith(user, "ada@devhub.dev");

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({ pathname: "/verify-email", params: { email: "ada@devhub.dev" } }),
    );
    expect(pendingCredentials.take()).toEqual({ identifier: "ada@devhub.dev", password: "supersecret1" });
    await waitFor(() => expect(resent).toEqual([{ email: "ada@devhub.dev" }]));
  });

  it("offers to restore an account that is scheduled for deletion", async () => {
    loginEndpoint(() => fail(403, "ACCOUNT_DEACTIVATED"));
    const restored: unknown[] = [];
    server.use(
      http.post(`${API}/auth/restore`, async ({ request }) => {
        restored.push(await request.json());
        return ok(tokenPair("restored"));
      }),
    );
    const { user } = renderScreen(<LogInScreen />);

    await signInWith(user, "ada");
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    const buttons = vi.mocked(Alert.alert).mock.calls[0][2] as Button[];
    buttons.find((button) => button.text === "Restore")?.onPress?.();

    await waitFor(() => expect(sessionManager.store.get()).toEqual({ status: "signedIn", online: true }));
    expect(restored).toHaveLength(1);
  });

  it("welcomes back the last user after their session ended, and lets them switch account", async () => {
    await sessionManager.startSession(tokenPair("a"));
    await sessionManager.endSessionFromServer("expired");
    lastUserStore.write({ id: "u1", username: "ada", displayName: "Ada" });
    const { user } = renderScreen(<LogInScreen />);

    expect(screen.getByText("Welcome back, Ada")).toBeTruthy();
    expect(screen.getByLabelText("Email or username")).toHaveProperty("value", "ada");

    await user.click(screen.getByRole("link", { name: "Not @ada? Use another account" }));

    await waitFor(() => expect(screen.getByLabelText("Email or username")).toHaveProperty("value", ""));
    expect(lastUserStore.read()).toBeNull();
    expect(sessionManager.store.get()).toEqual({ status: "signedOut" });
  });

  it("carries a typed email over to password recovery", async () => {
    const { user } = renderScreen(<LogInScreen />);

    await user.type(screen.getByLabelText("Email or username"), "ada@devhub.dev");
    await user.click(screen.getByRole("link", { name: "Forgot password?" }));

    expect(router.push).toHaveBeenCalledWith({ pathname: "/forgot-password", params: { email: "ada@devhub.dev" } });
  });
});
