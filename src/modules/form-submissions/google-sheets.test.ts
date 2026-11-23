import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("node:crypto", () => ({
  createSign: () => ({
    update: () => undefined,
    sign: () => "signature",
  }),
}));
vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL: "forms@kgj.test",
    GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY:
      "-----BEGIN PRIVATE KEY-----\\nMIIB\\n-----END PRIVATE KEY-----",
  },
}));

import { appendGoogleSheetsResponse } from "./google-sheets";

describe("Google Sheets form delivery", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("appends mapped values as raw cells and neutralizes spreadsheet formulas", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "token", expires_in: 3600 }),
          {
            status: 200,
          },
        ),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    await expect(
      appendGoogleSheetsResponse({
        spreadsheetUrl:
          "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit",
        sheetName: "Respons Form",
        fieldMappings: [
          { fieldName: "nama", column: "B" },
          { fieldName: "catatan", column: "D" },
        ],
        values: { nama: "Nadia", catatan: '=IMPORTXML("https://contoh.test")' },
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/values/'Respons%20Form'!A%3AD:append"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
        body: JSON.stringify({
          majorDimension: "ROWS",
          values: [["", "Nadia", "", '\'=IMPORTXML("https://contoh.test")']],
        }),
      }),
    );
  });

  it("escapes an apostrophe in the sheet tab name", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "token", expires_in: 3600 }),
          {
            status: 200,
          },
        ),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    await appendGoogleSheetsResponse({
      spreadsheetUrl:
        "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit",
      sheetName: "Respons Marketing's",
      fieldMappings: [{ fieldName: "nama", column: "A" }],
      values: { nama: "Nadia" },
    });

    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/values/'Respons%20Marketing''s'!A%3AA:append"),
      expect.anything(),
    );
  });
});
