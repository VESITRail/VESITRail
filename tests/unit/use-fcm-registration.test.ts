import { getActiveServiceWorkerRegistration } from "@/lib/pwa/service-worker-registration";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const registration = { scope: "https://example.test/" } as ServiceWorkerRegistration;

const createServiceWorker = (ready = new Promise<ServiceWorkerRegistration>(() => {})) => ({
	ready,
	getRegistration: vi.fn<ServiceWorkerContainer["getRegistration"]>(),
	register: vi.fn<ServiceWorkerContainer["register"]>()
});

describe("getActiveServiceWorkerRegistration", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the ready registration", async () => {
		const serviceWorker = createServiceWorker(Promise.resolve(registration));

		await expect(getActiveServiceWorkerRegistration(serviceWorker)).resolves.toBe(registration);
		expect(serviceWorker.getRegistration).not.toHaveBeenCalled();
		expect(serviceWorker.register).not.toHaveBeenCalled();
	});

	it("looks up the root registration after four seconds", async () => {
		const serviceWorker = createServiceWorker();
		serviceWorker.getRegistration.mockResolvedValue(registration);

		const result = getActiveServiceWorkerRegistration(serviceWorker);
		await vi.advanceTimersByTimeAsync(3999);
		expect(serviceWorker.getRegistration).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);

		await expect(result).resolves.toBe(registration);
		expect(serviceWorker.getRegistration).toHaveBeenCalledExactlyOnceWith("/");
		expect(serviceWorker.register).not.toHaveBeenCalled();
	});

	it("returns undefined when no registration is available", async () => {
		const serviceWorker = createServiceWorker();
		serviceWorker.getRegistration.mockResolvedValue(undefined);

		const result = getActiveServiceWorkerRegistration(serviceWorker);
		await vi.advanceTimersByTimeAsync(4000);

		await expect(result).resolves.toBeUndefined();
		expect(serviceWorker.getRegistration).toHaveBeenCalledExactlyOnceWith("/");
		expect(serviceWorker.register).not.toHaveBeenCalled();
	});
});
