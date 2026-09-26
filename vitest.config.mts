import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const mock = (name: string): string => fileURLToPath(new URL(`./test/mocks/${name}`, import.meta.url));

const nativeModules: Record<string, string> = {
  "expo-sqlite/kv-store": mock("expo-sqlite-kv-store.ts"),
  "expo-sqlite": mock("expo-sqlite.ts"),
  "expo-secure-store": mock("expo-secure-store.ts"),
  "expo-crypto": mock("expo-crypto.ts"),
  "expo-router": mock("expo-router.tsx"),
  "expo-notifications": mock("expo-notifications.ts"),
  "expo-network": mock("expo-network.ts"),
  "expo-haptics": mock("expo-haptics.ts"),
  "expo-clipboard": mock("expo-clipboard.ts"),
  "expo-constants": mock("expo-constants.ts"),
  "expo-device": mock("expo-device.ts"),
  "expo-application": mock("expo-application.ts"),
  "expo-system-ui": mock("expo-system-ui.ts"),
  "expo-status-bar": mock("expo-status-bar.tsx"),
  "expo-splash-screen": mock("expo-splash-screen.ts"),
  "expo-font": mock("expo-font.ts"),
  "expo-web-browser": mock("expo-web-browser.ts"),
  "expo-symbols": mock("expo-symbols.tsx"),
  "react-native-reanimated": mock("react-native-reanimated.tsx"),
  "react-native-gesture-handler/ReanimatedSwipeable": mock("reanimated-swipeable.tsx"),
  "react-native-gesture-handler": mock("react-native-gesture-handler.tsx"),
  "react-native-safe-area-context": mock("react-native-safe-area-context.tsx"),
};

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: [
      ...Object.entries(nativeModules).map(([find, replacement]) => ({
        find: new RegExp(`^${find.replaceAll("/", "\\/")}$`),
        replacement,
      })),
      { find: /^react-native$/, replacement: "react-native-web" },
    ],
    extensions: [".native.tsx", ".native.ts", ".tsx", ".ts", ".mjs", ".js", ".jsx", ".json"],
  },
  define: {
    __DEV__: "true",
  },
  test: {
    setupFiles: ["./test/setup.ts"],
    restoreMocks: true,
    env: { EXPO_PUBLIC_API_URL: "http://api.test" },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.web.{ts,tsx}", "src/theme/**", "src/app/design-system.tsx"],
    },
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["src/**/*.test.ts"], environment: "node" },
      },
      {
        extends: true,
        test: { name: "integration", include: ["src/**/*.test.tsx", "test/screens/**/*.test.tsx"], environment: "jsdom", testTimeout: 15_000 },
      },
    ],
  },
});
