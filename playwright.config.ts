import { devices, defineConfig } from "@playwright/test";

export default defineConfig({
	timeout: 60000,
	reporter: "html",
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	expect: {
		timeout: 10000
	},
	use: {
		locale: "en-US",
		actionTimeout: 15000,
		trace: "on-first-retry",
		navigationTimeout: 30000,
		video: "retain-on-failure",
		baseURL: "http://localhost:3000"
	},
	webServer: {
		port: 3000,
		timeout: 180000,
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
