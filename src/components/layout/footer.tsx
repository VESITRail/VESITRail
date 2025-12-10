"use client";

import Link from "next/link";
import { navigationItems } from "@/config/navigation";
import { Paragraph } from "@/components/ui/typography";

const Footer = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer aria-label="Footer" className="w-full border-accent bg-background pb-33 lg:pb-0">
			<div className="max-w-7xl mx-auto px-6 md:px-16 xl:px-8">
				<div className="pt-10 pb-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
					<nav aria-label="Footer Navigation">
						<ul className="flex flex-wrap gap-x-8 gap-y-2 items-center justify-center lg:items-start lg:justify-start">
							{navigationItems.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="focus:text-foreground transition-colors underline-offset-10 hover:underline focus:underline font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded-sm duration-200"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>

					<div className="flex flex-col gap-2 md:items-end md:text-right items-start text-left">
						<Paragraph className="text-base text-foreground font-semibold tracking-tight text-center lg:text-right">
							Made with ❤️ by VESITians for VESITians
						</Paragraph>
					</div>
				</div>

				<div className="w-full border-t-2 border-accent pt-4 pb-6">
					<Paragraph className="text-sm text-muted-foreground text-center">
						© {currentYear}{" "}
						<Link
							href="/"
							className="text-muted-foreground hover:text-foreground transition-colors underline-offset-10 hover:underline focus:underline font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded-sm duration-200"
						>
							VESITRail
						</Link>
						. All rights reserved.
					</Paragraph>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
