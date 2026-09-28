import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewCarousel } from "./review-carousel";

const scrollIntoView = vi.fn();

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
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
  scrollIntoView.mockReset();
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

  it("provides manual navigation when there are multiple reviews", () => {
    render(
      <ReviewCarousel itemCount={2}>
        <li>Ulasan pertama</li>
        <li>Ulasan kedua</li>
      </ReviewCarousel>,
    );

    expect(
      screen.getByText("Geser untuk membaca ulasan lainnya"),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Tampilkan ulasan 2" }));
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  });
});
