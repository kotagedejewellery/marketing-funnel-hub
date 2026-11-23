import "server-only";

import {
  createHmac,
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { serverEnv } from "@/lib/env/server";

function encryptionKey() {
  const value = serverEnv.FORM_SUBMISSION_ENCRYPTION_KEY;
  if (!value) throw new Error("Form submission encryption is not configured.");
  return Buffer.from(value, "hex");
}

export function encryptFormValues(values: Record<string, string | boolean>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(values), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptFormValues(value: string) {
  const [version, ivValue, tagValue, encryptedValue] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue)
    throw new Error("Invalid encrypted form submission.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plaintext) as Record<string, string | boolean>;
}

export function createFormContinuationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashFormContinuationToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashFormContactForSearch(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return createHmac("sha256", encryptionKey())
    .update(`form-contact-search:v1:${normalized}`)
    .digest("hex");
}
