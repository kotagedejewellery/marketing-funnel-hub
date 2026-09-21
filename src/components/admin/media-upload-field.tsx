"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { FormDialog } from "@/components/admin/form-dialog";
import { uploadMedia } from "@/modules/admin/media/actions";
import { maxImageBytes } from "@/modules/admin/media/validation";

export function MediaUploadField({
  entityType,
  entityId,
  label,
  previewUrl,
}: {
  entityType: "site" | "campaign" | "product";
  entityId: string;
  label: string;
  previewUrl: string | null;
}) {
  const [state, action, pending] = useActionState(uploadMedia, {
    ok: false,
    message: "",
  });
  const [fileError, setFileError] = useState("");

  return (
    <section className="rounded-2xl bg-card p-6 sm:p-8" aria-label={label}>
      <h2 className="font-serif text-2xl">{label}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Unggah atau perbarui gambar untuk konten publik.
      </p>
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt={`${label} saat ini`}
          width={640}
          height={360}
          sizes="(max-width: 768px) 100vw, 640px"
          className="mt-5 max-h-64 w-full border border-border bg-background object-contain p-4"
          unoptimized={process.env.NEXT_PUBLIC_APP_ENV === "local"}
        />
      ) : (
        <p className="mt-5 border border-dashed border-border bg-background px-5 py-8 text-sm text-muted-foreground">
          Belum ada gambar.
        </p>
      )}
      <div className="mt-6">
        <FormDialog
          title={`Unggah ${label.toLowerCase()}`}
          triggerLabel={
            previewUrl
              ? `Ganti ${label.toLowerCase()}`
              : `Unggah ${label.toLowerCase()}`
          }
        >
          <form action={action} className="space-y-4">
            <input type="hidden" name="entityType" value={entityType} />
            <input type="hidden" name="entityId" value={entityId} />
            <div>
              <label htmlFor={`media-${entityType}`} className="font-medium">
                Pilih gambar baru
              </label>
              <input
                id={`media-${entityType}`}
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="mt-2 block w-full text-sm file:mr-4 file:min-h-11 file:cursor-pointer file:border file:border-border file:bg-background file:px-4 file:font-medium hover:file:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (
                    file &&
                    (file.size > maxImageBytes ||
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        file.type,
                      ))
                  ) {
                    setFileError("Gunakan JPEG, PNG, atau WebP maksimal 5 MB.");
                    event.currentTarget.value = "";
                  } else {
                    setFileError("");
                  }
                }}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                JPEG, PNG, atau WebP; maksimal 5 MB.
              </p>
            </div>
            {fileError && (
              <p role="alert" className="text-sm text-destructive">
                {fileError}
              </p>
            )}
            <p role="status" aria-live="polite" className="text-sm">
              {state.message}
            </p>
            {pending && (
              <progress aria-label="Mengunggah gambar" className="w-full" />
            )}
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 cursor-pointer border border-border px-4 font-medium hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50"
            >
              {pending ? "Mengunggah..." : "Unggah gambar"}
            </button>
          </form>
        </FormDialog>
      </div>
    </section>
  );
}
