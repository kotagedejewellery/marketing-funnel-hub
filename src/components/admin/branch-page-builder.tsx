"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  PageDataManagerProvider,
  type PageDataCanvasBlock,
  type PageDataSelection,
  type PageDataToolKey,
} from "@/components/admin/page-data-manager-context";
import {
  publishPageBuilder,
  savePageBuilderDraft,
  uploadPageBuilderImage,
} from "@/modules/page-builder/actions";
import { sectionSupportsPublicTitle } from "@/modules/admin/branches/page-validation";
import {
  pageBuilderBlocksSchema,
  pageBuilderPublishBlocksSchema,
  type PageBuilderBlock,
  type PageBuilderBlockInput,
  type PageBuilderFormField,
} from "@/modules/page-builder/schema";
import { metaCtaEventNames } from "@/modules/tracking/meta-event";
import { maxImageBytes } from "@/modules/admin/media/validation";

type Catalog = {
  sections: {
    sectionKey: string;
    label: string;
    publicTitle?: string | null;
  }[];
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
type SectionBlock = Extract<PageBuilderBlock, { type: "section" }>;
type SectionTitle = NonNullable<SectionBlock["title"]>;
type TypographyValues = Partial<
  Pick<
    SectionTitle,
    "fontSize" | "fontUnit" | "lineHeight" | "isBold" | "isItalic" | "textAlign"
  >
>;

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
  initialRevision = null,
  publishedBlocks: initialPublishedBlocks = initialBlocks,
  isPublished: initialIsPublished = false,
  publishedAt: initialPublishedAt = null,
  privacyUrl = null,
  catalog,
  dataTools,
  preview,
}: {
  branchId: string;
  branchName: string;
  initialBlocks: PageBuilderBlock[];
  initialRevision?: number | null;
  publishedBlocks?: PageBuilderBlock[];
  isPublished?: boolean;
  publishedAt?: string | null;
  privacyUrl?: string | null;
  catalog: Catalog;
  dataTools: Record<PageDataToolKey, ReactNode>;
  preview: ReactNode;
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(initialBlocks);
  const [savedBlocks, setSavedBlocks] = useState(initialBlocks);
  const [savedRevision, setSavedRevision] = useState(initialRevision);
  const [publishedBlocks, setPublishedBlocks] = useState(
    initialPublishedBlocks,
  );
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [publishedAt, setPublishedAt] = useState(initialPublishedAt);
  const [saveFailure, setSaveFailure] = useState<"error" | "conflict" | null>(
    null,
  );
  const [saveRetry, setSaveRetry] = useState(0);
  const [history, setHistory] = useState<BuilderHistory>({
    past: [],
    future: [],
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    initialBlocks[0]?.id ?? null,
  );
  const [message, setMessage] = useState("");
  const [pendingKind, setPendingKind] = useState<"autosave" | "publish" | null>(
    null,
  );
  const [sourceDataOpen, setSourceDataOpen] = useState(false);
  const [activeDataSelection, setActiveDataSelection] =
    useState<PageDataSelection | null>(null);
  const [canvasFocusId, setCanvasFocusId] = useState<string | null>(null);
  const [touchDragId, setTouchDragId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [removedBlock, setRemovedBlock] = useState<{
    block: PageBuilderBlock;
    index: number;
  } | null>(null);
  const touchDragIdRef = useRef<string | null>(null);
  const historyGroupRef = useRef<string | null>(null);
  const latestInitialRevisionRef = useRef(initialRevision);
  const sourceDataTriggerRef = useRef<HTMLButtonElement | null>(null);
  const canvasBlockRefs = useRef(new Map<string, HTMLLIElement>());
  const restoreSourceDataFocusRef = useRef(false);
  const selected = blocks.find((block) => block.id === selectedId) ?? null;
  const selectedDataContext = selected
    ? sourceDataContext(selected, catalog)
    : null;
  const pending = pendingKind !== null;
  const hasUnsavedChanges =
    JSON.stringify(blocks) !== JSON.stringify(savedBlocks);
  const hasUnpublishedChanges =
    !isPublished || JSON.stringify(blocks) !== JSON.stringify(publishedBlocks);
  const draftReadiness = pageBuilderBlocksSchema.safeParse(blocks);
  const publishReadiness = pageBuilderPublishBlocksSchema.safeParse(blocks);
  const referenceIssue = unavailableReferenceIssue(blocks, catalog);
  const saveIssue =
    referenceIssue ??
    (!draftReadiness.success
      ? "Lengkapi pengaturan blok yang masih belum valid."
      : null);
  const hasVisibleProductCta = blocks.some(
    (block) => block.type === "product_cta" && block.isVisible,
  );
  const hasVisibleBlock = blocks.some((block) => block.isVisible);
  const needsPrivacyUrl =
    !privacyUrl &&
    blocks.some((block) => block.type === "form" && block.isVisible);
  const publishIssue =
    blocks.length === 0
      ? "Tambahkan minimal satu blok sebelum menerbitkan."
      : (referenceIssue ??
        (!publishReadiness.success
          ? "Lengkapi pengaturan blok yang masih belum valid."
          : null));
  const hasActiveProductCta = catalog.products.some(
    (product) => product.assignment,
  );

  useEffect(() => {
    const refreshSourceData = () => {
      window.dispatchEvent(new Event("kgj:admin-saved"));
      router.refresh();
    };
    window.addEventListener("kgj:branch-source-saved", refreshSourceData);
    return () =>
      window.removeEventListener("kgj:branch-source-saved", refreshSourceData);
  }, [router]);

  useEffect(() => {
    if (latestInitialRevisionRef.current === initialRevision) return;
    if (hasUnsavedChanges) return;
    // Synchronizes fresh server props only when the local canvas is already saved.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBlocks(initialBlocks);
    setSavedBlocks(initialBlocks);
    setSavedRevision(initialRevision);
    setPublishedBlocks(initialPublishedBlocks);
    setIsPublished(initialIsPublished);
    setPublishedAt(initialPublishedAt);
    setSaveFailure(null);
    latestInitialRevisionRef.current = initialRevision;
    setSelectedId((current) =>
      initialBlocks.some((block) => block.id === current)
        ? current
        : (initialBlocks[0]?.id ?? null),
    );
  }, [
    hasUnsavedChanges,
    initialBlocks,
    initialIsPublished,
    initialPublishedAt,
    initialPublishedBlocks,
    initialRevision,
  ]);

  useEffect(() => {
    if (sourceDataOpen || !restoreSourceDataFocusRef.current) return;
    sourceDataTriggerRef.current?.focus();
    restoreSourceDataFocusRef.current = false;
  }, [sourceDataOpen]);

  useEffect(() => {
    if (sourceDataOpen || !canvasFocusId) return;
    const block = canvasBlockRefs.current.get(canvasFocusId);
    if (!block) return;
    block.scrollIntoView?.({ block: "nearest" });
    block.querySelector<HTMLButtonElement>("button")?.focus();
    setCanvasFocusId(null);
  }, [blocks, canvasFocusId, sourceDataOpen]);

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
      if (!window.confirm("Perubahan belum tersimpan otomatis. Tetap keluar?"))
        event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", warnInternalNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", warnInternalNavigation, true);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges || saveIssue || saveFailure) return;
    const blocksToSave = blocks;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        setPendingKind("autosave");
        try {
          const result = await savePageBuilderDraft(
            branchId,
            blocksToSave,
            savedRevision,
          );
          setMessage(
            result.ok ? "Perubahan tersimpan otomatis." : result.message,
          );
          if (result.ok) {
            setSavedBlocks(blocksToSave);
            setSavedRevision(result.revision);
            window.dispatchEvent(new Event("kgj:admin-saved"));
          } else {
            setSaveFailure(result.conflict ? "conflict" : "error");
          }
        } catch {
          setMessage("Penyimpanan otomatis belum berhasil. Coba lagi.");
          setSaveFailure("error");
        } finally {
          setPendingKind(null);
        }
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    blocks,
    branchId,
    hasUnsavedChanges,
    saveFailure,
    saveIssue,
    saveRetry,
    savedRevision,
  ]);

  function commitBlocks(
    transform: (current: PageBuilderBlock[]) => PageBuilderBlock[],
    historyGroup?: string,
  ) {
    setBlocks((current) => {
      const next = transform(current);
      if (JSON.stringify(next) === JSON.stringify(current)) return current;
      setSaveFailure(null);
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
    if (duplicate) {
      const existing = blocks.find(
        (item) =>
          item.type === "section" && item.sectionKey === next.sectionKey,
      );
      if (existing) {
        setSelectedId(existing.id);
        setMessage(`${label(existing, catalog)} sudah ada di kanvas.`);
        return existing.id;
      }
    }
    commitBlocks((current) => [...current, next]);
    setSelectedId(next.id);
    setRemovedBlock(null);
    setMessage(`${label(next, catalog)} ditambahkan ke kanvas.`);
    return next.id;
  }

  function addPageDataBlock(block: PageDataCanvasBlock) {
    const duplicate = blocks.find(
      (item) =>
        (block.type === "product_cta" &&
          item.type === "product_cta" &&
          item.assignmentId === block.assignmentId) ||
        (block.type === "link" &&
          item.type === "link" &&
          item.linkId === block.linkId),
    );
    if (duplicate) {
      setMessage(`${label(duplicate, catalog)} sudah ada di kanvas.`);
      closeSourceDataForCanvas(duplicate.id);
      return;
    }
    const id = add({ ...block, width: "full", isVisible: true });
    closeSourceDataForCanvas(id);
  }

  function isPageDataBlockOnCanvas(block: PageDataCanvasBlock) {
    return blocks.some(
      (item) =>
        (block.type === "product_cta" &&
          item.type === "product_cta" &&
          item.assignmentId === block.assignmentId) ||
        (block.type === "link" &&
          item.type === "link" &&
          item.linkId === block.linkId),
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

  function retrySave() {
    if (saveFailure === "conflict") {
      if (
        !window.confirm(
          "Perubahan lokal belum tersimpan akan hilang. Muat versi terbaru?",
        )
      )
        return;
      window.location.reload();
      return;
    }
    setMessage("Mencoba menyimpan kembali...");
    setSaveFailure(null);
    setSaveRetry((current) => current + 1);
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

  function closeSourceDataForCanvas(id: string) {
    restoreSourceDataFocusRef.current = false;
    setActiveDataSelection(null);
    setCanvasFocusId(id);
    setSourceDataOpen(false);
  }

  function publish() {
    if (publishIssue) {
      setMessage(publishIssue);
      return;
    }
    historyGroupRef.current = null;
    startTransition(async () => {
      setPendingKind("publish");
      try {
        const result = await publishPageBuilder(
          branchId,
          blocks,
          savedRevision,
        );
        setMessage(result.message);
        if (result.ok) {
          setSavedBlocks(blocks);
          setSavedRevision(result.revision);
          setPublishedBlocks(blocks);
          setIsPublished(true);
          setPublishedAt(new Date().toISOString());
          setSaveFailure(null);
          setHistory({ past: [], future: [] });
          setRemovedBlock(null);
          window.dispatchEvent(new Event("kgj:admin-saved"));
        } else {
          setSaveFailure(result.conflict ? "conflict" : "error");
        }
      } catch {
        setMessage(
          "Penyimpanan belum berhasil. Periksa koneksi lalu coba lagi.",
        );
        setSaveFailure("error");
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
            {branchName} · susun halaman, pratinjau tersimpan, lalu terbitkan.
          </p>
          <p
            role="status"
            aria-live="polite"
            className="mt-3 inline-flex min-h-7 items-center rounded-full bg-secondary px-3 text-xs font-semibold text-muted-foreground"
          >
            {pending
              ? pendingKind === "publish"
                ? "Menerbitkan perubahan..."
                : "Menyimpan otomatis..."
              : hasUnsavedChanges
                ? saveFailure === "conflict"
                  ? "Versi lain sudah tersimpan"
                  : saveFailure
                    ? "Penyimpanan otomatis belum berhasil"
                    : saveIssue
                      ? "Lengkapi pengaturan sebelum perubahan dapat disimpan"
                      : "Perubahan akan tersimpan otomatis"
                : "Perubahan tersimpan otomatis"}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            <span className="font-semibold">
              {hasUnpublishedChanges ? "Belum diterbitkan" : "Sudah terbit"}
            </span>{" "}
            {hasUnpublishedChanges
              ? "Perubahan tersimpan belum tampil di halaman publik."
              : publishedAt
                ? `Sama dengan halaman publik sejak ${new Intl.DateTimeFormat(
                    "id-ID",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    },
                  ).format(new Date(publishedAt))}.`
                : "Sama dengan halaman publik."}
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
              (!hasVisibleBlock
                ? "Tidak ada blok yang tampil di halaman publik."
                : hasVisibleProductCta
                  ? "CTA WhatsApp tampil dan pengaturan blok telah diperiksa."
                  : "Halaman tetap dapat diterbitkan tanpa CTA WhatsApp produk yang tampil.")}
          </p>
          {needsPrivacyUrl && (
            <p
              role="status"
              aria-live="polite"
              className="mt-2 text-xs leading-5 text-muted-foreground"
            >
              Form dapat menyimpan data pengunjung. Tambahkan URL kebijakan
              privasi di{" "}
              <Link
                href="/admin/settings"
                className="font-semibold underline underline-offset-4"
              >
                Pengaturan situs
              </Link>{" "}
              sebelum halaman digunakan secara publik.
            </p>
          )}
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
          {saveFailure && (
            <button
              type="button"
              onClick={retrySave}
              className="min-h-11 rounded-full border border-border px-4 text-sm font-bold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {saveFailure === "conflict" ? "Muat versi terbaru" : "Coba lagi"}
            </button>
          )}
          <button
            type="button"
            disabled={
              pending || Boolean(publishIssue) || !hasUnpublishedChanges
            }
            onClick={publish}
            aria-busy={pendingKind === "publish" || undefined}
            className="min-h-11 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
          >
            {pendingKind === "publish"
              ? "Menerbitkan..."
              : hasUnpublishedChanges
                ? "Terbitkan perubahan"
                : "Sudah diterbitkan"}
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
              label="Judul"
              onClick={() =>
                add({
                  type: "heading",
                  text: "Judul bagian",
                  level: "h2",
                  isBold: true,
                  isItalic: false,
                  textAlign: "left",
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
                  path: "",
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
                  showTitle: true,
                  description: "Isi data Anda, lalu lanjut ke WhatsApp.",
                  showDescription: true,
                  submitLabel: "Simpan data",
                  privacyNotice:
                    "Data Anda disimpan oleh KGJ untuk menindaklanjuti konsultasi.",
                  thankYouTitle: "Terima kasih",
                  thankYouMessage:
                    "Data Anda sudah kami terima. Lanjutkan ke WhatsApp untuk menghubungi cabang.",
                  continueLabel: "Lanjut ke WhatsApp",
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
                    ? "Judul daftar WhatsApp"
                    : section.sectionKey === "secondary_links"
                      ? "Judul daftar tautan"
                      : section.sectionKey === "social_links"
                        ? "Judul daftar media sosial"
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
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Kelola CTA dan tautan, lalu tambahkan item individual melalui Semua
            data halaman.
          </p>
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
                ref={(element) => {
                  if (element) canvasBlockRefs.current.set(block.id, element);
                  else canvasBlockRefs.current.delete(block.id);
                }}
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
                    {block.type === "form" && block.showTitle === false && (
                      <span>Judul disembunyikan</span>
                    )}
                    {block.type === "form" &&
                      block.showDescription === false && (
                        <span>Deskripsi disembunyikan</span>
                      )}
                    {blockConfigurationIssue(block) && (
                      <span className="font-semibold text-destructive">
                        {blockConfigurationIssue(block)}
                      </span>
                    )}
                    {sourceReferenceIssue(block, catalog) && (
                      <span className="font-semibold text-destructive">
                        {sourceReferenceIssue(block, catalog)}
                      </span>
                    )}
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
              Tambahkan blok bebas atau section data dari panel kiri. CTA dan
              tautan individual ditambahkan dari Semua data halaman.
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
                <>
                  <Editor
                    label="Teks"
                    value={selected.text}
                    onChange={(text) => update({ text }, "rich-text")}
                    onBlur={endHistoryGroup}
                  />
                  <TypographyEditor
                    key={selected.id}
                    typography={selected}
                    showFontSize
                    onChange={(patch) => update(patch, "rich-text-style")}
                  />
                </>
              )}
              {selected.type === "heading" && (
                <>
                  <Editor
                    label="Judul"
                    value={selected.text}
                    onChange={(text) => update({ text }, "heading")}
                    onBlur={endHistoryGroup}
                  />
                  <label className="block">
                    Level judul
                    <select
                      value={selected.level}
                      onChange={(event) =>
                        update(
                          {
                            level: event.target.value as Extract<
                              PageBuilderBlock,
                              { type: "heading" }
                            >["level"],
                          },
                          "heading-level",
                        )
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <option value="h1">H1</option>
                      <option value="h2">H2</option>
                      <option value="h3">H3</option>
                      <option value="h4">H4</option>
                      <option value="h5">H5</option>
                      <option value="h6">H6</option>
                    </select>
                  </label>
                  {selected.level === "h1" && (
                    <p className="text-xs leading-5 text-muted-foreground">
                      Periksa pratinjau: bila Profil menampilkan nama, halaman
                      sudah memiliki H1. Gunakan H2 untuk judul bagian.
                    </p>
                  )}
                  <TypographyEditor
                    key={selected.id}
                    typography={selected}
                    onChange={(patch) =>
                      update(
                        {
                          isBold: patch.isBold,
                          isItalic: patch.isItalic,
                          textAlign: patch.textAlign,
                        },
                        "heading-style",
                      )
                    }
                  />
                </>
              )}
              {selected.type === "section" &&
                sectionSupportsPublicTitle(selected.sectionKey) && (
                  <SectionTitleEditor
                    key={selected.id}
                    block={selected}
                    sourceTitle={
                      catalog.sections.find(
                        (section) => section.sectionKey === selected.sectionKey,
                      )?.publicTitle ?? null
                    }
                    label={
                      catalog.sections.find(
                        (section) => section.sectionKey === selected.sectionKey,
                      )?.label ?? label(selected, catalog)
                    }
                    onChange={(title) => update({ title }, "section-title")}
                  />
                )}
              {selected.type === "html" && (
                <>
                  <label className="block">
                    Kode HTML lama
                    <textarea
                      readOnly
                      value={selected.html}
                      className="mt-1 min-h-20 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-muted-foreground"
                    />
                  </label>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Blok lama ini dipertahankan agar konten yang sudah terbit
                    tidak berubah dan tidak dapat diedit. Blok baru menggunakan
                    Teks atau Judul. Script, iframe, dan kode yang tidak
                    didukung tidak akan ditampilkan.
                  </p>
                </>
              )}
              {selected.type === "image" && (
                <>
                  <ImageBlockEditor
                    branchId={branchId}
                    path={selected.path}
                    onUploaded={(path) => update({ path }, "image-upload")}
                  />
                  <Editor
                    label="Teks alternatif"
                    value={selected.alt}
                    onChange={(alt) => update({ alt }, "image-alt")}
                    onBlur={endHistoryGroup}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Unggah gambar sebelum menerbitkan halaman. Teks alternatif
                    diperlukan agar gambar tetap dapat dipahami pembaca layar.
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
                    {sourceReferenceIssue(selected, catalog) && (
                      <p
                        role="alert"
                        className="mt-2 text-sm leading-6 text-destructive"
                      >
                        {sourceReferenceIssue(selected, catalog)}
                      </p>
                    )}
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
          onAddToCanvas={addPageDataBlock}
          isOnCanvas={isPageDataBlockOnCanvas}
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
  onAddToCanvas,
  isOnCanvas,
  onClose,
}: {
  summary: Catalog["sourceSummary"];
  activeSelection: PageDataSelection | null;
  tools: Record<PageDataToolKey, ReactNode>;
  onShowAll: () => void;
  onSelect: (selection: PageDataSelection) => void;
  onAddToCanvas: (block: PageDataCanvasBlock) => void;
  isOnCanvas: (block: PageDataCanvasBlock) => boolean;
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
    <PageDataManagerProvider
      selection={activeSelection}
      onSelect={onSelect}
      onAddToCanvas={onAddToCanvas}
      isOnCanvas={isOnCanvas}
    >
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
                  halaman tersimpan otomatis; terbitkan perubahan saat siap.
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

function fieldOptionIssue(field: PageBuilderFormField) {
  if (field.type !== "select" && field.type !== "radio") return null;
  if (field.options.length < 2) return "Tambahkan minimal dua pilihan.";
  if (field.options.some((option) => !option.trim()))
    return "Setiap pilihan harus diisi.";
  const options = field.options.map((option) =>
    option.trim().toLocaleLowerCase("id-ID"),
  );
  return new Set(options).size !== options.length
    ? "Pilihan tidak boleh sama."
    : null;
}

function nextOptionLabel(options: string[]) {
  const used = new Set(options.map((option) => option.trim()));
  let number = 1;
  while (used.has(`Pilihan ${number}`)) number += 1;
  return `Pilihan ${number}`;
}

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

function spreadsheetColumn(index: number) {
  let remaining = index;
  let column = "";
  while (remaining > 0) {
    const remainder = (remaining - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return column;
}

function sheetMappings(
  fields: PageBuilderFormField[],
  current: { fieldName: string; column: string }[] = [],
) {
  const columns = new Map(
    current.map((mapping) => [mapping.fieldName, mapping.column]),
  );
  return fields.map((field, index) => ({
    fieldName: field.name,
    column: columns.get(field.name) ?? spreadsheetColumn(index + 1),
  }));
}

const formMetaEventOptions = metaCtaEventNames.filter(
  (eventName) => eventName !== "Contact",
);

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
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    form.fields[0]?.id ?? null,
  );
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState<number | null>(
    null,
  );
  const [dragOverOptionIndex, setDragOverOptionIndex] = useState<number | null>(
    null,
  );
  const [touchDragFieldId, setTouchDragFieldId] = useState<string | null>(null);
  const touchDragFieldIdRef = useRef<string | null>(null);
  const hasSelectedCta = ctaProducts.some(
    (product) => product.assignment?.id === form.assignmentId,
  );
  const selectedCta = ctaProducts.find(
    (product) => product.assignment?.id === form.assignmentId,
  );
  const activeField =
    form.fields.find((field) => field.id === selectedFieldId) ?? form.fields[0];
  const updateFields = (
    transform: (fields: PageBuilderFormField[]) => PageBuilderFormField[],
    historyGroup?: string,
  ) => {
    const fields = transform(form.fields);
    onChange(
      form.submissionDestination === "google_sheets"
        ? {
            fields,
            googleSheets: {
              ...(form.googleSheets ?? {
                spreadsheetUrl: "",
                sheetName: "",
              }),
              fieldMappings: sheetMappings(
                fields,
                form.googleSheets?.fieldMappings,
              ),
            },
          }
        : { fields },
      historyGroup,
    );
  };
  const updateField = (
    id: string,
    patch: Partial<(typeof form.fields)[number]>,
    historyGroup?: string,
  ) =>
    updateFields(
      (fields) =>
        fields.map((field) =>
          field.id === id ? { ...field, ...patch } : field,
        ),
      historyGroup,
    );

  function moveField(from: number, to: number) {
    if (from === to) return;
    updateFields((fields) => moveItem(fields, from, to));
  }

  function endTouchFieldDrag() {
    touchDragFieldIdRef.current = null;
    setTouchDragFieldId(null);
    setDragOverFieldIndex(null);
  }

  function addField(
    label: string,
    type: PageBuilderFormField["type"],
    required: boolean,
  ) {
    const field: PageBuilderFormField = {
      id: crypto.randomUUID(),
      name: generatedFieldName(
        label,
        form.fields.map((item) => item.name),
      ),
      label,
      type,
      placeholder: "",
      help: "",
      required,
      options:
        type === "select" || type === "radio" ? ["Pilihan 1", "Pilihan 2"] : [],
    };
    updateFields((fields) => [...fields, field]);
    setSelectedFieldId(field.id);
  }

  if (!activeField) return null;
  const activeFieldIndex = form.fields.findIndex(
    (field) => field.id === activeField.id,
  );
  const usesOptions =
    activeField.type === "select" || activeField.type === "radio";
  const optionError = fieldOptionIssue(activeField);
  const showTitle = form.showTitle !== false;
  const showDescription = form.showDescription !== false;
  const googleSheets = form.googleSheets ?? {
    spreadsheetUrl: "",
    sheetName: "",
    fieldMappings: sheetMappings(form.fields),
  };
  const standardFormMetaEvent = formMetaEventOptions.includes(
    form.metaEventName as (typeof formMetaEventOptions)[number],
  );
  const responseIdentity = form.responseIdentity ?? {};
  const nameFields = form.fields.filter((field) => field.type === "text");
  const contactFields = form.fields.filter((field) =>
    ["text", "tel", "email"].includes(field.type),
  );
  return (
    <div className="space-y-4">
      <fieldset className="space-y-3 border-b border-border pb-4">
        <legend className="font-semibold">Tampilan pengantar form</legend>
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={showTitle}
              aria-describedby="form-show-title-help"
              onChange={(event) =>
                onChange({ showTitle: event.target.checked }, "form-show-title")
              }
              className="mt-1 size-4"
            />
            Tampilkan judul form
          </label>
          <p
            id="form-show-title-help"
            className="mt-1 pl-7 text-xs leading-5 text-muted-foreground"
          >
            Judul tetap tersimpan untuk nama aksesibel form.
          </p>
        </div>
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={showDescription}
              aria-describedby="form-show-description-help"
              onChange={(event) =>
                onChange(
                  { showDescription: event.target.checked },
                  "form-show-description",
                )
              }
              className="mt-1 size-4"
            />
            Tampilkan deskripsi
          </label>
          <p
            id="form-show-description-help"
            className="mt-1 pl-7 text-xs leading-5 text-muted-foreground"
          >
            Deskripsi tetap tersimpan dan dapat ditampilkan kembali kapan saja.
          </p>
        </div>
      </fieldset>
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
      <fieldset className="space-y-3 border-y border-border py-4">
        <legend className="font-semibold">Tombol form</legend>
        <div>
          <span className="text-sm font-semibold">Posisi</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                ["left", "Kiri"],
                ["center", "Tengah"],
                ["right", "Kanan"],
              ] as const
            ).map(([value, label]) => (
              <ToggleButton
                key={value}
                pressed={(form.submitButtonAlign ?? "left") === value}
                onClick={() =>
                  onChange(
                    { submitButtonAlign: value },
                    "form-submit-button-align",
                  )
                }
              >
                {label}
              </ToggleButton>
            ))}
          </div>
        </div>
        <div>
          <span className="text-sm font-semibold">Lebar</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["auto", "Menyesuaikan isi"],
                ["full", "Penuh"],
              ] as const
            ).map(([value, label]) => (
              <ToggleButton
                key={value}
                pressed={(form.submitButtonWidth ?? "auto") === value}
                onClick={() =>
                  onChange(
                    { submitButtonWidth: value },
                    "form-submit-button-width",
                  )
                }
              >
                {label}
              </ToggleButton>
            ))}
          </div>
        </div>
        <div>
          <span className="text-sm font-semibold">Gaya</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                ["primary", "Utama gelap"],
                ["soft", "Lembut"],
                ["outline", "Outline"],
              ] as const
            ).map(([value, label]) => (
              <ToggleButton
                key={value}
                pressed={(form.submitButtonStyle ?? "primary") === value}
                onClick={() =>
                  onChange(
                    { submitButtonStyle: value },
                    "form-submit-button-style",
                  )
                }
              >
                {label}
              </ToggleButton>
            ))}
          </div>
        </div>
      </fieldset>
      <Editor
        label="Pemberitahuan privasi"
        value={form.privacyNotice}
        onChange={(privacyNotice) =>
          onChange({ privacyNotice }, "form-privacy-notice")
        }
        onBlur={onEditEnd}
      />
      <fieldset className="space-y-3 border-y border-border py-4">
        <legend className="font-semibold">Identitas pada daftar respons</legend>
        <p className="text-xs leading-5 text-muted-foreground">
          Pilih field yang akan membantu Marketing mengenali pengisi. Nama
          tampil penuh, kontak disamarkan di daftar, dan jawaban lengkap tetap
          hanya ada di detail respons.
        </p>
        <label className="block">
          Nama pengisi
          <select
            value={responseIdentity.nameField ?? ""}
            onChange={(event) =>
              onChange(
                {
                  responseIdentity: {
                    ...responseIdentity,
                    nameField: event.target.value || undefined,
                  },
                },
                "form-response-identity-name",
              )
            }
            className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
          >
            <option value="">Tidak ditampilkan</option>
            {nameFields.map((field) => (
              <option key={field.id} value={field.name}>
                {field.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Kontak pengisi
          <select
            value={responseIdentity.contactField ?? ""}
            onChange={(event) =>
              onChange(
                {
                  responseIdentity: {
                    ...responseIdentity,
                    contactField: event.target.value || undefined,
                  },
                },
                "form-response-identity-contact",
              )
            }
            className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
          >
            <option value="">Tidak ditampilkan</option>
            {contactFields.map((field) => (
              <option
                key={field.id}
                value={field.name}
                disabled={field.name === responseIdentity.nameField}
              >
                {field.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <fieldset className="space-y-3 border-y border-border py-4">
        <legend className="font-semibold">Penyimpanan respons</legend>
        <label className="block">
          Tujuan data
          <select
            value={form.submissionDestination ?? "database"}
            onChange={(event) => {
              const submissionDestination = event.target.value as
                "database" | "google_sheets";
              onChange(
                submissionDestination === "google_sheets"
                  ? {
                      submissionDestination,
                      googleSheets: {
                        ...googleSheets,
                        fieldMappings: sheetMappings(
                          form.fields,
                          googleSheets.fieldMappings,
                        ),
                      },
                    }
                  : { submissionDestination },
                "form-submission-destination",
              );
            }}
            className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
          >
            <option value="database">Sistem KGJ (terenkripsi)</option>
            <option value="google_sheets">Sistem KGJ + Google Sheets</option>
          </select>
        </label>
        <p className="text-xs leading-5 text-muted-foreground">
          Respons selalu tersimpan terenkripsi di Sistem KGJ. Google Sheets
          menerima salinan append-only setelahnya.
        </p>
        {form.submissionDestination === "google_sheets" && (
          <div className="space-y-3 border-t border-border pt-3">
            <Editor
              label="URL Google Sheets"
              value={googleSheets.spreadsheetUrl}
              onChange={(spreadsheetUrl) =>
                onChange(
                  { googleSheets: { ...googleSheets, spreadsheetUrl } },
                  "form-google-sheets-url",
                )
              }
              onBlur={onEditEnd}
            />
            <Editor
              label="Nama tab"
              value={googleSheets.sheetName}
              onChange={(sheetName) =>
                onChange(
                  { googleSheets: { ...googleSheets, sheetName } },
                  "form-google-sheets-tab",
                )
              }
              onBlur={onEditEnd}
            />
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">
                Kolom Google Sheets
              </legend>
              <p className="text-xs leading-5 text-muted-foreground">
                Tentukan huruf kolom untuk setiap pertanyaan, misalnya A atau
                AB. Bagikan akses Editor pada sheet kepada akun layanan Google
                yang dikonfigurasi technical admin.
              </p>
              {form.fields.map((field) => {
                const mapping = googleSheets.fieldMappings.find(
                  (item) => item.fieldName === field.name,
                ) ?? { fieldName: field.name, column: "" };
                return (
                  <label key={field.id} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {field.label}
                    </span>
                    <input
                      aria-label={`Kolom Google Sheets untuk ${field.label}`}
                      value={mapping.column}
                      onChange={(event) =>
                        onChange(
                          {
                            googleSheets: {
                              ...googleSheets,
                              fieldMappings: googleSheets.fieldMappings.map(
                                (item) =>
                                  item.fieldName === field.name
                                    ? {
                                        ...item,
                                        column:
                                          event.target.value.toUpperCase(),
                                      }
                                    : item,
                              ),
                            },
                          },
                          `form-google-sheets-column-${field.id}`,
                        )
                      }
                      onBlur={onEditEnd}
                      className="min-h-10 w-20 rounded-lg border border-border bg-background px-3 text-center font-mono"
                    />
                  </label>
                );
              })}
            </fieldset>
          </div>
        )}
      </fieldset>
      <fieldset className="space-y-3 border-b border-border pb-4">
        <legend className="font-semibold">Tracking submit form</legend>
        <label className="block">
          Event Meta setelah respons tersimpan
          <select
            value={
              !form.metaEventName
                ? ""
                : standardFormMetaEvent
                  ? form.metaEventName
                  : "custom"
            }
            onChange={(event) => {
              const value = event.target.value;
              onChange(
                {
                  metaEventName:
                    value === ""
                      ? null
                      : value === "custom"
                        ? "FormSubmitted"
                        : value,
                },
                "form-meta-event",
              );
            }}
            className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
          >
            <option value="">Jangan kirim event Meta</option>
            {formMetaEventOptions.map((eventName) => (
              <option key={eventName} value={eventName}>
                {eventName}
              </option>
            ))}
            <option value="custom">Event custom</option>
          </select>
        </label>
        {!standardFormMetaEvent && form.metaEventName && (
          <Editor
            label="Nama event custom"
            value={form.metaEventName}
            onChange={(metaEventName) =>
              onChange({ metaEventName }, "form-meta-event-custom")
            }
            onBlur={onEditEnd}
          />
        )}
        <p className="text-xs leading-5 text-muted-foreground">
          Event hanya dikirim setelah respons tersimpan dan tidak memuat jawaban
          form. Contact tetap hanya dikirim saat pengunjung menekan WhatsApp.
        </p>
      </fieldset>
      <details className="border-t border-border pt-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Pesan setelah form dikirim
        </summary>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Ditampilkan saat data berhasil tersimpan, sebelum pengunjung memilih
          untuk membuka WhatsApp.
        </p>
        <div className="mt-3 space-y-3">
          <Editor
            label="Judul terima kasih"
            value={form.thankYouTitle ?? "Terima kasih"}
            onChange={(thankYouTitle) =>
              onChange({ thankYouTitle }, "form-thank-you-title")
            }
            onBlur={onEditEnd}
          />
          <Editor
            label="Pesan terima kasih"
            value={
              form.thankYouMessage ??
              "Data Anda sudah kami terima. Lanjutkan ke WhatsApp untuk menghubungi cabang."
            }
            onChange={(thankYouMessage) =>
              onChange({ thankYouMessage }, "form-thank-you-message")
            }
            onBlur={onEditEnd}
          />
          <Editor
            label="Label tombol lanjut"
            value={form.continueLabel ?? "Lanjut ke WhatsApp"}
            onChange={(continueLabel) =>
              onChange({ continueLabel }, "form-continue-label")
            }
            onBlur={onEditEnd}
          />
        </div>
      </details>
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
        <fieldset>
          <legend className="font-semibold">Pertanyaan form</legend>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Seret untuk mengurutkan. Pilih pertanyaan untuk mengubah isinya.
          </p>
          <ol
            className="mt-3 space-y-2"
            onDragOver={(event) => event.preventDefault()}
          >
            {form.fields.map((field, index) => (
              <li
                key={field.id}
                data-form-field-index={index}
                draggable
                onDragStart={(event) =>
                  event.dataTransfer.setData("text/plain", String(index))
                }
                onDragEnd={() => setDragOverFieldIndex(null)}
                onDragEnter={() => setDragOverFieldIndex(index)}
                onDrop={(event) => {
                  const from = Number(event.dataTransfer.getData("text/plain"));
                  if (Number.isInteger(from)) moveField(from, index);
                  setDragOverFieldIndex(null);
                }}
                className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                  activeField.id === field.id
                    ? "border-[var(--kgj-accent)] bg-secondary"
                    : "border-border bg-background"
                } ${
                  dragOverFieldIndex === index
                    ? "border-dashed border-[var(--kgj-accent)]"
                    : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  data-form-field-drag-handle
                  data-dragging={touchDragFieldId === field.id || undefined}
                  className="touch-none cursor-grab text-[var(--kgj-accent)]"
                  onPointerDown={(event) => {
                    if (event.pointerType === "mouse") return;
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    touchDragFieldIdRef.current = field.id;
                    setTouchDragFieldId(field.id);
                  }}
                  onPointerMove={(event) => {
                    const draggedId = touchDragFieldIdRef.current;
                    if (!draggedId) return;
                    const target = document
                      .elementFromPoint(event.clientX, event.clientY)
                      ?.closest<HTMLElement>("[data-form-field-index]");
                    const targetIndex = Number(target?.dataset.formFieldIndex);
                    const from = form.fields.findIndex(
                      (item) => item.id === draggedId,
                    );
                    if (from >= 0 && Number.isInteger(targetIndex))
                      moveField(from, targetIndex);
                  }}
                  onPointerUp={endTouchFieldDrag}
                  onPointerCancel={endTouchFieldDrag}
                  onLostPointerCapture={endTouchFieldDrag}
                >
                  <DragHandleIcon />
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFieldId(field.id)}
                  className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="block truncate font-semibold">
                    {field.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formFieldTypes.find(([type]) => type === field.type)?.[1]}
                    {field.required ? " · Wajib" : " · Opsional"}
                    {(field.type === "select" || field.type === "radio") &&
                      ` · ${field.options.length} pilihan`}
                    {fieldOptionIssue(field) && (
                      <span className="ml-1 font-semibold text-destructive">
                        · Perlu diperbaiki
                      </span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveField(index, index - 1)}
                  className="min-h-10 px-1 text-xs font-bold disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2"
                  aria-label={`Naikkan ${field.label}`}
                >
                  Naik
                </button>
                <button
                  type="button"
                  disabled={index === form.fields.length - 1}
                  onClick={() => moveField(index, index + 1)}
                  className="min-h-10 px-1 text-xs font-bold disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2"
                  aria-label={`Turunkan ${field.label}`}
                >
                  Turun
                </button>
              </li>
            ))}
          </ol>
        </fieldset>
        <fieldset className="rounded-xl border border-border p-4">
          <legend className="px-1 font-semibold">Atur pertanyaan</legend>
          <label className="block font-semibold">
            Pertanyaan
            <input
              value={activeField.label}
              onChange={(event) =>
                updateField(
                  activeField.id,
                  { label: event.target.value },
                  `form-field-${activeField.id}-label`,
                )
              }
              onBlur={onEditEnd}
              className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3 font-normal"
            />
          </label>
          <label className="mt-3 block">
            Jenis jawaban
            <select
              value={activeField.type}
              onChange={(event) => {
                const type = event.target.value as PageBuilderFormField["type"];
                updateField(activeField.id, {
                  type,
                  options:
                    (type === "select" || type === "radio") &&
                    activeField.options.length < 2
                      ? ["Pilihan 1", "Pilihan 2"]
                      : activeField.options,
                });
              }}
              className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
            >
              {formFieldTypes.map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {usesOptions && (
            <fieldset className="mt-4 border-t border-border pt-4">
              <legend className="font-semibold">Pilihan jawaban</legend>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Tambahkan 2–20 pilihan berbeda. Seret atau gunakan Naik/Turun
                untuk mengurutkan.
              </p>
              <ol
                className="mt-3 space-y-2"
                onDragOver={(event) => event.preventDefault()}
              >
                {activeField.options.map((option, index) => (
                  <li
                    key={`${activeField.id}-${index}`}
                    draggable
                    onDragStart={(event) =>
                      event.dataTransfer.setData("text/plain", String(index))
                    }
                    onDragEnd={() => setDragOverOptionIndex(null)}
                    onDragEnter={() => setDragOverOptionIndex(index)}
                    onDrop={(event) => {
                      const from = Number(
                        event.dataTransfer.getData("text/plain"),
                      );
                      if (Number.isInteger(from) && from !== index) {
                        updateField(activeField.id, {
                          options: moveItem(activeField.options, from, index),
                        });
                      }
                      setDragOverOptionIndex(null);
                    }}
                    className={`flex items-center gap-2 rounded-lg border p-2 ${
                      dragOverOptionIndex === index
                        ? "border-dashed border-[var(--kgj-accent)]"
                        : "border-border"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="cursor-grab text-[var(--kgj-accent)]"
                    >
                      <DragHandleIcon />
                    </span>
                    <input
                      aria-label={`Pilihan ${index + 1}`}
                      value={option}
                      onChange={(event) =>
                        updateField(
                          activeField.id,
                          {
                            options: activeField.options.map(
                              (item, itemIndex) =>
                                itemIndex === index ? event.target.value : item,
                            ),
                          },
                          `form-field-${activeField.id}-options`,
                        )
                      }
                      onBlur={onEditEnd}
                      className="min-h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3"
                    />
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        updateField(activeField.id, {
                          options: moveItem(
                            activeField.options,
                            index,
                            index - 1,
                          ),
                        })
                      }
                      className="min-h-10 px-1 text-xs font-bold disabled:opacity-40"
                      aria-label={`Naikkan pilihan ${index + 1}`}
                    >
                      Naik
                    </button>
                    <button
                      type="button"
                      disabled={index === activeField.options.length - 1}
                      onClick={() =>
                        updateField(activeField.id, {
                          options: moveItem(
                            activeField.options,
                            index,
                            index + 1,
                          ),
                        })
                      }
                      className="min-h-10 px-1 text-xs font-bold disabled:opacity-40"
                      aria-label={`Turunkan pilihan ${index + 1}`}
                    >
                      Turun
                    </button>
                    <button
                      type="button"
                      disabled={activeField.options.length <= 2}
                      onClick={() =>
                        updateField(activeField.id, {
                          options: activeField.options.filter(
                            (_, optionIndex) => optionIndex !== index,
                          ),
                        })
                      }
                      className="min-h-10 px-1 text-xs font-bold text-destructive disabled:opacity-40"
                      aria-label={`Hapus pilihan ${index + 1}`}
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                disabled={activeField.options.length >= 20}
                onClick={() =>
                  updateField(activeField.id, {
                    options: [
                      ...activeField.options,
                      nextOptionLabel(activeField.options),
                    ],
                  })
                }
                className="mt-3 min-h-10 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-secondary disabled:opacity-40"
              >
                Tambah pilihan
              </button>
              {optionError && (
                <p
                  role="alert"
                  className="mt-2 text-xs leading-5 text-destructive"
                >
                  {optionError}
                </p>
              )}
            </fieldset>
          )}
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeField.required}
              onChange={(event) =>
                updateField(activeField.id, { required: event.target.checked })
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
                  value={activeField.placeholder}
                  onChange={(event) =>
                    updateField(
                      activeField.id,
                      { placeholder: event.target.value },
                      `form-field-${activeField.id}-placeholder`,
                    )
                  }
                  onBlur={onEditEnd}
                  className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
                />
              </label>
              <label className="block">
                Teks bantuan (opsional)
                <input
                  value={activeField.help}
                  onChange={(event) =>
                    updateField(
                      activeField.id,
                      { help: event.target.value },
                      `form-field-${activeField.id}-help`,
                    )
                  }
                  onBlur={onEditEnd}
                  className="mt-1 min-h-10 w-full rounded-lg border border-border bg-background px-3"
                />
              </label>
              <p className="text-xs leading-5 text-muted-foreground">
                ID respons dibuat otomatis dan tidak berubah agar respons serta
                ekspor lama tetap terbaca.
              </p>
            </div>
          </details>
          {form.fields.length > 1 && (
            <button
              type="button"
              onClick={() => {
                updateFields((fields) =>
                  fields.filter((field) => field.id !== activeField.id),
                );
                setSelectedFieldId(
                  form.fields[activeFieldIndex === 0 ? 1 : activeFieldIndex - 1]
                    ?.id ?? null,
                );
              }}
              className="mt-3 text-sm font-semibold text-destructive underline"
            >
              Hapus pertanyaan
            </button>
          )}
        </fieldset>
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
                addField(
                  label as string,
                  type as PageBuilderFormField["type"],
                  required as boolean,
                )
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

function moveItem<T>(items: T[], from: number, to: number) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  )
    return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
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

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 12 20" className="size-4 shrink-0" fill="currentColor">
      <circle cx="3" cy="3" r="1.25" />
      <circle cx="9" cy="3" r="1.25" />
      <circle cx="3" cy="10" r="1.25" />
      <circle cx="9" cy="10" r="1.25" />
      <circle cx="3" cy="17" r="1.25" />
      <circle cx="9" cy="17" r="1.25" />
    </svg>
  );
}

function ImageBlockEditor({
  branchId,
  path,
  onUploaded,
}: {
  branchId: string;
  path: string;
  onUploaded: (path: string) => void;
}) {
  const [state, action, pending] = useActionState(uploadPageBuilderImage, {
    ok: false,
    message: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadedPathRef = useRef<string | null>(null);
  const [selected, setSelected] = useState<{
    name: string;
    size: number;
    url: string;
    width?: number;
    height?: number;
  } | null>(null);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (!selected?.url) return;
    return () => URL.revokeObjectURL(selected.url);
  }, [selected?.url]);

  useEffect(() => {
    if (!state.ok || state.path === uploadedPathRef.current) return;
    uploadedPathRef.current = state.path;
    onUploaded(state.path);
  }, [onUploaded, state]);

  function selectFile(file: File) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size === 0 ||
      file.size > maxImageBytes
    ) {
      if (inputRef.current) inputRef.current.value = "";
      setSelected(null);
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

  const selectedWidth = selected?.width ?? 0;
  const selectedHeight = selected?.height ?? 0;
  const hasDimensions = Boolean(selectedWidth && selectedHeight);
  const ratioDiffers =
    hasDimensions && Math.abs(selectedWidth / selectedHeight - 4 / 5) > 0.03;
  const isSmall =
    hasDimensions && (selectedWidth < 1080 || selectedHeight < 1350);

  return (
    <form action={action} className="space-y-3" aria-busy={pending}>
      <input type="hidden" name="branchId" value={branchId} />
      <label className="block">
        Unggah gambar
        <input
          ref={inputRef}
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={pending}
          className="mt-1 block w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-background file:px-3 file:py-1.5 file:font-medium"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) selectFile(file);
          }}
        />
      </label>
      <p className="text-xs leading-5 text-muted-foreground">
        Disarankan 1080 Ã— 1350 px (4:5). JPEG, PNG, atau WebP; maksimal 5 MB.
      </p>
      {selected ? (
        <div className="rounded-xl border border-border bg-background p-3">
          <Image
            src={selected.url}
            alt="Pratinjau gambar yang dipilih"
            width={1080}
            height={1350}
            unoptimized
            className="aspect-[4/5] w-full rounded-lg bg-secondary object-cover"
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              setSelected((current) =>
                current?.url === selected.url
                  ? { ...current, width: naturalWidth, height: naturalHeight }
                  : current,
              );
            }}
            onError={() => {
              if (inputRef.current) inputRef.current.value = "";
              setSelected(null);
              setFileError("Gambar tidak dapat dibuka. Pilih file lain.");
            }}
          />
          <p
            className="mt-2 truncate text-sm font-medium"
            title={selected.name}
          >
            {selected.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {selected.width && selected.height
              ? `${selected.width} Ã— ${selected.height} px`
              : "Membaca dimensi..."}
          </p>
          {ratioDiffers ? (
            <p role="status" className="mt-2 text-xs text-[var(--kgj-accent)]">
              Rasio berbeda dari 4:5; gambar dapat terpotong pada halaman.
            </p>
          ) : null}
          {isSmall ? (
            <p role="status" className="mt-2 text-xs text-[var(--kgj-accent)]">
              Resolusi di bawah ukuran yang disarankan; gambar mungkin kurang
              tajam.
            </p>
          ) : null}
        </div>
      ) : null}
      {fileError ? (
        <p role="alert" className="text-sm text-destructive">
          {fileError}
        </p>
      ) : null}
      {path ? (
        <p className="text-sm text-muted-foreground">Gambar telah diunggah.</p>
      ) : null}
      {state.message ? (
        <p
          role={state.ok ? "status" : "alert"}
          className={`text-sm ${state.ok ? "text-muted-foreground" : "text-destructive"}`}
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || Boolean(fileError)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
      >
        {pending ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4 animate-spin motion-reduce:animate-none"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="42"
              strokeDashoffset="12"
            />
          </svg>
        ) : null}
        {pending ? "Mengunggah..." : path ? "Ganti gambar" : "Unggah gambar"}
      </button>
    </form>
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

function sectionTitleTextAlign(sectionKey: string): SectionTitle["textAlign"] {
  return sectionKey === "gallery" ? "center" : "left";
}

function SectionTitleEditor({
  block,
  sourceTitle,
  label,
  onChange,
}: {
  block: SectionBlock;
  sourceTitle: string | null;
  label: string;
  onChange: (title: SectionTitle) => void;
}) {
  const title: SectionTitle = block.title ?? {
    mode: "inherit",
    level: "h2",
    isBold: true,
    isItalic: false,
    textAlign: sectionTitleTextAlign(block.sectionKey),
  };
  const update = (patch: Partial<SectionTitle>) =>
    onChange({ ...title, ...patch });
  const titleTextError =
    title.mode === "custom" && !title.text?.trim()
      ? "Judul kustom tidak boleh kosong."
      : null;
  const titleInputId = `section-title-${block.id}`;
  const titleTextErrorId = `${titleInputId}-error`;

  return (
    <fieldset className="space-y-4 border-t border-border pt-4">
      <legend className="font-semibold">Judul bagian</legend>
      <label className="block">
        Mode judul bagian
        <select
          value={title.mode}
          onChange={(event) => {
            const mode = event.target.value as SectionTitle["mode"];
            update({
              mode,
              text:
                mode === "custom"
                  ? (title.text ?? sourceTitle ?? label)
                  : title.text,
            });
          }}
          className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2"
        >
          <option value="inherit">Gunakan judul bawaan</option>
          <option value="custom">Judul kustom</option>
          <option value="hidden">Sembunyikan judul</option>
        </select>
      </label>
      {title.mode === "inherit" && (
        <p className="text-xs leading-5 text-muted-foreground">
          {sourceTitle
            ? `Judul bawaan saat ini: ${sourceTitle}`
            : "Belum ada judul bawaan. Pilih Judul kustom untuk menambahkannya."}
        </p>
      )}
      {title.mode === "custom" && (
        <div>
          <label htmlFor={titleInputId} className="block">
            Teks judul bagian
          </label>
          <input
            id={titleInputId}
            value={title.text ?? ""}
            maxLength={160}
            onChange={(event) => update({ text: event.target.value })}
            aria-invalid={Boolean(titleTextError)}
            aria-describedby={titleTextError ? titleTextErrorId : undefined}
            className={`mt-1 min-h-11 w-full rounded-lg border bg-background px-3 py-2 ${
              titleTextError ? "border-destructive" : "border-border"
            }`}
          />
          {titleTextError ? (
            <p
              id={titleTextErrorId}
              role="alert"
              className="mt-1 text-xs leading-5 text-destructive"
            >
              {titleTextError}
            </p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Judul kustom tidak mengikuti perubahan judul di Sumber Data
              Halaman.
            </p>
          )}
        </div>
      )}
      {title.mode !== "hidden" && (
        <>
          <label className="block">
            Level judul bagian
            <select
              value={title.level}
              onChange={(event) =>
                update({
                  level: event.target.value as SectionTitle["level"],
                })
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
              <option value="h5">H5</option>
              <option value="h6">H6</option>
            </select>
          </label>
          <TypographyEditor
            key={`${block.id}-${title.mode}`}
            typography={title}
            showFontSize
            labelSuffix="judul bagian"
            onChange={update}
          />
        </>
      )}
    </fieldset>
  );
}

function TypographyEditor({
  typography,
  showFontSize = false,
  labelSuffix,
  onChange,
}: {
  typography: TypographyValues;
  showFontSize?: boolean;
  labelSuffix?: string;
  onChange: (patch: Partial<TypographyValues>) => void;
}) {
  const textLabel = labelSuffix ? `Ukuran ${labelSuffix}` : "Ukuran teks";
  const unitLabel = labelSuffix ? `Unit ${labelSuffix}` : "Unit";
  const lineHeightLabel = labelSuffix
    ? `Jarak baris ${labelSuffix}`
    : "Jarak baris";
  const displayLabel = labelSuffix
    ? `Tampilan ${labelSuffix}`
    : "Tampilan teks";
  const [fontSizeValue, setFontSizeValue] = useState(
    showFontSize ? String(typography.fontSize ?? 16) : "",
  );
  const [lineHeightValue, setLineHeightValue] = useState(
    showFontSize ? String(typography.lineHeight ?? 1.5) : "",
  );
  const [fontSizeError, setFontSizeError] = useState<string | null>(null);
  const [lineHeightError, setLineHeightError] = useState<string | null>(null);

  function updateFontSize(value: string) {
    setFontSizeValue(value);
    const size = Number(value);
    if (!Number.isInteger(size) || size < 8 || size > 200) {
      setFontSizeError(`${textLabel} harus antara 8 dan 200.`);
      return;
    }
    setFontSizeError(null);
    onChange({ fontSize: size });
  }

  function updateLineHeight(value: string) {
    setLineHeightValue(value);
    const lineHeight = Number(value);
    if (!Number.isFinite(lineHeight) || lineHeight < 1 || lineHeight > 2.5) {
      setLineHeightError(`${lineHeightLabel} harus antara 1 dan 2,5.`);
      return;
    }
    setLineHeightError(null);
    onChange({ lineHeight });
  }

  return (
    <fieldset className="space-y-3 border-t border-border pt-4">
      <legend className="font-semibold">{displayLabel}</legend>
      {showFontSize && (
        <div className="grid gap-3">
          <label className="block">
            {textLabel}
            <input
              type="number"
              min={8}
              max={200}
              value={fontSizeValue}
              onChange={(event) => updateFontSize(event.target.value)}
              aria-invalid={Boolean(fontSizeError)}
              aria-describedby={fontSizeError ? "font-size-error" : undefined}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
            {fontSizeError && (
              <span
                id="font-size-error"
                className="mt-1 block text-xs text-destructive"
              >
                {fontSizeError}
              </span>
            )}
          </label>
          <label className="block">
            {unitLabel}
            <select
              value={typography.fontUnit ?? "px"}
              onChange={(event) =>
                onChange({ fontUnit: event.target.value as "px" | "pt" })
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              <option value="px">px</option>
              <option value="pt">pt</option>
            </select>
          </label>
          <label className="block">
            {lineHeightLabel}
            <input
              type="number"
              min={1}
              max={2.5}
              step={0.1}
              value={lineHeightValue}
              onChange={(event) => updateLineHeight(event.target.value)}
              aria-invalid={Boolean(lineHeightError)}
              aria-describedby={
                lineHeightError ? "line-height-error" : undefined
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
            {lineHeightError && (
              <span
                id="line-height-error"
                className="mt-1 block text-xs text-destructive"
              >
                {lineHeightError}
              </span>
            )}
          </label>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <ToggleButton
          pressed={typography.isBold ?? false}
          onClick={() => onChange({ isBold: !(typography.isBold ?? false) })}
        >
          Tebal
        </ToggleButton>
        <ToggleButton
          pressed={typography.isItalic ?? false}
          onClick={() =>
            onChange({ isItalic: !(typography.isItalic ?? false) })
          }
        >
          Miring
        </ToggleButton>
      </div>
      <div
        className="grid grid-cols-3 gap-2"
        aria-label={labelSuffix ? `Perataan ${labelSuffix}` : "Perataan teks"}
      >
        {(
          [
            ["left", "Kiri"],
            ["center", "Tengah"],
            ["right", "Kanan"],
          ] as const
        ).map(([value, label]) => (
          <ToggleButton
            key={value}
            pressed={(typography.textAlign ?? "left") === value}
            onClick={() => onChange({ textAlign: value })}
          >
            {label}
          </ToggleButton>
        ))}
      </div>
    </fieldset>
  );
}

function ToggleButton({
  children,
  pressed,
  onClick,
}: {
  children: ReactNode;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-10 rounded-lg border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 ${
        pressed
          ? "border-[var(--kgj-accent)] bg-secondary"
          : "border-border bg-background hover:bg-secondary"
      }`}
    >
      {children}
    </button>
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
    const issue = sourceReferenceIssue(block, catalog);
    if (issue) return issue;
  }
  return null;
}

function sourceReferenceIssue(block: PageBuilderBlock, catalog: Catalog) {
  if (
    (block.type === "product_cta" || block.type === "form") &&
    !catalog.products.some(
      (product) => product.assignment?.id === block.assignmentId,
    )
  ) {
    const target =
      block.type === "form"
        ? `CTA WhatsApp untuk form ${block.title}`
        : "CTA WhatsApp";
    return `${target} tidak aktif. Atur data terkait.`;
  }
  if (
    block.type === "link" &&
    !catalog.links.some((link) => link.id === block.linkId)
  )
    return "Tautan tidak aktif. Atur data terkait.";
  if (
    block.type === "section" &&
    !catalog.sections.some((section) => section.sectionKey === block.sectionKey)
  )
    return "Section tidak aktif. Atur data terkait.";
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
  if (block.type === "heading") return "Judul";
  if (block.type === "html") return "HTML lama";
  if (block.type === "image") return "Gambar";
  if (block.type === "spacer") return "Pemisah & jarak";
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

function blockConfigurationIssue(block: PageBuilderBlock) {
  if (block.type === "image" && !block.path) return "Gambar belum diunggah";
  if (block.type === "image" && !block.alt)
    return "Teks alternatif gambar belum diisi";
  return null;
}
