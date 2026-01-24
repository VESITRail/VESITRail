interface GitHubContributor {
	login: string;
	id: number;
	avatar_url: string;
	html_url: string;
	contributions: number;
	type: string;
}

export interface Contributor {
	username: string;
	avatar: string;
	profileUrl: string;
	commits: number;
}

const BOT_PATTERNS = [
	"bot",
	"[bot]",
	"dependabot",
	"github-actions",
	"semantic-release-bot",
	"renovate",
	"greenkeeper"
];

function isBot(username: string, type: string): boolean {
	if (type === "Bot") return true;
	const lowerUsername = username.toLowerCase();
	return BOT_PATTERNS.some((pattern) => lowerUsername.includes(pattern));
}

export async function fetchGitHubContributors(): Promise<Contributor[]> {
	const token = process.env.GITHUB_TOKEN;
	const repo = "VESITRail/VESITRail";

	const headers: HeadersInit = {
		Accept: "application/vnd.github.v3+json",
		...(token && { Authorization: `Bearer ${token}` })
	};

	try {
		const response = await fetch(`https://api.github.com/repos/${repo}/contributors?per_page=100`, {
			headers,
			next: { revalidate: false }
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
