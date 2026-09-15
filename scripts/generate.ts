import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const zodDir = resolve(process.cwd(), "src/generated/zod");
rmSync(zodDir, { recursive: true, force: true });

execSync("pnpm exec prisma generate", {
	stdio: "inherit"
});
