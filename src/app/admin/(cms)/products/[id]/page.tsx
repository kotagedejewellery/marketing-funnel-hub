import Link from "next/link";

import { FormDialog } from "@/components/admin/form-dialog";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { ProductForm } from "@/components/admin/product-form";
import { serverEnv } from "@/lib/env/server";
import { getProduct } from "@/modules/admin/products/data";
import { publicAssetUrl } from "@/modules/public-content/links";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const product = await getProduct((await params).id);

  return (
    <div>
      <Link
        href="/admin/products"
        className="text-sm underline underline-offset-4"
      >
        Kembali ke Pustaka Produk
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">{product.name}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Data dasar ini menjadi bawaan bagi Link Bio cabang yang tidak
            menggunakan nama, deskripsi, atau gambar khusus.
          </p>
        </div>
        <FormDialog
          title={`Edit ${product.name}`}
          triggerLabel="Edit data produk"
          primary
        >
          <ProductForm product={product} />
        </FormDialog>
      </div>
      <section className="mt-8 max-w-3xl rounded-2xl bg-card p-6 sm:p-8">
        <h2 className="font-serif text-2xl">Gambar utama</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Link Bio cabang memakai gambar ini selama belum memiliki gambar
          khusus. Penempatan dan tampilan produk diatur dari Halaman Link Bio.
        </p>
        <div className="mt-5">
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
      </section>
    </div>
  );
}
