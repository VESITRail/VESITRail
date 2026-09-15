import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src")
		}
	},
	test: {
		globals: true,
		environment: "node",
		include: ["tests/**/*.test.ts"],
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
				"src/lib/notifications/scenarios.ts"
			],
			thresholds: {
				lines: 80,
				branches: 80,
				functions: 80,
				perFile: true,
				statements: 80
			}
		}
	}
});
