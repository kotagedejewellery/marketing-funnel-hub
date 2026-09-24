"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { FormDialog } from "@/components/admin/form-dialog";
import { ProductForm } from "@/components/admin/product-form";
import {
  addExistingProductToBranch,
  createProductForBranch,
  moveBranchProduct,
  saveBranchProduct,
} from "@/modules/admin/branches/product-actions";

type BranchProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  assignment: {
    id: string;
    displayName: string | null;
    description: string | null;
    ctaLabel: string | null;
    whatsappMessageTemplate: string | null;
    isActive: boolean;
    sortOrder: number;
  } | null;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

export function BranchProductManager({
  branchId,
  products,
}: {
  branchId: string;
  products: BranchProduct[];
}) {
  const [moveState, moveAction, moving] = useActionState(moveBranchProduct, {
    message: "",
    errors: {},
    ok: false,
  });
  const visible = products.filter((product) => product.assignment?.isActive);
  const available = products.filter(
    (product) => product.isActive && !product.assignment?.isActive,
  );

  return (
    <section
      className="rounded-2xl bg-card p-6 sm:p-8"
      aria-labelledby="branch-products-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="branch-products-heading" className="font-serif text-2xl">
            Tombol WhatsApp
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Atur pilihan produk yang membuka WhatsApp cabang ini. Gambar tetap
            dikelola terpisah melalui Galeri Produk.
          </p>
        </div>
        <FormDialog
          title="Tambah tombol WhatsApp"
          triggerLabel="Tambah tombol"
          primary
        >
          <AddBranchProductContent branchId={branchId} available={available} />
        </FormDialog>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 border-t border-border py-7 text-sm text-muted-foreground">
          Belum ada tombol WhatsApp pada halaman cabang ini. Gunakan tombol
          “Tambah tombol” untuk memilih jenis produk atau membuat yang baru.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {visible.map((product, index) => (
            <li key={product.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {product.assignment?.displayName || product.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.isActive
                      ? "Tampil di halaman ini"
                      : "Jenis produk bersama nonaktif; tombol tidak tampil"}
                    {product.assignment?.displayName
                      ? " · Nama khusus cabang"
                      : " · Mengikuti nama bersama"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={moveAction}>
                    <input type="hidden" name="branchId" value={branchId} />
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      name="direction"
                      value="up"
                      disabled={moving || index === 0}
                      className="min-h-11 rounded-full border border-border px-3 text-sm disabled:opacity-40"
                    >
                      Naik
                    </button>
                    <button
                      name="direction"
                      value="down"
                      disabled={moving || index === visible.length - 1}
                      className="ml-2 min-h-11 rounded-full border border-border px-3 text-sm disabled:opacity-40"
                    >
                      Turun
                    </button>
                  </form>
                  <FormDialog
                    title={`Edit tombol ${product.name}`}
                    triggerLabel="Edit tombol"
                  >
                    <BranchProductForm branchId={branchId} product={product} />
                  </FormDialog>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FormFeedback state={moveState} pending={moving} />

      {products.length > 0 && (
        <details className="mt-6 rounded-xl bg-secondary p-5">
          <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
            Kelola jenis produk bersama ({products.length})
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Gunakan bagian ini hanya untuk mengubah data dasar yang dipakai
            ulang. Perubahan berlaku pada semua cabang yang masih mengikuti nama
            atau deskripsi bersama.
          </p>
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.isActive ? "Aktif" : "Nonaktif"} · {product.slug}
                  </p>
                </div>
                <FormDialog
                  title={`Edit jenis produk ${product.name}`}
                  triggerLabel="Edit jenis"
                >
                  <ProductForm product={product} />
                </FormDialog>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function AddBranchProductContent({
  branchId,
  available,
}: {
  branchId: string;
  available: BranchProduct[];
}) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="use-existing-product">
        <h3 id="use-existing-product" className="text-lg font-bold">
          Pilih jenis yang sudah ada
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Pilihan ini dapat dipakai ulang di beberapa cabang, sedangkan isi
          tombol tetap dapat disesuaikan khusus untuk cabang ini.
        </p>
        {available.length > 0 ? (
          <AddExistingProductForm branchId={branchId} products={available} />
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Semua jenis produk aktif sudah ditambahkan ke cabang ini.
          </p>
        )}
      </section>

      <section
        aria-labelledby="create-branch-product"
        className="border-t border-border pt-7"
      >
        <h3 id="create-branch-product" className="text-lg font-bold">
          Buat jenis produk baru
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Jenis baru langsung ditambahkan sebagai tombol WhatsApp cabang ini dan
          tersedia untuk dipakai ulang pada cabang lain.
        </p>
        <CreateBranchProductForm branchId={branchId} />
      </section>
    </div>
  );
}

function AddExistingProductForm({
  branchId,
  products,
}: {
  branchId: string;
  products: BranchProduct[];
}) {
  const [state, action, pending] = useActionState(addExistingProductToBranch, {
    message: "",
    errors: {},
    ok: false,
  });

  return (
    <form action={action} className="mt-5 space-y-5">
      <input type="hidden" name="branchId" value={branchId} />
      <div>
        <label htmlFor="existing-product" className="font-medium">
          Jenis produk
        </label>
        <select
          id="existing-product"
          name="productId"
          className={inputClass}
          defaultValue=""
          required
        >
          <option value="" disabled>
            Pilih jenis produk
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <FieldError message={state.errors.productId} />
      </div>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Menambahkan..." : "Tambahkan ke cabang"}
      </button>
    </form>
  );
}

function CreateBranchProductForm({ branchId }: { branchId: string }) {
  const [state, action, pending] = useActionState(createProductForBranch, {
    message: "",
    errors: {},
    ok: false,
  });

  return (
    <form action={action} className="mt-5 space-y-5">
      <input type="hidden" name="branchId" value={branchId} />
      <div>
        <label htmlFor="new-product-name" className="font-medium">
          Nama produk / kebutuhan
        </label>
        <input
          id="new-product-name"
          name="name"
          className={inputClass}
          required
          maxLength={120}
          placeholder="Contoh: Cincin Nikah Premium"
        />
        <FieldError message={state.errors.name} />
      </div>
      <div>
        <label htmlFor="new-product-description" className="font-medium">
          Deskripsi publik
        </label>
        <textarea
          id="new-product-description"
          name="description"
          className={inputClass}
          rows={3}
          maxLength={2000}
        />
        <FieldError message={state.errors.description} />
      </div>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Membuat..." : "Buat dan tambahkan"}
      </button>
    </form>
  );
}

function BranchProductForm({
  branchId,
  product,
}: {
  branchId: string;
  product: BranchProduct;
}) {
  const [state, action, pending] = useActionState(saveBranchProduct, {
    message: "",
    errors: {},
    ok: false,
  });
  const assignment = product.assignment;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="productId" value={product.id} />
      <input
        type="hidden"
        name="sortOrder"
        value={assignment?.sortOrder ?? product.sortOrder}
      />
      <label className="flex min-h-11 items-center gap-3 font-medium">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={assignment?.isActive ?? true}
          className="size-5 accent-primary"
        />
        Tampilkan tombol di halaman cabang
      </label>
      <p className="-mt-4 pl-8 text-sm leading-6 text-muted-foreground">
        Nonaktifkan untuk menyembunyikan tombol hanya dari cabang ini.
      </p>
      <p className="text-sm leading-6 text-muted-foreground">
        Nama dan deskripsi kosong mengikuti jenis produk bersama. Label kosong
        mengikuti pengaturan cabang lalu Standar &amp; Template KGJ; pesan
        kosong mengikuti Standar &amp; Template KGJ.
      </p>
      <div>
        <label htmlFor={`display-name-${product.id}`} className="font-medium">
          Nama khusus cabang
        </label>
        <input
          id={`display-name-${product.id}`}
          name="displayName"
          defaultValue={assignment?.displayName ?? ""}
          maxLength={160}
          placeholder={product.name}
          className={inputClass}
        />
        <FieldError message={state.errors.displayName} />
      </div>
      <div>
        <label htmlFor={`description-${product.id}`} className="font-medium">
          Deskripsi khusus cabang
        </label>
        <textarea
          id={`description-${product.id}`}
          name="description"
          defaultValue={assignment?.description ?? ""}
          maxLength={2000}
          rows={3}
          placeholder={product.description || "Ikuti deskripsi bersama"}
          className={inputClass}
        />
        <FieldError message={state.errors.description} />
      </div>
      <div>
        <label htmlFor={`cta-${product.id}`} className="font-medium">
          Label tombol WhatsApp
        </label>
        <input
          id={`cta-${product.id}`}
          name="ctaLabel"
          defaultValue={assignment?.ctaLabel ?? ""}
          maxLength={120}
          placeholder="Ikuti label bawaan"
          className={inputClass}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Isi hanya jika tombol produk ini perlu berbeda dari label cabang.
        </p>
        <FieldError message={state.errors.ctaLabel} />
      </div>
      <div>
        <label htmlFor={`message-${product.id}`} className="font-medium">
          Pesan WhatsApp
        </label>
        <textarea
          id={`message-${product.id}`}
          name="whatsappMessageTemplate"
          defaultValue={assignment?.whatsappMessageTemplate ?? ""}
          maxLength={500}
          rows={3}
          placeholder="Gunakan {product} dan {branch} bila perlu"
          className={inputClass}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Isi hanya jika pesan produk ini perlu berbeda dari pesan WhatsApp
          bawaan.
        </p>
        <FieldError message={state.errors.whatsappMessageTemplate} />
      </div>
      <FieldError message={state.errors.isActive} />
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan tombol WhatsApp"}
      </button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-2 text-sm text-destructive">
      {message}
    </p>
  ) : null;
}
