import { screen } from "@testing-library/react";
import { Linking } from "react-native";
import { describe, expect, it, vi } from "vitest";

import { UpdateRequiredScreen } from "@/update/update-required-screen";

import { renderScreen } from "../render";

describe("Update required screen", () => {
  it("explains why and sends people to the latest release", async () => {
    const openURL = vi.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { user } = renderScreen(<UpdateRequiredScreen />);

    expect(screen.getByRole("heading", { name: "Time to update DevHub" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Download the update" }));

    expect(openURL).toHaveBeenCalledWith("https://github.com/GitSter-dev/devhub-app/releases/latest");
  });
});
