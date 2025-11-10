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
	webServer: {
		port: 3000,
		timeout: 120000,
		reuseExistingServer: !process.env.CI,
		command: "npm run build && npm run start"
	},
	projects: [
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
