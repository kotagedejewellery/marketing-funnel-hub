import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  inspectGoogleSheetsDestination: vi.fn(),
}));

vi.mock("@/lib/env/server", () => ({
  serverEnv: { NEXT_PUBLIC_SITE_URL: "https://kgj.test" },
}));
vi.mock("@/modules/admin/access", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/modules/form-submissions/google-sheets", () => ({
  inspectGoogleSheetsDestination: mocks.inspectGoogleSheetsDestination,
}));

import { POST } from "./route";

const spreadsheetId = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789";

describe("POST /api/admin/forms/google-sheets/connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a cross-site request before checking Google Sheets", async () => {
    const response = await POST(
      new Request("https://kgj.test/api/admin/forms/google-sheets/connection", {
        method: "POST",
        headers: { origin: "https://other.test" },
        body: JSON.stringify({ spreadsheetId }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.requireAdmin).not.toHaveBeenCalled();
    expect(mocks.inspectGoogleSheetsDestination).not.toHaveBeenCalled();
  });

  it("rejects malformed input before checking Google Sheets", async () => {
    const response = await POST(
      new Request("https://kgj.test/api/admin/forms/google-sheets/connection", {
        method: "POST",
        headers: { origin: "https://kgj.test" },
        body: JSON.stringify({ spreadsheetId: "invalid" }),
      }),
    );

    expect(response.status).toBe(422);
    expect(mocks.requireAdmin).not.toHaveBeenCalled();
    expect(mocks.inspectGoogleSheetsDestination).not.toHaveBeenCalled();
  });

  it("returns only the sanitized connection result to an admin", async () => {
    mocks.inspectGoogleSheetsDestination.mockResolvedValue({
      ok: false,
      code: "spreadsheet_access_denied",
    });

    const response = await POST(
      new Request("https://kgj.test/api/admin/forms/google-sheets/connection", {
        method: "POST",
        headers: { origin: "https://kgj.test" },
        body: JSON.stringify({ spreadsheetId }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: "spreadsheet_access_denied",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.inspectGoogleSheetsDestination).toHaveBeenCalledWith({
      spreadsheetId,
    });
  });
});
