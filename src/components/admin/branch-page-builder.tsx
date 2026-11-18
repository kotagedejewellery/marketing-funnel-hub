"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  PageDataManagerProvider,
  type PageDataSelection,
  type PageDataToolKey,
} from "@/components/admin/page-data-manager-context";
import {
  publishPageBuilder,
  savePageBuilderDraft,
} from "@/modules/page-builder/actions";
import {
  pageBuilderBlocksSchema,
  type PageBuilderBlock,
  type PageBuilderBlockInput,
} from "@/modules/page-builder/schema";

type Catalog = {
  sections: { sectionKey: string; label: string }[];
  products: { id: string; name: string; assignment: { id: string } | null }[];
  links: { id: string; label: string }[];
  sourceSummary: { id: string; label: string; detail: string }[];
};

type PageDataAction = PageDataSelection & {
  label: string;
};

type PageDataContext = { actions: PageDataAction[] };
type BuilderHistory = {
  past: PageBuilderBlock[][];
  future: PageBuilderBlock[][];
};

const pageDataToolGroups: { label: string; tools: PageDataToolKey[] }[] = [
  { label: "Identitas & struktur", tools: ["identity", "sections"] },
  { label: "Promosi & galeri", tools: ["campaigns", "gallery"] },
  { label: "Konversi", tools: ["cta", "formResponses"] },
  { label: "Kepercayaan & informasi", tools: ["reviews", "faq"] },
  { label: "Distribusi", tools: ["links"] },
  { label: "Teknis", tools: ["tracking"] },
];

const pageDataToolSummaryIds: Partial<Record<PageDataToolKey, string>> = {
  identity: "profile",
  sections: "sections",
  campaigns: "campaign",
  gallery: "gallery",
  cta: "cta",
  reviews: "reviews",
  faq: "faq",
  links: "links",
};

const sectionDataContexts: Record<
  Extract<PageBuilderBlock, { type: "section" }>["sectionKey"],
  PageDataContext
> = {
  profile_logo: { actions: [{ tool: "identity", label: "Profil & logo" }] },
  brand_header: { actions: [{ tool: "identity", label: "Profil & logo" }] },
  campaign_banner: {
    actions: [{ tool: "campaigns", label: "Konten unggulan" }],
  },
  gallery: { actions: [{ tool: "gallery", label: "Galeri produk" }] },
  products: { actions: [{ tool: "cta", label: "CTA WhatsApp" }] },
  google_reviews: { actions: [{ tool: "reviews", label: "Ulasan Google" }] },
  faq: { actions: [{ tool: "faq", label: "FAQ" }] },
  secondary_links: { actions: [{ tool: "links", label: "Tautan & sosial" }] },
  social_links: { actions: [{ tool: "links", label: "Tautan & sosial" }] },
  footer: { actions: [] },
};

