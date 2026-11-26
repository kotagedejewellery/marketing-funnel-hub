import sanitizeHtml from "sanitize-html";
import * as z from "zod";

import {
  branchSectionKeys,
  sectionSupportsPublicTitle,
} from "@/modules/admin/branches/page-validation";
import { metaCtaEventOverrideSchema } from "@/modules/tracking/meta-event";

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

const googleSheetsUrlSchema = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return (
      url.hostname === "docs.google.com" &&
      /^\/spreadsheets\/d\/[A-Za-z0-9_-]{20,}(?:\/|$)/.test(url.pathname)
    );
  } catch {
    return false;
  }
}, "Gunakan URL Google Sheets yang valid.");

const googleSheetsIdSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9_-]{20,}$/,
    "Gunakan ID Spreadsheet Google Sheets yang valid.",
  );

const optionalGoogleSheetsIdSchema = z
  .union([googleSheetsIdSchema, z.literal("")])
  .optional();
const optionalGoogleSheetsUrlSchema = z
  .union([googleSheetsUrlSchema, z.literal("")])
  .optional();

const googleSheetsFieldMappingSchema = z.object({
  fieldName: z.string().trim().min(1).max(40),
  column: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{1,3}$/, "Gunakan kolom seperti A, B, atau AA."),
});

export const googleSheetsDestinationSchema = z
  .object({
    // spreadsheetUrl is retained solely for saved Form configurations created
    // before the editor moved to a canonical Spreadsheet ID.
    spreadsheetId: optionalGoogleSheetsIdSchema,
    spreadsheetUrl: optionalGoogleSheetsUrlSchema,
    sheetName: z.string().trim().min(1).max(100),
    fieldMappings: z.array(googleSheetsFieldMappingSchema).min(1).max(20),
  })
  .superRefine((destination, context) => {
    if (!destination.spreadsheetId && !destination.spreadsheetUrl)
      context.addIssue({
        code: "custom",
        path: ["spreadsheetId"],
        message: "Isi ID Spreadsheet Google Sheets.",
      });
    const columns = new Set<string>();
    destination.fieldMappings.forEach((mapping, index) => {
      if (columns.has(mapping.column))
        context.addIssue({
          code: "custom",
          path: ["fieldMappings", index, "column"],
          message: "Setiap pertanyaan harus memakai kolom yang berbeda.",
        });
      columns.add(mapping.column);
    });
  });

const googleSheetsDraftDestinationSchema = z.object({
  spreadsheetId: z.string().trim().max(128).default(""),
  spreadsheetUrl: z.string().trim().max(2048).default(""),
  sheetName: z.string().trim().max(100).default(""),
  fieldMappings: z
    .array(
      z.object({
        fieldName: z.string().trim().min(1).max(40),
        column: z
          .string()
          .trim()
          .toUpperCase()
          .refine(
            (value) => value === "" || /^[A-Z]{1,3}$/.test(value),
            "Gunakan kolom seperti A, B, atau AA.",
          ),
      }),
    )
    .max(20)
    .default([]),
});

const responseIdentitySchema = z.object({
  nameField: z.string().trim().min(1).max(40).optional(),
  contactField: z.string().trim().min(1).max(40).optional(),
});

const formMetaEventSchema = metaCtaEventOverrideSchema.refine(
  (value) => value !== "Contact",
  "Contact hanya dikirim saat pengunjung membuka WhatsApp.",
);

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
    path: z
      .string()
      .trim()
      .max(2048)
      .refine(
        (value) => value === "" || isPageBuilderImagePath(value),
        "Gambar harus berasal dari unggahan builder.",
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
    type: z.literal("form"),
    title: z.string().trim().min(1).max(160),
    showTitle: z.boolean().optional(),
    description: z.string().trim().max(1000).default(""),
    showDescription: z.boolean().optional(),
    submitLabel: z.string().trim().min(1).max(80).default("Simpan data"),
    submitButtonAlign: z.enum(["left", "center", "right"]).optional(),
    submitButtonWidth: z.enum(["auto", "full"]).optional(),
    submitButtonStyle: z.enum(["primary", "soft", "outline"]).optional(),
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
    submissionDestination: z.enum(["database", "google_sheets"]).optional(),
    googleSheets: googleSheetsDraftDestinationSchema.optional(),
    responseIdentity: responseIdentitySchema.optional(),
    metaEventName: formMetaEventSchema.optional(),
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
      if (block.type === "form" && block.responseIdentity) {
        const fieldsByName = new Map(
          block.fields.map((field) => [field.name, field]),
        );
        const { nameField, contactField } = block.responseIdentity;
        if (nameField && fieldsByName.get(nameField)?.type !== "text") {
          context.addIssue({
            code: "custom",
            path: ["responseIdentity", "nameField"],
            message: "Nama pengisi harus memakai field teks.",
          });
        }
        if (
          contactField &&
          !["text", "tel", "email"].includes(
            fieldsByName.get(contactField)?.type ?? "",
          )
        ) {
          context.addIssue({
            code: "custom",
            path: ["responseIdentity", "contactField"],
            message:
              "Kontak pengisi harus memakai field teks, telepon, atau email.",
          });
        }
        if (
          (nameField && !fieldsByName.has(nameField)) ||
          (contactField && !fieldsByName.has(contactField)) ||
          (nameField && contactField === nameField)
        ) {
          context.addIssue({
            code: "custom",
            path: ["responseIdentity"],
            message: "Pilih field nama dan kontak yang berbeda dari form ini.",
          });
        }
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
      if (block.type === "image" && !block.path) {
        context.addIssue({
          code: "custom",
          path: [index, "path"],
          message: "Unggah gambar sebelum menerbitkan.",
        });
      }
      if (block.type === "image" && !block.alt) {
        context.addIssue({
          code: "custom",
          path: [index, "alt"],
          message: "Isi teks alternatif gambar sebelum menerbitkan.",
        });
      }
      if (
        block.type === "form" &&
        block.submissionDestination === "google_sheets"
      ) {
        const destination = googleSheetsDestinationSchema.safeParse(
          block.googleSheets,
        );
        if (!destination.success) {
          context.addIssue({
            code: "custom",
            path: [index, "googleSheets"],
            message:
              "Lengkapi URL, tab, dan kolom Google Sheets sebelum menerbitkan.",
          });
          return;
        }
        const names = block.fields.map((field) => field.name);
        const mappings = destination.data.fieldMappings;
        if (
          mappings.length !== names.length ||
          new Set(mappings.map((mapping) => mapping.fieldName)).size !==
            mappings.length ||
          mappings.some((mapping) => !names.includes(mapping.fieldName)) ||
          new Set(mappings.map((mapping) => mapping.column)).size !==
            mappings.length
        ) {
          context.addIssue({
            code: "custom",
            path: [index, "googleSheets", "fieldMappings"],
            message:
              "Petakan setiap pertanyaan ke kolom Google Sheets yang berbeda.",
          });
        }
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

export function stripPageBuilderPrivateConfig(blocks: unknown) {
  const parsed = pageBuilderBlocksSchema.safeParse(blocks);
  if (!parsed.success) return blocks;
  return parsed.data.map((block) => {
    if (block.type !== "form") return block;
    const {
      googleSheets: _googleSheets,
      responseIdentity: _responseIdentity,
      ...publicBlock
    } = block;
    return publicBlock;
  });
}

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

function isPageBuilderImagePath(value: string) {
  return /^builder\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.(?:jpg|png|webp)$/i.test(
    value,
  );
}
