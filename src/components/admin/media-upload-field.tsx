"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { FormDialog } from "@/components/admin/form-dialog";
import { clearMediaOverride, uploadMedia } from "@/modules/admin/media/actions";
import { maxImageBytes } from "@/modules/admin/media/validation";

type MediaType = "site" | "branch" | "campaign";
type SelectedImage = {
  name: string;
  size: number;
  url: string;
  width?: number;
  height?: number;
};

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export function MediaUploadField({
  entityType,
  entityId,
  label,
  previewUrl,
}: {
  entityType: MediaType;
  entityId: string;
  label: string;
  previewUrl: string | null;
}) {
  const isLogo = entityType === "site" || entityType === "branch";
  const recommendedSize = isLogo
    ? "800 × 800 px (1:1)"
    : "1080 × 1350 px (4:5)";

  return (
    <section className="rounded-2xl bg-card p-6 sm:p-8" aria-label={label}>
      <h2 className="font-serif text-2xl">{label}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Disarankan {recommendedSize}. JPEG, PNG, atau WebP; maksimal 5 MB.
      </p>
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt={`${label} saat ini`}
          width={isLogo ? 800 : 1080}
          height={isLogo ? 800 : 1350}
          sizes="(max-width: 768px) 100vw, 640px"
          className={`mt-5 w-full max-w-80 rounded-xl border border-border bg-secondary ${isLogo ? "aspect-square object-contain p-4" : "aspect-[4/5] object-cover"}`}
          unoptimized={process.env.NEXT_PUBLIC_APP_ENV === "local"}
        />
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-background px-5 py-8 text-sm text-muted-foreground">
          Belum ada gambar.
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <FormDialog
          title={`Unggah ${label.toLowerCase()}`}
          triggerLabel={
            previewUrl
              ? `Ganti ${label.toLowerCase()}`
              : `Unggah ${label.toLowerCase()}`
          }
        >
          <MediaUploadForm
            entityType={entityType}
            entityId={entityId}
            label={label}
            recommendedSize={recommendedSize}
          />
        </FormDialog>
        {previewUrl && entityType === "branch" ? (
          <FormDialog
            title="Gunakan gambar bawaan"
            triggerLabel="Gunakan gambar bawaan"
          >
            <MediaOverrideResetForm
              entityType={entityType}
              entityId={entityId}
            />
          </FormDialog>
        ) : null}
      </div>
    </section>
  );
}

