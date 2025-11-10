import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
	await page.goto("http://localhost:3000/");
	await page.getByRole("link", { name: "Logo VESITRail" }).click();
	await page.getByLabel("Main").getByRole("link", { name: "Home" }).click();
	await page.getByLabel("Main").getByRole("link", { name: "Guide" }).click();
	await page.getByLabel("Main").getByRole("link", { name: "Developers" }).click();
	await page.getByLabel("Main").getByRole("link", { name: "Contact" }).click();
	await page.getByRole("button", { name: "Contact Us" }).click();
	await page.getByRole("link", { name: "VESITRail", exact: true }).click();
	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Home" }).click();
	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Guide" }).click();
	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Developers" }).click();
	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Contact" }).click();
	await page.getByRole("button", { name: "Install App" }).click();
	await page.getByRole("button", { name: "Toggle theme" }).click();
	await page.getByText("VESIT Students Only").click();
	await page
		.locator("div")
		.filter({ hasText: /^Only @ves\.ac\.in emails allowed$/ })
		.click();
	await page.getByRole("button", { name: "Continue with Google" }).click();
});
