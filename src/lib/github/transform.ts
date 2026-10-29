const BOT_PATTERNS = [
	"bot",
	"[bot]",
	"renovate",
	"dependabot",
	"greenkeeper",
	"github-actions",
	"semantic-release-bot"
];

export type GitHubReleaseResponse = {
	draft: boolean;
	tag_name: string;
	body: string | null;
	prerelease: boolean;
	published_at: string;
};

export type ReleaseData = {
	version: string;
	tagName: string;
	changelog: string;
	publishedAt: string;
};

export type GitHubContributor = {
	id: number;
	type: string;
	login: string;
	html_url: string;
	avatar_url: string;
	contributions: number;
};

export type GitHubContributorStats = {
	total: number;
	author: GitHubContributor;
};

export type Contributor = {
	avatar: string;
	commits: number;
	username: string;
	profileUrl: string;
};

export const isBot = (username: string, type: string): boolean => {
	if (type === "Bot") return true;
	const lowerUsername = username.toLowerCase();
	return BOT_PATTERNS.some((pattern) => lowerUsername.includes(pattern));
};

export const toReleaseData = (data: GitHubReleaseResponse): ReleaseData | null => {
	if (data.draft || data.prerelease) {
		return null;
	}

	return {
		tagName: data.tag_name,
		publishedAt: data.published_at,
		version: data.tag_name.replace(/^v/, ""),
		changelog: data.body || "No changelog available."
	};
};

export const mapContributorStats = (stats: GitHubContributorStats[]): Contributor[] =>
	stats
		.filter((item) => item.author && !isBot(item.author.login, item.author.type))
		.map((item) => ({
			commits: item.total,
			username: item.author.login,
			avatar: item.author.avatar_url,
			profileUrl: item.author.html_url
		}))
		.sort((a, b) => b.commits - a.commits);

export const mapContributors = (contributors: GitHubContributor[]): Contributor[] =>
	contributors
		.filter((contributor) => !isBot(contributor.login, contributor.type))
		.map((contributor) => ({
			username: contributor.login,
			avatar: contributor.avatar_url,
			profileUrl: contributor.html_url,
			commits: contributor.contributions
		}))
		.sort((a, b) => b.commits - a.commits);
