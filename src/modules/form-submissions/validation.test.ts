import { describe, expect, it } from "vitest";

import type { PageBuilderFormField } from "@/modules/page-builder/schema";

import { validatedFormValues } from "./validation";

const fields: PageBuilderFormField[] = [
  {
    id: "0c6b5a8d-c36b-43d6-a183-876aaea89eb1",
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "",
    help: "",
    required: true,
    options: [],
  },
  {
    id: "a6a8d891-8c7b-4555-a9a1-f72c2a88491b",
    name: "model",
    label: "Model",
    type: "select",
    placeholder: "",
    help: "",
    required: false,
    options: ["Classic", "Custom"],
  },
  {
    id: "b6a8d891-8c7b-4555-a9a1-f72c2a88491b",
    name: "tanggal_kunjungan",
    label: "Tanggal kunjungan",
    type: "date",
    placeholder: "",
    help: "",
    required: false,
    options: [],
  },
];

describe("form submission validation", () => {
  it("normalizes valid field values", () => {
    expect(
      validatedFormValues(fields, {
        email: "  hello@kgj.test ",
        model: "Classic",
        tanggal_kunjungan: "",
      }),
    ).toEqual({
      email: "hello@kgj.test",
      model: "Classic",
      tanggal_kunjungan: "",
    });
  });

  it("rejects unknown fields and invalid choices", () => {
    expect(
      validatedFormValues(fields, {
        email: "hello@kgj.test",
        tanggal_kunjungan: "",
        extra: "x",
      }),
    ).toBeNull();
    expect(
      validatedFormValues(fields, {
        email: "hello@kgj.test",
        model: "Other",
        tanggal_kunjungan: "",
      }),
    ).toBeNull();
  });

  it("rejects date values that are not real ISO calendar dates", () => {
    expect(
      validatedFormValues(fields, {
        email: "hello@kgj.test",
        model: "Classic",
        tanggal_kunjungan: "2026-02-30",
      }),
    ).toBeNull();
    expect(
      validatedFormValues(fields, {
        email: "hello@kgj.test",
        model: "Classic",
        tanggal_kunjungan: "2026-02-28",
      }),
    ).toMatchObject({ tanggal_kunjungan: "2026-02-28" });
  });
});
