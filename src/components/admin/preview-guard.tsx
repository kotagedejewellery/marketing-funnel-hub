"use client";

import type { ReactNode } from "react";

export function PreviewGuard({ children }: { children: ReactNode }) {
  function blockExternalLink(
    target: EventTarget | null,
    event: { preventDefault: () => void },
  ) {
    if (!(target instanceof Element)) return;
    const link = target.closest("a");
    if (link && !link.getAttribute("href")?.startsWith("#")) {
      event.preventDefault();
    }
  }

  return (
    <div
      onClickCapture={(event) => blockExternalLink(event.target, event)}
      onAuxClickCapture={(event) => blockExternalLink(event.target, event)}
    >
      {children}
    </div>
  );
}
