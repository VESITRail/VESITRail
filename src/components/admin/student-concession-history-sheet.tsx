"use client";

import { toast } from "sonner";
import { format } from "date-fns";
import { toTitleCase } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentListItem } from "@/actions/student";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useCallback, useEffect, useMemo } from "react";
import { ConcessionApplicationStatusType } from "@/generated/zod";
import { getStudentConcessionHistory, StudentConcessionHistoryItem } from "@/actions/concession";
import { Inbox, History, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { Sheet, SheetTitle, SheetHeader, SheetContent, SheetTrigger, SheetDescription } from "@/components/ui/sheet";

const PAGE_SIZE = 5;

const StatusBadge = ({ status }: { status: ConcessionApplicationStatusType }) => {
	const variants = {
		Rejected: "bg-red-600 text-white",
		Pending: "bg-amber-600 text-white",
		Approved: "bg-primary text-white",
		Issued: "bg-green-600 text-white"
	};

	return <Badge className={`${variants[status]} font-medium`}>{status}</Badge>;
};

export const StudentConcessionHistorySheet = ({ student }: { student: StudentListItem }) => {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [hasError, setHasError] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [history, setHistory] = useState<StudentConcessionHistoryItem[]>([]);

	const studentFullName = toTitleCase(
		[student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ")
	);

	const totalPages = useMemo(() => Math.ceil(history.length / PAGE_SIZE), [history.length]);
	const hasNextPage = currentPage < totalPages;
	const hasPreviousPage = currentPage > 1;

	const paginatedHistory = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return history.slice(start, start + PAGE_SIZE);
	}, [history, currentPage]);

	const loadHistory = useCallback(async () => {
		if (!isOpen) return;

		setIsLoading(true);
		setHasError(false);

		try {
			const result = await getStudentConcessionHistory(student.userId);

			if (result.isSuccess) {
				setHistory(result.data);
			} else {
				setHasError(true);
				toast.error("Failed to load concession history");
			}
		} catch (error) {
			console.error("Error loading concession history:", error);
			setHasError(true);
			toast.error("Failed to load concession history");
		} finally {
			setIsLoading(false);
		}
	}, [isOpen, student.userId]);

	useEffect(() => {
		if (isOpen) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- loadHistory is async; it sets loading/error state before awaiting the fetch, which matches React's documented data-fetching effect pattern. Safe: no state is derived synchronously from props/state outside the fetch.
			setCurrentPage(1);
			loadHistory();
		} else {
			setHistory([]);
			setHasError(false);
		}
	}, [isOpen, loadHistory]);

	const renderPagination = () => (
		<div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
			<div className="text-sm text-muted-foreground order-2 sm:order-1">
				{isLoading ? (
					<Skeleton className="h-5 w-52" />
				) : history.length > 0 ? (
					<>
						Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, history.length)} of{" "}
						{history.length} application(s)
					</>
				) : (
					"Showing 0 of 0 applications"
				)}
			</div>

			<div className="flex items-center justify-center gap-3 order-1 sm:order-2">
				{isLoading ? (
					<>
						<Skeleton className="size-8" />
						<Skeleton className="h-6 w-20" />
						<Skeleton className="size-8" />
					</>
				) : (
					<>
						<Button
							size="sm"
							variant="outline"
							className="size-8 p-0"
							disabled={!hasPreviousPage}
							onClick={() => setCurrentPage((p) => p - 1)}
						>
							<ChevronLeft className="size-4" />
						</Button>

						<div className="flex items-center gap-2 px-3">
							<span className="text-sm font-medium text-foreground">{totalPages === 0 ? 0 : currentPage}</span>
							<span className="text-sm text-muted-foreground">of</span>
							<span className="text-sm font-medium text-foreground">{totalPages}</span>
						</div>

						<Button
							size="sm"
							variant="outline"
							className="size-8 p-0"
							disabled={!hasNextPage}
							onClick={() => setCurrentPage((p) => p + 1)}
						>
							<ChevronRight className="size-4" />
						</Button>
					</>
				)}
			</div>
		</div>
	);

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button size="sm" variant="outline" title="View Concession History" aria-label="View Concession History">
					<History className="size-4" />
				</Button>
			</SheetTrigger>

			<SheetContent
				side="bottom"
				className="h-[60vh] rounded-t-2xl border-t shadow-2xl flex flex-col p-0 gap-0 overflow-hidden"
			>
				<SheetHeader className="px-6 py-4 border-b bg-card flex flex-row items-center justify-between gap-4 shrink-0">
					<div className="flex items-center gap-3 text-left">
						<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
							<History className="size-5" />
						</div>
						<div>
							<SheetTitle className="text-lg font-semibold text-foreground">Concession Application History</SheetTitle>
							<SheetDescription className="text-xs text-muted-foreground mt-0.5">
								Reviewing concession history for <strong className="text-foreground">{studentFullName}</strong> (
								{student.user.email})
							</SheetDescription>
						</div>
					</div>

					{!isLoading && !hasError && history.length > 0 && (
						<Badge variant="secondary" className="font-medium text-xs px-3 py-1 mr-8">
							Total: {history.length} {history.length === 1 ? "Application" : "Applications"}
						</Badge>
					)}
				</SheetHeader>

				<div className="flex-1 min-h-0 overflow-hidden flex flex-col p-6 space-y-4">
					{isLoading ? (
						<>
							<div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden flex flex-col">
								<div className="overflow-auto flex-1 min-h-0">
									<Table>
										<TableHeader className="sticky top-0 bg-card z-10">
											<TableRow className="hover:bg-transparent border-border/50">
												<TableHead className="font-semibold h-12 text-center px-4 w-16">
													<Skeleton className="h-4 w-12 mx-auto" />
												</TableHead>
												<TableHead className="font-semibold h-12 text-center px-4 w-16">
													<Skeleton className="h-4 w-10 mx-auto" />
												</TableHead>
												<TableHead className="font-semibold h-12 text-center px-4 w-20">
													<Skeleton className="h-4 w-14 mx-auto" />
												</TableHead>
												<TableHead className="font-semibold h-12 text-center px-4 w-20">
													<Skeleton className="h-4 w-14 mx-auto" />
												</TableHead>
												<TableHead className="font-semibold h-12 text-center px-4 w-20">
													<Skeleton className="h-4 w-12 mx-auto" />
												</TableHead>
												<TableHead className="font-semibold h-12 text-center px-4 w-20">
													<Skeleton className="h-4 w-14 mx-auto" />
												</TableHead>
												<TableHead className="font-semibold h-12 text-center px-4 w-28">
													<Skeleton className="h-4 w-20 mx-auto" />
												</TableHead>
												<TableHead className="font-semibold h-12 text-center px-4 w-24">
													<Skeleton className="h-4 w-20 mx-auto" />
												</TableHead>
												<TableHead className="font-semibold h-12 text-center px-4 w-32">
													<Skeleton className="h-4 w-28 mx-auto" />
												</TableHead>
											</TableRow>
										</TableHeader>

										<TableBody>
											{Array.from({ length: PAGE_SIZE }).map((_, index) => (
												<TableRow key={index} className="hover:bg-muted/50 border-border/50">
													<TableCell className="p-4 text-center">
														<Skeleton className="h-4 w-6 mx-auto" />
													</TableCell>
													<TableCell className="p-4 text-center">
														<Skeleton className="h-4 w-10 mx-auto" />
													</TableCell>
													<TableCell className="p-4 text-center">
														<Skeleton className="h-6 w-14 rounded-md mx-auto" />
													</TableCell>
													<TableCell className="p-4 text-center">
														<Skeleton className="h-6 w-16 rounded-full mx-auto" />
													</TableCell>
													<TableCell className="p-4 text-center">
														<Skeleton className="h-4 w-12 mx-auto" />
													</TableCell>
													<TableCell className="p-4 text-center">
														<Skeleton className="h-4 w-14 mx-auto" />
													</TableCell>
													<TableCell className="p-4 text-center">
														<Skeleton className="h-4 w-24 mx-auto" />
													</TableCell>
													<TableCell className="p-4 text-center">
														<Skeleton className="h-4 w-20 mx-auto" />
													</TableCell>
													<TableCell className="p-4 text-center">
														<Skeleton className="h-4 w-28 mx-auto" />
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>

							<div className="shrink-0">{renderPagination()}</div>
						</>
					) : hasError ? (
						<div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-3">
							<div className="p-4 rounded-full bg-destructive/10 text-destructive">
								<AlertCircle className="size-8" />
							</div>
							<p className="text-base font-semibold text-foreground">Failed to Load History</p>
							<p className="text-sm text-muted-foreground max-w-sm">
								Unable to retrieve concession history. Please check connection and try again.
							</p>
							<Button size="sm" onClick={loadHistory} variant="outline" className="mt-2">
								<RefreshCw className="size-3.5 mr-1.5" />
								Try Again
							</Button>
						</div>
					) : history.length === 0 ? (
						<div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden flex flex-col">
							<Table>
								<TableHeader className="bg-card">
									<TableRow className="hover:bg-transparent border-border/50">
										<TableHead className="font-semibold h-12 text-center px-4">Sr. No.</TableHead>
										<TableHead className="font-semibold h-12 text-center px-4">ID</TableHead>
										<TableHead className="font-semibold h-12 text-center px-4">Type</TableHead>
										<TableHead className="font-semibold h-12 text-center px-4">Status</TableHead>
										<TableHead className="font-semibold h-12 text-center px-4">Class</TableHead>
										<TableHead className="font-semibold h-12 text-center px-4">Period</TableHead>
										<TableHead className="font-semibold h-12 text-center px-4">Home Station</TableHead>
										<TableHead className="font-semibold h-12 text-center px-4">Applied Date</TableHead>
										<TableHead className="font-semibold h-12 text-center px-4">Certificate / Reason</TableHead>
									</TableRow>
								</TableHeader>
							</Table>

							<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
								<div className="flex flex-col items-center space-y-4">
									<div className="p-4 rounded-full bg-primary">
										<Inbox className="size-8 text-white" />
									</div>

									<div className="space-y-2 text-center">
										<h3 className="text-lg font-semibold text-foreground">No applications found</h3>

										<p className="text-sm text-muted-foreground max-w-md">
											No concession applications have been submitted for this student yet.
										</p>
									</div>
								</div>
							</div>
						</div>
					) : (
						<>
							<div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden flex flex-col">
								<div className="overflow-auto flex-1 min-h-0 flex flex-col">
									<Table className="min-w-full h-full">
										<TableHeader className="sticky top-0 bg-card z-10">
											<TableRow className="hover:bg-transparent border-border/50">
												<TableHead className="font-semibold h-12 text-center px-3 w-16">Sr. No.</TableHead>
												<TableHead className="font-semibold h-12 text-center px-3 w-16">ID</TableHead>
												<TableHead className="font-semibold h-12 text-center px-3 w-20">Type</TableHead>
												<TableHead className="font-semibold h-12 text-center px-3 w-20">Status</TableHead>
												<TableHead className="font-semibold h-12 text-center px-3 w-20">Class</TableHead>
												<TableHead className="font-semibold h-12 text-center px-3 w-20">Period</TableHead>
												<TableHead className="font-semibold h-12 text-center px-3 w-28">Home Station</TableHead>
												<TableHead className="font-semibold h-12 text-center px-3 w-24">Applied Date</TableHead>
												<TableHead className="font-semibold h-12 text-center px-3 w-36">Certificate / Reason</TableHead>
											</TableRow>
										</TableHeader>

										<TableBody>
											{paginatedHistory.map((app, index) => (
												<TableRow key={app.id} className="hover:bg-muted/50 border-border/50">
													<TableCell className="p-3 text-center font-medium text-foreground">
														{(currentPage - 1) * PAGE_SIZE + index + 1}
													</TableCell>

													<TableCell className="p-3 text-center font-mono font-medium text-foreground">
														#{app.shortId}
													</TableCell>

													<TableCell className="p-3 text-center">
														<div className="flex items-center justify-center gap-1.5">
															<Badge variant="outline" className="text-xs font-normal">
																{app.applicationType}
															</Badge>
															{app.submissionCount > 1 && (
																<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-normal">
																	#{app.submissionCount}
																</Badge>
															)}
														</div>
													</TableCell>

													<TableCell className="p-3 text-center">
														<StatusBadge status={app.status} />
													</TableCell>

													<TableCell className="p-3 text-center font-medium text-foreground/90 text-sm">
														{app.concessionClass.name}
													</TableCell>

													<TableCell className="p-3 text-center font-medium text-foreground/90 text-sm">
														{app.concessionPeriod.name}
													</TableCell>

													<TableCell className="p-3 text-center font-medium text-foreground/90 text-sm">
														{app.station.name} ({app.station.code})
													</TableCell>

													<TableCell className="p-3 text-center font-medium text-foreground/90 text-sm">
														{format(new Date(app.createdAt), "MMM dd, yyyy")}
													</TableCell>

													<TableCell className="p-3 text-center text-sm">
														{app.derivedCertificateNo ? (
															<span className="font-mono font-medium text-foreground">{app.derivedCertificateNo}</span>
														) : app.status === "Rejected" && app.rejectionReason ? (
															<span
																className="text-foreground text-xs font-medium wrap-break-word max-w-55 block mx-auto"
																title={app.rejectionReason}
															>
																{app.rejectionReason}
															</span>
														) : app.status === "Approved" ? (
															<span className="text-muted-foreground text-xs">
																{app.reviewedBy?.user?.name
																	? `Approved by ${toTitleCase(app.reviewedBy.user.name)} (Awaiting Pickup)`
																	: "Approved (Awaiting Pickup)"}
															</span>
														) : app.status === "Issued" ? (
															<span className="text-muted-foreground text-xs">
																{app.reviewedBy?.user?.name
																	? `Issued by ${toTitleCase(app.reviewedBy.user.name)}`
																	: "Issued"}
															</span>
														) : (
															<span className="text-muted-foreground text-xs">Pending Review</span>
														)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>

							<div className="shrink-0">{renderPagination()}</div>
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default StudentConcessionHistorySheet;
