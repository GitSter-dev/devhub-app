import { http } from "msw";
import { Alert } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/api/query-client";
import { followSync } from "@/features/follows/follow-sync";

import { API, fail, ok, server } from "../../test/server";
import { signIn } from "../../test/signed-in";
import { confirmBlock, unblock } from "./block-actions";

type Button = { text: string; onPress?: () => void };

function pressAlertButton(label: string): void {
  const buttons = vi.mocked(Alert.alert).mock.calls.at(-1)?.[2] as Button[];
  buttons.find((button) => button.text === label)?.onPress?.();
}

describe("block actions", () => {
  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await signIn();
  });

  afterEach(() => {
    followSync.reset();
    queryClient.clear();
  });

  it("asks before blocking and does nothing on cancel", () => {
    const blocked = vi.fn();
    server.use(http.put(`${API}/users/me/blocks/:id`, () => ok(null)));

    confirmBlock("u1", "ada", blocked);
    pressAlertButton("Cancel");

    expect(Alert.alert).toHaveBeenCalledWith("Block @ada?", expect.stringContaining("stop following"), expect.any(Array));
    expect(blocked).not.toHaveBeenCalled();
  });

  it("blocks on confirmation, drops the follow and refreshes everything", async () => {
    const requests: string[] = [];
    server.use(
      http.put(`${API}/users/me/blocks/:id`, ({ params }) => {
        requests.push(String(params.id));
        return ok(null);
      }),
    );
    followSync.seed("u1", true);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const blocked = vi.fn();

    confirmBlock("u1", "ada", blocked);
    pressAlertButton("Block");

    await vi.waitFor(() => expect(blocked).toHaveBeenCalled());
    expect(requests).toEqual(["u1"]);
    expect(followSync.store.get().has("u1")).toBe(false);
    expect(invalidate).toHaveBeenCalled();
  });

  it("tells the user when the block did not go through", async () => {
    server.use(http.put(`${API}/users/me/blocks/:id`, () => fail(400, "CANNOT_BLOCK_SELF", "You can't block yourself")));

    confirmBlock("me", "me");
    pressAlertButton("Block");

    await vi.waitFor(() => expect(Alert.alert).toHaveBeenLastCalledWith("Couldn't block", "You can't block yourself"));
  });

  it("unblocks and refreshes", async () => {
    server.use(http.delete(`${API}/users/me/blocks/:id`, () => ok(null)));
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await unblock("u1");

    expect(invalidate).toHaveBeenCalled();
  });
});
