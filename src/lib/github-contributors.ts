import { unstable_cache } from "next/cache";

interface GitHubContributor {
	id: number;
	type: string;
	login: string;
	html_url: string;
	avatar_url: string;
	contributions: number;
}

export interface Contributor {
	avatar: string;
	commits: number;
	username: string;
	profileUrl: string;
}

const BOT_PATTERNS = [
	"bot",
	"[bot]",
	"renovate",
	"dependabot",
	"greenkeeper",
	"github-actions",
	"semantic-release-bot"
];

function isBot(username: string, type: string): boolean {
	if (type === "Bot") return true;
	const lowerUsername = username.toLowerCase();
	return BOT_PATTERNS.some((pattern) => lowerUsername.includes(pattern));
}

async function fetchContributorsFromGitHub(): Promise<Contributor[]> {
	const repo = "VESITRail/VESITRail";
	const token = process.env.GITHUB_TOKEN;

	const headers: HeadersInit = {
		Accept: "application/vnd.github.v3+json",
		...(token && { Authorization: `Bearer ${token}` })
	};

	try {
		const response = await fetch(`https://api.github.com/repos/${repo}/contributors?per_page=100`, {
			headers,
			cache: "force-cache"
		});

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const data: GitHubContributor[] = await response.json();

		const contributors = data
			.filter((contributor) => !isBot(contributor.login, contributor.type))
			.map((contributor) => ({
				username: contributor.login,
				avatar: contributor.avatar_url,
				profileUrl: contributor.html_url,
				commits: contributor.contributions
			}))
			.sort((a, b) => b.commits - a.commits);

		return contributors;
	} catch (error) {
		console.error("Failed to fetch GitHub contributors:", error);
		return [];
	}
}

export const fetchGitHubContributors = unstable_cache(fetchContributorsFromGitHub, ["github-contributors"], {
	revalidate: false
});
