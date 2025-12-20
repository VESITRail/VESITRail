import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";

const ZOD_FILE = join(process.cwd(), "src/generated/zod/index.ts");

const OLD_IMPORTS = `import { z } from 'zod';
import { JsonValue, InputJsonValue, objectEnumValues } from '@prisma/client/runtime/library';
import type { Prisma } from '../prisma';`;

const NEW_IMPORTS = `// @ts-nocheck
import { z } from "zod";
import type { Prisma } from "../prisma/client";
import { JsonValue, InputJsonValue } from "@prisma/client/runtime/client";

const objectEnumValues = {
	instances: {
		DbNull: Symbol("DbNull"),
		JsonNull: Symbol("JsonNull")
	}
};

const NullTypes = {
	AnyNull: Symbol("AnyNull"),
	DbNull: objectEnumValues.instances.DbNull,
	JsonNull: objectEnumValues.instances.JsonNull
};`;

async function fixZodTypes() {
	console.log("");
	console.log("========================================");
	console.log("      FIXING ZOD TYPES FOR PRISMA      ");
	console.log("========================================");
	console.log("");

	console.log("Updating Zod types for Prisma v7...");

	try {
		const content = await readFile(ZOD_FILE, "utf-8");
		const fixed = content.replace(OLD_IMPORTS, NEW_IMPORTS);
		await writeFile(ZOD_FILE, fixed, "utf-8");

		console.log("");
		console.log("----------------------------------------");
		console.log("✓ Zod types fixed successfully.");
		console.log("----------------------------------------");
		console.log("");
	} catch (error) {
		console.log("");
		console.log("----------------------------------------");
		console.log("✗ Failed to fix Zod types.");
		console.log("----------------------------------------");
		console.error(error);
		console.log("");
		process.exit(1);
	}
}

fixZodTypes();
