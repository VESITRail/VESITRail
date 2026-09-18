import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

interface LabelConfig {
	name: string;
	color: string;
	description: string;
}

function parseLabelsYaml(filePath: string): LabelConfig[] {
	const labels: LabelConfig[] = [];
	const content = readFileSync(filePath, "utf-8");

	const blocks = content.split(/(?=^-\s+name:)/m);

	for (const block of blocks) {
		const nameMatch = block.match(/name:\s*["']?([^"'\n]+)["']?/);
		const colorMatch = block.match(/color:\s*["']?#?([a-fA-F0-9]{6})["']?/);
		const descMatch = block.match(/description:\s*["']?([^"'\n]*)["']?/);

		if (nameMatch && colorMatch) {
			labels.push({
				name: nameMatch[1].trim(),
				color: colorMatch[1].trim(),
				description: descMatch ? descMatch[1].trim() : ""
			});
		}
	}

	return labels;
}

function syncLabels() {
	const labelsPath = resolve(process.cwd(), ".github/labels.yml");
	console.log(`Reading label definitions from: ${labelsPath}`);

	const labels = parseLabelsYaml(labelsPath);
	console.log(`Found ${labels.length} labels to sync.\n`);

	let errorCount = 0;
	let successCount = 0;

	for (const label of labels) {
		process.stdout.write(`Syncing "${label.name}" (#${label.color})... `);
		try {
			execFileSync(
				"gh",
				["label", "create", label.name, "--color", label.color, "--description", label.description, "--force"],
				{ stdio: ["ignore", "pipe", "pipe"] }
			);
			console.log("✓ Done");
			successCount++;
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			console.log(`✗ Failed: ${errorMsg}`);
			errorCount++;
		}
	}

	console.log(`\nFinished: ${successCount} synced, ${errorCount} failed.`);
}

syncLabels();
