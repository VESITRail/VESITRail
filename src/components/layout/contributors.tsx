"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { contributors } from "@/config/contributors";
import { Lead, Heading1 } from "@/components/ui/typography";
import { Users, School, Github, Linkedin, BookOpen } from "lucide-react";

const Contributors = () => {
	return (
		<section id="contributors" className="flex flex-col bg-background overflow-x-hidden px-4 md:px-8 py-12">
			<div className="container mx-auto space-y-16">
				<div className="text-center">
					<Heading1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-linear-to-br from-foreground to-muted-foreground dark:from-white dark:to-muted-foreground bg-clip-text text-transparent">
						Our Team
					</Heading1>

					<Lead className="text-muted-foreground text-lg leading-normal mt-4">
						Meet the talented contributors behind VESITRail
					</Lead>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
					{contributors.map((contributor, index) => (
						<Card
							key={index}
							className="group p-5 hover:shadow-lg transition-all duration-300 bg-card border border-border hover:border-primary/60"
						>
							<div className="flex justify-between items-start mb-2">
								<h2 className="text-xl font-semibold bg-clip-text">{contributor.name}</h2>

								<div className="flex gap-2">
									<Link
										target="_blank"
										title="GitHub Profile"
										href={contributor.github}
										rel="noopener noreferrer"
										className="p-2 rounded-lg bg-muted/50 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
									>
										<Github size={16} />
									</Link>

									<Link
										target="_blank"
										title="LinkedIn Profile"
										href={contributor.linkedin}
										rel="noopener noreferrer"
										className="p-2 rounded-lg bg-muted/50 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
									>
										<Linkedin size={16} />
									</Link>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<BookOpen size={15} />
									<span className="font-semibold">Year:</span>
									<span>{contributor.year}</span>
								</div>

								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Users size={15} />
									<span className="font-semibold">Class:</span>
									<span>{contributor.class}</span>
								</div>

								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<School size={15} />
									<span className="font-semibold">Branch:</span>
									<span>{contributor.branch}</span>
								</div>
							</div>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
};

export default Contributors;
