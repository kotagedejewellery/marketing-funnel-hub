import { describe, expect, it } from "vitest";

import type { PageBuilderFormField } from "@/modules/page-builder/schema";

import { formSubmissionCsv } from "./csv";

const email: PageBuilderFormField = {
  id: "0c6b5a8d-c36b-43d6-a183-876aaea89eb1",
  name: "email",
  label: "Email",
  type: "email",
  placeholder: "",
  help: "",
  required: false,
  options: [],
};
const note: PageBuilderFormField = {
  ...email,
  id: "a6a8d891-8c7b-4555-a9a1-f72c2a88491b",
  name: "note",
  label: "Catatan",
  type: "textarea",
};

describe("form submission CSV", () => {
  it("keeps fields from historical schemas and neutralizes formulas", () => {
    const csv = formSubmissionCsv([
      {
        id: "1",
        submittedAt: new Date("2026-01-01T00:00:00Z"),
        whatsappContinuedAt: null,
        branchName: "Pusat",
        formTitle: "A",
        productName: "Cincin",
        fields: [email],
        values: { email: "=SUM(1)" },
      },
      {
        id: "2",
        submittedAt: new Date("2026-01-02T00:00:00Z"),
        whatsappContinuedAt: null,
        branchName: "Pusat",
        formTitle: "B",
        productName: "Cincin",
        fields: [note],
        values: null,
      },
    ]);
    expect(csv).toContain('"Email","Catatan"');
    expect(csv).toContain('"\'=SUM(1)"');
    expect(csv).toContain('"Tidak dapat didekripsi"');
  });

  it("keeps renamed historical field labels in separate columns", () => {
    const renamedEmail = { ...email, label: "Email pelanggan" };
    const csv = formSubmissionCsv([
      {
        id: "1",
        submittedAt: new Date("2026-01-01T00:00:00Z"),
        whatsappContinuedAt: null,
        branchName: "Pusat",
        formTitle: "A",
        productName: "Cincin",
        fields: [email],
        values: { email: "lama@kgj.test" },
      },
      {
        id: "2",
        submittedAt: new Date("2026-01-02T00:00:00Z"),
        whatsappContinuedAt: null,
        branchName: "Pusat",
        formTitle: "A",
        productName: "Cincin",
        fields: [renamedEmail],
        values: { email: "baru@kgj.test" },
      },
    ]);
    expect(csv).toContain('"Email","Email pelanggan"');
    expect(csv).toContain('"lama@kgj.test",""');
    expect(csv).toContain('"","baru@kgj.test"');
  });

  it("exports the non-sensitive WhatsApp continuation time", () => {
    const csv = formSubmissionCsv([
      {
        id: "1",
        submittedAt: new Date("2026-01-01T00:00:00Z"),
        whatsappContinuedAt: new Date("2026-01-01T00:01:00Z"),
        branchName: "Pusat",
        formTitle: "A",
        productName: "Cincin",
        fields: [],
        values: {},
      },
    ]);
    expect(csv).toContain('"Waktu klik lanjut WhatsApp (UTC)"');
    expect(csv).toContain('"2026-01-01T00:01:00.000Z"');
  });
});
