import { Inbox, type LucideIcon } from "lucide-react";

export default function TableEmptyState({
	title,
	description,
	icon: Icon = Inbox
}: {
	title: string;
	description: string;
	icon?: LucideIcon;
}) {
	return (
		<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
			<div className="flex flex-col items-center space-y-4">
				<div className="p-4 rounded-full bg-primary">
					<Icon className="size-8 text-white" />
				</div>
				<div className="space-y-2 text-center">
					<h3 className="text-lg font-semibold text-foreground">{title}</h3>
					<p className="text-sm text-muted-foreground max-w-md">{description}</p>
				</div>
			</div>
		</div>
	);
}
