import { expect, test } from "@playwright/test";

test("renders the local public Link Bio in a real browser", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("Kotagede Jewellery | Pilihan Produk");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "KGJ",
    }),
  ).toBeVisible();
  await expect(page.getByText(/Pilihan produk belum tersedia/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("persists a consented UTM PageView without duplicating its event ID", async ({
  page,
}) => {
  const eventRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/events"))
      eventRequests.push(request.url());
  });

  await page.goto(
    "/?utm_source=instagram&utm_medium=paid_social&utm_campaign=wedding_september&utm_content=video_a",
  );
  expect(eventRequests).toHaveLength(0);

  const firstEvent = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/events"),
  );
  await page.getByRole("button", { name: "Izinkan semua" }).click();
  const response = await firstEvent;
  const responseBody = await response.json();
  expect(response.status(), JSON.stringify(responseBody)).toBe(200);

  const payload = response.request().postDataJSON();
  expect(payload).toMatchObject({
    eventName: "PageView",
    attribution: {
      source: "instagram",
      campaign: "wedding_september",
      utmSource: "instagram",
      utmMedium: "paid_social",
      utmCampaign: "wedding_september",
      utmContent: "video_a",
      utmTerm: null,
    },
  });
  const duplicate = await page.request.post("/api/events", {
    data: payload,
    headers: { Origin: "http://127.0.0.1:3100" },
  });
  expect(duplicate.status()).toBe(200);
  await expect(duplicate.json()).resolves.toMatchObject({ duplicate: true });
});

test("keeps the desktop public page responsive and protects the Admin CMS", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Selamat datang kembali." }),
  ).toBeVisible();
});
