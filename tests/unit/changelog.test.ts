import { describe, it, expect } from "vitest";
import { isMarkdownContent } from "@/lib/changelog";

describe("Changelog Helpers (src/lib/changelog.ts)", () => {
	describe("isMarkdownContent", () => {
		it.each([
			["inline code", "Run `pnpm install` first"],
			["heading", "## What's Changed"],
			["italic text", "This is *important*"],
			["link", "See [release notes](https://example.com)"],
			["unordered list", "* Fixed a bug"],
			["bold text", "**Breaking** change"],
			["ordered list", "1. First step"],
			["code block", "```\nconst a = 1;\n```"],
			["heading on a later line", "Intro line\n### Features"]
		])("detects %s", (_label, content) => {
			expect(isMarkdownContent(content)).toBe(true);
		});

		it.each([
			["plain text", "Fixed a bug in the booklet table"],
			["empty string", ""],
			["hash without space", "#hashtag"],
			["number without dot space", "Version 2 released"],
			["bare url", "https://github.com/VESITRail/VESITRail"]
		])("returns false for %s", (_label, content) => {
			expect(isMarkdownContent(content)).toBe(false);
		});
	});
});
