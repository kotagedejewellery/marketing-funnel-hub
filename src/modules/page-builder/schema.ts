import sanitizeHtml from "sanitize-html";
import * as z from "zod";

import {
  branchSectionKeys,
  sectionSupportsPublicTitle,
} from "@/modules/admin/branches/page-validation";

const blockBase = z.object({
  id: z.uuid(),
  width: z.enum(["full", "half"]).default("full"),
  isVisible: z.boolean().default(true),
});

const typographyFields = {
  isBold: z.boolean().optional(),
  isItalic: z.boolean().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
};

const headingTypographyFields = {
  isBold: z.boolean().default(true),
  isItalic: z.boolean().default(false),
  textAlign: z.enum(["left", "center", "right"]).default("left"),
};

const sectionTitleSchema = z
  .object({
    mode: z.enum(["inherit", "custom", "hidden"]).default("inherit"),
    text: z.string().trim().max(160).optional(),
    level: z.enum(["h2", "h3", "h4", "h5", "h6"]).default("h2"),
    fontSize: z.number().int().min(8).max(200).optional(),
    fontUnit: z.enum(["px", "pt"]).optional(),
    lineHeight: z.number().min(1).max(2.5).optional(),
    ...headingTypographyFields,
  })
  .superRefine((title, context) => {
    if (title.mode === "custom" && !title.text) {
      context.addIssue({
        code: "custom",
        path: ["text"],
        message: "Judul kustom tidak boleh kosong.",
      });
    }
  });

export const pageBuilderFormFieldSchema = z
  .object({
    id: z.uuid(),
    name: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
    label: z.string().trim().min(1).max(120),
    type: z.enum([
      "text",
      "email",
      "tel",
      "number",
      "date",
      "textarea",
      "select",
      "radio",
      "checkbox",
    ]),
    placeholder: z.string().trim().max(160).default(""),
    help: z.string().trim().max(300).default(""),
    required: z.boolean().default(false),
    options: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  })
  .superRefine((field, context) => {
    if (
      (field.type === "select" || field.type === "radio") &&
      field.options.length < 2
    ) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Pilihan membutuhkan minimal dua opsi.",
      });
    }
    if (field.type === "select" || field.type === "radio") {
      const normalizedOptions = field.options.map((option) =>
        option.toLocaleLowerCase("id-ID"),
      );
      if (new Set(normalizedOptions).size !== normalizedOptions.length) {
        context.addIssue({
          code: "custom",
          path: ["options"],
          message: "Pilihan tidak boleh sama.",
        });
      }
    }
  });

