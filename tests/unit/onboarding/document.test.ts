import { describe, it, expect } from "vitest";
import DocumentSchema from "@/lib/validations/onboarding/document";

describe("DocumentSchema", () => {
	it("accepts a valid HTTP URL", () => {
		const res = DocumentSchema.safeParse({ verificationDocUrl: "http://example.com/doc.pdf" });
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.verificationDocUrl).toBe("http://example.com/doc.pdf");
		}
	});

	it("accepts a valid HTTPS URL with path and query parameters", () => {
		const res = DocumentSchema.safeParse({
			verificationDocUrl: "https://s3.amazonaws.com/bucket/doc.png?sig=123"
		});
		expect(res.success).toBe(true);
	});

	it("rejects non-URL string", () => {
		const res = DocumentSchema.safeParse({ verificationDocUrl: "not-a-url" });
		expect(res.success).toBe(false);
	});

	it("rejects empty string", () => {
		const res = DocumentSchema.safeParse({ verificationDocUrl: "" });
		expect(res.success).toBe(false);
	});

	it("rejects missing verificationDocUrl property", () => {
		const res = DocumentSchema.safeParse({});
		expect(res.success).toBe(false);
	});
});
