import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Concession } from "@/actions/concession";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ApplicationStatus = NonNullable<Concession>["status"];
type ApplicationType = NonNullable<Concession>["applicationType"];
type PreviousApplication = NonNullable<Concession>["previousApplication"];

export const ConcessionStatusBadge = ({ status }: { status: ApplicationStatus }) => {
	const variants = {
		Rejected: "bg-red-600 text-white",
		Issued: "bg-green-600 text-white",
		Approved: "bg-primary text-white",
		Pending: "bg-amber-600 text-white"
	};

	return <Badge className={`${variants[status]} font-medium`}>{status}</Badge>;
};

export const ConcessionTypeBadge = ({ type }: { type: ApplicationType }) => {
	return (
		<Badge variant="secondary" className="font-medium">
			{type}
		</Badge>
	);
};

export function PreviousApplicationDialog({
	previousApplication,
	showLabel = false
}: {
	previousApplication: PreviousApplication;
	showLabel?: boolean;
}) {
	if (!previousApplication) return null;

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant="ghost"
					aria-label="Show History"
					title="View previous application details"
					className={cn("text-muted-foreground hover:text-foreground", !showLabel && "size-6 p-0")}
				>
					<History className="size-4" />
					{showLabel && "Show History"}
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Previous Application Details</DialogTitle>
				</DialogHeader>

				<Separator className="my-2" />

				<div className="space-y-6">
					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Status</p>
							<ConcessionStatusBadge status={previousApplication.status} />
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Type</p>
							<ConcessionTypeBadge type={previousApplication.applicationType} />
						</div>
					</div>

					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Class</p>
							<p className="font-medium text-foreground/90">
								{previousApplication.concessionClass.name} ({previousApplication.concessionClass.code})
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Period</p>
							<p className="font-medium text-foreground/90">
								{previousApplication.concessionPeriod.name} ({previousApplication.concessionPeriod.duration}{" "}
								{previousApplication.concessionPeriod.duration === 1 ? "month" : "months"})
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Home Station</p>
							<p className="font-medium text-foreground/90">
								{previousApplication.station.name} ({previousApplication.station.code})
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Applied Date</p>
							<p className="font-medium text-foreground/90">
								{format(new Date(previousApplication.createdAt), "MMMM dd, yyyy")}
							</p>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
