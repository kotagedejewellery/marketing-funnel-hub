import { expect, test } from "@playwright/test";

test("renders the Sprint 0 shell in a real browser", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("KGJ Marketing Funnel Hub");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Marketing Funnel Hub",
    }),
  ).toBeVisible();
  await expect(page.getByText("KGJ · Sprint 0")).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
