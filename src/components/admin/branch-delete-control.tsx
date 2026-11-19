"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FormFeedback } from "@/components/admin/admin-toast";
import { DestructiveConfirmDialog } from "@/components/admin/destructive-confirm-dialog";
import {
  deactivateBranch,
  deleteBranch,
} from "@/modules/admin/branches/actions";

export function BranchDeleteControl({
  branchId,
  slug,
  blockedReason,
  canDeactivate,
}: {
  branchId: string;
  slug: string;
  blockedReason: string | null;
  canDeactivate: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteBranch, {
    message: "",
    errors: {},
  });
  const [deactivateState, deactivateAction, deactivating] = useActionState(
    deactivateBranch,
    { message: "", errors: {} },
  );

  useEffect(() => {
    if (!state.ok && !deactivateState.ok) return;
    router.refresh();
  }, [deactivateState.ok, router, state.ok]);

  if (blockedReason) {
    return (
      <div>
        <p className="max-w-56 text-xs leading-5 text-muted-foreground">
          Hapus tidak tersedia: {blockedReason}
        </p>
        {canDeactivate ? (
          <form action={deactivateAction} className="mt-2">
            <input type="hidden" name="id" value={branchId} />
            <button
              type="submit"
              disabled={deactivating}
              aria-busy={deactivating || undefined}
              className="min-h-11 rounded-full px-2 text-sm font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50"
            >
              {deactivating ? "Menonaktifkan..." : "Nonaktifkan halaman"}
            </button>
            <FormFeedback state={deactivateState} pending={deactivating} />
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <form id={formId} ref={formRef} action={action}>
        <input type="hidden" name="id" value={branchId} />
      </form>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-full px-2 text-sm font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Hapus halaman uji
      </button>
      <DestructiveConfirmDialog
        open={open && !state.ok}
        count={1}
        pending={pending}
        title={`Hapus halaman uji ${slug}?`}
        description="Blok builder, CTA, galeri, tautan, FAQ, kampanye, ulasan, dan pengaturan Meta khusus cabang akan dihapus permanen."
        confirmLabel="Hapus halaman uji"
        confirmationValue={slug}
        confirmationInputName="confirmationSlug"
        confirmationFormId={formId}
        onClose={() => setOpen(false)}
        onConfirm={() => formRef.current?.requestSubmit()}
      />
      <FormFeedback state={state} pending={pending} />
    </div>
  );
}
