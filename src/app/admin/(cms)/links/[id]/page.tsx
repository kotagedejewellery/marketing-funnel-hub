import Link from "next/link";

import { LinkForm } from "@/components/admin/link-form";
import { FormDialog } from "@/components/admin/form-dialog";
import { getLink } from "@/modules/admin/links/data";

export default async function EditLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const link = await getLink((await params).id);

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
