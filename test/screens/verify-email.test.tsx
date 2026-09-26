import { act, screen, waitFor } from "@testing-library/react";
import { router } from "expo-router";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pendingCredentials } from "@/session/pending-credentials";
import { sessionManager } from "@/session/session-manager";
import VerifyEmailScreen from "@/app/(auth)/verify-email";

import { setSearchParams } from "../mocks/expo-router";
import { renderScreen } from "../render";
import { API, fail, ok, server } from "../server";
import { tokenPair } from "../tokens";

function codeBox() {
  return screen.getByRole("textbox", { name: "Verification code" });
}

describe("Verify email screen", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    setSearchParams({ email: "ada@devhub.dev" });
  });

  afterEach(async () => {
    pendingCredentials.forget();
    await sessionManager.signOut();
  });

  it("verifies as soon as six digits are in and signs the new user straight in", async () => {
    const verified: unknown[] = [];
    server.use(
      http.post(`${API}/auth/verify-email`, async ({ request }) => {
        verified.push(await request.json());
        return ok(null);
      }),
      http.post(`${API}/auth/login`, () => ok(tokenPair("new"))),
    );
    pendingCredentials.remember({ identifier: "ada@devhub.dev", password: "supersecret1" });
    const { user } = renderScreen(<VerifyEmailScreen />);

    await user.type(codeBox(), "123456");

    await waitFor(() => expect(sessionManager.store.get()).toEqual({ status: "signedIn", online: true }));
    expect(verified).toEqual([{ email: "ada@devhub.dev", code: "123456" }]);
  });

  it("sends the user to sign in when there are no credentials to reuse", async () => {
    server.use(http.post(`${API}/auth/verify-email`, () => ok(null)));
    const { user } = renderScreen(<VerifyEmailScreen />);

    await user.type(codeBox(), "123456");

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/log-in"));
  });

  it("clears a wrong code and says why", async () => {
    server.use(http.post(`${API}/auth/verify-email`, () => fail(400, "INVALID_VERIFICATION_CODE", "That code isn't right")));
    const { user } = renderScreen(<VerifyEmailScreen />);

    await user.type(codeBox(), "999999");

    expect((await screen.findByRole("alert")).textContent).toContain("That code isn't right");
    await waitFor(() => expect(codeBox()).toHaveProperty("value", ""));
  });

  it("asks for the email when it was not passed along", async () => {
    setSearchParams({});
    renderScreen(<VerifyEmailScreen />);

    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByText("Enter your email and the 6-digit code we sent you.")).toBeTruthy();
  });

  it("makes the user wait a minute between resends", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const resent: unknown[] = [];
    server.use(
      http.post(`${API}/auth/resend-verification`, async ({ request }) => {
        resent.push(await request.json());
        return ok(null);
      }),
    );
    const { user } = renderScreen(<VerifyEmailScreen />);
    act(() => vi.advanceTimersByTime(60_000));

    await user.click(await screen.findByRole("link", { name: "Resend code" }));

    expect(await screen.findByText(/a fresh code is on its way/)).toBeTruthy();
    expect(screen.getByText(/Resend in \d+s/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Resend code" })).toBeNull();
    await waitFor(() => expect(resent).toEqual([{ email: "ada@devhub.dev" }]));
    vi.useRealTimers();
  });
});
