import { test, expect } from "@playwright/test";
test("real array insertion supports stepping, backward playback, reset and prediction", async ({
  page,
}) => {
  await page.goto("/#/lesson/arrays/insert");
  const forward = page.getByRole("button", { name: "Step forward" });
  await expect(forward).toBeEnabled();
  const animationRequests: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/"))
      animationRequests.push(r.url());
  });
  for (let i = 1; i <= 3; i++) {
    await forward.click();
    await expect(page.getByLabel("Playback position")).toHaveValue(String(i));
  }
  await expect(
    page.getByRole("img", { name: "Arrays state: 3, 9, 1, 4" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Step backward" }).click();
  await expect(page.getByLabel("Playback position")).toHaveValue("2");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByLabel("Playback position")).toHaveValue("0");
  await page.getByRole("button", { name: "Predict the next action" }).click();
  await page.getByLabel("Your prediction").selectOption("write");
  await page.getByRole("button", { name: "Reveal next action" }).click();
  await expect(
    page.getByText("Correct: the next action is Write a value."),
  ).toBeVisible();
  await expect(page.locator(".example-panel .highlighted")).toHaveCount(0);
  expect(animationRequests).toEqual([]);
});
test("array deletion and traversal have their own examples and operations", async ({
  page,
}) => {
  await page.goto("/#/lesson/arrays/delete");
  await expect(page.getByLabel("Programming language")).toBeVisible();
  await expect(
    page.getByLabel("C example code", { exact: true }),
  ).toContainText("array_delete");
  await expect(page.getByLabel("Value or target")).toHaveCount(0);
  const forward = page.getByRole("button", { name: "Step forward" });
  await expect(forward).toBeEnabled();
  await forward.click();
  await forward.click();
  await expect(
    page.getByRole("img", { name: "Arrays state: 3, 4" }),
  ).toBeVisible();
  await page.getByLabel("Lesson pages").selectOption("traversal");
  await expect(
    page.getByLabel("C example code", { exact: true }),
  ).toContainText("array_traverse");
  await page.getByLabel("Input values").fill("100000, 2, 100000");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  for (let i = 0; i < 4; i++) {
    await expect(forward).toBeEnabled();
    await forward.click();
  }
  await expect(page.locator(".counters")).toContainText("visit3");
});
