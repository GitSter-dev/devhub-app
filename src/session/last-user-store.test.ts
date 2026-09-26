import { Storage } from "expo-sqlite/kv-store";
import { describe, expect, it } from "vitest";

import { lastUserStore } from "./last-user-store";
import { pendingCredentials } from "./pending-credentials";
import { sessionMarker } from "./session-marker";

describe("last user store", () => {
  it("remembers only who signed in last, not anything else it was given", () => {
    lastUserStore.write({ id: "u1", username: "ada", displayName: "Ada", email: "ada@devhub.dev" } as never);

    expect(lastUserStore.read()).toEqual({ id: "u1", username: "ada", displayName: "Ada" });
    expect(Storage.getItemSync("devhub.session.lastUser")).not.toContain("email");
  });

  it("ignores corrupt or unexpected stored values", () => {
    Storage.setItemSync("devhub.session.lastUser", "{not json");
    expect(lastUserStore.read()).toBeNull();

    Storage.setItemSync("devhub.session.lastUser", JSON.stringify({ username: 42 }));
    expect(lastUserStore.read()).toBeNull();
  });

  it("forgets on clear", () => {
    lastUserStore.write({ username: "ada", displayName: "Ada" });
    lastUserStore.clear();

    expect(lastUserStore.read()).toBeNull();
  });
});

describe("pending credentials", () => {
  it("hands credentials over exactly once", () => {
    pendingCredentials.remember({ identifier: "ada", password: "pw" });

    expect(pendingCredentials.take()).toEqual({ identifier: "ada", password: "pw" });
    expect(pendingCredentials.take()).toBeNull();
  });

  it("can be forgotten before anyone takes them", () => {
    pendingCredentials.remember({ identifier: "ada", password: "pw" });
    pendingCredentials.forget();

    expect(pendingCredentials.take()).toBeNull();
  });
});

describe("session marker", () => {
  it("records whether a session is expected on this device", () => {
    expect(sessionMarker.isPresent()).toBe(false);
    sessionMarker.set();
    expect(sessionMarker.isPresent()).toBe(true);
    sessionMarker.clear();
    expect(sessionMarker.isPresent()).toBe(false);
  });
});
