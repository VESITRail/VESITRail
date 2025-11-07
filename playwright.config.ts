import { devices, defineConfig } from "@playwright/test";

export default defineConfig({
	use: {
		trace: "on-first-retry"
	},
	reporter: "html",
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	projects: [
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] }
		},
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] }
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] }
		}
	]
});
