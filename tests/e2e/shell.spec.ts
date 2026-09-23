import { expect, test } from "@playwright/test";

test("renders the local branch directory in a real browser", async ({
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
  await expect(page).toHaveTitle("Kotagede Jewellery | Link Bio Cabang");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Temukan Link Bio cabang Anda",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /WhatsApp/i })).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("does not send a business event from the branch directory", async ({
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

  await expect(
    page.getByRole("heading", { name: /Temukan Link Bio cabang/ }),
  ).toBeVisible();
  expect(eventRequests).toHaveLength(0);
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
