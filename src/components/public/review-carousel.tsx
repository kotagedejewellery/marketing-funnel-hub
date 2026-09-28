"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ReviewCarousel({
  children,
  itemCount,
}: {
  children: ReactNode;
  itemCount: number;
}) {
  const carouselRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || itemCount < 2) return;

    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let timer: number | null = null;
    let suspended = false;

    const clearTimer = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };
    const currentIndex = () => {
      const items = Array.from(carousel.children) as HTMLElement[];
      return items.reduce(
        (closest, item, index) =>
          Math.abs(item.offsetLeft - carousel.scrollLeft) <
          Math.abs(items[closest].offsetLeft - carousel.scrollLeft)
            ? index
            : closest,
        0,
      );
    };
    const advance = () => {
      if (suspended || document.hidden || !media.matches) return;
      const nextIndex = (currentIndex() + 1) % itemCount;
      const item = carousel.children.item(nextIndex) as HTMLElement | null;
      item?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    };
    const startTimer = () => {
      clearTimer();
      if (!suspended && !document.hidden && media.matches)
        timer = window.setInterval(advance, 3000);
    };
    const suspend = () => {
      suspended = true;
      clearTimer();
    };
    const resume = () => {
      suspended = false;
      startTimer();
    };
    const onVisibilityChange = () => {
      if (document.hidden) clearTimer();
      else startTimer();
    };
    carousel.addEventListener("pointerdown", suspend, { passive: true });
    carousel.addEventListener("pointerenter", suspend);
    carousel.addEventListener("focusin", suspend);
    carousel.addEventListener("pointerleave", resume);
    carousel.addEventListener("focusout", resume);
    document.addEventListener("visibilitychange", onVisibilityChange);
    media.addEventListener("change", startTimer);
    startTimer();

    return () => {
      clearTimer();
      carousel.removeEventListener("pointerdown", suspend);
      carousel.removeEventListener("pointerenter", suspend);
      carousel.removeEventListener("focusin", suspend);
      carousel.removeEventListener("pointerleave", resume);
      carousel.removeEventListener("focusout", resume);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      media.removeEventListener("change", startTimer);
    };
  }, [itemCount]);

  const carousel = (
    <ul
      ref={carouselRef}
      aria-label={itemCount > 1 ? "Carousel ulasan pelanggan" : undefined}
      tabIndex={itemCount > 1 ? 0 : undefined}
      className={
        itemCount > 1
          ? "flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-offset-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : ""
      }
    >
      {children}
    </ul>
  );

  if (itemCount < 2) return carousel;

  return (
    <div>
      {carousel}
      <p className="mt-1 text-xs text-muted-foreground">
        Geser untuk membaca ulasan lainnya
      </p>
    </div>
  );
}
