export const normalizeVersion = (version: string): string => {
	return version.replace(/^v/, "");
};

export const formatVersion = (version: string): string => {
	return version.startsWith("v") ? version : `v${version}`;
};

export const compareVersions = (currentVersion: string, newVersion: string): number => {
	const latest = normalizeVersion(newVersion).split(".").map(Number);
	const current = normalizeVersion(currentVersion).split(".").map(Number);

	for (let i = 0; i < Math.max(current.length, latest.length); i++) {
		const latestPart = latest[i] || 0;
		const currentPart = current[i] || 0;

		if (currentPart > latestPart) return 1;
		if (currentPart < latestPart) return -1;
	}

	return 0;
};
