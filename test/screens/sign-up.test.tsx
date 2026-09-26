import { screen, waitFor } from "@testing-library/react";
import { router } from "expo-router";
import { http } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { pendingCredentials } from "@/session/pending-credentials";
import SignUpScreen from "@/app/(auth)/sign-up";

import { renderScreen } from "../render";
import { API, fail, ok, server } from "../server";

function signupEndpoint(respond: () => Response): unknown[] {
  const bodies: unknown[] = [];
  server.use(
    http.post(`${API}/auth/signup`, async ({ request }) => {
      bodies.push(await request.json());
      return respond();
    }),
  );
  return bodies;
}

async function fillIn(user: ReturnType<typeof renderScreen>["user"]) {
  await user.type(screen.getByLabelText("Username"), "ada_dev");
  await user.type(screen.getByLabelText("Display name"), "Ada Lovelace");
  await user.type(screen.getByLabelText("Email"), "Ada@DevHub.dev");
  await user.type(screen.getByLabelText("Password"), "supersecret1");
  await user.click(screen.getByRole("button", { name: "Create account" }));
}

describe("Sign up screen", () => {
  afterEach(() => pendingCredentials.forget());

  it("creates the account and moves on to email verification", async () => {
    const bodies = signupEndpoint(() => ok({ id: "u1", username: "ada_dev" }, 201));
    const { user } = renderScreen(<SignUpScreen />);

    await fillIn(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({ pathname: "/verify-email", params: { email: "ada@devhub.dev" } }),
    );
    expect(bodies).toEqual([
      { username: "ada_dev", displayName: "Ada Lovelace", email: "ada@devhub.dev", password: "supersecret1" },
    ]);
    expect(pendingCredentials.take()).toEqual({ identifier: "ada@devhub.dev", password: "supersecret1" });
  });

  it("flags every invalid field without calling the server", async () => {
    const bodies = signupEndpoint(() => ok({}));
    const { user } = renderScreen(<SignUpScreen />);

    await user.type(screen.getByLabelText("Username"), "a!");
    await user.type(screen.getByLabelText("Email"), "nope");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Use at least 3 characters")).toBeTruthy();
    expect(screen.getByText("Tell people what to call you")).toBeTruthy();
    expect(screen.getByText("Enter a valid email address")).toBeTruthy();
    expect(screen.getByText("Use at least 8 characters")).toBeTruthy();
    expect(bodies).toEqual([]);
  });

  it("puts a taken email on the email field rather than in a banner", async () => {
    signupEndpoint(() => fail(409, "EMAIL_TAKEN", "That email is already registered"));
    const { user } = renderScreen(<SignUpScreen />);

    await fillIn(user);

    expect(await screen.findByText("That email is already registered")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("puts a taken username on the username field", async () => {
    signupEndpoint(() => fail(409, "USERNAME_TAKEN", "That username is taken"));
    const { user } = renderScreen(<SignUpScreen />);

    await fillIn(user);

    expect(await screen.findByText("That username is taken")).toBeTruthy();
  });

  it("shows other failures in a banner", async () => {
    signupEndpoint(() => fail(400, "BAD_REQUEST", "Something about that request was off"));
    const { user } = renderScreen(<SignUpScreen />);

    await fillIn(user);

    expect((await screen.findByRole("alert")).textContent).toContain("Something about that request was off");
  });
});
