export const getActiveServiceWorkerRegistration = async (
	serviceWorker: Pick<ServiceWorkerContainer, "ready" | "getRegistration">
): Promise<ServiceWorkerRegistration | undefined> => {
	let timeout: ReturnType<typeof setTimeout> | undefined;
	const waitForTimeout = new Promise<undefined>((resolve) => {
		timeout = setTimeout(() => resolve(undefined), 4000);
	});

	try {
		const registration = await Promise.race([serviceWorker.ready, waitForTimeout]);
		return registration ?? serviceWorker.getRegistration("/");
	} finally {
		clearTimeout(timeout);
	}
};
