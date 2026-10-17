import { test, expect } from "@playwright/test";
test("guest array execution, synchronized source, backward playback and reset", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 0');
  for (let i = 1; i <= 3; i++) {
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("engine-state")).toContainText(`"seq": ${i}`);
  }
  await expect(
    page.getByRole("img", { name: "Arrays state: 3, 9, 1, 4" }),
  ).toBeVisible();
  await expect(page.getByLabel("Executed C source")).toContainText(
    "array.insert",
  );
  await page.getByRole("button", { name: "Step backward" }).click();
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 2');
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 0');
  await page.getByRole("button", { name: "Predict next operation" }).click();
  await page.getByLabel("Your prediction").selectOption("write");
  await page.getByRole("button", { name: "Reveal next event" }).click();
  await expect(
    page.getByText("Correct: the next event is write", { exact: false }),
  ).toBeVisible();
});
test("array delete reports the removed C value independently of the unused argument", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Operation", { exact: true }).selectOption("4");
  await page.getByLabel("Index", { exact: true }).fill("1");
  await page.getByLabel("Value or target", { exact: true }).fill("999");
  await page
    .getByRole("button", { name: "Initialize experiment", exact: true })
    .click();
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 0');
  await page.getByRole("button", { name: "Step forward" }).click();
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 1');
  await page.getByRole("button", { name: "Step forward" }).click();
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 2');
  await expect(
    page.getByRole("img", { name: "Arrays state: 3, 4" }),
  ).toBeVisible();
  await expect(page.locator(".event-line")).toContainText("value=1");
});
