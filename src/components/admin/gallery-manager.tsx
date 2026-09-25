"use client";

import Image from "next/image";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { FormDialog } from "@/components/admin/form-dialog";
import { PageOrderControls } from "@/components/admin/page-order-controls";
import type { galleryItems } from "@/lib/db/schema";
import { saveGalleryItem } from "@/modules/admin/gallery/actions";
import { maxImageBytes } from "@/modules/admin/media/validation";

type GalleryItem = Pick<
  typeof galleryItems.$inferSelect,
  | "id"
  | "branchId"
  | "title"
  | "description"
  | "altText"
  | "sortOrder"
  | "isActive"
> & { imageUrl: string };

const inputClass =
  "mt-2 min-h-12 w-full rounded-sm border border-border bg-background px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)]";
const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export function GalleryManager({
  branchId,
  items,
}: {
  branchId: string;
  items: GalleryItem[];
}) {
  return (
    <section className="rounded-2xl bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl">Galeri Produk</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Galeri visual ini berdiri sendiri dan tidak mengubah tombol
            WhatsApp. Tambahkan gambar sebanyak yang dibutuhkan; enam gambar
            pertama langsung tampil, sisanya berada di tombol “Lihat semua
            koleksi”.
          </p>
        </div>
        <FormDialog
          title="Tambah gambar galeri"
          triggerLabel="Tambah gambar"
          primary
        >
          <GalleryItemForm
            branchId={branchId}
            item={null}
            initialSortOrder={items.length}
          />
        </FormDialog>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
          Belum ada gambar galeri untuk cabang ini.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-background p-4"
            >
              <Image
                src={item.imageUrl}
                alt={item.altText}
                width={1080}
                height={1350}
                sizes="(max-width: 768px) 100vw, 360px"
                className="aspect-[4/5] w-full rounded-lg bg-secondary object-cover"
                unoptimized={process.env.NEXT_PUBLIC_APP_ENV === "local"}
              />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold break-words">
                    {item.title || "Tanpa judul"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.isActive ? "Tampil" : "Disembunyikan"}
                  </p>
                </div>
                <FormDialog title="Edit gambar galeri" triggerLabel="Edit">
                  <GalleryItemForm
                    branchId={branchId}
                    item={item}
                    initialSortOrder={item.sortOrder}
                  />
                </FormDialog>
              </div>
              <div className="mt-3">
                <PageOrderControls
                  kind="gallery"
                  id={item.id}
                  branchId={branchId}
                  index={index}
                  count={items.length}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GalleryItemForm({
  branchId,
  item,
  initialSortOrder,
}: {
  branchId: string;
  item: GalleryItem | null;
  initialSortOrder: number;
}) {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [state, action, pending] = useActionState(saveGalleryItem, {
    message: "",
    errors: {},
  });

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function selectFile(file: File) {
    if (
      !acceptedTypes.includes(file.type) ||
      file.size === 0 ||
      file.size > maxImageBytes
    ) {
      if (inputRef.current) inputRef.current.value = "";
      setPreview(null);
      setFileError("Gunakan JPEG, PNG, atau WebP maksimal 5 MB.");
      return;
    }
    setFileError("");
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="space-y-5" aria-busy={pending}>
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="branchId" value={branchId} />
      <input
        type="hidden"
        name="sortOrder"
        value={item?.sortOrder ?? initialSortOrder}
      />
      <div>
        <p className="font-medium">
          {item ? "Ganti gambar (opsional)" : "Gambar"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Disarankan 1080 × 1350 px (4:5). JPEG, PNG, atau WebP; maksimal 5 MB.
        </p>
        <input
          ref={inputRef}
          id={`${formId}-file`}
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={!item}
          disabled={pending}
          className="peer sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) selectFile(file);
          }}
        />
        <label
          htmlFor={`${formId}-file`}
          onDragOver={(event) => {
            event.preventDefault();
            if (!pending) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (pending) return;
            const file = event.dataTransfer.files[0];
            if (!file) return;
            const transfer = new DataTransfer();
            transfer.items.add(file);
            if (inputRef.current) inputRef.current.files = transfer.files;
            selectFile(file);
          }}
          className={`mt-3 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${dragging ? "border-[var(--kgj-accent)] bg-[var(--kgj-accent-soft)]" : "border-border bg-secondary hover:border-[var(--kgj-accent)]"}`}
        >
          <span className="font-medium">
            Seret gambar ke sini atau pilih file
          </span>
          <span className="mt-1 text-sm text-muted-foreground">
            {item
              ? "Kosongkan untuk mempertahankan gambar saat ini"
              : "Satu gambar per item galeri"}
          </span>
        </label>
        {(preview || item?.imageUrl) && (
          <Image
            src={preview || item?.imageUrl || ""}
            alt="Pratinjau gambar galeri"
            width={1080}
            height={1350}
            unoptimized
            className="mx-auto mt-4 aspect-[4/5] w-full max-w-64 rounded-lg bg-secondary object-cover"
          />
        )}
        {(fileError || state.errors.file) && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {fileError || state.errors.file}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${formId}-title`} className="font-medium">
          Judul (opsional)
        </label>
        <input
          id={`${formId}-title`}
          name="title"
          defaultValue={item?.title ?? ""}
          maxLength={160}
          className={inputClass}
        />
        <FieldError message={state.errors.title} />
      </div>
      <div>
        <label htmlFor={`${formId}-description`} className="font-medium">
          Keterangan (opsional)
        </label>
        <textarea
          id={`${formId}-description`}
          name="description"
          defaultValue={item?.description ?? ""}
          maxLength={1000}
          rows={3}
          className={inputClass}
        />
        <FieldError message={state.errors.description} />
      </div>
      <div>
        <label htmlFor={`${formId}-alt`} className="font-medium">
          Teks alternatif gambar
        </label>
        <input
          id={`${formId}-alt`}
          name="altText"
          defaultValue={item?.altText ?? ""}
          required
          maxLength={300}
          placeholder="Contoh: Sepasang cincin nikah emas putih"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Jelaskan isi gambar secara singkat untuk aksesibilitas.
        </p>
        <FieldError message={state.errors.altText} />
      </div>
      <label className="flex min-h-11 items-center gap-3 border-t border-border pt-5 font-medium">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={item?.isActive ?? true}
          className="size-5 accent-primary"
        />
        Tampilkan di Link Bio
      </label>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending || Boolean(fileError)}
        aria-busy={pending || undefined}
        className="min-h-12 rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan galeri"}
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
