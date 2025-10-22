"use client";

import { Card, CardTitle, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { Mail, Clock, Shield, RefreshCw, ArrowRight, AlertCircle, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserRoles } from "@/actions/check-role";

type RoleSelectionProps = {
	roles: UserRoles;
	userName?: string;
};

const RoleSelection = ({ roles, userName }: RoleSelectionProps) => {
	const hasMultipleRoles = Boolean(roles.admin && roles.student);

	if (!hasMultipleRoles) {
		return null;
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
			<div className="w-full max-w-4xl mx-auto space-y-8">
				<div className="text-center space-y-2">
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
						Welcome back{userName ? `, ${userName}` : ""}
					</h1>
					<p className="text-muted-foreground text-base md:text-lg">
						You have multiple roles. Choose which dashboard you&apos;d like to access.
					</p>
				</div>

				<div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
					{roles.admin && (
						<Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
							<CardHeader className="pb-4">
								<div className="flex items-center gap-3">
									<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
										<Shield className="size-6" />
									</div>

									<div>
										<CardTitle className="text-xl">Admin Dashboard</CardTitle>
										<CardDescription>Manage applications and students</CardDescription>
									</div>
								</div>
							</CardHeader>

							<CardContent className="flex flex-col h-full space-y-4">
								<div className="flex-1">
									{roles.admin.status === "Active" ? (
										<ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
											<li>Review concession applications</li>
											<li>Manage student registrations</li>
											<li>Handle address change requests</li>
											<li>Access admin tools</li>
										</ul>
									) : (
										<div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
											<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
												<AlertCircle className="size-4 text-muted-foreground" />
											</div>

											<div className="flex-1 pt-0.5">
												<p className="text-sm text-foreground">
													Your admin account has been deactivated. Contact support for assistance.
												</p>
											</div>
										</div>
									)}
								</div>

								<div className="pt-4 border-t border-border">
									{roles.admin.status === "Active" ? (
										<Button asChild className="w-full">
											<Link href="/dashboard/admin" className="flex items-center gap-2">
												Continue as Admin
												<ArrowRight className="size-4" />
											</Link>
										</Button>
									) : (
										<Button asChild disabled variant="outline" className="w-full">
											<span className="flex items-center gap-2">
												<Mail className="size-4" />
												Contact Support
											</span>
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{roles.student && (
						<Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
							<CardHeader className="pb-4">
								<div className="flex items-center gap-3">
									<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
										<GraduationCap className="size-6" />
									</div>

									<div>
										<CardTitle className="text-xl">Student Dashboard</CardTitle>
										<CardDescription>Apply for concessions and track status</CardDescription>
									</div>
								</div>
							</CardHeader>

							<CardContent className="flex flex-col h-full space-y-4">
								<div className="flex-1">
									{roles.student.status === "Approved" ? (
										<ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
											<li>Apply for new concessions</li>
											<li>Track application status</li>
											<li>Update address information</li>
											<li>Manage account settings</li>
										</ul>
									) : roles.student.status === "Pending" ? (
										<div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
											<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
												<AlertCircle className="size-4 text-muted-foreground" />
											</div>
											<div className="flex-1 pt-0.5">
												<p className="text-sm text-foreground">
													Your student account is under review. You&apos;ll be notified once it&apos;s approved.
												</p>
											</div>
										</div>
									) : roles.student.status === "Rejected" ? (
										<div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
											<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
												<AlertCircle className="size-4 text-muted-foreground" />
											</div>
											<div className="flex-1 pt-0.5 space-y-1">
												<p className="text-sm font-medium text-foreground">Application Rejected</p>
												{roles.student.rejectionReason && (
													<p className="text-xs text-muted-foreground">{roles.student.rejectionReason}</p>
												)}
											</div>
										</div>
									) : (
										<div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
											<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
												<AlertCircle className="size-4 text-muted-foreground" />
											</div>
											<div className="flex-1 pt-0.5">
												<p className="text-sm text-foreground">Complete your student profile setup to get started.</p>
											</div>
										</div>
									)}
								</div>

								<div className="pt-4 border-t border-border">
									{roles.student.status === "Approved" ? (
										<Button asChild className="w-full">
											<Link href="/dashboard/student" className="flex items-center gap-2">
												Continue as Student
												<ArrowRight className="size-4" />
											</Link>
										</Button>
									) : roles.student.status === "Pending" ? (
										<Button variant="outline" className="w-full" disabled>
											<Clock className="size-4 mr-2" />
											Awaiting Approval
										</Button>
									) : roles.student.status === "Rejected" ? (
										<Button asChild variant="outline" className="w-full">
											<Link href="/onboarding" className="flex items-center gap-2">
												<RefreshCw className="size-4" />
												Update & Resubmit
											</Link>
										</Button>
									) : (
										<Button asChild className="w-full">
											<Link href="/onboarding" className="flex items-center gap-2">
												Complete Setup
												<ArrowRight className="size-4" />
											</Link>
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
};

export default RoleSelection;
