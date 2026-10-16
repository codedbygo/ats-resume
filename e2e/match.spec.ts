import path from "node:path";

import { expect, test } from "@playwright/test";

// Runs against a production build. The job boards are live upstream APIs;
// when they are unreachable the app falls back to sample jobs, so the flow
// is asserted either way.
test.describe("resume to matched jobs", () => {
  test("parses an uploaded PDF into the editor and scores it", async ({ page }) => {
    await page.goto("/");

    // The way a user uploads: the button opens the picker once React has
    // hydrated, so retry the click until the chooser appears.
    await expect(async () => {
      const chooser = page.waitForEvent("filechooser", { timeout: 1_000 });
      await page.getByRole("button", { name: "Upload PDF" }).click();
      await (await chooser).setFiles(path.join(import.meta.dirname, "fixtures/resume.pdf"));
    }).toPass();

    const editor = page.getByRole("textbox", { name: "Resume text" });
    await expect(editor).toHaveValue(/Jordan Lee/);
    await expect(editor).toHaveValue(/\n- Reduced p95 latency by 40% with Redis caching/);
    await expect(page.getByRole("img", { name: /ATS score \d+ out of 100/ })).toBeVisible();
  });

  test("finds ranked jobs for the sample resume and scores against one", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Try a sample" }).click();
    await expect(page.getByRole("img", { name: /ATS score [1-9]\d out of 100/ })).toBeVisible();
    await page.getByRole("button", { name: "Find matching jobs" }).click();

    await expect(page.getByText(/Scanned \d+ live jobs|these are sample jobs/)).toBeVisible({
      timeout: 30_000,
    });
    const first = page
      .getByRole("region", { name: "Best-fit jobs" })
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { level: 3 }) })
      .first();
    await expect(first.getByText("Skill coverage")).toBeVisible();

    await first.getByRole("button", { name: /ATS check vs this job/ }).click();
    await expect(page.getByText(/Scored against/)).toBeVisible();
  });

  // Regression: the print copy sat inside the sticky column and printed blank.
  test("prints only the resume as plain text and keeps it after a reload", async ({ page }) => {
    await page.goto("/");
    await expect(async () => {
      await page.getByRole("button", { name: "Try a sample" }).click();
      await expect(page.getByRole("textbox", { name: "Resume text" })).not.toHaveValue("", {
        timeout: 500,
      });
    }).toPass();

    await page.reload();
    await expect(page.getByRole("textbox", { name: "Resume text" })).toHaveValue(/Alex Rivera/);
    await page.emulateMedia({ media: "print" });

    await expect(page.locator("#print-resume")).toBeVisible();
    await expect(page.locator("#print-resume")).toContainText("Brightpath Labs");
    await expect(page.getByRole("heading", { name: /Stop searching/ })).toBeHidden();
  });

  test("serves the liveness probe", async ({ request }) => {
    const health = await request.get("/api/healthz");

    expect(health.ok()).toBe(true);
    expect(await health.json()).toMatchObject({ status: "ok" });
  });

  test("shows the not-found page for an unknown path", async ({ page }) => {
    const response = await page.goto("/nowhere");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
