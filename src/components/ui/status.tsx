import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type StatusProps = {
	title: string;
	iconBg?: string;
	icon: LucideIcon;
	iconColor?: string;
	description: string;
	cardClassName?: string;
	iconClassName?: string;
	containerClassName?: string;
	button?: {
		href?: string;
		label: string;
		icon: LucideIcon;
		onClick?: () => void;
	};
};

const Status = ({
	title,
	button,
	icon: Icon,
	description,
	iconClassName,
	cardClassName,
	iconBg = "bg-primary/10",
	iconColor = "text-foreground",
	containerClassName = "min-h-screen"
}: StatusProps) => {
	return (
		<div className={cn("flex items-center justify-center p-6 bg-background", containerClassName)}>
			<Card className={`w-full max-w-md shadow-lg border-0 bg-card/50 backdrop-blur-sm ${cardClassName}`}>
				<CardContent className="p-8">
					<div className="flex flex-col items-center text-center space-y-6">
						<div className="relative">
							<div
								className={cn(
									iconBg,
									"ring-4 ring-primary/5 shadow-lg",
									"relative size-18 flex items-center justify-center rounded-full transition-all duration-300"
								)}
							>
								<Icon className={cn(iconColor, iconClassName, "size-10 transition-all duration-300")} />
							</div>

							<div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
							<div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 blur-xl -z-10" />
						</div>

						<div className="space-y-3">
							<div className="space-y-2">
								<h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
							</div>

							<p className="text-base text-muted-foreground leading-relaxed max-w-sm">{description}</p>
						</div>

						{button && (
							<div className="pt-2 w-full">
								{button.href ? (
									<Link href={button.href} className="flex items-center gap-2">
										<Button
											size="lg"
											onClick={button.onClick}
											className={cn(
												"shadow-md hover:shadow-lg active:scale-[0.98]",
												"bg-primary hover:bg-primary/90 text-primary-foreground",
												"w-full h-12 text-base font-medium transition-all duration-200"
											)}
										>
											<button.icon className="size-5" />
											{button.label}
										</Button>
									</Link>
								) : (
									<Button
										size="lg"
										onClick={button.onClick}
										className={cn(
											"shadow-md hover:shadow-lg active:scale-[0.98]",
											"bg-primary hover:bg-primary/90 text-primary-foreground",
											"w-full h-12 text-base font-medium transition-all duration-200"
										)}
									>
										<button.icon className="size-5" />
										{button.label}
									</Button>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Status;
