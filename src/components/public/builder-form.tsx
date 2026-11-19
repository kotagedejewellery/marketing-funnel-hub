"use client";

import { useEffect, useRef, useState } from "react";

import type { PageBuilderBlock } from "@/modules/page-builder/schema";
import type { PublicContent } from "@/modules/public-content/data";

type FormBlock = Extract<PageBuilderBlock, { type: "form" }>;

export function BuilderForm({
  block,
  branchSlug,
  product,
}: {
  block: FormBlock;
  branchSlug: string;
  product: PublicContent["products"][number];
}) {
  const [message, setMessage] = useState("");
  const [destination, setDestination] = useState<{
    url: string;
    label: string;
    continuationToken: string | null;
  } | null>(null);
  const [thankYouOpen, setThankYouOpen] = useState(false);
  const thankYouDialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!thankYouOpen || !thankYouDialogRef.current?.showModal) return;
    if (!thankYouDialogRef.current.open) thankYouDialogRef.current.showModal();
  }, [thankYouOpen]);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    const values = Object.fromEntries(
      block.fields.map((field) => [
        field.name,
        field.type === "checkbox"
          ? formData.get(field.name) === "on"
          : String(formData.get(field.name) ?? ""),
      ]),
    );
    try {
      const response = await fetch(`/api/forms/${branchSlug}/${block.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values,
          website: String(formData.get("website") ?? ""),
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        whatsappUrl?: string;
        ctaLabel?: string;
        continuationToken?: string;
        error?: { message?: string };
      };
      if (!result.ok || !result.whatsappUrl || !result.ctaLabel) {
        setMessage(
          result.error?.message ?? "Form belum dapat disimpan. Coba lagi.",
        );
        return;
      }
      setDestination({
        url: result.whatsappUrl,
        label: result.ctaLabel,
        continuationToken: result.continuationToken ?? null,
      });
      setThankYouOpen(true);
    } catch {
      setMessage("Form belum dapat disimpan. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  const thankYouTitle = block.thankYouTitle ?? "Terima kasih";
  const thankYouMessage =
    block.thankYouMessage ??
    "Data Anda sudah kami terima. Lanjutkan ke WhatsApp untuk menghubungi cabang.";
  const continueLabel = block.continueLabel ?? "Lanjut ke WhatsApp";

  function recordWhatsappContinuation() {
    if (!destination?.continuationToken) return;
    void fetch(`/api/forms/${branchSlug}/${block.id}/continue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        continuationToken: destination.continuationToken,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  if (destination)
    return (
      <>
        <section className="rounded-2xl bg-card p-5">
          <h2 className="font-serif text-xl font-bold">{thankYouTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {thankYouMessage}
          </p>
          <article data-track-product-id={product.id} className="mt-4">
            <a
              href={destination.url}
              data-track="whatsapp"
              data-track-branch-id={product.branches[0]?.id}
              onClick={recordWhatsappContinuation}
              className="flex min-h-14 items-center justify-center rounded-full bg-[#0e0d0d] px-5 font-bold text-[var(--primary-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {continueLabel}
            </a>
          </article>
        </section>
        <dialog
          ref={thankYouDialogRef}
          aria-labelledby={`form-thank-you-title-${block.id}`}
          aria-describedby={`form-thank-you-message-${block.id}`}
          onClose={() => setThankYouOpen(false)}
          className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border-0 bg-card p-0 text-foreground shadow-[0_24px_80px_-24px_rgba(40,33,28,0.5)] backdrop:bg-[rgba(40,33,28,0.6)]"
        >
          <div className="p-6 sm:p-7">
            <h2
              id={`form-thank-you-title-${block.id}`}
              className="font-serif text-2xl font-bold"
            >
              {thankYouTitle}
            </h2>
            <p
              id={`form-thank-you-message-${block.id}`}
              className="mt-3 text-sm leading-6 text-muted-foreground"
            >
              {thankYouMessage}
            </p>
            <article data-track-product-id={product.id} className="mt-6">
              <a
                href={destination.url}
                data-track="whatsapp"
                data-track-branch-id={product.branches[0]?.id}
                onClick={recordWhatsappContinuation}
                className="flex min-h-14 items-center justify-center rounded-full bg-[#0e0d0d] px-5 font-bold text-[var(--primary-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {continueLabel}
              </a>
            </article>
            <button
              type="button"
              onClick={() => thankYouDialogRef.current?.close()}
              className="mt-3 min-h-11 w-full rounded-full px-5 text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Nanti saja
            </button>
          </div>
        </dialog>
      </>
    );

  return (
    <form action={submit} className="rounded-2xl bg-card p-5">
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <h2 className="font-serif text-xl font-bold">{block.title}</h2>
      {block.description && (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {block.description}
        </p>
      )}
      <div className="mt-5 space-y-4">
        {block.fields.map((field) => (
          <label key={field.id} className="block text-sm font-semibold">
            {field.label}
            {field.required ? " *" : ""}
            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                required={field.required}
                placeholder={field.placeholder}
                className="mt-2 min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal"
              />
            ) : field.type === "select" ? (
              <select
                name={field.name}
                required={field.required}
                defaultValue=""
                className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal"
              >
                <option value="" disabled>
                  Pilih salah satu
                </option>
                {field.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : field.type === "radio" ? (
              <span className="mt-2 grid gap-2 font-normal">
                {field.options.map((option) => (
                  <span key={option}>
                    <input
                      type="radio"
                      name={field.name}
                      value={option}
                      required={field.required}
                    />{" "}
                    {option}
                  </span>
                ))}
              </span>
            ) : field.type === "checkbox" ? (
              <span className="mt-2 flex items-center gap-2 font-normal">
                <input
                  type="checkbox"
                  name={field.name}
                  required={field.required}
                />{" "}
                {field.placeholder || field.label}
              </span>
            ) : (
              <input
                name={field.name}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal"
              />
            )}
            {field.help && (
              <span className="mt-1 block font-normal text-muted-foreground">
                {field.help}
              </span>
            )}
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        {block.privacyNotice}
      </p>
      {message && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {message}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {pending ? "Menyimpan form" : ""}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-12 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : block.submitLabel}
      </button>
    </form>
  );
}
