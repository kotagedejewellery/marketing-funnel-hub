import Link from "next/link";

import { BranchForm } from "@/components/admin/branch-form";
import { FormDialog } from "@/components/admin/form-dialog";
import { getBranch } from "@/modules/admin/branches/data";

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const branch = await getBranch((await params).id);

  return (
    <div>
      <Link
        href="/admin/branches"
        className="text-sm underline underline-offset-4"
      >
        Kembali ke cabang
      </Link>
      <h1 className="mt-5 font-serif text-4xl">Edit cabang</h1>
      <div className="mt-8">
        <FormDialog
          title={`Edit ${branch.name}`}
          triggerLabel="Edit cabang"
          primary
        >
          <BranchForm branch={branch} />
        </FormDialog>
      </div>
    </div>
  );
}