export const pageBuilderBlockSchema = z.discriminatedUnion("type", [
  blockBase.extend({
    type: z.literal("rich_text"),
    text: z.string().trim().max(4000),
    fontSize: z.number().int().min(8).max(200).optional(),
    fontUnit: z.enum(["px", "pt"]).optional(),
    lineHeight: z.number().min(1).max(2.5).optional(),
    ...typographyFields,
  }),
  blockBase.extend({
    type: z.literal("heading"),
    text: z.string().trim().min(1).max(4000),
    level: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]),
    ...headingTypographyFields,
  }),
  blockBase.extend({
    type: z.literal("html"),
    html: z.string().trim().max(20000),
  }),
  blockBase.extend({
    type: z.literal("image"),
    url: z
      .string()
      .trim()
      .max(2048)
      .refine(
        (value) => value === "" || isHttpsUrl(value),
        "Gambar harus memakai URL HTTPS.",
      ),
    alt: z.string().trim().max(250),
  }),
  blockBase
    .extend({
      type: z.literal("spacer"),
      // Retained for layouts saved before the pixel control was introduced.
      size: z.enum(["sm", "md", "lg"]).optional(),
      spacingPx: z.number().int().min(0).max(240).optional(),
      showDivider: z.boolean().default(false),
    })
    .superRefine((block, context) => {
      if (block.spacingPx === undefined && block.size === undefined) {
        context.addIssue({
          code: "custom",
          message: "Pemisah membutuhkan jarak vertikal.",
        });
      }
    }),
  blockBase.extend({
    type: z.literal("embed"),
    url: z
      .string()
      .trim()
      .max(2048)
      .refine(
        (value) => value === "" || embedUrl(value) !== null,
        "Embed harus berupa URL YouTube /embed yang aman.",
      ),
  }),
  blockBase.extend({
    type: z.literal("form"),
    title: z.string().trim().min(1).max(160),
    showTitle: z.boolean().optional(),
    description: z.string().trim().max(1000).default(""),
    showDescription: z.boolean().optional(),
    submitLabel: z.string().trim().min(1).max(80).default("Simpan data"),
    privacyNotice: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .default("Data Anda disimpan oleh KGJ untuk menindaklanjuti konsultasi."),
    thankYouTitle: z.string().trim().min(1).max(160).optional(),
    thankYouMessage: z.string().trim().min(1).max(500).optional(),
    continueLabel: z.string().trim().min(1).max(80).optional(),
    assignmentId: z.uuid(),
    fields: z.array(pageBuilderFormFieldSchema).min(1).max(20),
  }),
  blockBase.extend({ type: z.literal("product_cta"), assignmentId: z.uuid() }),
  blockBase.extend({ type: z.literal("link"), linkId: z.uuid() }),
  blockBase.extend({
    type: z.literal("section"),
    sectionKey: z.enum(branchSectionKeys),
    title: sectionTitleSchema.optional(),
  }),
]);

export const pageBuilderBlocksSchema = z
  .array(pageBuilderBlockSchema)
  .max(60)
  .superRefine((blocks, context) => {
    if (new Set(blocks.map((block) => block.id)).size !== blocks.length) {
      context.addIssue({ code: "custom", message: "ID blok harus unik." });
    }
    for (const block of blocks) {
      if (
        block.type === "form" &&
        new Set(block.fields.map((field) => field.name)).size !==
          block.fields.length
      ) {
        context.addIssue({
          code: "custom",
          message: "Nama field form harus unik.",
        });
      }
    }
  });

export const pageBuilderPublishBlocksSchema =
  pageBuilderBlocksSchema.superRefine((blocks, context) => {
    const publishedSections = new Set<string>();
    blocks.forEach((block, index) => {
      if (block.type === "section") {
        if (!sectionSupportsPublicTitle(block.sectionKey)) return;
        if (publishedSections.has(block.sectionKey)) {
          context.addIssue({
            code: "custom",
            path: [index, "sectionKey"],
            message: "Bagian data hanya boleh ditampilkan sekali.",
          });
        }
        publishedSections.add(block.sectionKey);
      }
      if (block.type === "image" && !block.url) {
        context.addIssue({
          code: "custom",
          path: [index, "url"],
          message: "Masukkan URL gambar HTTPS sebelum menerbitkan.",
        });
      }
      if (block.type === "embed" && !block.url) {
        context.addIssue({
          code: "custom",
          path: [index, "url"],
          message: "Masukkan URL embed YouTube sebelum menerbitkan.",
        });
      }
    });
  });

export type PageBuilderBlock = z.infer<typeof pageBuilderBlockSchema>;
export type PageBuilderFormField = z.infer<typeof pageBuilderFormFieldSchema>;
export type PageBuilderBlockInput = PageBuilderBlock extends infer T
  ? T extends { id: string }
    ? Omit<T, "id">
    : never
  : never;

export function sanitizePageBuilderHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "a",
      "b",
      "br",
      "blockquote",
      "code",
      "em",
      "h2",
      "h3",
      "li",
      "ol",
      "p",
      "strong",
      "ul",
    ],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

export function embedUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (
    url.hostname === "www.youtube.com" &&
    /^\/embed\/[^/]+/.test(url.pathname)
  ) {
    return url.toString();
  }
  if (
    url.hostname === "www.youtube-nocookie.com" &&
    /^\/embed\/[^/]+/.test(url.pathname)
  ) {
    return url.toString();
  }
  return null;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
