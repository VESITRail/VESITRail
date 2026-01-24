import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const REPO_NAME = "VESITRail";
const REPO_OWNER = "VESITRail";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const CACHE_DURATIONS = {
	stars: 3600,
	release: 1800,
	contributors: false as false
};

const BOT_PATTERNS = [
	"bot",
	"[bot]",
	"renovate",
	"dependabot",
	"greenkeeper",
	"github-actions",
	"semantic-release-bot"
];

type GitHubRepoResponse = {
	stargazers_count: number;
};

type GitHubReleaseResponse = {
	draft: boolean;
	tag_name: string;
	body: string | null;
	prerelease: boolean;
	published_at: string;
};

type ReleaseData = {
	version: string;
	tagName: string;
	changelog: string;
	publishedAt: string;
};

type GitHubContributor = {
	id: number;
	type: string;
	login: string;
	html_url: string;
	avatar_url: string;
	contributions: number;
};

type Contributor = {
	avatar: string;
	commits: number;
	username: string;
	profileUrl: string;
};

function isBot(username: string, type: string): boolean {
	if (type === "Bot") return true;
	const lowerUsername = username.toLowerCase();
	return BOT_PATTERNS.some((pattern) => lowerUsername.includes(pattern));
}

const fetchGitHub = async <T>(endpoint: string): Promise<T> => {
	const headers: Record<string, string> = {
		Accept: "application/vnd.github.v3+json"
	};

	if (GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
	}

	const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${endpoint}`, {
		headers
	});

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	return response.json();
};

const getCachedStars = unstable_cache(
	async (): Promise<number> => {
		const data = await fetchGitHub<GitHubRepoResponse>("");
		return data.stargazers_count;
	},
	["github-stars"],
	{
		tags: ["github-stars"],
		revalidate: CACHE_DURATIONS.stars
	}
);

const getCachedRelease = unstable_cache(
	async (): Promise<ReleaseData | null> => {
		const data = await fetchGitHub<GitHubReleaseResponse>("/releases/latest");

		if (data.draft || data.prerelease) {
			return null;
		}

		return {
			tagName: data.tag_name,
			publishedAt: data.published_at,
			version: data.tag_name.replace(/^v/, ""),
			changelog: data.body || "No changelog available."
		};
	},
	["github-release"],
	{
		tags: ["github-release"],
		revalidate: CACHE_DURATIONS.release
	}
);

const getCachedContributors = unstable_cache(
	async (): Promise<Contributor[]> => {
		try {
			const data = await fetchGitHub<GitHubContributor[]>("/contributors?per_page=100");

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
	},
	["github-contributors"],
	{
		tags: ["github-contributors"],
		revalidate: CACHE_DURATIONS.contributors
	}
);

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const type = searchParams.get("type");

	try {
		if (type === "stars") {
			const stars = await getCachedStars();

			return NextResponse.json(
				{ stars },
				{
					headers: {
						"Cache-Control": `public, s-maxage=${CACHE_DURATIONS.stars}, stale-while-revalidate=${CACHE_DURATIONS.stars * 2}`
					}
				}
			);
		}

		if (type === "release") {
			const releaseData = await getCachedRelease();

			if (!releaseData) {
				return NextResponse.json({ error: "No stable release available" }, { status: 404 });
			}

			return NextResponse.json(releaseData, {
				headers: {
					"Cache-Control": `public, s-maxage=${CACHE_DURATIONS.release}, stale-while-revalidate=${CACHE_DURATIONS.release * 2}`
				}
			});
		}

		if (type === "contributors") {
			const contributors = await getCachedContributors();

			return NextResponse.json(contributors, {
				headers: {
					"Cache-Control": "public, immutable"
				}
			});
		}

		return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
	} catch (error) {
		console.error("GitHub API error:", error);
		return NextResponse.json({ error: "Failed to fetch data from GitHub" }, { status: 500 });
	}
}
