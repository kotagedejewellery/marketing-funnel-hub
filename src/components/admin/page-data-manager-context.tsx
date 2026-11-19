"use client";

import { createContext, useContext, type ReactNode } from "react";

export type PageDataToolKey =
  | "identity"
  | "sections"
  | "campaigns"
  | "gallery"
  | "cta"
  | "reviews"
  | "faq"
  | "links"
  | "formResponses"
  | "tracking";

export type PageDataSelection = {
  tool: PageDataToolKey;
  target?: { kind: "assignment" | "link"; id: string };
};

export type PageDataCanvasBlock =
  | { type: "product_cta"; assignmentId: string }
  | { type: "link"; linkId: string };

type PageDataManagerContextValue = {
  selection: PageDataSelection | null;
  select?: (selection: PageDataSelection) => void;
  addToCanvas?: (block: PageDataCanvasBlock) => void;
  isOnCanvas?: (block: PageDataCanvasBlock) => boolean;
};

const PageDataManagerContext =
  createContext<PageDataManagerContextValue | null>(null);

export function PageDataManagerProvider({
  selection,
  onSelect,
  onAddToCanvas,
  isOnCanvas,
  children,
}: {
  selection: PageDataSelection | null;
  onSelect?: (selection: PageDataSelection) => void;
  onAddToCanvas?: (block: PageDataCanvasBlock) => void;
  isOnCanvas?: (block: PageDataCanvasBlock) => boolean;
  children: ReactNode;
}) {
  return (
    <PageDataManagerContext.Provider
      value={{
        selection,
        select: onSelect,
        addToCanvas: onAddToCanvas,
        isOnCanvas,
      }}
    >
      {children}
    </PageDataManagerContext.Provider>
  );
}

export function usePageDataManager() {
  return useContext(PageDataManagerContext)?.selection ?? null;
}

export function useSelectPageDataManager() {
  return useContext(PageDataManagerContext)?.select;
}

export function useAddPageDataToCanvas() {
  return useContext(PageDataManagerContext)?.addToCanvas;
}

export function useIsPageDataOnCanvas() {
  return useContext(PageDataManagerContext)?.isOnCanvas;
}
