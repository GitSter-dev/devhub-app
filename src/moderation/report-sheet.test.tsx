import { act, screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { Alert } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/api/query-client";
import { chatStore } from "@/chat/chat-store";

import { message } from "../../test/chat-fixtures";
import { renderScreen } from "../../test/render";
import { API, fail, ok, server } from "../../test/server";
import { signIn } from "../../test/signed-in";
import { ReportSheet } from "./report-sheet";
import { reportFlow } from "./report-store";

type Button = { text: string; onPress?: () => void };

function reportEndpoint(respond: () => Response = () => ok(null)): unknown[] {
  const reports: unknown[] = [];
  server.use(
    http.post(`${API}/reports`, async ({ request }) => {
      reports.push(await request.json());
      return respond();
    }),
  );
  return reports;
}

function lastAlertButtons(): Button[] {
  return vi.mocked(Alert.alert).mock.calls.at(-1)?.[2] as Button[];
}

describe("Report sheet", () => {
  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await signIn();
  });

  afterEach(() => act(() => reportFlow.close()));

  it("stays hidden until something is reported", () => {
    renderScreen(<ReportSheet />);

    expect(screen.queryByText("Report this post")).toBeNull();
  });

  it("reports a post with the chosen reason and note, then offers to block the author", async () => {
    const reports = reportEndpoint();
    const blocks: string[] = [];
    server.use(
      http.put(`${API}/users/me/blocks/:id`, ({ params }) => {
        blocks.push(String(params.id));
        return ok(null);
      }),
    );
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { user } = renderScreen(<ReportSheet />);
    act(() => reportFlow.open({ type: "POST", id: "p1", username: "ada", userId: "u1" }));

    expect(await screen.findByText("Report this post")).toBeTruthy();
    await user.type(screen.getByLabelText("Add a note (optional)"), "  crypto scam link  ");
    await user.click(screen.getByRole("button", { name: /^Spam/ }));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Thanks for reporting", expect.stringContaining("block @ada"), expect.any(Array)));
    expect(reports).toEqual([{ targetType: "POST", targetId: "p1", reason: "SPAM", note: "crypto scam link" }]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["posts"] });
    expect(screen.queryByText("Report this post")).toBeNull();

    lastAlertButtons().find((button) => button.text === "Block")?.onPress?.();
    await waitFor(() => expect(blocks).toEqual(["u1"]));
  });

  it("hides a reported message from the chat straight away", async () => {
    reportEndpoint();
    await chatStore.wipe();
    await chatStore.saveMessages("c1", [message(1), message(2)]);
    const { user } = renderScreen(<ReportSheet />);
    act(() => reportFlow.open({ type: "MESSAGE", id: "m2", username: "ada", userId: "u1", conversationId: "c1" }));

    await user.click(await screen.findByRole("button", { name: /^Harassment/ }));

    await waitFor(async () =>
      expect((await chatStore.messages("c1")).map((m) => m.deleted)).toEqual([false, true]),
    );
  });

  it("thanks the reporter without offering a block when there is nobody to block", async () => {
    reportEndpoint();
    const { user } = renderScreen(<ReportSheet />);
    act(() => reportFlow.open({ type: "USER", id: "u9", username: null, userId: null }));

    await user.click(await screen.findByRole("button", { name: /^Impersonation/ }));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Thanks for reporting", "Our moderators will take a look."));
  });

  it("keeps the sheet open and explains when the report fails", async () => {
    reportEndpoint(() => fail(409, "CONFLICT", "You already reported this"));
    const { user } = renderScreen(<ReportSheet />);
    act(() => reportFlow.open({ type: "POST", id: "p1", username: "ada", userId: "u1" }));

    await user.click(await screen.findByRole("button", { name: /^Spam/ }));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't send the report", "You already reported this"));
    expect(screen.getByText("Report this post")).toBeTruthy();
  });

  it("closes without reporting", async () => {
    const reports = reportEndpoint();
    const { user } = renderScreen(<ReportSheet />);
    act(() => reportFlow.open({ type: "POST", id: "p1", username: "ada", userId: "u1" }));

    await user.click((await screen.findAllByRole("button", { name: "Close" }))[0]);

    await waitFor(() => expect(screen.queryByText("Report this post")).toBeNull());
    expect(reports).toEqual([]);
  });
});
