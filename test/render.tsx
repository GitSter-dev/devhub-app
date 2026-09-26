import { QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "@/api/query-client";
import { ThemeProvider } from "@/theme";

export function renderScreen(ui: ReactElement): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup({ delay: null });
  const result = render(
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{ui}</ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return { ...result, user };
}
