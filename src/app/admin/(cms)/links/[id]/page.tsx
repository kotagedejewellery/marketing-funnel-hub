import Link from "next/link";

import { LinkForm } from "@/components/admin/link-form";
import { FormDialog } from "@/components/admin/form-dialog";
import { getLink } from "@/modules/admin/links/data";

export default async function EditLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const link = await getLink((await params).id);
  const saved = (await searchParams).saved === "1";

  return (
    <div>
      <Link
        href="/admin/links"
        className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Kembali ke tautan
      </Link>
      <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-[var(--kgj-accent)] uppercase">
        Destinasi / Editor
      </p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Edit tautan</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
        Perbarui tujuan dan status tautan yang sudah ada.
      </p>
      {saved && (
        <p
          role="status"
          className="mt-5 border-l-2 border-[var(--kgj-accent)] bg-secondary px-4 py-3 text-sm"
        >
          Tautan tersimpan.
        </p>
      )}
      <div className="mt-8">
        <FormDialog
          title={`Edit ${link.label}`}
          triggerLabel="Edit tautan"
          primary
        >
          <LinkForm link={link} />
        </FormDialog>
      </div>
    </div>
  );
}
