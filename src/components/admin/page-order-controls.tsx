"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { movePageItem } from "@/modules/admin/link-bio/order-actions";

export function PageOrderControls({
  kind,
  id,
  branchId,
  index,
  count,
}: {
  kind: "link" | "faq" | "gallery";
  id: string;
  branchId?: string | null;
  index: number;
  count: number;
}) {
  const [state, action, pending] = useActionState(movePageItem, {
    message: "",
    ok: false,
  });
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="branchId" value={branchId ?? ""} />
      <button
        type="submit"
        name="direction"
        value="up"
        disabled={pending || index === 0}
        className="min-h-11 rounded-full border border-border px-3 text-sm disabled:opacity-40"
      >
        Naik
      </button>
      <button
        type="submit"
        name="direction"
        value="down"
        disabled={pending || index === count - 1}
        className="min-h-11 rounded-full border border-border px-3 text-sm disabled:opacity-40"
      >
        Turun
      </button>
      <FormFeedback state={state} pending={pending} />
    </form>
  );
}
