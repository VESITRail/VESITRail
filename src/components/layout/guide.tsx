import { guide } from "@/config/guide";
import { ArrowDownIcon } from "lucide-react";
import { Lead, Heading1 } from "@/components/ui/typography";

const Guide = () => {
	return (
		<section id="guide" className="flex flex-col bg-background overflow-x-hidden px-4 md:px-8 py-12">
			<div className="container mx-auto space-y-16">
				<div className="text-center">
					<Heading1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground dark:from-white dark:to-muted-foreground bg-clip-text text-transparent lg:pb-2">
						How to Get Your Railway Concession
					</Heading1>

					<Lead className="text-muted-foreground text-lg leading-normal mt-4">
						Follow these simple steps to apply for and receive your railway concession.
					</Lead>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 max-w-5xl mx-auto">
					{guide.map((step, index) => {
						const isLastItem = index === guide.length - 1;

						return (
							<div key={index} className="flex flex-col">
								<div className="group relative flex items-start gap-6 rounded-lg border bg-card p-6 transition-all duration-300 flex-1 hover:shadow-lg border-border hover:border-primary/60">
									<div className="absolute left-0 top-0 bottom-0 w-1 bg-border group-hover:bg-primary transition-colors duration-300 rounded-l-lg" />

									<div className="relative shrink-0">
										<div className="flex size-12 items-center justify-center rounded-full bg-background/50 text-muted-foreground ring-2 ring-border transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary">
											<step.icon className="size-5" />
										</div>

										<span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
											{index + 1}
										</span>
									</div>

									<div className="flex-1 pt-1">
										<h2 className="text-lg font-semibold tracking-tight mb-2">{step.title}</h2>

										<p className="text-sm text-muted-foreground">{step.description}</p>
									</div>
								</div>

								{!isLastItem && (
									<div className="md:hidden flex justify-center py-4">
										<ArrowDownIcon className="size-6 text-muted-foreground" />
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default Guide;
