import { test, expect } from "@playwright/test";
test("login merges explicit guest slides, records server grading and restores account position and experiments", async ({
  page,
}) => {
  test.skip(
    process.env.INTEGRATED !== "1",
    "Requires Spring Boot and MySQL; use INTEGRATED=1",
  );
  const email = `lessons-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  await page.goto("/#/lesson/arrays/basics");
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Display name").fill("Lesson Learner");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("integration-passphrase-42");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("integration-passphrase-42");
  await page.getByRole("button", { name: "Register and sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Lesson Learner" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const data = await (
        await page.request.get("/api/learning/progress")
      ).json();
      return data.items?.some(
        (x: any) =>
          x.moduleId === "arrays" && x.slideId === "basics" && x.completed,
      );
    })
    .toBe(true);
  await page
    .getByRole("link", { name: "DSA Learning Lab home", exact: true })
    .click();
  await page.getByRole("link", { name: "Open Arrays", exact: true }).click();
  await expect(page.getByLabel("Lesson pages")).toHaveValue("representation");
  await page.getByLabel("Lesson pages").selectOption("insert");
  await expect(
    page.getByRole("button", { name: "Step forward" }),
  ).toBeEnabled();
  await page.getByLabel("Input values").fill("8, 2");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Arrays state: 8, 2" }),
  ).toBeVisible();
  await page.getByText("Save or reuse this input", { exact: true }).click();
  await page.getByLabel("Experiment title").fill("Recorded lesson experiment");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(
    page.getByText("Experiment saved. Find it in Saved experiments."),
  ).toBeVisible();
  const saved = await (await page.request.get("/api/experiments")).json();
  expect(saved.items[0].title).toBe("Recorded lesson experiment");
  expect(saved.items[0].engineVersion).toBe("1.1.0");
  await page.getByLabel("Lesson pages").selectOption("quiz");
  const response = await (
    await page.request.get("/api/modules/arrays/questions")
  ).json();
  expect(response).toHaveLength(3);
  expect(JSON.stringify(response)).not.toMatch(/correct|explanation/);
  await expect(page.locator(".quiz fieldset")).toHaveCount(3);
  for (const field of await page.locator(".quiz fieldset").all())
    await field.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(
    page.getByRole("region", { name: "Quiz results" }),
  ).toContainText("Recorded result:");
  await expect(page.locator(".selected-incorrect")).toHaveCount(2);
  for (const wrong of await page.locator(".selected-incorrect input").all())
    await expect(wrong).toBeChecked();
  await expect(
    page.getByRole("link", { name: /Review:/ }).first(),
  ).toBeVisible();
  let attempts = await (await page.request.get("/api/attempts")).json();
  expect(attempts.total).toBe(1);
  expect(attempts.items[0].total).toBe(3);
  await page.getByRole("button", { name: "Retry quiz" }).click();
  await expect(page.locator(".quiz fieldset")).toHaveCount(3);
  for (const field of await page.locator(".quiz fieldset").all())
    await field.getByRole("radio").last().check();
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(
    page.getByRole("region", { name: "Quiz results" }),
  ).toBeVisible();
  attempts = await (await page.request.get("/api/attempts")).json();
  expect(attempts.total).toBe(2);
  await page.getByLabel("Lesson pages").selectOption("delete");
  await expect
    .poll(async () => {
      const data = await (
        await page.request.get("/api/learning/positions")
      ).json();
      return data.items.find((x: any) => x.moduleId === "arrays")?.slideId;
    })
    .toBe("delete");
  await page.reload();
  await expect(page.getByLabel("Lesson pages")).toHaveValue("delete");
  await page.getByRole("link", { name: "Lesson Learner", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("integration-passphrase-42");
  await page
    .getByRole("button", { name: "Sign in to your account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Lesson Learner" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "DSA Learning Lab home", exact: true })
    .click();
  await page.getByRole("link", { name: "Open Arrays", exact: true }).click();
  await expect(page.getByLabel("Lesson pages")).toHaveValue("delete");
  await page
    .getByRole("link", { name: "Saved experiments", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Recorded lesson experiment",
      exact: true,
    }),
  ).toHaveCount(2);
  await page
    .locator(".saved-row")
    .last()
    .getByRole("button", { name: "Load", exact: true })
    .click();
  await expect(page.getByLabel("Lesson pages")).toHaveValue("insert");
  await expect(
    page.getByText("Loaded your saved values and operation."),
  ).toBeVisible();
  await expect(page.getByLabel("Input values")).toHaveValue("8, 2");
  await page.getByRole("link", { name: "Lesson Learner", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Keep your learning in sync" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Saved experiments", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Recorded lesson experiment",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "DSA Learning Lab home", exact: true })
    .click();
  await page.getByRole("link", { name: "Open Arrays", exact: true }).click();
  await page.getByLabel("Lesson pages").selectOption("insert");
  await expect(page.getByLabel("Input values")).toHaveValue("3, 1, 4");
  await expect(
    page.getByText("Loaded your saved values and operation."),
  ).toHaveCount(0);
});
