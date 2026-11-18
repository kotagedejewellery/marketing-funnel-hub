import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  canSubmitForm,
  resetFormSubmissionRateLimitForTest,
} from "./rate-limit";

afterEach(resetFormSubmissionRateLimitForTest);

describe("form submission rate limit", () => {
  it("allows ten submissions per form and rejects the next request", () => {
    const request = new Request("https://kgj.test/form", {
      headers: { "x-forwarded-for": "127.0.0.1" },
    });
    for (let index = 0; index < 10; index += 1)
      expect(canSubmitForm(request, "form-1")).toBe(true);
    expect(canSubmitForm(request, "form-1")).toBe(false);
  });
});
