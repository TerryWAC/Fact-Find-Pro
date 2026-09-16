import { test, expect } from "@playwright/test";

test("admin sees honest provider status and cannot test a missing API key", async ({
  page,
}, testInfo) => {
  await page.goto("/login?redirectTo=/admin/emails");
  await page.getByLabel("Email", { exact: false }).fill("admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill("PreviewOnly!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("Email connection", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send test email" }),
  ).toBeDisabled();
  await expect(page.getByText("Key configured", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("Log only", { exact: true })).toBeVisible();
  await expect(page.getByText("Logged only", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Sends one sample PDF to admin@example.test/),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("email-connection.png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("adviser cannot access platform email configuration", async ({ page }) => {
  await page.goto("/login?redirectTo=/admin/emails");
  await page.getByLabel("Email", { exact: false }).fill("adviser@example.test");
  await page.getByLabel("Password", { exact: true }).fill("PreviewOnly!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("button", { name: "Send test email" }),
  ).toHaveCount(0);
  await page.goto("/admin/emails");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Email connection", { exact: true })).toHaveCount(
    0,
  );
});