function MediaUploadForm({
  entityType,
  entityId,
  label,
  recommendedSize,
}: {
  entityType: MediaType;
  entityId: string;
  label: string;
  recommendedSize: string;
}) {
  const [state, action, pending] = useActionState(uploadMedia, {
    ok: false,
    message: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const previewUrl = selected?.url;
  const isLogo = entityType === "site" || entityType === "branch";
  const recommendedWidth = isLogo ? 800 : 1080;
  const recommendedHeight = isLogo ? 800 : 1350;
  const recommendedRatio = isLogo ? "1:1" : "4:5";
  const inputId = `media-${entityType}-${entityId}`;
  const guideId = `media-guide-${entityType}-${entityId}`;

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function clearSelection() {
    if (inputRef.current) inputRef.current.value = "";
    setSelected(null);
    setFileError("");
  }

  function selectFile(file: File) {
    if (
      !acceptedTypes.includes(file.type) ||
      file.size === 0 ||
      file.size > maxImageBytes
    ) {
      clearSelection();
      setFileError("Gunakan JPEG, PNG, atau WebP maksimal 5 MB.");
      return;
    }
    setFileError("");
    setSelected({
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    });
  }

  const actualWidth = selected?.width ?? 0;
  const actualHeight = selected?.height ?? 0;
  const hasDimensions = actualWidth > 0 && actualHeight > 0;
  const ratioDiffers =
    hasDimensions &&
    Math.abs(
      actualWidth / actualHeight - recommendedWidth / recommendedHeight,
    ) > 0.03;
  const isSmall =
    hasDimensions &&
    (actualWidth < recommendedWidth || actualHeight < recommendedHeight);

  return (
    <form action={action} className="space-y-5" aria-busy={pending}>
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />
      <div>
        <p className="font-medium">Pilih gambar baru</p>
        <p id={guideId} className="mt-1 text-sm text-muted-foreground">
          Disarankan {recommendedSize}. JPEG, PNG, atau WebP; maksimal 5 MB.
        </p>
        <input
          ref={inputRef}
          id={inputId}
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={`Pilih ${label.toLowerCase()}`}
          aria-describedby={guideId}
          required
          disabled={pending}
          className="peer sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) selectFile(file);
          }}
        />
        <label
          htmlFor={inputId}
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
          className={`mt-3 flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 motion-reduce:transition-none ${dragging ? "border-[var(--kgj-accent)] bg-[var(--kgj-accent-soft)]" : "border-border bg-secondary hover:border-[var(--kgj-accent)]"} ${pending ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-7"
          >
            <path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
          <span className="font-medium">
            {selected
              ? "Ganti pilihan gambar"
              : "Seret gambar ke sini atau pilih file"}
          </span>
          <span className="text-sm text-muted-foreground">
            Klik untuk membuka file dari perangkat
          </span>
        </label>
      </div>
      {fileError && (
        <p role="alert" className="text-sm text-destructive">
          {fileError}
        </p>
      )}
      {selected && (
        <div className="rounded-xl border border-border bg-background p-4">
          <Image
            src={selected.url}
            alt="Pratinjau gambar yang dipilih"
            width={recommendedWidth}
            height={recommendedHeight}
            unoptimized
            className={`mx-auto w-full max-w-80 rounded-lg bg-secondary ${isLogo ? "aspect-square object-contain p-3" : "aspect-[4/5] object-cover"}`}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              setSelected((current) =>
                current?.url === selected.url &&
                (current.width !== naturalWidth ||
                  current.height !== naturalHeight)
                  ? { ...current, width: naturalWidth, height: naturalHeight }
                  : current,
              );
            }}
            onError={() => {
              clearSelection();
              setFileError("Gambar tidak dapat dibuka. Pilih file lain.");
            }}
          />
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium" title={selected.name}>
                {selected.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selected.size < 1024 * 1024
                  ? `${Math.ceil(selected.size / 1024)} KB`
                  : `${(selected.size / (1024 * 1024)).toFixed(2)} MB`}
                {hasDimensions
                  ? ` · ${selected.width} × ${selected.height} px`
                  : " · Membaca dimensi..."}
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              disabled={pending}
              className="min-h-11 rounded-full border border-border px-4 text-sm font-medium hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
            >
              Hapus pilihan
            </button>
          </div>
          {ratioDiffers && (
            <p role="status" className="mt-3 text-sm text-[var(--kgj-accent)]">
              Rasio berbeda dari {recommendedRatio}. Gambar{" "}
              {isLogo
                ? "akan menyesuaikan ruang logo"
                : "dapat terpotong pada Link Bio"}
              .
            </p>
          )}
          {isSmall && (
            <p role="status" className="mt-2 text-sm text-[var(--kgj-accent)]">
              Resolusi di bawah ukuran yang disarankan; gambar mungkin tampak
              kurang tajam.
            </p>
          )}
        </div>
      )}
      <FormFeedback state={state} pending={pending} />
      {pending && (
        <p
          role="status"
          className="rounded-xl bg-secondary px-4 py-3 text-sm font-medium"
          aria-live="polite"
        >
          Mengunggah gambar… Mohon tunggu hingga selesai.
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !hasDimensions}
        className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Mengunggah..." : "Unggah gambar"}
      </button>
    </form>
  );
}

function MediaOverrideResetForm({
  entityType,
  entityId,
}: {
  entityType: "branch";
  entityId: string;
}) {
  const [state, action, pending] = useActionState(clearMediaOverride, {
    ok: false,
    message: "",
  });
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />
      <p className="text-sm leading-6 text-muted-foreground">
        Gambar khusus tidak lagi dipakai. Halaman ini akan kembali mengikuti
        gambar dari Pengaturan Bersama.
      </p>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Ya, gunakan gambar bawaan"}
      </button>
    </form>
  );
}
