import { describe, it, expect } from "vitest";
import { beforeUserCreate } from "@/lib/auth-hooks";

describe("Auth Hooks (src/lib/auth-hooks.ts)", () => {
	describe("beforeUserCreate", () => {
		it("returns the user with a trimmed, title-cased name for a ves.ac.in email", async () => {
			const user = { id: "u1", email: "jay.kerkar@ves.ac.in", name: "  jay   kerkar " };

			await expect(beforeUserCreate(user)).resolves.toEqual({
				data: { id: "u1", email: "jay.kerkar@ves.ac.in", name: "Jay Kerkar" }
			});
		});

		it.each([null, undefined, ""])("keeps an empty name %j unchanged", async (name) => {
			await expect(beforeUserCreate({ email: "student@ves.ac.in", name })).resolves.toEqual({
				data: { email: "student@ves.ac.in", name }
			});
		});

		it.each([
			"student@gmail.com",
			"student@ves.ac.in.evil.com",
			"ves.ac.in@gmail.com",
			"student@sub.ves.ac.in",
			"STUDENT@VES.AC.IN",
			"student@",
			"",
			null,
			undefined
		])("rejects email %j with INVALID_EMAIL_DOMAIN", async (email) => {
			await expect(beforeUserCreate({ email, name: "Student" })).rejects.toMatchObject({
				body: { code: "INVALID_EMAIL_DOMAIN", message: "INVALID_EMAIL_DOMAIN" }
			});
		});
	});
});
