import { test, expect } from "@playwright/test";
test("registration merges guest progress and persists official grading and experiments", async ({
  page,
}) => {
  test.skip(
    process.env.INTEGRATED !== "1",
    "Requires running Spring Boot + MySQL; enable INTEGRATED=1",
  );
  const email = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  await page.goto("/");
  await expect(page.getByTestId("engine-state")).toContainText('"seq": 0');
  await page.getByLabel("O(n)", { exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(
    page.getByText("Practice result: Correct.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sign in / register", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Display name").fill("Integrated Learner");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("integration-passphrase-42");
  await page.getByRole("button", { name: "Register and sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Integrated Learner" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const r = await page.request.get("/api/progress?size=100");
      const data = await r.json();
      return data.items?.find((x: any) => x.moduleId === "arrays")?.completion;
    })
    .toBe(75);
  await page.getByRole("button", { name: "Open Arrays", exact: true }).click();
  await page.getByLabel("O(n)", { exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(
    page.getByText("Official score: 1/1.", { exact: false }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const data = await (await page.request.get("/api/progress")).json();
      return data.items.find((x: any) => x.moduleId === "arrays")?.completion;
    })
    .toBe(100);
  await page.getByLabel("Experiment title").fill("Authenticated C experiment");
  await page
    .getByRole("button", { name: "Save experiment", exact: true })
    .click();
  await expect(
    page.getByText("Experiment saved.", { exact: false }),
  ).toBeVisible();
  const experiments = await (await page.request.get("/api/experiments")).json();
  expect(experiments.items[0].title).toBe("Authenticated C experiment");
  const attempts = await (await page.request.get("/api/attempts")).json();
  expect(attempts.items[0].score).toBe(1);
  await page.reload();
  await page
    .getByRole("button", { name: "Your account", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Integrated Learner" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Keep your learning in sync" }),
  ).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("integration-passphrase-42");
  await page
    .getByRole("button", { name: "Sign in to your account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Integrated Learner" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Saved experiments", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Authenticated C experiment" }),
  ).toHaveCount(2);
});
