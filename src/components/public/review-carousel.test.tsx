import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewCarousel } from "./review-carousel";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReviewCarousel", () => {
  it("keeps one review static", () => {
    render(
      <ReviewCarousel itemCount={1}>
        <li>Ulasan pertama</li>
      </ReviewCarousel>,
    );

    expect(screen.getByText("Ulasan pertama")).toBeVisible();
    expect(
      screen.queryByText("Geser untuk membaca ulasan lainnya"),
    ).not.toBeInTheDocument();
  });

  it("keeps swipe guidance without pagination controls for multiple reviews", () => {
    render(
      <ReviewCarousel itemCount={2}>
        <li>Ulasan pertama</li>
        <li>Ulasan kedua</li>
      </ReviewCarousel>,
    );

    expect(
      screen.getByText("Geser untuk membaca ulasan lainnya"),
    ).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
