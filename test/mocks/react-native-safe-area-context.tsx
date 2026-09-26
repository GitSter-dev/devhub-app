import type { ReactNode } from "react";

const insets = { top: 0, right: 0, bottom: 0, left: 0 };
const frame = { x: 0, y: 0, width: 390, height: 844 };

export const initialWindowMetrics = { insets, frame };

export function SafeAreaProvider({ children }: { children?: ReactNode }): ReactNode {
  return children;
}

export function useSafeAreaInsets(): typeof insets {
  return insets;
}

export function useSafeAreaFrame(): typeof frame {
  return frame;
}
