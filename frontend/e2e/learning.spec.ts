import { test, expect } from "@playwright/test";
const titles = [
  "Arrays",
  "Linear search",
  "Binary search",
  "Insertion sort",
  "Merge sort",
  "Quicksort",
  "Singly linked list",
  "Stack",
  "Queue",
  "Binary search tree",
  "Graph editor",
  "Breadth-first search",
  "Depth-first search",
  "Dijkstra shortest paths",
];
test("catalog loads every released module and validates prerequisites", async ({
  page,
}) => {
  await page.goto("/");
  for (const title of titles) {
    await page
      .getByRole("button", { name: `Open ${title}`, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: title, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.getByTestId("engine-state")).toContainText('"seq": 0');
  }
  await page
    .getByRole("button", { name: "Open Binary search", exact: true })
    .click();
  await page.getByLabel("Input values", { exact: true }).fill("3, 1, 2");
  await page
    .getByRole("button", { name: "Initialize experiment", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("sorted");
  await page
    .getByRole("searchbox", { name: "Search modules" })
    .fill("not-a-module");
  await expect(page.getByText("No matching modules.")).toBeVisible();
});
test("guest experiments survive reload and practice gives explanatory feedback", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 0');
  await page.getByLabel("Experiment title").fill("Guest persistence case");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(
    page.getByText("Experiment saved.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("O(n)", { exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(
    page.getByText("Practice result: Correct.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Saved experiments", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Guest persistence case", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load", exact: true }).click();
  await expect(page.getByLabel("Input values", { exact: true })).toHaveValue(
    "3, 1, 4",
  );
});
test("graph edits use C and preserve stable IDs", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open Graph editor", exact: true })
    .click();
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 0');
  await page.getByLabel("Node ID", { exact: true }).fill("9");
  await page.getByRole("button", { name: "Add node", exact: true }).click();
  await expect(page.getByText("C graph edit complete: insert.")).toBeVisible();
  await expect(page.getByLabel("Input values", { exact: true })).toHaveValue(
    "1, 2, 3, 4, 9",
  );
  await page.getByRole("button", { name: "Remove node", exact: true }).click();
  await expect(page.getByText("C graph edit complete: delete.")).toBeVisible();
  await expect(page.getByLabel("Input values", { exact: true })).toHaveValue(
    "1, 2, 3, 4",
  );
});
test("sorting comparison runs identical input through all three engines", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Compare sorts", exact: false })
    .click();
  await page.getByRole("button", { name: "Initialize comparison" }).click();
  await page.getByRole("button", { name: "Play comparison" }).click();
  await expect(page.getByText("Complete", { exact: true })).toHaveCount(3, {
    timeout: 20000,
  });
  for (const name of ["Insertion sort", "Merge sort", "Quicksort"])
    await expect(
      page.getByRole("img", { name: `${name} state: 1, 2, 2, 4, 5` }),
    ).toBeVisible();
});
test("responsive controls are keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open Stack", exact: true }).click();
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 0');
  const step = page.getByRole("button", { name: "Step forward" });
  await step.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 1');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
