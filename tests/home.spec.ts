import { test } from "@playwright/test";

test("should navigate to home page", async ({ page }) => {
	await page.goto("/");
});

test("should navigate through main navigation links", async ({ page }) => {
	await page.goto("/");

	await page.getByLabel("Main").getByRole("link", { name: "Home" }).click();
	await page.getByLabel("Main").getByRole("link", { name: "Guide" }).click();
	await page.getByLabel("Main").getByRole("link", { name: "Contributors" }).click();
	await page.getByLabel("Main").getByRole("link", { name: "Contact" }).click();
});

test("should interact with logo", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("link", { name: "Logo VESITRail" }).click();
});

test("should toggle theme and install app", async ({ page }) => {
	await page.goto("/");

	await page.getByRole("button", { name: "Install App" }).click();
	await page.getByRole("button", { name: "Toggle theme" }).click();
});

test("should display and interact with authentication dialog", async ({ page }) => {
	await page.goto("/");

	await page.getByText("VESIT Students Only").click();
	await page
		.locator("div")
		.filter({ hasText: /^Only @ves\.ac\.in emails allowed$/ })
		.click();
	await page.getByRole("button", { name: "Continue with Google" }).click();
});

test("should navigate to contact section", async ({ page }) => {
	await page.goto("/#contact");
	await page.getByRole("button", { name: "Contact Us" }).click();
});

test("should navigate through footer links", async ({ page }) => {
	await page.goto("/");

	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Home" }).click();
	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Guide" }).click();
	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Contributors" }).click();
	await page.getByLabel("Footer Navigation").getByRole("link", { name: "Contact" }).click();
});
