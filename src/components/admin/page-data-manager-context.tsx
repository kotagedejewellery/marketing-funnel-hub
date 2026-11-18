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

type PageDataManagerContextValue = {
  selection: PageDataSelection | null;
  select?: (selection: PageDataSelection) => void;
};

const PageDataManagerContext =
  createContext<PageDataManagerContextValue | null>(null);

export function PageDataManagerProvider({
  selection,
  onSelect,
  children,
}: {
  selection: PageDataSelection | null;
  onSelect?: (selection: PageDataSelection) => void;
  children: ReactNode;
}) {
  return (
    <PageDataManagerContext.Provider value={{ selection, select: onSelect }}>
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
