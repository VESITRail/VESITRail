import { test, expect } from "@playwright/test";

test("should navigate through home page elements and verify UI interactions", async ({ page }) => {
	await page.goto("/");

	await page.getByRole("link", { name: "Logo VESITRail" }).click();
	await page.waitForURL("/");

	await page.getByLabel("Main").getByRole("link", { name: "Home" }).click();
	await page.waitForURL("/");

	await page.getByLabel("Main").getByRole("link", { name: "Guide" }).click();
	await page.waitForLoadState("domcontentloaded");

	await page.getByLabel("Main").getByRole("link", { name: "Developers" }).click();
	await page.waitForLoadState("domcontentloaded");

	await page.getByLabel("Main").getByRole("link", { name: "Contact" }).click();
	await page.waitForLoadState("domcontentloaded");

	await page.getByRole("button", { name: "Contact Us" }).click();
	await page.waitForLoadState("domcontentloaded");

	await page.goto("/");

	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Home" }).click();
	await page.waitForURL("/");

	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Guide" }).click();
	await page.waitForLoadState("domcontentloaded");

	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Developers" }).click();
	await page.waitForLoadState("domcontentloaded");

	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Contact" }).click();
	await page.waitForLoadState("domcontentloaded");

	await page.getByRole("button", { name: "Install App" }).click();
	await page.waitForTimeout(500);

	await page.getByRole("button", { name: "Toggle theme" }).click();
	await page.waitForTimeout(500);

	await expect(page.getByText("VESIT Students Only")).toBeVisible();
	await expect(page.locator("div").filter({ hasText: /^Only @ves\.ac\.in emails allowed$/ })).toBeVisible();

	await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});
