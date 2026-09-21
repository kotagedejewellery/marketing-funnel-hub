import Link from "next/link";

import { FormDialog } from "@/components/admin/form-dialog";
import { ProductForm } from "@/components/admin/product-form";
import { getProductList } from "@/modules/admin/products/data";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; create?: string }>;
}) {
  const { page: pageParam, create } = await searchParams;
  const requestedPage = Number(pageParam ?? 1);
  const { rows, page, pageCount } = await getProductList(requestedPage);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Produk</h1>
          <p className="mt-3 text-muted-foreground">
            Kelola kategori kebutuhan pelanggan, bukan stok atau SKU.
          </p>
        </div>
        <FormDialog
          key={create === "1" ? "create-open" : "create-closed"}
          title="Tambah produk"
          triggerLabel="Tambah produk"
          primary
          initiallyOpen={create === "1"}
        >
          <ProductForm product={null} />
        </FormDialog>
      </div>
      {rows.length === 0 ? (
        <p className="mt-8 border-t border-border py-7 text-muted-foreground">
          Belum ada produk.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {rows.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {product.isActive ? "Aktif" : "Nonaktif"} · Urutan{" "}
                  {product.sortOrder} · {product.slug}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <FormDialog title={`Edit ${product.name}`} triggerLabel="Edit">
                  <ProductForm product={product} />
                </FormDialog>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Gambar & cabang
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <nav
        aria-label="Halaman produk"
        className="mt-6 flex items-center gap-4 text-sm"
      >
        {page > 1 && (
          <Link
            href={`/admin/products?page=${page - 1}`}
            className="underline underline-offset-4"
          >
            Sebelumnya
          </Link>
        )}
        <span>
          Halaman {page} dari {pageCount}
        </span>
        {page < pageCount && (
          <Link
            href={`/admin/products?page=${page + 1}`}
            className="underline underline-offset-4"
          >
            Berikutnya
          </Link>
        )}
      </nav>
    </div>
  );
}
