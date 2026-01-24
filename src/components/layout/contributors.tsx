import Link from "next/link";
import { Card } from "@/components/ui/card";
import Status from "@/components/ui/status";
import { AlertCircle } from "lucide-react";
import { Lead, Heading1 } from "@/components/ui/typography";
import { fetchGitHubContributors } from "@/lib/github-contributors";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Contributors = async () => {
	const contributors = await fetchGitHubContributors();

	return (
		<section id="contributors" className="flex flex-col bg-background overflow-x-hidden px-4 md:px-8 py-12">
			<div className="container mx-auto space-y-12">
				<div className="text-center">
					<Heading1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-linear-to-br from-foreground to-muted-foreground dark:from-white dark:to-muted-foreground bg-clip-text text-transparent">
						Contributors
					</Heading1>

					<Lead className="text-muted-foreground text-lg leading-normal mt-4">
						Built by passionate developers from the community
					</Lead>
				</div>

				{contributors.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
						{contributors.map((contributor) => (
							<Card
								key={contributor.username}
								className="group p-5 hover:shadow-md transition-all duration-200 bg-card border border-border hover:border-primary"
							>
								<div className="flex items-center gap-4">
									<Link href={contributor.profileUrl} target="_blank" rel="noopener noreferrer">
										<Avatar className="size-15 border-2 border-border group-hover:border-primary transition-colors">
											<AvatarImage src={contributor.avatar} alt={contributor.username} />
											<AvatarFallback>{contributor.username.slice(0, 2).toUpperCase()}</AvatarFallback>
										</Avatar>
									</Link>

									<div className="flex-1 min-w-0 space-y-1.5">
										<Link
											target="_blank"
											rel="noopener noreferrer"
											href={contributor.profileUrl}
											className="flex items-center gap-1.5 font-semibold truncate"
										>
											<span className="truncate">{contributor.username}</span>
										</Link>

										<p className="text-sm text-muted-foreground">
											{contributor.commits.toLocaleString()} {contributor.commits === 1 ? "commit" : "commits"}
										</p>
									</div>
								</div>
							</Card>
						))}
					</div>
				) : (
					<Status
						icon={AlertCircle}
						iconBg="bg-yellow-600"
						iconColor="text-white"
						containerClassName="p-0"
						title="Unable to Load Contributors"
						description="We couldn't fetch contributor data at this time. Please try again later."
					/>
				)}
			</div>
		</section>
	);
};

export default Contributors;