export function BranchPageBuilder({
  branchId,
  branchName,
  initialBlocks,
  catalog,
  dataTools,
  preview,
}: {
  branchId: string;
  branchName: string;
  initialBlocks: PageBuilderBlock[];
  catalog: Catalog;
  dataTools: Record<PageDataToolKey, ReactNode>;
  preview: ReactNode;
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(initialBlocks);
  const [savedBlocks, setSavedBlocks] = useState(initialBlocks);
  const [history, setHistory] = useState<BuilderHistory>({
    past: [],
    future: [],
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    initialBlocks[0]?.id ?? null,
  );
  const [message, setMessage] = useState("");
  const [pendingKind, setPendingKind] = useState<"draft" | "publish" | null>(
    null,
  );
  const [sourceDataOpen, setSourceDataOpen] = useState(false);
  const [activeDataSelection, setActiveDataSelection] =
    useState<PageDataSelection | null>(null);
  const [touchDragId, setTouchDragId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [removedBlock, setRemovedBlock] = useState<{
    block: PageBuilderBlock;
    index: number;
  } | null>(null);
  const touchDragIdRef = useRef<string | null>(null);
  const historyGroupRef = useRef<string | null>(null);
  const sourceDataTriggerRef = useRef<HTMLButtonElement | null>(null);
  const restoreSourceDataFocusRef = useRef(false);
  const selected = blocks.find((block) => block.id === selectedId) ?? null;
  const selectedDataContext = selected
    ? sourceDataContext(selected, catalog)
    : null;
  const pending = pendingKind !== null;
  const hasUnsavedChanges =
    JSON.stringify(blocks) !== JSON.stringify(savedBlocks);
  const publishReadiness = pageBuilderBlocksSchema.safeParse(blocks);
  const referenceIssue = unavailableReferenceIssue(blocks, catalog);
  const saveIssue = referenceIssue;
  const publishIssue = !blocks.some(
    (block) => block.type === "product_cta" && block.isVisible,
  )
    ? "Tambahkan minimal satu CTA WhatsApp produk yang tampil."
    : (referenceIssue ??
      (!publishReadiness.success
        ? "Lengkapi pengaturan blok yang masih belum valid."
        : null));
  const hasActiveProductCta = catalog.products.some(
    (product) => product.assignment,
  );

  useEffect(() => {
    const refreshSourceData = () => router.refresh();
    window.addEventListener("kgj:branch-source-saved", refreshSourceData);
    return () =>
      window.removeEventListener("kgj:branch-source-saved", refreshSourceData);
  }, [router]);

  useEffect(() => {
    if (sourceDataOpen || !restoreSourceDataFocusRef.current) return;
    sourceDataTriggerRef.current?.focus();
    restoreSourceDataFocusRef.current = false;
  }, [sourceDataOpen]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const warnInternalNavigation = (event: globalThis.MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      )
        return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const nextUrl = new URL(link.href, window.location.href);
      if (
        nextUrl.origin !== window.location.origin ||
        nextUrl.href === window.location.href
      )
        return;
      if (!window.confirm("Perubahan draft belum disimpan. Tetap keluar?"))
        event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", warnInternalNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", warnInternalNavigation, true);
    };
  }, [hasUnsavedChanges]);

  function commitBlocks(
    transform: (current: PageBuilderBlock[]) => PageBuilderBlock[],
    historyGroup?: string,
  ) {
    setBlocks((current) => {
      const next = transform(current);
      if (JSON.stringify(next) === JSON.stringify(current)) return current;
      if (historyGroup !== historyGroupRef.current) {
        setHistory(({ past }) => ({
          past: [...past, current].slice(-50),
          future: [],
        }));
      }
      historyGroupRef.current = historyGroup ?? null;
      return next;
    });
  }

  function undo() {
    historyGroupRef.current = null;
    setHistory(({ past, future }) => {
      const previous = past.at(-1);
      if (!previous) return { past, future };
      setBlocks(previous);
      setMessage("Perubahan terakhir dibatalkan.");
      return {
        past: past.slice(0, -1),
        future: [blocks, ...future].slice(0, 50),
      };
    });
  }

  function redo() {
    historyGroupRef.current = null;
    setHistory(({ past, future }) => {
      const next = future[0];
      if (!next) return { past, future };
      setBlocks(next);
      setMessage("Perubahan dikembalikan.");
      return { past: [...past, blocks].slice(-50), future: future.slice(1) };
    });
  }

  useEffect(() => {
    const handleHistory = (event: globalThis.KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      if (event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", handleHistory);
    return () => window.removeEventListener("keydown", handleHistory);
  });

  function add(block: PageBuilderBlockInput) {
    historyGroupRef.current = null;
    const next = { ...block, id: crypto.randomUUID() } as PageBuilderBlock;
    const duplicate =
      next.type === "section" &&
      blocks.some(
        (item) =>
          item.type === "section" && item.sectionKey === next.sectionKey,
      );
    commitBlocks((current) => [...current, next]);
    setSelectedId(next.id);
    setRemovedBlock(null);
    setMessage(
      duplicate
        ? `${label(next, catalog)} sudah ada; blok kedua tetap ditambahkan.`
        : `${label(next, catalog)} ditambahkan ke kanvas.`,
    );
  }

  function update(patch: Partial<PageBuilderBlock>, historyGroup?: string) {
    commitBlocks(
      (current) =>
        current.map((block) =>
          block.id === selectedId
            ? ({ ...block, ...patch } as PageBuilderBlock)
            : block,
        ),
      historyGroup,
    );
  }

  function endHistoryGroup() {
    historyGroupRef.current = null;
  }

  function remove(id: string) {
    historyGroupRef.current = null;
    const index = blocks.findIndex((block) => block.id === id);
    const removed = blocks[index];
    if (!removed) return;
    commitBlocks((current) => current.filter((block) => block.id !== id));
    setSelectedId((current) => (current === id ? null : current));
    setRemovedBlock({ block: removed, index });
    setMessage(`${label(removed, catalog)} dihapus dari kanvas.`);
  }

  function undoRemove() {
    if (!removedBlock) return;
    historyGroupRef.current = null;
    commitBlocks((current) => [
      ...current.slice(0, removedBlock.index),
      removedBlock.block,
      ...current.slice(removedBlock.index),
    ]);
    setSelectedId(removedBlock.block.id);
    setMessage(`${label(removedBlock.block, catalog)} dikembalikan ke kanvas.`);
    setRemovedBlock(null);
  }

  function move(from: number, to: number) {
    if (from === to) return;
    historyGroupRef.current = null;
    commitBlocks((current) => {
      const next = [...current];
      const [block] = next.splice(from, 1);
      next.splice(to, 0, block);
      return next;
    });
    setMessage(
      `${label(blocks[from], catalog)} dipindahkan ke urutan ${to + 1} dari ${blocks.length}.`,
    );
    setRemovedBlock(null);
  }

  function moveBlockToIndex(id: string, to: number) {
    historyGroupRef.current = null;
    commitBlocks((current) => {
      const from = current.findIndex((block) => block.id === id);
      if (from < 0 || from === to) return current;
      const next = [...current];
      const [block] = next.splice(from, 1);
      next.splice(to, 0, block);
      return next;
    });
    setMessage("Urutan blok diperbarui.");
    setRemovedBlock(null);
  }

  function endTouchDrag() {
    touchDragIdRef.current = null;
    setTouchDragId(null);
    setDragOverIndex(null);
  }

  function openSourceData(
    event: MouseEvent<HTMLButtonElement>,
    selection: PageDataSelection | null = null,
  ) {
    restoreSourceDataFocusRef.current = false;
    sourceDataTriggerRef.current = event.currentTarget;
    setActiveDataSelection(selection);
    setSourceDataOpen(true);
  }

  function openCtaSourceData(event: MouseEvent<HTMLButtonElement>) {
    restoreSourceDataFocusRef.current = false;
    sourceDataTriggerRef.current = event.currentTarget;
    setActiveDataSelection({ tool: "cta" });
    setSourceDataOpen(true);
  }

  function closeSourceData() {
    restoreSourceDataFocusRef.current = true;
    setActiveDataSelection(null);
    setSourceDataOpen(false);
  }

  function save(publish: boolean) {
    const issue = publish ? publishIssue : saveIssue;
    if (issue) {
      setMessage(issue);
      return;
    }
    historyGroupRef.current = null;
    startTransition(async () => {
      setPendingKind(publish ? "publish" : "draft");
      try {
        const result = publish
          ? await publishPageBuilder(branchId, blocks)
          : await savePageBuilderDraft(branchId, blocks);
        setMessage(result.message);
        if (result.ok) {
          setSavedBlocks(blocks);
          setHistory({ past: [], future: [] });
          setRemovedBlock(null);
          window.dispatchEvent(new Event("kgj:admin-saved"));
        }
      } catch {
        setMessage(
          "Penyimpanan belum berhasil. Periksa koneksi lalu coba lagi.",
        );
      } finally {
        setPendingKind(null);
      }
    });
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-card"
      aria-labelledby="builder-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-5 border-b border-border bg-card px-5 py-5 sm:px-7">
        <div className="min-w-0">
          <h1 id="builder-title" className="font-serif text-3xl">
            Builder Link Bio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {branchName} · susun draft, pratinjau, lalu terbitkan.
          </p>
          <p
            role="status"
            aria-live="polite"
            className="mt-3 inline-flex min-h-7 items-center rounded-full bg-secondary px-3 text-xs font-semibold text-muted-foreground"
          >
            {pending
              ? pendingKind === "publish"
                ? "Menerbitkan perubahan..."
                : "Menyimpan draft..."
              : hasUnsavedChanges
                ? "Perubahan belum disimpan"
                : "Draft tersimpan"}
          </p>
          <p
            role="status"
            aria-live="polite"
            className={`mt-2 text-xs leading-5 ${
              publishIssue ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            <span className="font-semibold">
              {publishIssue ? "Belum siap diterbitkan" : "Siap diterbitkan"}
            </span>{" "}
            {publishIssue ??
              "CTA WhatsApp tampil dan pengaturan blok telah diperiksa."}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
          <button
            type="button"
            disabled={!history.past.length}
            onClick={undo}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-bold disabled:opacity-50"
          >
            Batalkan
          </button>
          <button
            type="button"
            disabled={!history.future.length}
            onClick={redo}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-bold disabled:opacity-50"
          >
            Ulangi
          </button>
          <button
            type="button"
            onClick={openSourceData}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-bold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Semua data halaman
          </button>
          <button
            type="button"
            disabled={pending || Boolean(saveIssue)}
            onClick={() => save(false)}
            aria-busy={pendingKind === "draft" || undefined}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-bold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
          >
            {pendingKind === "draft" ? "Menyimpan draft..." : "Simpan draft"}
          </button>
          <button
            type="button"
            disabled={pending || Boolean(publishIssue)}
            onClick={() => save(true)}
            aria-busy={pendingKind === "publish" || undefined}
            className="min-h-11 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
          >
            {pendingKind === "publish"
              ? "Menerbitkan..."
              : "Terbitkan perubahan"}
          </button>
        </div>
      </header>

      <div className="grid 2xl:grid-cols-[16rem_minmax(18rem,1fr)_24rem_minmax(20rem,24rem)]">
        <aside className="border-b border-border bg-card/70 p-5 2xl:border-r 2xl:border-b-0">
          <h2 className="font-semibold">Tambah blok</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <BuilderButton
              label="Teks"
              onClick={() =>
                add({
                  type: "rich_text",
                  text: "Tulis pesan Anda di sini.",
                  width: "full",
                  isVisible: true,
                })
              }
            />
            <BuilderButton
              label="HTML kustom"
              onClick={() =>
                add({
                  type: "html",
                  html: "<p>Konten baru</p>",
                  width: "full",
                  isVisible: true,
                })
              }
            />
            <BuilderButton
              label="Gambar"
              onClick={() =>
                add({
                  type: "image",
                  url: "https://",
                  alt: "",
                  width: "full",
                  isVisible: true,
                })
              }
            />
            <BuilderButton
              label="Pemisah & jarak"
              onClick={() =>
                add({
                  type: "spacer",
                  spacingPx: 32,
                  showDivider: false,
                  width: "full",
                  isVisible: true,
                })
              }
            />
            <BuilderButton
              label="Embed YouTube"
              onClick={() =>
                add({
                  type: "embed",
                  url: "https://www.youtube-nocookie.com/embed/",
                  width: "full",
                  isVisible: true,
                })
              }
            />
            <BuilderButton
              label={hasActiveProductCta ? "Form" : "Form (perlu CTA)"}
              onClick={(event) => {
                if (!hasActiveProductCta) {
                  setMessage(
                    "Tambahkan CTA WhatsApp aktif sebelum membuat form.",
                  );
                  openCtaSourceData(event);
                  return;
                }
                add({
                  type: "form",
                  title: "Konsultasi",
                  description: "Isi data Anda, lalu lanjut ke WhatsApp.",
                  submitLabel: "Simpan data",
                  privacyNotice:
                    "Data Anda disimpan oleh KGJ untuk menindaklanjuti konsultasi.",
                  assignmentId: catalog.products.find(
                    (product) => product.assignment,
                  )!.assignment!.id,
                  fields: [
                    {
                      id: crypto.randomUUID(),
                      name: "nama",
                      label: "Nama",
                      type: "text",
                      placeholder: "",
                      help: "",
                      required: true,
                      options: [],
                    },
                  ],
                  width: "full",
                  isVisible: true,
                });
              }}
            />
          </div>

          <h2 className="mt-7 font-semibold">Blok dari data halaman</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {catalog.sections.map((section) => (
              <BuilderButton
                key={section.sectionKey}
                label={
                  section.sectionKey === "products"
                    ? "Judul Tombol WhatsApp"
                    : section.sectionKey === "secondary_links"
                      ? "Judul Tautan tambahan"
                      : section.sectionKey === "social_links"
                        ? "Judul Media sosial"
                        : section.label
                }
                onClick={() =>
                  add({
                    type: "section",
                    sectionKey: section.sectionKey as Extract<
                      PageBuilderBlockInput,
                      { type: "section" }
                    >["sectionKey"],
                    width: "full",
                    isVisible: true,
                  })
                }
              />
            ))}
            {catalog.products.flatMap((product) =>
              product.assignment
                ? [
                    <BuilderButton
                      key={product.id}
                      label={`CTA ${product.name}`}
                      onClick={() =>
                        add({
                          type: "product_cta",
                          assignmentId: product.assignment!.id,
                          width: "full",
                          isVisible: true,
                        })
                      }
                    />,
                  ]
                : [],
            )}
            {catalog.links.map((link) => (
              <BuilderButton
                key={link.id}
                label={link.label}
                onClick={() =>
                  add({
                    type: "link",
                    linkId: link.id,
                    width: "full",
                    isVisible: true,
                  })
                }
              />
            ))}
          </div>

          <button
            type="button"
            onClick={openSourceData}
            className="mt-7 w-full border-t border-border pt-5 text-left text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Semua data halaman
          </button>
        </aside>

        <div className="min-h-[38rem] bg-[var(--kgj-accent-soft)]/35 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Kanvas halaman</h2>
            <span className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground">
              Seret untuk mengubah urutan
            </span>
          </div>
          <ol
            className="mt-4 space-y-3"
            onDragOver={(event) => event.preventDefault()}
          >
            {blocks.map((block, index) => (
              <li
                key={block.id}
                data-builder-index={index}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", String(index));
                  setDragOverIndex(index);
                }}
                onDragEnd={() => setDragOverIndex(null)}
                onDragEnter={() => setDragOverIndex(index)}
                onDrop={(event) => {
                  const from = Number(event.dataTransfer.getData("text/plain"));
                  if (Number.isInteger(from)) move(from, index);
                  setDragOverIndex(null);
                }}
                className={`flex min-h-[4.75rem] cursor-grab items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-[border-color,background-color,box-shadow] hover:border-[var(--kgj-accent)] hover:shadow-md focus-within:border-[var(--kgj-accent)] focus-within:shadow-md ${
                  selectedId === block.id
                    ? "border-[var(--kgj-accent)] ring-2 ring-[var(--kgj-accent-soft)]"
                    : "border-border"
                } ${touchDragId === block.id ? "opacity-60" : ""} ${
                  dragOverIndex === index && touchDragId !== block.id
                    ? "border-dashed border-[var(--kgj-accent)] bg-[var(--kgj-accent-soft)]/30"
                    : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  data-builder-drag-handle
                  data-dragging={touchDragId === block.id || undefined}
                  className="touch-none cursor-grab"
                  onPointerDown={(event) => {
                    if (event.pointerType === "mouse") return;
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    touchDragIdRef.current = block.id;
                    setTouchDragId(block.id);
                  }}
                  onPointerMove={(event) => {
                    const draggedId = touchDragIdRef.current;
                    if (!draggedId) return;
                    const target = document
                      .elementFromPoint(event.clientX, event.clientY)
                      ?.closest<HTMLElement>("[data-builder-index]");
                    const targetIndex = Number(target?.dataset.builderIndex);
                    if (Number.isInteger(targetIndex))
                      moveBlockToIndex(draggedId, targetIndex);
                  }}
                  onPointerUp={endTouchDrag}
                  onPointerCancel={endTouchDrag}
                  onLostPointerCapture={endTouchDrag}
                >
                  <svg
                    viewBox="0 0 12 20"
                    className="size-4 shrink-0 text-[var(--kgj-accent)]"
                  >
                    <circle cx="3" cy="3" r="1.25" fill="currentColor" />
                    <circle cx="9" cy="3" r="1.25" fill="currentColor" />
                    <circle cx="3" cy="10" r="1.25" fill="currentColor" />
                    <circle cx="9" cy="10" r="1.25" fill="currentColor" />
                    <circle cx="3" cy="17" r="1.25" fill="currentColor" />
                    <circle cx="9" cy="17" r="1.25" fill="currentColor" />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedId(block.id)}
                  className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="block font-semibold">
                    {label(block, catalog)}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${
                        block.isVisible
                          ? "bg-[var(--kgj-accent)]"
                          : "bg-muted-foreground"
                      }`}
                    />
                    {block.isVisible ? "Tampil" : "Disembunyikan"} ·{" "}
                    {block.width === "full" ? "Lebar penuh" : "Setengah lebar"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(block.id)}
                  className="min-h-11 px-2 text-xs font-bold text-destructive focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Hapus
                </button>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    className="min-h-11 px-1 text-xs font-bold disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2"
                    aria-label={`Naikkan ${label(block, catalog)}`}
                  >
                    Naik
                  </button>
                  <button
                    type="button"
                    disabled={index === blocks.length - 1}
                    onClick={() => move(index, index + 1)}
                    className="min-h-11 px-1 text-xs font-bold disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2"
                    aria-label={`Turunkan ${label(block, catalog)}`}
                  >
                    Turun
                  </button>
                </div>
              </li>
            ))}
          </ol>
          {blocks.length === 0 && (
            <p className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm leading-6 text-muted-foreground">
              Tambahkan blok bebas atau blok yang memakai data cabang dari panel
              kiri.
            </p>
          )}
          {removedBlock && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3 text-sm"
            >
              <span>Blok dihapus dari draft.</span>
              <button
                type="button"
                onClick={undoRemove}
                className="min-h-10 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Urungkan
              </button>
            </div>
          )}
        </div>

        <aside className="border-t border-border bg-card p-5 2xl:border-t-0 2xl:border-l">
          <h2 className="font-semibold">Pengaturan blok</h2>
          {selected ? (
            <div className="mt-4 space-y-4 text-sm">
              <p className="text-xs font-semibold text-muted-foreground">
                Sedang mengatur: {label(selected, catalog)}
              </p>
              <fieldset className="space-y-3 border-b border-border pb-4">
                <legend className="font-semibold">Tampilan blok</legend>
                <label className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.isVisible}
                    onChange={(event) =>
                      update({ isVisible: event.target.checked })
                    }
                  />
                  Tampilkan blok
                </label>
                <label className="block">
                  Lebar
                  <select
                    value={selected.width}
                    onChange={(event) =>
                      update({ width: event.target.value as "full" | "half" })
                    }
                    className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <option value="full">Penuh</option>
                    <option value="half">Setengah</option>
                  </select>
                </label>
              </fieldset>
              {selected.type === "rich_text" && (
                <Editor
                  label="Teks"
                  value={selected.text}
                  onChange={(text) => update({ text }, "rich-text")}
                  onBlur={endHistoryGroup}
                />
              )}
              {selected.type === "html" && (
                <>
                  <Editor
                    label="Kode HTML"
                    value={selected.html}
                    onChange={(html) => update({ html }, "html")}
                    onBlur={endHistoryGroup}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Tempel HTML untuk teks dan tautan dengan format khusus.
                    Script, iframe, dan kode yang tidak didukung tidak akan
                    ditampilkan. Untuk video, gunakan blok Embed YouTube.
                  </p>
                </>
              )}
              {selected.type === "image" && (
                <>
                  <Editor
                    label="URL gambar HTTPS"
                    value={selected.url}
                    onChange={(url) => update({ url }, "image-url")}
                    onBlur={endHistoryGroup}
                  />
                  <Editor
                    label="Teks alternatif"
                    value={selected.alt}
                    onChange={(alt) => update({ alt }, "image-alt")}
                    onBlur={endHistoryGroup}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Masukkan URL gambar HTTPS sebelum menyimpan draft.
                  </p>
                </>
              )}
              {selected.type === "embed" && (
                <>
                  <Editor
                    label="URL embed YouTube"
                    value={selected.url}
                    onChange={(url) => update({ url }, "embed-url")}
                    onBlur={endHistoryGroup}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Gunakan URL YouTube berformat /embed/ID-VIDEO sebelum
                    menyimpan draft.
                  </p>
                </>
              )}
              {selected.type === "spacer" && (
                <SpacerEditor
                  spacer={selected}
                  onChange={(patch) => update(patch)}
                />
              )}
              {selected.type === "form" && (
                <>
                  <FormEditor
                    form={selected}
                    products={catalog.products}
                    onChange={(form, historyGroup) =>
                      update(form, historyGroup)
                    }
                    onEditEnd={endHistoryGroup}
                    onManageCta={openCtaSourceData}
                  />
                  <Link
                    href={`/admin/form-responses?branchId=${branchId}&formId=${selected.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-bold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Lihat respons form ini
                  </Link>
                </>
              )}
              {selectedDataContext &&
                selectedDataContext.actions.length > 0 && (
                  <div className="border-t border-border pt-5">
                    <p className="font-semibold">Data untuk blok ini</p>
                    <div className="mt-3 grid gap-2">
                      {selectedDataContext.actions.map((action) => (
                        <button
                          key={`${action.tool}-${action.label}`}
                          type="button"
                          onClick={(event) => openSourceData(event, action)}
                          className="min-h-11 rounded-lg border border-border px-4 py-2 text-left text-sm font-bold transition-colors hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                          Atur {action.label}
                          <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
                            {catalog.sourceSummary.find(
                              (item) =>
                                item.id === pageDataToolSummaryIds[action.tool],
                            )?.detail ?? "Siap dikelola untuk cabang ini."}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Pilih blok pada kanvas untuk mengatur isinya.
            </p>
          )}
        </aside>

        <div className="border-t border-border p-5 2xl:border-t-0 2xl:border-l">
          {preview}
        </div>
      </div>
      {sourceDataOpen && (
        <SourceDataDrawer
          summary={catalog.sourceSummary}
          activeSelection={activeDataSelection}
          tools={dataTools}
          onShowAll={() => setActiveDataSelection(null)}
          onSelect={setActiveDataSelection}
          onClose={closeSourceData}
        />
      )}
      {message && (
        <p role="status" className="border-t border-border px-6 py-3 text-sm">
          {message}
        </p>
      )}
    </section>
  );
}

function SourceDataDrawer({
  summary,
  activeSelection,
  tools,
  onShowAll,
  onSelect,
  onClose,
}: {
  summary: Catalog["sourceSummary"];
  activeSelection: PageDataSelection | null;
  tools: Record<PageDataToolKey, ReactNode>;
  onShowAll: () => void;
  onSelect: (selection: PageDataSelection) => void;
  onClose: () => void;
}) {
  const activeTool = activeSelection?.tool ?? null;
  const portalRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const portal = portalRef.current;
    if (!portal) return;
    const bodyOverflow = document.body.style.overflow;
    const hiddenSiblings = (Array.from(document.body.children) as HTMLElement[])
      .filter((element) => element !== portal)
      .map((element) => ({
        element,
        inert: element.inert,
        ariaHidden: element.getAttribute("aria-hidden"),
      }));
    document.body.style.overflow = "hidden";
    hiddenSiblings.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });
    return () => {
      document.body.style.overflow = bodyOverflow;
      hiddenSiblings.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
    };
  }, []);

  useEffect(() => titleRef.current?.focus(), [activeTool]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target instanceof HTMLElement && event.target.closest("dialog"))
      return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => element.tabIndex >= 0);
    if (focusable.length === 0) {
      event.preventDefault();
      drawerRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (
      event.shiftKey &&
      (document.activeElement === titleRef.current ||
        document.activeElement === first)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <PageDataManagerProvider selection={activeSelection} onSelect={onSelect}>
      <div ref={portalRef} className="kgj-admin fixed inset-0 z-50">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[rgba(40,33,28,0.6)]"
        />
        <aside
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="source-data-title"
          aria-describedby="source-data-description"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="absolute inset-y-0 right-0 h-dvh w-full max-w-xl overflow-y-auto bg-card p-0 text-foreground shadow-[-16px_0_48px_-24px_rgba(40,33,28,0.45)]"
        >
          <header className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-4 border-b border-border bg-card px-6 py-5">
            <div>
              <h2
                ref={titleRef}
                id="source-data-title"
                tabIndex={-1}
                className="font-serif text-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {activeTool
                  ? `Atur ${pageDataToolLabel(activeTool)}`
                  : "Semua data halaman"}
              </h2>
              <p
                id="source-data-description"
                className="mt-1 text-sm leading-6 text-muted-foreground"
              >
                {activeTool
                  ? "Hanya pengaturan yang terkait dengan blok terpilih ditampilkan di sini."
                  : "Pilih data yang ingin dikelola untuk halaman cabang ini."}
              </p>
            </div>
            <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
              {activeTool && (
                <button
                  type="button"
                  onClick={onShowAll}
                  className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span aria-hidden="true">←</span>
                  Semua data
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 whitespace-nowrap px-2 text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Tutup
              </button>
            </div>
          </header>
          <div className="space-y-7 px-6 py-6">
            {activeTool ? (
              <>
                <p className="rounded-xl bg-secondary px-4 py-3 text-sm leading-6 text-muted-foreground">
                  Perubahan data di sini disimpan langsung. Posisi dan blok
                  halaman tetap perlu disimpan sebagai draft lalu diterbitkan.
                </p>
                {pageDataToolSummaryIds[activeTool] && (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {summary.find(
                      (item) => item.id === pageDataToolSummaryIds[activeTool],
                    )?.detail ??
                      "Belum ada data. Anda tetap dapat menambahkannya."}
                  </p>
                )}
                <div>{tools[activeTool]}</div>
              </>
            ) : (
              <>
                <dl className="divide-y divide-border border-y border-border text-sm">
                  {summary.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <dt className="font-semibold">{item.label}</dt>
                      <dd className="text-right text-muted-foreground">
                        {item.detail}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="space-y-6">
                  {pageDataToolGroups.map((group) => (
                    <section key={group.label} aria-label={group.label}>
                      <h3 className="text-sm font-semibold">{group.label}</h3>
                      <div className="mt-2 grid gap-2">
                        {group.tools.map((tool) => (
                          <div key={tool}>{tools[tool]}</div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </PageDataManagerProvider>,
    document.body,
  );
}

const formFieldTypes = [
  ["text", "Jawaban singkat"],
  ["textarea", "Jawaban panjang"],
  ["email", "Email"],
  ["tel", "Nomor telepon"],
  ["number", "Angka"],
  ["date", "Tanggal"],
  ["select", "Pilihan dropdown"],
  ["radio", "Pilih satu jawaban"],
  ["checkbox", "Persetujuan / centang"],
] as const;

function generatedFieldName(label: string, existingNames: string[]) {
  const base =
    label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/^[^a-z]+/, "")
      .slice(0, 36) || "pertanyaan";
  let name = base;
  let suffix = 2;
  while (existingNames.includes(name)) {
    name = `${base.slice(0, 36)}_${suffix}`;
    suffix += 1;
  }
  return name.slice(0, 40);
}

function FormEditor({
  form,
  products,
  onChange,
  onEditEnd,
  onManageCta,
}: {
  form: Extract<PageBuilderBlock, { type: "form" }>;
  products: Catalog["products"];
  onChange: (form: Partial<PageBuilderBlock>, historyGroup?: string) => void;
  onEditEnd: () => void;
  onManageCta: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const ctaProducts = products.filter((product) => product.assignment);
  const hasSelectedCta = ctaProducts.some(
    (product) => product.assignment?.id === form.assignmentId,
  );
  const selectedCta = ctaProducts.find(
    (product) => product.assignment?.id === form.assignmentId,
  );
  const updateField = (
    index: number,
    patch: Partial<(typeof form.fields)[number]>,
    historyGroup?: string,
  ) =>
    onChange(
      {
        fields: form.fields.map((field, fieldIndex) =>
          fieldIndex === index ? { ...field, ...patch } : field,
        ),
      },
      historyGroup,
    );
  return (
    <div className="space-y-4">
      <Editor
        label="Judul form"
        value={form.title}
        onChange={(title) => onChange({ title }, "form-title")}
        onBlur={onEditEnd}
      />
      <Editor
        label="Deskripsi"
        value={form.description}
        onChange={(description) =>
          onChange({ description }, "form-description")
        }
        onBlur={onEditEnd}
      />
      <Editor
        label="Label tombol"
        value={form.submitLabel}
        onChange={(submitLabel) =>
          onChange({ submitLabel }, "form-submit-label")
        }
        onBlur={onEditEnd}
      />
      <Editor
        label="Pemberitahuan privasi"
        value={form.privacyNotice}
        onChange={(privacyNotice) =>
          onChange({ privacyNotice }, "form-privacy-notice")
        }
        onBlur={onEditEnd}
      />
      {ctaProducts.length ? (
        <div>
          <label className="block">
            CTA WhatsApp tujuan
            <select
              value={hasSelectedCta ? form.assignmentId : ""}
              onChange={(event) =>
                onChange({ assignmentId: event.target.value })
              }
              className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
            >
              {!hasSelectedCta && (
                <option value="" disabled>
                  Pilih CTA WhatsApp tujuan
                </option>
              )}
              {ctaProducts.map((product) => (
                <option key={product.id} value={product.assignment!.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          {selectedCta && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              CTA saat ini: {selectedCta.name}. Ubah jika form ditujukan ke CTA
              lain.
            </p>
          )}
        </div>
      ) : (
        <div className="border-y border-border py-4">
          <p className="font-semibold">CTA WhatsApp tujuan belum tersedia.</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Tambahkan CTA WhatsApp aktif untuk cabang ini sebelum form dapat
            digunakan.
          </p>
          <button
            type="button"
            onClick={onManageCta}
            className="mt-3 min-h-11 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Atur CTA WhatsApp
          </button>
        </div>
      )}
      <div className="space-y-3 border-t border-border pt-4">
        <p className="font-semibold">Field form</p>
        {form.fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border border-border p-3">
            <label className="block font-semibold">
              Pertanyaan
              <input
                value={field.label}
                onChange={(event) =>
                  updateField(
                    index,
                    { label: event.target.value },
                    `form-field-${field.id}-label`,
                  )
                }
                onBlur={onEditEnd}
                className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3 font-normal"
              />
            </label>
            <label className="mt-3 block">
              Jenis jawaban
              <select
                value={field.type}
                onChange={(event) =>
                  updateField(index, {
                    type: event.target.value as typeof field.type,
                    options:
                      event.target.value === "select" ||
                      event.target.value === "radio"
                        ? field.options.length >= 2
                          ? field.options
                          : ["Pilihan 1", "Pilihan 2"]
                        : [],
                  })
                }
                className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
              >
                {formFieldTypes.map(([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {(field.type === "select" || field.type === "radio") && (
              <Editor
                label="Pilihan (satu per baris)"
                value={field.options.join("\n")}
                onChange={(value) =>
                  updateField(
                    index,
                    {
                      options: value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    },
                    `form-field-${field.id}-options`,
                  )
                }
                onBlur={onEditEnd}
              />
            )}
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(event) =>
                  updateField(index, { required: event.target.checked })
                }
              />{" "}
              Wajib diisi
            </label>
            <details className="mt-3 border-t border-border pt-3">
              <summary className="cursor-pointer text-sm font-semibold">
                Pengaturan tambahan
              </summary>
              <div className="mt-3 space-y-3">
                <label className="block">
                  Contoh jawaban (opsional)
                  <input
                    value={field.placeholder}
                    onChange={(event) =>
                      updateField(
                        index,
                        { placeholder: event.target.value },
                        `form-field-${field.id}-placeholder`,
                      )
                    }
                    onBlur={onEditEnd}
                    className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
                  />
                </label>
                <label className="block">
                  Teks bantuan (opsional)
                  <input
                    value={field.help}
                    onChange={(event) =>
                      updateField(
                        index,
                        { help: event.target.value },
                        `form-field-${field.id}-help`,
                      )
                    }
                    onBlur={onEditEnd}
                    className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
                  />
                </label>
              </div>
            </details>
            {form.fields.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    fields: form.fields.filter(
                      (_, fieldIndex) => fieldIndex !== index,
                    ),
                  })
                }
                className="mt-3 text-sm font-semibold underline"
              >
                Hapus field
              </button>
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {[
            ["Nama lengkap", "text", true],
            ["Nomor WhatsApp", "tel", true],
            ["Email", "email", false],
            ["Pertanyaan baru", "text", false],
            ["Pilihan", "select", false],
          ].map(([label, type, required]) => (
            <button
              key={String(label)}
              type="button"
              disabled={form.fields.length >= 20}
              onClick={() =>
                onChange({
                  fields: [
                    ...form.fields,
                    {
                      id: crypto.randomUUID(),
                      name: generatedFieldName(
                        label as string,
                        form.fields.map((item) => item.name),
                      ),
                      label: label as string,
                      type: type as (typeof form.fields)[number]["type"],
                      placeholder: "",
                      help: "",
                      required: required as boolean,
                      options:
                        type === "select" ? ["Pilihan 1", "Pilihan 2"] : [],
                    },
                  ],
                })
              }
              className="min-h-11 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-secondary disabled:opacity-40"
            >
              + {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpacerEditor({
  spacer,
  onChange,
}: {
  spacer: Extract<PageBuilderBlock, { type: "spacer" }>;
  onChange: (patch: Pick<typeof spacer, "spacingPx" | "showDivider">) => void;
}) {
  const spacingPx = spacer.spacingPx ?? legacySpacerPx(spacer.size);

  function changeSpacing(value: number) {
    onChange({
      spacingPx: Math.max(0, Math.min(240, Math.round(value))),
      showDivider: spacer.showDivider,
    });
  }

  return (
    <fieldset className="space-y-3 rounded-xl border border-border p-4">
      <legend className="px-1 font-semibold">Pemisah & jarak</legend>
      <label className="block">
        <span className="flex items-center justify-between gap-3">
          Jarak vertikal
          <output className="font-semibold tabular-nums">{spacingPx} px</output>
        </span>
        <input
          type="range"
          min="0"
          max="240"
          step="4"
          value={spacingPx}
          onChange={(event) => changeSpacing(event.currentTarget.valueAsNumber)}
          className="mt-3 w-full accent-[var(--kgj-accent)]"
        />
      </label>
      <label className="block">
        Isi jarak dalam piksel
        <input
          type="number"
          min="0"
          max="240"
          step="1"
          value={spacingPx}
          onChange={(event) => changeSpacing(event.currentTarget.valueAsNumber)}
          className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={spacer.showDivider}
          onChange={(event) =>
            onChange({
              spacingPx,
              showDivider: event.currentTarget.checked,
            })
          }
        />
        Tampilkan garis pemisah
      </label>
      <p className="text-xs leading-5 text-muted-foreground">
        Garis, bila dipilih, berada di tengah ruang vertikal ini.
      </p>
    </fieldset>
  );
}

function BuilderButton({
  label,
  onClick,
}: {
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-10 rounded-lg border border-border px-3 py-2 text-left font-medium transition-colors hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      + {label}
    </button>
  );
}

function Editor({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <label className="block">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="mt-1 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2"
      />
    </label>
  );
}

function legacySpacerPx(size: "sm" | "md" | "lg" | undefined) {
  return size === "sm" ? 16 : size === "lg" ? 64 : 32;
}

function unavailableReferenceIssue(
  blocks: PageBuilderBlock[],
  catalog: Catalog,
) {
  for (const block of blocks) {
    if (
      (block.type === "product_cta" || block.type === "form") &&
      !catalog.products.some(
        (product) => product.assignment?.id === block.assignmentId,
      )
    ) {
      const target =
        block.type === "form"
          ? `CTA WhatsApp untuk form ${block.title}`
          : "CTA WhatsApp untuk blok ini";
      return `${target} sudah tidak aktif. Atur data terkait terlebih dahulu.`;
    }
    if (
      block.type === "link" &&
      !catalog.links.some((link) => link.id === block.linkId)
    ) {
      return "Tautan untuk blok ini sudah tidak aktif. Atur data terkait terlebih dahulu.";
    }
    if (
      block.type === "section" &&
      !catalog.sections.some(
        (section) => section.sectionKey === block.sectionKey,
      )
    ) {
      return "Section untuk blok ini sudah tidak aktif. Atur data terkait terlebih dahulu.";
    }
  }
  return null;
}

function sourceDataContext(
  block: PageBuilderBlock,
  catalog: Catalog,
): PageDataContext | null {
  if (block.type === "section") return sectionDataContexts[block.sectionKey];
  if (block.type === "product_cta") {
    const product = catalog.products.find(
      (item) => item.assignment?.id === block.assignmentId,
    );
    return {
      actions: [
        {
          tool: "cta",
          label: product ? `CTA ${product.name}` : "CTA WhatsApp",
          target: { kind: "assignment", id: block.assignmentId },
        },
      ],
    };
  }
  if (block.type === "link") {
    return {
      actions: [
        {
          tool: "links",
          label: "Tautan & sosial",
          target: { kind: "link", id: block.linkId },
        },
      ],
    };
  }
  return null;
}

function pageDataToolLabel(tool: PageDataToolKey) {
  return (
    {
      identity: "Profil & logo",
      sections: "tampilan & susunan halaman",
      campaigns: "konten unggulan",
      gallery: "galeri produk",
      cta: "CTA WhatsApp",
      reviews: "ulasan Google",
      faq: "FAQ",
      links: "tautan & sosial",
      formResponses: "respons form",
      tracking: "Tracking Meta",
    } satisfies Record<PageDataToolKey, string>
  )[tool];
}

function label(block: PageBuilderBlock, catalog: Catalog) {
  if (block.type === "rich_text") return "Teks";
  if (block.type === "html") return "HTML kustom";
  if (block.type === "image") return "Gambar";
  if (block.type === "spacer") return "Pemisah & jarak";
  if (block.type === "embed") return "Embed YouTube";
  if (block.type === "section") {
    return (
      catalog.sections.find((item) => item.sectionKey === block.sectionKey)
        ?.label ?? "Section"
    );
  }
  if (block.type === "product_cta") {
    return (
      catalog.products.find(
        (item) => item.assignment?.id === block.assignmentId,
      )?.name ?? "CTA produk"
    );
  }
  if (block.type === "form") return block.title;
  return (
    catalog.links.find((item) => item.id === block.linkId)?.label ?? "Tautan"
  );
}
