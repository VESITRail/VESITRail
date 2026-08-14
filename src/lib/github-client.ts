type GitHubStarsResponse = {
	stars: number;
};

type ReleaseData = {
	version: string;
	tagName: string;
	changelog: string;
	publishedAt: string;
};

type Contributor = {
	avatar: string;
	commits: number;
	username: string;
	profileUrl: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const pendingPromises = new Map<string, Promise<unknown>>();
const cache = new Map<string, { data: unknown; timestamp: number }>();

export async function fetchGitHubStars(): Promise<GitHubStarsResponse> {
	return fetchGitHubData<GitHubStarsResponse>("stars");
}

export async function fetchGitHubContributors(): Promise<Contributor[]> {
	return fetchGitHubData<Contributor[]>("contributors");
}

export async function fetchGitHubRelease(): Promise<ReleaseData> {
	return fetchGitHubData<ReleaseData>("release");
}

async function fetchGitHubData<T>(type: string): Promise<T> {
	const now = Date.now();
	const cacheKey = `github_${type}`;

	const cached = cache.get(cacheKey);
	if (cached && now - cached.timestamp < CACHE_TTL_MS) {
		return cached.data as T;
	}

	if (pendingPromises.has(cacheKey)) {
		return pendingPromises.get(cacheKey) as Promise<T>;
	}

	const promise = (async () => {
		try {
			const response = await fetch(`/api/github?type=${type}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch ${type} data: ${response.status}`);
			}
			const data = (await response.json()) as T;
			cache.set(cacheKey, { data, timestamp: Date.now() });
			return data;
		} finally {
			pendingPromises.delete(cacheKey);
		}
	})();

	pendingPromises.set(cacheKey, promise);
	return promise;
}
