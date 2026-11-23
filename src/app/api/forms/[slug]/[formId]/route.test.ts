import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  deliverGoogleSheetsFormSubmission: vi.fn(),
  encryptFormValues: vi.fn(() => "encrypted-values"),
  hashFormContactForSearch: vi.fn(() => null),
  hashFormContinuationToken: vi.fn(() => "continuation-hash"),
  createFormContinuationToken: vi.fn(() => "continuation-token"),
  canSubmitForm: vi.fn(() => true),
}));

vi.mock("@/lib/db/client", () => ({ getDatabase: mocks.getDatabase }));
vi.mock("@/lib/env/server", () => ({
  serverEnv: { NEXT_PUBLIC_SITE_URL: "https://kgj.test" },
}));
vi.mock("@/modules/form-submissions/crypto", () => ({
  encryptFormValues: mocks.encryptFormValues,
  hashFormContactForSearch: mocks.hashFormContactForSearch,
  hashFormContinuationToken: mocks.hashFormContinuationToken,
  createFormContinuationToken: mocks.createFormContinuationToken,
}));
vi.mock("@/modules/form-submissions/delivery", () => ({
  deliverGoogleSheetsFormSubmission: mocks.deliverGoogleSheetsFormSubmission,
}));
vi.mock("@/modules/form-submissions/rate-limit", () => ({
  canSubmitForm: mocks.canSubmitForm,
}));

import { POST } from "./route";

const branchId = "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";
const assignmentId = "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";
const formId = "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";
const submissionId = "6f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";
const deliveryId = "7f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";

function readRows(rows: unknown[]) {
  const query = {
    from: () => query,
    innerJoin: () => query,
    where: () => query,
    limit: () => Promise.resolve(rows),
  };
  return query;
}

describe("POST /api/forms/[slug]/[formId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the KGJ submission and WhatsApp response when Google Sheets fails", async () => {
    const submissionValues = vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([{ id: submissionId }]),
    }));
    const deliveryValues = vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([{ id: deliveryId }]),
    }));
    const transaction = {
      insert: vi
        .fn()
        .mockReturnValueOnce({ values: submissionValues })
        .mockReturnValueOnce({ values: deliveryValues }),
    };
    const rows = [
      [
        {
          id: branchId,
          name: "Jakarta",
          whatsappNumber: "628111111111",
          ctaLabel: null,
        },
      ],
      [
        {
          isPublished: true,
          publishedBlocks: [
            {
              id: formId,
              type: "form",
              title: "Konsultasi",
              description: "",
              submitLabel: "Kirim",
              privacyNotice: "Data disimpan KGJ.",
              assignmentId,
              submissionDestination: "google_sheets",
              googleSheets: {
                spreadsheetId: "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789",
                sheetName: "Respons",
                fieldMappings: [{ fieldName: "nama", column: "A" }],
              },
              fields: [
                {
                  id: "8f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
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
            },
          ],
        },
      ],
      [
        {
          id: assignmentId,
          name: "Cincin Nikah",
          category: "cincin-nikah",
          ctaLabel: "Hubungi Jakarta",
          message: "Halo, saya tertarik {product} di {branch}.",
        },
      ],
      [
        {
          defaultCtaLabel: "Hubungi kami",
          defaultWhatsappMessage: "Halo, saya tertarik {product}.",
        },
      ],
    ];
    mocks.getDatabase.mockReturnValue({
      select: vi.fn(() => readRows(rows.shift() ?? [])),
      transaction: vi.fn(async (callback) => callback(transaction)),
    });
    mocks.deliverGoogleSheetsFormSubmission.mockRejectedValue(
      new Error("Google Sheets timeout"),
    );

    const response = await POST(
      new Request("https://kgj.test/api/forms/jakarta/" + formId, {
        method: "POST",
        headers: {
          origin: "https://kgj.test",
          "content-type": "application/json",
        },
        body: JSON.stringify({ values: { nama: "Nadia" }, website: "" }),
      }),
      { params: Promise.resolve({ slug: "jakarta", formId }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      ctaLabel: "Hubungi Jakarta",
      whatsappUrl: expect.stringContaining("https://wa.me/628111111111"),
      continuationToken: "continuation-token",
    });
    expect(submissionValues).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId,
        productBranchId: assignmentId,
        formBlockId: formId,
        valuesEncrypted: "encrypted-values",
      }),
    );
    expect(mocks.deliverGoogleSheetsFormSubmission).toHaveBeenCalledWith(
      deliveryId,
    );
    expect(deliveryValues).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google_sheets",
        destination: expect.objectContaining({
          spreadsheetId: "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789",
        }),
      }),
    );
  });
});
