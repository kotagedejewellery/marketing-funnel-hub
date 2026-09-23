"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { saveProduct } from "@/modules/admin/products/actions";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

const inputClass =
  "mt-2 min-h-11 w-full border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

export function ProductForm({ product }: { product: Product | null }) {
  const [state, action, pending] = useActionState(saveProduct, {
    message: "",
    errors: {},
  });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <div>
        <label htmlFor="name" className="font-medium">
          Nama produk / kebutuhan
        </label>
        <input
          id="name"
          name="name"
          defaultValue={product?.name ?? ""}
          className={inputClass}
          required
          maxLength={120}
        />
        <FieldError message={state.errors.name} />
      </div>
      <div>
        <label htmlFor="slug" className="font-medium">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={product?.slug ?? ""}
          className={inputClass}
          required
          maxLength={120}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="wedding-ring"
        />
        <FieldError message={state.errors.slug} />
      </div>
      <div>
        <label htmlFor="description" className="font-medium">
          Deskripsi publik
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          className={inputClass}
          rows={4}
          maxLength={2000}
        />
        <FieldError message={state.errors.description} />
      </div>
      <div>
        <label htmlFor="sortOrder" className="font-medium">
          Urutan tampil
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          max={2147483647}
          defaultValue={product?.sortOrder ?? 0}
          className={inputClass}
          required
        />
        <FieldError message={state.errors.sortOrder} />
      </div>
      <label className="flex min-h-11 items-center gap-3 font-medium">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={product?.isActive ?? true}
          className="size-5 accent-primary"
        />
        Aktif
      </label>
      <p className="text-sm leading-6 text-muted-foreground">
        Perubahan data ini berlaku pada semua Link Bio yang masih memakai data
        bawaan produk. Menonaktifkan produk akan menyembunyikannya dari seluruh
        Link Bio.
      </p>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-primary px-5 font-medium text-primary-foreground hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan produk"}
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
