import { describe, expect, it } from "vitest";

import {
  pageBuilderBlocksSchema,
  pageBuilderPublishBlocksSchema,
  stripPageBuilderPrivateConfig,
  sanitizePageBuilderHtml,
} from "./schema";

const id = "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";

describe("Branch Page Builder schema", () => {
  it("accepts only internally uploaded image paths", () => {
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          id,
          type: "image",
          path: "builder/3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4/4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4.webp",
          alt: "Cincin emas",
          width: "full",
          isVisible: true,
        },
      ]).success,
    ).toBe(true);
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          id,
          type: "image",
          path: "https://example.com/image.jpg",
          alt: "Cincin emas",
          width: "full",
          isVisible: true,
        },
      ]).success,
    ).toBe(false);
  });

  it("rejects external images and unknown domain sections", () => {
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          id,
          type: "image",
          path: "http://example.com/image.jpg",
          alt: "",
          width: "full",
          isVisible: true,
        },
      ]).success,
    ).toBe(false);
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          id,
          type: "section",
          sectionKey: "unknown",
          width: "full",
          isVisible: true,
        },
      ]).success,
    ).toBe(false);
  });

  it("keeps an unfinished uploaded image in a draft but not in a published layout", () => {
    const unfinished = [
      {
        id,
        type: "image",
        path: "",
        alt: "",
        width: "full",
        isVisible: true,
      },
    ];

    expect(pageBuilderBlocksSchema.safeParse(unfinished).success).toBe(true);
    expect(pageBuilderPublishBlocksSchema.safeParse(unfinished).success).toBe(
      false,
    );
  });

  it("accepts precise text styles and semantic heading levels", () => {
    const blocks = pageBuilderBlocksSchema.safeParse([
      {
        id,
        type: "rich_text",
        text: "Pesan konsultasi",
        fontSize: 18,
        fontUnit: "pt",
        isBold: true,
        isItalic: true,
        textAlign: "center",
        width: "full",
        isVisible: true,
      },
      {
        id: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        type: "heading",
        text: "Koleksi cincin",
        level: "h2",
        width: "full",
        isVisible: true,
      },
    ]);

    expect(blocks.success).toBe(true);
    if (blocks.success) {
      expect(blocks.data[1]).toMatchObject({
        isBold: true,
        isItalic: false,
        textAlign: "left",
      });
    }
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          id,
          type: "rich_text",
          text: "Terlalu besar",
          fontSize: 201,
          fontUnit: "px",
          isBold: false,
          isItalic: false,
          textAlign: "left",
          width: "full",
          isVisible: true,
        },
      ]).success,
    ).toBe(false);
  });

  it("accepts a styled custom section title and rejects an empty one", () => {
    const section = {
      id,
      type: "section",
      sectionKey: "faq",
      title: {
        mode: "custom",
        text: "Pertanyaan umum",
        level: "h3",
        fontSize: 20,
        fontUnit: "pt",
        lineHeight: 1.4,
        isBold: true,
        isItalic: false,
        textAlign: "center",
      },
      width: "full",
      isVisible: true,
    };

    expect(pageBuilderBlocksSchema.safeParse([section]).success).toBe(true);
    expect(
      pageBuilderBlocksSchema.safeParse([
        { ...section, title: { ...section.title, text: "" } },
      ]).success,
    ).toBe(false);
  });

  it("keeps legacy duplicate sections editable but prevents publishing them", () => {
    const sections = [
      {
        id,
        type: "section",
        sectionKey: "faq",
        width: "full",
        isVisible: true,
      },
      {
        id: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        type: "section",
        sectionKey: "faq",
        width: "full",
        isVisible: true,
      },
    ];

    expect(pageBuilderBlocksSchema.safeParse(sections).success).toBe(true);
    expect(pageBuilderPublishBlocksSchema.safeParse(sections).success).toBe(
      false,
    );
  });

  it("removes executable HTML on every sanitization pass", () => {
    expect(
      sanitizePageBuilderHtml(
        '<p>Halo</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>',
      ),
    ).toBe('<p>Halo</p><a rel="noopener noreferrer">x</a>');
  });

  it("accepts a published form only with unique field names and valid choices", () => {
    const form = {
      id,
      type: "form",
      title: "Konsultasi",
      description: "",
      submitLabel: "Simpan data",
      privacyNotice: "Data disimpan oleh KGJ.",
      assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
      width: "full",
      isVisible: true,
      fields: [
        {
          id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          name: "nama",
          label: "Nama",
          type: "text",
          placeholder: "",
          help: "",
          required: true,
          options: [],
        },
        {
          id: "6f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          name: "model",
          label: "Model",
          type: "select",
          placeholder: "",
          help: "",
          required: false,
          options: ["Classic", "Custom"],
        },
      ],
    };

    expect(pageBuilderBlocksSchema.safeParse([form]).success).toBe(true);
    expect(
      pageBuilderBlocksSchema.safeParse([
        { ...form, fields: [{ ...form.fields[0] }, { ...form.fields[0] }] },
      ]).success,
    ).toBe(false);
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          ...form,
          fields: [
            form.fields[0],
            { ...form.fields[1], options: ["Classic", "classic"] },
          ],
        },
      ]).success,
    ).toBe(false);
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          ...form,
          fields: [
            form.fields[0],
            {
              ...form.fields[1],
              type: "text",
              options: ["Classic", "classic"],
            },
          ],
        },
      ]).success,
    ).toBe(true);
  });

  it("keeps legacy form introductions visible and accepts explicit visibility", () => {
    const form = {
      id,
      type: "form",
      title: "Konsultasi",
      description: "Isi data Anda.",
      submitLabel: "Kirim",
      privacyNotice: "Data disimpan oleh KGJ.",
      assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
      width: "full",
      isVisible: true,
      fields: [
        {
          id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          name: "nama",
          label: "Nama",
          type: "text",
          placeholder: "",
          help: "",
          required: true,
          options: [],
        },
      ],
    };

    expect(pageBuilderBlocksSchema.safeParse([form]).success).toBe(true);
    expect(
      pageBuilderBlocksSchema.safeParse([
        { ...form, showTitle: false, showDescription: false },
      ]).success,
    ).toBe(true);
  });

  it("accepts controlled form submit button layout without changing legacy forms", () => {
    const form = {
      id,
      type: "form",
      title: "Konsultasi",
      description: "",
      submitLabel: "Kirim",
      privacyNotice: "Data disimpan oleh KGJ.",
      submitButtonAlign: "center",
      submitButtonWidth: "full",
      submitButtonStyle: "soft",
      assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
      width: "full",
      isVisible: true,
      fields: [
        {
          id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          name: "nama",
          label: "Nama",
          type: "text",
          placeholder: "",
          help: "",
          required: true,
          options: [],
        },
      ],
    };

    const parsed = pageBuilderBlocksSchema.safeParse([form]);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data[0]).toMatchObject({
        submitButtonAlign: "center",
        submitButtonWidth: "full",
        submitButtonStyle: "soft",
      });
    }
    expect(
      pageBuilderBlocksSchema.safeParse([
        { ...form, submitButtonAlign: "bottom" },
      ]).success,
    ).toBe(false);
  });

  it("accepts controlled thank-you copy without changing form field schema", () => {
    const parsed = pageBuilderBlocksSchema.safeParse([
      {
        id,
        type: "form",
        title: "Konsultasi",
        description: "",
        submitLabel: "Kirim",
        privacyNotice: "Data disimpan oleh KGJ.",
        thankYouTitle: "Terima kasih sudah menghubungi KGJ",
        thankYouMessage: "Pilih tombol berikut untuk lanjut ke cabang.",
        continueLabel: "Buka WhatsApp KGJ",
        assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        width: "full",
        isVisible: true,
        fields: [
          {
            id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            name: "nama",
            label: "Nama",
            type: "text",
            placeholder: "",
            help: "",
            required: true,
            options: [],
          },
        ],
      },
    ]);
    expect(parsed.success).toBe(true);
  });

  it("accepts an explicitly mapped Google Sheets destination for a form", () => {
    const parsed = pageBuilderBlocksSchema.safeParse([
      {
        id,
        type: "form",
        title: "Konsultasi",
        description: "",
        submitLabel: "Kirim",
        privacyNotice: "Data disimpan oleh KGJ.",
        assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        submissionDestination: "google_sheets",
        responseIdentity: { nameField: "nama" },
        googleSheets: {
          spreadsheetUrl:
            "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit",
          sheetName: "Respons",
          fieldMappings: [{ fieldName: "nama", column: "B" }],
        },
        metaEventName: "Lead",
        width: "full",
        isVisible: true,
        fields: [
          {
            id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            name: "nama",
            label: "Nama",
            type: "text",
            placeholder: "",
            help: "",
            required: true,
            options: [],
          },
        ],
      },
    ]);

    expect(parsed.success).toBe(true);
    if (parsed.success)
      expect(parsed.data[0]).toMatchObject({
        submissionDestination: "google_sheets",
        metaEventName: "Lead",
        googleSheets: { sheetName: "Respons" },
      });
  });

  it("accepts explicit fields for the respondent summary and rejects unknown fields", () => {
    const form = {
      id,
      type: "form" as const,
      title: "Konsultasi",
      description: "",
      submitLabel: "Kirim",
      privacyNotice: "Data disimpan oleh KGJ.",
      assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
      width: "full" as const,
      isVisible: true,
      fields: [
        {
          id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          name: "nama",
          label: "Nama lengkap",
          type: "text" as const,
          placeholder: "",
          help: "",
          required: true,
          options: [],
        },
        {
          id: "6f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          name: "whatsapp",
          label: "Nomor WhatsApp",
          type: "tel" as const,
          placeholder: "",
          help: "",
          required: true,
          options: [],
        },
      ],
    };

    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          ...form,
          responseIdentity: { nameField: "nama", contactField: "whatsapp" },
        },
      ]).success,
    ).toBe(true);
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          ...form,
          responseIdentity: { nameField: "tidak_ada" },
        },
      ]).success,
    ).toBe(false);
  });

  it("never exposes a form Google Sheets destination to the public renderer", () => {
    const blocks = stripPageBuilderPrivateConfig([
      {
        id,
        type: "form",
        title: "Konsultasi",
        description: "",
        submitLabel: "Kirim",
        privacyNotice: "Data disimpan oleh KGJ.",
        assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        submissionDestination: "google_sheets",
        googleSheets: {
          spreadsheetUrl:
            "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit",
          sheetName: "Respons",
          fieldMappings: [{ fieldName: "nama", column: "B" }],
        },
        width: "full",
        isVisible: true,
        fields: [
          {
            id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            name: "nama",
            label: "Nama",
            type: "text",
            placeholder: "",
            help: "",
            required: true,
            options: [],
          },
        ],
      },
    ]);

    expect(blocks).toEqual([
      expect.not.objectContaining({
        googleSheets: expect.anything(),
        responseIdentity: expect.anything(),
      }),
    ]);
  });

  it("keeps legacy spacer sizes and accepts a precise divider spacing", () => {
    const legacy = pageBuilderBlocksSchema.safeParse([
      { id, type: "spacer", size: "lg", width: "full", isVisible: true },
    ]);
    const precise = pageBuilderBlocksSchema.safeParse([
      {
        id,
        type: "spacer",
        spacingPx: 37,
        showDivider: true,
        width: "full",
        isVisible: true,
      },
    ]);

    expect(legacy.success).toBe(true);
    expect(precise.success).toBe(true);
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          id,
          type: "spacer",
          spacingPx: 241,
          width: "full",
          isVisible: true,
        },
      ]).success,
    ).toBe(false);
  });
});
