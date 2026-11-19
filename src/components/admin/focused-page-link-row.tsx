"use client";

import { useEffect, useRef } from "react";

import { FormDialog } from "@/components/admin/form-dialog";
import { LinkForm } from "@/components/admin/link-form";
import {
  useAddPageDataToCanvas,
  useIsPageDataOnCanvas,
  usePageDataManager,
} from "@/components/admin/page-data-manager-context";
import { PageOrderControls } from "@/components/admin/page-order-controls";
import type { links } from "@/lib/db/schema";

type PageLink = typeof links.$inferSelect;

export function FocusedPageLinkRow({
  row,
  branchId,
  hasCustomLayout,
  canManageMeta,
  index,
  count,
}: {
  row: PageLink;
  branchId: string | null;
  hasCustomLayout: boolean;
  canManageMeta: boolean;
  index: number;
  count: number;
}) {
  const selection = usePageDataManager();
  const addToCanvas = useAddPageDataToCanvas();
  const isOnCanvas = useIsPageDataOnCanvas();
  const isFocused =
    selection?.tool === "links" &&
    selection.target?.kind === "link" &&
    selection.target.id === row.id;
  const rowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (isFocused) rowRef.current?.scrollIntoView({ block: "nearest" });
  }, [isFocused]);

  return (
    <li
      ref={rowRef}
      className={`flex flex-wrap items-center justify-between gap-3 py-4 ${
        isFocused ? "rounded-lg bg-secondary px-3" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{row.label}</p>
        {isFocused && (
          <p className="mt-1 text-sm text-muted-foreground">
            Dipilih dari blok di kanvas.
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {row.isActive ? "Aktif" : "Nonaktif"}
        </p>
        <p
          className="mt-1 truncate text-sm text-muted-foreground"
          title={row.url}
        >
          {row.url}
        </p>
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {!hasCustomLayout && (
          <PageOrderControls
            kind="link"
            id={row.id}
            branchId={branchId}
            index={index}
            count={count}
          />
        )}
        <FormDialog title={`Edit ${row.label}`} triggerLabel="Edit">
          <LinkForm
            link={row}
            hasCustomLayout={hasCustomLayout}
            canManageMeta={canManageMeta}
            stayOnPage
          />
        </FormDialog>
        {hasCustomLayout && row.isActive && addToCanvas && (
          <button
            type="button"
            onClick={() => addToCanvas({ type: "link", linkId: row.id })}
            className="min-h-11 rounded-full border border-border bg-card px-3 text-sm font-bold hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {isOnCanvas?.({ type: "link", linkId: row.id })
              ? "Lihat di kanvas"
              : "Tambahkan ke kanvas"}
          </button>
        )}
      </div>
    </li>
  );
}
