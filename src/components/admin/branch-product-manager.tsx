"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { FormDialog } from "@/components/admin/form-dialog";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import {
  moveBranchProduct,
  saveBranchProduct,
} from "@/modules/admin/branches/product-actions";

type BranchProduct = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  assignment: {
    id: string;
    displayName: string | null;
    description: string | null;
    imageUrl: string | null;
    showImage: boolean;
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
  const available = products.filter((product) => !product.assignment?.isActive);

  return (
    <section
      className="rounded-2xl bg-card p-6 sm:p-8"
      aria-labelledby="branch-products-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="branch-products-heading" className="font-serif text-2xl">
            Produk & WhatsApp
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Produk aktif membentuk daftar CTA WhatsApp. Maksimal empat produk
            pertama yang gambarnya ditampilkan juga membentuk galeri di atas
            daftar CTA.
          </p>
        </div>
      </div>
      {products.length === 0 ? (
        <div className="mt-5 text-sm text-muted-foreground">
          <p>Pustaka produk masih kosong. Tambahkan kategori produk dahulu.</p>
          <Link
            href="/admin/products"
            className="mt-3 inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-4"
          >
            Buka pustaka produk
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-5 divide-y divide-border border-t border-border">
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
                        : "Produk di pustaka nonaktif; tidak tampil di publik"}
                      {product.assignment?.displayName
                        ? " · Nama khusus cabang"
                        : " · Nama dari pustaka"}
                      {product.assignment?.showImage
                        ? " · Gambar tampil"
                        : " · Gambar disembunyikan"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={moveAction}>
                      <input type="hidden" name="branchId" value={branchId} />
                      <input
                        type="hidden"
                        name="productId"
                        value={product.id}
                      />
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
                      title={`Atur ${product.name}`}
                      triggerLabel="Edit"
                    >
                      <BranchProductForm
                        branchId={branchId}
                        product={product}
                      />
                    </FormDialog>
                  </div>
                </div>
                {product.assignment && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
                      Atur gambar khusus cabang
                    </summary>
                    <div className="mt-3">
                      {!product.assignment.imageUrl && (
                        <p className="mb-3 text-sm text-muted-foreground">
                          Belum ada gambar khusus; halaman mengikuti gambar dari
                          pustaka produk.
                        </p>
                      )}
                      <MediaUploadField
                        entityType="assignment"
                        entityId={product.assignment.id}
                        label={`Gambar ${product.name} untuk cabang ini`}
                        previewUrl={product.assignment.imageUrl}
                      />
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
          <FormFeedback state={moveState} pending={moving} />
          {visible.length === 0 && (
            <p className="mt-5 text-sm text-muted-foreground">
              Belum ada produk yang ditampilkan pada cabang ini.
            </p>
          )}
          {available.length > 0 && (
            <details className="mt-5 rounded-xl bg-secondary p-5">
              <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
                Produk yang belum tampil ({available.length})
              </summary>
              <ul className="mt-4 divide-y divide-border">
                {available.map((product) => (
                  <li
                    key={product.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {!product.isActive
                          ? "Produk di pustaka nonaktif"
                          : product.assignment
                            ? "Nonaktif di halaman ini"
                            : "Belum ditambahkan ke halaman ini"}
                      </p>
                    </div>
                    <FormDialog
                      title={`Atur ${product.name}`}
                      triggerLabel="Atur"
                    >
                      <BranchProductForm
                        branchId={branchId}
                        product={product}
                      />
                    </FormDialog>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
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
        Tampilkan produk di halaman cabang
      </label>
      <p className="-mt-4 pl-8 text-sm leading-6 text-muted-foreground">
        Aktifkan untuk menampilkan produk pada daftar CTA halaman cabang.
      </p>
      <div className="rounded-xl bg-secondary p-4">
        <label className="flex min-h-11 items-center gap-3 font-medium">
          <input
            type="checkbox"
            name="showImage"
            defaultChecked={assignment?.showImage ?? true}
            className="size-5 accent-primary"
          />
          Tampilkan produk di galeri gambar
        </label>
        <p className="mt-1 pl-8 text-sm leading-6 text-muted-foreground">
          Jika dimatikan, nama, keterangan, dan tombol WhatsApp tetap tampil di
          daftar CTA. Gambar tersimpan dan dapat ditampilkan kembali kapan saja.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Nama dan deskripsi kosong mengikuti Pustaka Produk. Label CTA kosong
        mengikuti pengaturan cabang lalu Pengaturan Bersama; pesan WhatsApp
        kosong mengikuti Pengaturan Bersama.
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
          placeholder={product.description || "Deskripsi dari pustaka produk"}
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
      <FieldError message={state.errors.showImage} />
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan produk cabang"}
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
