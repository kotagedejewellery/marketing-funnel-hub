import { describe, expect, it } from "vitest";

import {
  pageBuilderBlocksSchema,
  pageBuilderPublishBlocksSchema,
  sanitizePageBuilderHtml,
} from "./schema";

const id = "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";

describe("Branch Page Builder schema", () => {
  it("only accepts a YouTube embed URL", () => {
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          id,
          type: "embed",
          url: "https://www.youtube-nocookie.com/embed/abc",
          width: "full",
          isVisible: true,
        },
      ]).success,
    ).toBe(true);
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          id,
          type: "embed",
          url: "https://example.com/embed/abc",
          width: "full",
          isVisible: true,
        },
      ]).success,
    ).toBe(false);
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          id,
          type: "embed",
          url: "https://www.youtube-nocookie.com/embed/",
          width: "full",
          isVisible: true,
        },
      ]).success,
    ).toBe(false);
  });

  it("requires HTTPS images and known domain sections", () => {
    expect(
      pageBuilderBlocksSchema.safeParse([
        {
          id,
          type: "image",
          url: "http://example.com/image.jpg",
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

  it("keeps unfinished image and embed blocks in a draft but not in a published layout", () => {
    const unfinished = [
      {
        id,
        type: "image",
        url: "",
        alt: "",
        width: "full",
        isVisible: true,
      },
      {
        id: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        type: "embed",
        url: "",
        width: "full",
        isVisible: true,
      },
    ];

    expect(pageBuilderBlocksSchema.safeParse(unfinished).success).toBe(true);
    expect(pageBuilderPublishBlocksSchema.safeParse(unfinished).success).toBe(
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
