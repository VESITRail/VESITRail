import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const cliArgs = process.argv.slice(2);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isIntegration =
	cliArgs.includes("integration") ||
	cliArgs.some((arg) => arg.includes("project=integration")) ||
	Boolean(process.env.npm_lifecycle_event?.includes("integration"));

const isUnitOnly =
	(cliArgs.includes("unit") ||
		cliArgs.some((arg) => arg.includes("project=unit")) ||
		Boolean(process.env.npm_lifecycle_event?.includes("unit"))) &&
	!isIntegration;

export default defineConfig({
	test: {
		fileParallelism: Boolean(isUnitOnly),
		coverage: {
			provider: "v8",
			reportOnFailure: true,
			reportsDirectory: "coverage",
			reporter: ["text", "text-summary", "json-summary", "json", "lcov", "html"],
			include: [
				"src/lib/utils.ts",
				"src/lib/result.ts",
				"src/lib/validations/**/*.ts",
				"src/lib/pwa/version-utils.ts",
				"src/lib/notifications/scenarios.ts",
				"src/lib/notifications/email-templates.ts"
			],
			thresholds: isIntegration
				? undefined
				: {
						lines: 80,
						branches: 80,
						functions: 80,
						perFile: true,
						statements: 80
					}
		},
		projects: [
			{
				resolve: {
					alias: {
						"@": path.resolve(__dirname, "./src")
					}
				},
				test: {
					name: "unit",
					globals: true,
					environment: "node",
					include: ["tests/unit/**/*.test.ts"]
				}
			},
			{
				resolve: {
					alias: [
						{
							find: "@/lib/auth",
							replacement: path.resolve(__dirname, "./tests/integration/test-auth.ts")
						},
						{
							find: "@",
							replacement: path.resolve(__dirname, "./src")
						}
					]
				},
				test: {
					globals: true,
					testTimeout: 20000,
					hookTimeout: 30000,
					environment: "node",
					name: "integration",
					setupFiles: ["tests/integration/setup.ts"],
					include: ["tests/integration/**/*.test.ts"],
					globalSetup: ["tests/integration/global-setup.ts"]
				}
			}
		]
	}
});
