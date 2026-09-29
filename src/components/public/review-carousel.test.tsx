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
  vi.useRealTimers();
  vi.restoreAllMocks();
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

  it("advances only the review rail without scrolling the page", () => {
    vi.useFakeTimers();
    const carouselScrollTo = vi.fn();
    const itemScrollIntoView = vi.fn();

    render(
      <ReviewCarousel itemCount={2}>
        <li>Ulasan pertama</li>
        <li>Ulasan kedua</li>
      </ReviewCarousel>,
    );

    const carousel = screen.getByRole("list", {
      name: "Carousel ulasan pelanggan",
    });
    const secondItem = carousel.children.item(1) as HTMLElement;
    Object.defineProperty(carousel, "scrollTo", {
      configurable: true,
      value: carouselScrollTo,
    });
    Object.defineProperty(secondItem, "scrollIntoView", {
      configurable: true,
      value: itemScrollIntoView,
    });
    Object.defineProperty(secondItem, "offsetLeft", {
      configurable: true,
      value: 240,
    });

    vi.advanceTimersByTime(3000);

    expect(carouselScrollTo).toHaveBeenCalledWith({
      left: 240,
      behavior: "smooth",
    });
    expect(itemScrollIntoView).not.toHaveBeenCalled();
  });
});
