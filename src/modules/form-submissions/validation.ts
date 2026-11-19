import type { PageBuilderFormField } from "@/modules/page-builder/schema";

export function validatedFormValues(
  fields: PageBuilderFormField[],
  input: unknown,
) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const values = input as Record<string, unknown>;
  if (
    Object.keys(values).some(
      (name) => !fields.some((field) => field.name === name),
    )
  )
    return null;
  const result: Record<string, string | boolean> = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.type === "checkbox") {
      if (typeof value !== "boolean") return null;
      if (field.required && !value) return null;
      result[field.name] = value;
      continue;
    }
    if (typeof value !== "string" || value.length > 4000) return null;
    const normalized = value.trim();
    if (field.required && !normalized) return null;
    if (
      field.type === "email" &&
      normalized &&
      !/^\S+@\S+\.\S+$/.test(normalized)
    )
      return null;
    if (
      field.type === "tel" &&
      normalized &&
      !/^[0-9+() -]{7,25}$/.test(normalized)
    )
      return null;
    if (
      field.type === "number" &&
      normalized &&
      !Number.isFinite(Number(normalized))
    )
      return null;
    if (field.type === "date" && normalized && !isCalendarDate(normalized))
      return null;
    if (
      (field.type === "select" || field.type === "radio") &&
      normalized &&
      !field.options.includes(normalized)
    )
      return null;
    result[field.name] = normalized;
  }
  return result;
}

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
