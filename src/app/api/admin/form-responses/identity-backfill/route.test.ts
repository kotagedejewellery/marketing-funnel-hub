import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  backfillFormResponseIdentity: vi.fn(),
}));

vi.mock("@/lib/env/server", () => ({
  serverEnv: { NEXT_PUBLIC_SITE_URL: "https://kgj.test" },
}));
vi.mock("@/modules/form-submissions/management", () => ({
  backfillFormResponseIdentity: mocks.backfillFormResponseIdentity,
}));

import { POST } from "./route";

const branchId = "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";
const formId = "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";

describe("POST /api/admin/form-responses/identity-backfill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a cross-site request before it reaches the backfill", async () => {
    const response = await POST(
      new Request(
        "https://kgj.test/api/admin/form-responses/identity-backfill",
        {
          method: "POST",
          headers: { origin: "https://other.test" },
          body: JSON.stringify({ branchId, formId }),
        },
      ),
    );

    expect(response.status).toBe(403);
    expect(mocks.backfillFormResponseIdentity).not.toHaveBeenCalled();
  });

  it("passes a trusted batch cursor to the protected mutation", async () => {
    mocks.backfillFormResponseIdentity.mockResolvedValue({
      ok: true,
      updated: 1,
      skipped: 0,
      nextCursor: "batch-dua",
    });
    const response = await POST(
      new Request(
        "https://kgj.test/api/admin/form-responses/identity-backfill",
        {
          method: "POST",
          headers: { origin: "https://kgj.test" },
          body: JSON.stringify({ branchId, formId, cursor: "batch-dua" }),
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(mocks.backfillFormResponseIdentity).toHaveBeenCalledWith({
      branchId,
      formId,
      cursor: "batch-dua",
    });
  });
});
