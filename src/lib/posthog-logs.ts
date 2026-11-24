import { after } from "next/server";
import { logs, type LogRecord } from "@opentelemetry/api-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const serviceName = "vesitrail";

const globalForPostHog = globalThis as typeof globalThis & {
	postHogLogs?: { provider: LoggerProvider; flush: Promise<void> };
};

export function registerPostHogLogs() {
	if (globalForPostHog.postHogLogs) return;

	const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();
	if (!token || !/^phc_[a-zA-Z0-9_-]+$/.test(token)) return;

	const provider = new LoggerProvider({
		resource: resourceFromAttributes({ "service.name": serviceName }),
		processors: [
			new BatchLogRecordProcessor({
				exporter: new OTLPLogExporter({
					url: "https://us.i.posthog.com/i/v1/logs",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json"
					}
				})
			})
		]
	});

	logs.setGlobalLoggerProvider(provider);
	globalForPostHog.postHogLogs = { provider, flush: Promise.resolve() };
}

export function emitServerLog(record: LogRecord) {
	const state = globalForPostHog.postHogLogs;
	if (!state) return;

	const { provider } = state;
	provider.getLogger(serviceName).emit(record);
	after(() => {
		state.flush = state.flush
			.then(() => provider.forceFlush())
			.catch(() => console.warn("Failed to flush PostHog logs"));
		return state.flush;
	});
}
