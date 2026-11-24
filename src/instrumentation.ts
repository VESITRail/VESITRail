export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { registerPostHogLogs } = await import("@/lib/posthog-logs");
		registerPostHogLogs();
	}
}
