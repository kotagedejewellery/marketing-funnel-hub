import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the Sprint 0 application shell", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Marketing Funnel Hub",
      }),
    ).toBeVisible();
    expect(screen.getByText("KGJ · Sprint 0")).toBeVisible();
    expect(screen.getByText(/Fondasi aplikasi siap/)).toBeVisible();
  });
});
