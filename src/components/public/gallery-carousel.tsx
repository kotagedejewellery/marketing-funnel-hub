"use client";

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

export function GalleryCarousel({
  children,
  className,
  itemCount,
  ...props
}: {
  children: ReactNode;
  className: string;
  itemCount: number;
} & ComponentPropsWithoutRef<"ul">) {
  const carouselRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || itemCount < 2) return;

    const media = window.matchMedia(
      "(max-width: 639px) and (prefers-reduced-motion: no-preference)",
    );
    let timer: number | null = null;
    let suspended = false;

    const clearTimer = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };
    const advance = () => {
      if (suspended || document.hidden || !media.matches) return;
      const firstItem = carousel.children.item(0) as HTMLElement | null;
      if (!firstItem) return;
      const gap = Number.parseFloat(getComputedStyle(carousel).gap) || 0;
      const step = firstItem.getBoundingClientRect().width + gap;
      const next = carousel.scrollLeft + step;
      const max = carousel.scrollWidth - carousel.clientWidth;
      carousel.scrollTo({
        left: next >= max - 1 ? 0 : next,
        behavior: "smooth",
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
    const onMediaChange = () => {
      if (media.matches) startTimer();
      else clearTimer();
    };
    const details = carousel.closest("details");
    const onDetailsToggle = () => {
      if (details?.open) resume();
      else suspend();
    };

    if (details && !details.open) suspended = true;
    carousel.addEventListener("pointerdown", suspend, { passive: true });
    carousel.addEventListener("pointerenter", suspend);
    carousel.addEventListener("focusin", suspend);
    carousel.addEventListener("pointerleave", resume);
    carousel.addEventListener("focusout", resume);
    document.addEventListener("visibilitychange", onVisibilityChange);
    media.addEventListener("change", onMediaChange);
    details?.addEventListener("toggle", onDetailsToggle);
    startTimer();

    return () => {
      clearTimer();
      carousel.removeEventListener("pointerdown", suspend);
      carousel.removeEventListener("pointerenter", suspend);
      carousel.removeEventListener("focusin", suspend);
      carousel.removeEventListener("pointerleave", resume);
      carousel.removeEventListener("focusout", resume);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      media.removeEventListener("change", onMediaChange);
      details?.removeEventListener("toggle", onDetailsToggle);
    };
  }, [itemCount]);

  return (
    <ul ref={carouselRef} className={className} {...props}>
      {children}
    </ul>
  );
}
