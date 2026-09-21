import Link from "next/link";

import { BranchAssignmentEditor } from "@/components/admin/branch-assignment-editor";
import { FormDialog } from "@/components/admin/form-dialog";
import { ProductForm } from "@/components/admin/product-form";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { serverEnv } from "@/lib/env/server";
import { getProductAssignments } from "@/modules/admin/assignments/data";
import { getProduct } from "@/modules/admin/products/data";
import { publicAssetUrl } from "@/modules/public-content/links";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const product = await getProduct((await params).id);
  const assignments = await getProductAssignments(product.id, product.name);
  const saved = (await searchParams).saved === "1";

  return (
    <div>
      <Link
        href="/admin/products"
        className="text-sm underline underline-offset-4"
      >
        Kembali ke produk
      </Link>
      <h1 className="mt-5 font-serif text-4xl">Edit produk</h1>
      {saved && (
        <p role="status" className="mt-5 text-sm">
          Produk tersimpan.
        </p>
      )}
      <div className="mt-8">
        <FormDialog
          title={`Edit ${product.name}`}
          triggerLabel="Edit produk"
          primary
        >
          <ProductForm product={product} />
        </FormDialog>
      </div>
      <div className="mt-8">
        <MediaUploadField
          entityType="product"
          entityId={product.id}
          label="Gambar produk"
          previewUrl={publicAssetUrl(
            serverEnv.NEXT_PUBLIC_SUPABASE_URL,
            serverEnv.SUPABASE_PUBLIC_ASSET_BUCKET,
            product.imagePath,
          )}
        />
      </div>
      <BranchAssignmentEditor
        productId={product.id}
        productIsActive={product.isActive}
        assignments={assignments}
      />
    </div>
  );
}
