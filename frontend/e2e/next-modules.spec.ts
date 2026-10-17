import { test, expect } from "@playwright/test";
test("heap vertical slice executes and restores real priority state", async ({
  page,
}) => {
  await page.goto("/#/lesson/heaps/basics");
  await expect(
    page.getByRole("img", { name: "Heap array and complete binary tree" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Step forward", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Step backward", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Complete" }).first(),
  ).toBeVisible();
});
