import "server-only";

import { createSign } from "node:crypto";

import { serverEnv } from "@/lib/env/server";

type FieldMapping = { fieldName: string; column: string };
type FormValues = Record<string, string | boolean>;

export type GoogleSheetsDestination = {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  sheetName: string;
  fieldMappings: FieldMapping[];
};

type DeliveryInput = GoogleSheetsDestination & { values: FormValues };
export type GoogleSheetsDeliveryErrorCode =
  | "configuration"
  | "authentication"
  | "spreadsheet_access_denied"
  | "sheets_api_disabled"
  | "spreadsheet_not_found"
  | "sheet_range_invalid"
  | "rate_limited"
  | "provider_unavailable"
  | "delivery"
  | "unknown";

type DeliveryResult =
  | { ok: true }
  | {
      ok: false;
      code: GoogleSheetsDeliveryErrorCode;
    };

type AccessToken = { value: string; expiresAt: number };

let accessToken: AccessToken | null = null;

function spreadsheetId(destination: GoogleSheetsDestination) {
  if (/^[A-Za-z0-9_-]{20,}$/.test(destination.spreadsheetId ?? ""))
    return destination.spreadsheetId ?? null;
  if (!destination.spreadsheetUrl) return null;
  try {
    const url = new URL(destination.spreadsheetUrl);
    const match = url.pathname.match(
      /^\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/,
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function columnIndex(column: string) {
  return [...column].reduce(
    (index, character) => index * 26 + character.charCodeAt(0) - 64,
    0,
  );
}

function spreadsheetCell(value: string | boolean | undefined) {
  if (typeof value === "boolean") return value;
  const text = value ?? "";
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function sheetRange(sheetName: string, lastColumn: string) {
  return `'${sheetName.replaceAll("'", "''")}'!A:${lastColumn}`;
}

function errorReason(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const error = "error" in body ? body.error : null;
  if (!error || typeof error !== "object") return null;
  for (const key of ["details", "errors"]) {
    const details = (error as Record<string, unknown>)[key];
    if (!Array.isArray(details)) continue;
    for (const detail of details) {
      if (
        detail &&
        typeof detail === "object" &&
        "reason" in detail &&
        typeof detail.reason === "string"
      )
        return detail.reason;
    }
  }
  return null;
}

function googleSheetsFailureCode(
  response: Response,
  body: unknown,
): GoogleSheetsDeliveryErrorCode {
  if (response.status === 400) return "sheet_range_invalid";
  if (response.status === 401) return "authentication";
  if (response.status === 403)
    return ["SERVICE_DISABLED", "accessNotConfigured"].includes(
      errorReason(body) ?? "",
    )
      ? "sheets_api_disabled"
      : "spreadsheet_access_denied";
  if (response.status === 404) return "spreadsheet_not_found";
  if (response.status === 429) return "rate_limited";
  if (response.status >= 500) return "provider_unavailable";
  return "delivery";
}

function serviceAccountAssertion(email: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  return `${unsigned}.${signer.sign(privateKey.replace(/\\n/g, "\n"), "base64url")}`;
}

async function googleAccessToken(): Promise<AccessToken | null> {
  if (accessToken && accessToken.expiresAt > Date.now() + 60_000)
    return accessToken;
  const email = serverEnv.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = serverEnv.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !privateKey) return null;
  let assertion: string;
  try {
    assertion = serviceAccountAssertion(email, privateKey);
  } catch {
    return null;
  }
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    const result = (await response.json()) as {
      access_token?: unknown;
      expires_in?: unknown;
    };
    if (!response.ok || typeof result.access_token !== "string") return null;
    accessToken = {
      value: result.access_token,
      expiresAt:
        Date.now() +
        (typeof result.expires_in === "number" ? result.expires_in : 3600) *
          1000,
    };
    return accessToken;
  } catch {
    return null;
  }
}

export async function appendGoogleSheetsResponse(
  input: DeliveryInput,
): Promise<DeliveryResult> {
  const id = spreadsheetId(input);
  if (!id) return { ok: false, code: "configuration" };
  const token = await googleAccessToken();
  if (!token) return { ok: false, code: "authentication" };
  const mappings = input.fieldMappings.map((mapping) => ({
    ...mapping,
    index: columnIndex(mapping.column),
  }));
  const maxIndex = Math.max(...mappings.map((mapping) => mapping.index));
  if (!Number.isSafeInteger(maxIndex) || maxIndex < 1)
    return { ok: false, code: "configuration" };
  const row: Array<string | boolean> = Array.from(
    { length: maxIndex },
    () => "",
  );
  for (const mapping of mappings)
    row[mapping.index - 1] = spreadsheetCell(input.values[mapping.fieldName]);

  try {
    const range = encodeURIComponent(
      sheetRange(
        input.sheetName,
        mappings.find((mapping) => mapping.index === maxIndex)?.column ?? "A",
      ),
    );
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.value}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ majorDimension: "ROWS", values: [row] }),
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      },
    );
    if (response.ok) return { ok: true };
    return {
      ok: false,
      code: googleSheetsFailureCode(
        response,
        await response.json().catch(() => null),
      ),
    };
  } catch {
    return { ok: false, code: "unknown" };
  }
}
