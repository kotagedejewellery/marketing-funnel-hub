"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function ReviewCarousel({
  children,
  itemCount,
}: {
  children: ReactNode;
  itemCount: number;
}) {
  const carouselRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function scrollToIndex(index: number) {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const item = carousel.children.item(index) as HTMLElement | null;
    item?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || itemCount < 2) return;

    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let timer: number | null = null;
    let suspended = false;
    let animationFrame: number | null = null;

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
        timer = window.setInterval(advance, 5000);
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
    const onScroll = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        setActiveIndex(currentIndex());
        animationFrame = null;
      });
    };

    carousel.addEventListener("pointerdown", suspend, { passive: true });
    carousel.addEventListener("pointerenter", suspend);
    carousel.addEventListener("focusin", suspend);
    carousel.addEventListener("pointerleave", resume);
    carousel.addEventListener("focusout", resume);
    carousel.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    media.addEventListener("change", startTimer);
    startTimer();

    return () => {
      clearTimer();
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      carousel.removeEventListener("pointerdown", suspend);
      carousel.removeEventListener("pointerenter", suspend);
      carousel.removeEventListener("focusin", suspend);
      carousel.removeEventListener("pointerleave", resume);
      carousel.removeEventListener("focusout", resume);
      carousel.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      media.removeEventListener("change", startTimer);
    };
  }, [itemCount]);

  const carousel = (
    <ul
      ref={carouselRef}
      className={
        itemCount > 1
          ? "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
      <div className="mt-1 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Geser untuk membaca ulasan lainnya
        </p>
        <nav className="flex items-center gap-1" aria-label="Pilih ulasan">
          {Array.from({ length: itemCount }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={`Tampilkan ulasan ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`flex size-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 ${activeIndex === index ? "bg-[var(--kgj-dark)] text-[var(--kgj-on-dark-muted)]" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {index === activeIndex ? (
                <span className="size-1.5 rounded-full bg-current" />
              ) : (
                <span className="size-1.5 rounded-full border border-current" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
