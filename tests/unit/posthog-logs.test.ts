import { after } from "next/server";
import { LoggerProvider } from "@opentelemetry/sdk-logs";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { emitServerLog, registerPostHogLogs } from "@/lib/posthog-logs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";

const { createExporter, exportRecords } = vi.hoisted(() => ({
	createExporter: vi.fn(),
	exportRecords: vi.fn<OTLPLogExporter["export"]>()
}));

vi.mock(import("@opentelemetry/exporter-logs-otlp-http"), async (importOriginal) => {
	const { OTLPLogExporter } = await importOriginal();

	return {
		OTLPLogExporter: class extends OTLPLogExporter {
			constructor(options: ConstructorParameters<typeof OTLPLogExporter>[0]) {
				super(options);
				createExporter(options);
			}

			override export = exportRecords;
		}
	};
});

vi.mock(import("next/server"), async (importOriginal) => ({
	...(await importOriginal()),
	after: vi.fn()
}));

const record = {
	body: "Example request completed",
	severityNumber: SeverityNumber.INFO,
	attributes: { "http.response.status_code": 200 }
};

async function runAfterResponse(index = 0) {
	const task = vi.mocked(after).mock.calls[index]?.[0];
	if (typeof task !== "function") throw new Error("No log flush was scheduled");
	await task();
}

beforeEach(() => {
	vi.stubGlobal("postHogLogs", undefined);
	vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
	createExporter.mockClear();
	exportRecords.mockReset();
	exportRecords.mockImplementation((_records, complete) => complete({ code: 0 }));
	vi.mocked(after).mockClear();
});

afterEach(() => {
	logs.disable();
	vi.unstubAllEnvs();
});

describe("registerPostHogLogs", () => {
	it.each([undefined, "", "  ", "your-posthog-project-token", "phx_personal", "phc_", "phc_bad token", "phc_☃"])(
		"leaves logging disabled when the token is %s",
		(token) => {
			vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", token);

			registerPostHogLogs();
			emitServerLog(record);

			expect(createExporter).not.toHaveBeenCalled();
			expect(after).not.toHaveBeenCalled();
		}
	);

	it("registers one provider with the US Cloud JSON endpoint and trimmed project token", async () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "  phc_test  ");
		registerPostHogLogs();
		registerPostHogLogs();

		logs.getLogger("test").emit({ body: "Global log" });
		emitServerLog(record);
		await runAfterResponse();

		expect(createExporter).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				url: "https://us.i.posthog.com/i/v1/logs",
				headers: { Authorization: "Bearer phc_test", "Content-Type": "application/json" }
			})
		);
		expect(exportRecords.mock.calls[0]?.[0].map(({ body }) => body)).toEqual(["Global log", record.body]);
	});
});

describe("emitServerLog", () => {
	it("exports the structured record with the service name after the response", async () => {
		registerPostHogLogs();

		emitServerLog(record);

		expect(exportRecords).not.toHaveBeenCalled();
		await runAfterResponse();
		expect(exportRecords.mock.calls[0]?.[0]).toEqual([
			expect.objectContaining({
				...record,
				resource: expect.objectContaining({ attributes: { "service.name": "vesitrail" } })
			})
		]);
	});

	it("flushes records from overlapping responses", async () => {
		const firstBatchStarted = Promise.withResolvers<void>();
		const finishFirstBatch = Promise.withResolvers<void>();
		exportRecords.mockImplementationOnce((_records, complete) => {
			firstBatchStarted.resolve();
			void finishFirstBatch.promise.then(() => complete({ code: 0 }));
		});
		registerPostHogLogs();

		emitServerLog(record);
		const firstFlush = runAfterResponse();
		await firstBatchStarted.promise;
		emitServerLog({ ...record, body: "Second request completed" });
		const secondFlush = runAfterResponse(1);
		finishFirstBatch.resolve();
		await Promise.all([firstFlush, secondFlush]);

		expect(exportRecords.mock.calls.map(([batch]) => batch.map(({ body }) => body))).toEqual([
			[record.body],
			["Second request completed"]
		]);
	});

	it("handles flush failures without exposing exporter details", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { forceFlush } = LoggerProvider.prototype;
		vi.spyOn(LoggerProvider.prototype, "forceFlush").mockImplementationOnce(async function (this: LoggerProvider) {
			await forceFlush.call(this);
			throw new Error("Sensitive exporter detail");
		});
		registerPostHogLogs();

		emitServerLog(record);

		await expect(runAfterResponse()).resolves.toBeUndefined();
		expect(warn).toHaveBeenCalledExactlyOnceWith("Failed to flush PostHog logs");
	});
});
