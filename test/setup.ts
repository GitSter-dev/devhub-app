import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { resetKeyValueStore } from "./mocks/expo-sqlite-kv-store";
import { resetSecureStore } from "./mocks/expo-secure-store";
import { resetRouter } from "./mocks/expo-router";
import { server } from "./server";

if (typeof window !== "undefined") {
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (typeof window !== "undefined") {
  const { cleanup, configure } = await import("@testing-library/react");
  configure({ asyncUtilTimeout: 3_000 });
  const { queryClient } = await import("@/api/query-client");
  beforeEach(() => queryClient.clear());
  afterEach(cleanup);
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => {
  resetKeyValueStore();
  resetSecureStore();
  resetRouter();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
