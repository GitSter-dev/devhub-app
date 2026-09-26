import { useEffect, type ReactNode } from "react";
import { vi } from "vitest";

type Params = Record<string, string | string[] | undefined>;

let params: Params = {};

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  navigate: vi.fn(),
  back: vi.fn(),
  dismiss: vi.fn(),
  dismissAll: vi.fn(),
  canGoBack: vi.fn(() => true),
  setParams: vi.fn(),
};

export function setSearchParams(next: Params): void {
  params = next;
}

export function resetRouter(): void {
  params = {};
  Object.values(router).forEach((fn) => fn.mockReset());
  router.canGoBack.mockReturnValue(true);
}

export function useRouter(): typeof router {
  return router;
}

export function useLocalSearchParams<T extends Params = Params>(): T {
  return params as T;
}

export function useGlobalSearchParams<T extends Params = Params>(): T {
  return params as T;
}

export function useFocusEffect(effect: () => void | (() => void)): void {
  useEffect(effect, [effect]);
}

export function useScrollToTop(): void {}

export function usePathname(): string {
  return "/";
}

function Passthrough({ children }: { children?: ReactNode }): ReactNode {
  return children ?? null;
}

function Nothing(): null {
  return null;
}

export const Stack = Object.assign(Passthrough, { Screen: Nothing, Protected: Passthrough });
export const Tabs = Object.assign(Passthrough, { Screen: Nothing, Protected: Passthrough });
export const ThemeProvider = Passthrough;
export const Link = Passthrough;
export const Redirect = Nothing;

const colors = {
  primary: "#10b981",
  background: "#ffffff",
  card: "#ffffff",
  text: "#000000",
  border: "#dddddd",
  notification: "#ff0000",
};
const fonts = {
  regular: { fontFamily: "System", fontWeight: "400" },
  medium: { fontFamily: "System", fontWeight: "500" },
  bold: { fontFamily: "System", fontWeight: "700" },
  heavy: { fontFamily: "System", fontWeight: "800" },
};

export type Theme = { dark: boolean; colors: typeof colors; fonts: typeof fonts };
export const DefaultTheme: Theme = { dark: false, colors, fonts };
export const DarkTheme: Theme = { dark: true, colors, fonts };
