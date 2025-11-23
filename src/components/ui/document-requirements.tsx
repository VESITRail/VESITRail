"use client";

import { IdCard, Zap, Home, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type DocumentRequirementsProps = {
	className?: string;
};

export function DocumentRequirements({ className }: DocumentRequirementsProps) {
	return (
		<div className={className}>
			<Alert className="mb-4">
				<AlertCircle className="size-4 text-white bg" />
				<AlertTitle>Important Instructions</AlertTitle>
				<AlertDescription className="inline">
					Merge all required documents into a{" "}
					<span className="font-semibold text-foreground">single PDF file (Max 5MB)</span> before uploading.
				</AlertDescription>
			</Alert>

			<div className="space-y-3">
				<div className="border rounded-lg p-4 bg-card">
					<h4 className="font-semibold text-sm mb-3">Always Required</h4>
					<div className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
						<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
							<IdCard className="size-5" />
						</div>
						<div className="min-w-0">
							<p className="font-medium text-sm">Aadhaar Card</p>
							<p className="text-xs text-muted-foreground">Both front and back sides</p>
						</div>
					</div>
				</div>

				<div className="border rounded-lg p-4 bg-card">
					<h4 className="font-semibold text-sm mb-3">If Address Differs</h4>
					<p className="text-xs text-muted-foreground mb-3">
						Include <span className="font-semibold text-foreground">one</span> of the following if your current address
						differs from Aadhaar:
					</p>
					<div className="space-y-2">
						<div className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
							<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
								<Zap className="size-5" />
							</div>
							<div className="min-w-0">
								<p className="font-medium text-sm">Electricity Bill</p>
								<p className="text-xs text-muted-foreground">In parent&apos;s name</p>
							</div>
						</div>
						<div className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
							<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
								<Home className="size-5" />
							</div>
							<div className="min-w-0">
								<p className="font-medium text-sm">Rent Agreement</p>
								<p className="text-xs text-muted-foreground">Valid document</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
