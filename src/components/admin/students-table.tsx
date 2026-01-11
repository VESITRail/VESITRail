import {
	Eye,
	Check,
	UserX,
	Inbox,
	Filter,
	Search,
	XCircle,
	Loader2,
	FileText,
	RefreshCw,
	ArrowUpDown,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ExternalLink,
	AlertTriangle
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import Status from "../ui/status";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserInitials, toTitleCase } from "@/lib/utils";
import { StudentApprovalStatusType } from "@/generated/zod";
import { useCallback, useState, useMemo, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from "@/components/ui/select";
import { ColumnDef, flexRender, useReactTable, VisibilityState, getCoreRowModel } from "@tanstack/react-table";
import { rejectStudent, StudentDetails, approveStudent, StudentListItem, getStudentDetails } from "@/actions/student";
import { Dialog, DialogTitle, DialogFooter, DialogHeader, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const PREDEFINED_REJECTION_REASONS = [
	{
		label: "Address Mismatch",
		reason: "Address in the verification document and the entered address mismatch"
	},
	{
		label: "Invalid Verification Document",
		reason: "Invalid verification document"
	},
	{
		label: "Document Not Clear",
		reason: "Verification document not clear"
	},
	{
		label: "Address Station Mismatch",
		reason: "Address does not belong to the new station selected"
	}
];

type SortOrder = "asc" | "desc";

const StatusBadge = ({ status }: { status: StudentApprovalStatusType }) => {
	const variants = {
		Rejected: "bg-red-600 text-white",
		Pending: "bg-amber-600 text-white",
		Approved: "bg-green-600 text-white"
	};

	return <Badge className={`${variants[status]} font-medium`}>{status}</Badge>;
};

const StudentDetailsDialog = ({
	student,
	adminId,
	onStudentUpdate
}: {
	adminId: string;
	student: StudentListItem;
	onStudentUpdate?: (updatedStudent: StudentDetails) => void;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
	const [hasError, setHasError] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [rejectionReason, setRejectionReason] = useState<string>("");
	const [selectedPredefinedReason, setSelectedPredefinedReason] = useState<string>("");
	const [showRejectDialog, setShowRejectDialog] = useState<boolean>(false);

	const loadStudentDetails = useCallback(async () => {
		if (!isOpen || studentDetails) return;

		setIsLoading(true);
		setHasError(false);
		try {
			const result = await getStudentDetails(student.userId);

			if (result.isSuccess) {
				setStudentDetails(result.data);
				setHasError(false);
			} else {
				setHasError(true);
				toast.error("Failed to load student details");
			}
		} catch (error) {
			console.error("Error loading student details:", error);
			setHasError(true);
			toast.error("Failed to load student details");
		} finally {
			setIsLoading(false);
		}
	}, [isOpen, studentDetails, student.userId]);

	const handleApprove = async () => {
		setIsProcessing(true);

		const approvePromise = async () => {
			const result = await approveStudent({
				reviewedById: adminId,
				studentId: student.userId
			});

			if (result.isSuccess) {
				setStudentDetails(result.data);
				onStudentUpdate?.(result.data);
				setIsOpen(false);
				return result.data;
			} else {
				throw new Error("Failed to approve student");
			}
		};

		toast.promise(approvePromise, {
			loading: "Approving student...",
			success: () => {
				return `${toTitleCase(`${student.firstName} ${student.lastName}`)} has been approved successfully.`;
			},
			error: "Failed to approve student. Please try again.",
			finally: () => {
				setIsProcessing(false);
			}
		});
	};

	const handleReject = async () => {
		const selectedReasonObj = PREDEFINED_REJECTION_REASONS.find((r) => r.label === selectedPredefinedReason);
		const finalReason = rejectionReason.trim() || selectedReasonObj?.reason || "";

		if (!finalReason) {
			toast.error("Reason required", {
				description: "Please provide a reason for rejecting this application."
			});
			return;
		}

		setIsProcessing(true);

		const rejectPromise = async () => {
			const result = await rejectStudent({
				reviewedById: adminId,
				studentId: student.userId,
				rejectionReason: finalReason
			});

			if (result.isSuccess) {
				setStudentDetails(result.data);
				onStudentUpdate?.(result.data);
				setShowRejectDialog(false);
				setRejectionReason("");
				setSelectedPredefinedReason("");
				setIsOpen(false);
				return result.data;
			} else {
				throw new Error("Failed to reject student");
			}
		};

		toast.promise(rejectPromise, {
			loading: "Rejecting student...",
			success: () => {
				return `${toTitleCase(`${student.firstName} ${student.lastName}`)} has been rejected.`;
			},
			error: "Failed to reject student. Please try again.",
			finally: () => {
				setIsProcessing(false);
			}
		});
	};

	useEffect(() => {
		if (isOpen) {
			loadStudentDetails();
		} else {
			setStudentDetails(null);
			setHasError(false);
		}
	}, [isOpen, loadStudentDetails]);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<Button size="sm">
						<Eye className="size-4" />
					</Button>
				</DialogTrigger>

				<DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
					{isLoading ? (
						<div className="space-y-6">
							<div className="flex mt-4 items-center justify-between">
								<div className="flex items-center gap-3">
									<Skeleton className="size-10 rounded-lg" />
									<div className="space-y-2">
										<Skeleton className="h-5 w-48" />
										<Skeleton className="h-4 w-36" />
									</div>
								</div>
								<Skeleton className="h-6 w-20 rounded-full" />
							</div>

							<Skeleton className="h-px w-full" />

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<Skeleton className="h-4 w-32" />
									<div className="space-y-3">
										<Skeleton className="h-8 w-full" />
										<Skeleton className="h-8 w-full" />
										<Skeleton className="h-12 w-full" />
									</div>
								</div>

								<div className="space-y-4">
									<Skeleton className="h-4 w-32" />
									<div className="space-y-3">
										<Skeleton className="h-8 w-full" />
										<Skeleton className="h-8 w-full" />
										<Skeleton className="h-8 w-full" />
									</div>
								</div>
							</div>

							<Separator />

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Skeleton className="h-20 w-full" />
								<Skeleton className="h-20 w-full" />
							</div>

							<Skeleton className="h-16 w-full rounded-lg" />

							<div className="flex justify-end gap-3 pt-4 border-t">
								<Skeleton className="h-10 w-38 rounded-md" />
								<Skeleton className="h-10 w-42 rounded-md" />
							</div>
						</div>
					) : hasError ? (
						<div className="flex flex-col items-center justify-center space-y-6 py-12">
							<div className="flex flex-col items-center space-y-4">
								<div className="p-4 rounded-full bg-destructive">
									<XCircle className="size-8 text-white" />
								</div>

								<div className="space-y-2 text-center">
									<h3 className="text-lg font-semibold text-foreground">Failed to Load Student Details</h3>

									<p className="text-sm text-muted-foreground max-w-md">
										We couldn&apos;t load the student information. This might be due to a connection issue or the data
										might be temporarily unavailable.
									</p>
								</div>

								<Button
									onClick={() => {
										setHasError(false);
										loadStudentDetails();
										setStudentDetails(null);
									}}
									className="mt-4"
								>
									<RefreshCw className="size-4" />
									Try Again
								</Button>
							</div>
						</div>
					) : studentDetails ? (
						<div className="space-y-6">
							<div className="flex mt-4 items-center justify-between">
								<div className="flex items-center gap-3">
									<Avatar className="size-8 rounded-lg">
										<AvatarImage
											alt={studentDetails.user.image || "Student"}
											src={studentDetails.user.image || undefined}
										/>
										<AvatarFallback className="rounded-lg">
											{getUserInitials("Student", studentDetails.user.name)}
										</AvatarFallback>
									</Avatar>

									<div>
										<h3 className="font-semibold text-lg">
											{toTitleCase(
												`${studentDetails.firstName} ${studentDetails.middleName} ${studentDetails.lastName}`
											)}
										</h3>
										<p className="text-sm text-muted-foreground">{studentDetails.user.email}</p>
									</div>
								</div>

								<StatusBadge status={studentDetails.status} />
							</div>

							<Separator />

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								<div className="space-y-6">
									<div>
										<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
											Personal Information
										</h4>

										<div className="space-y-4">
											<div className="flex justify-between items-start">
												<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0 w-24">Gender</span>
												<span className="text-sm text-right flex-1 ml-3">{studentDetails.gender}</span>
											</div>

											<div className="flex justify-between items-start">
												<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0 w-24">
													Birth Date
												</span>
												<span className="text-sm text-right flex-1 ml-3">
													{format(new Date(studentDetails.dateOfBirth), "MMM dd, yyyy")}
												</span>
											</div>

											<div className="flex justify-between items-start">
												<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0 w-24">Address</span>
												<span className="text-sm text-right flex-1 ml-3 wrap-break-word">{studentDetails.address}</span>
											</div>
										</div>
									</div>

									<Separator />

									<div>
										<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
											Station Information
										</h4>

										<div className="flex justify-between items-start">
											<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0 w-24">
												Home Station
											</span>
											<span className="text-sm text-right flex-1 ml-3">
												{studentDetails.station.name} ({studentDetails.station.code})
											</span>
										</div>
									</div>
								</div>

								<div className="space-y-6">
									<div>
										<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
											Academic Information
										</h4>

										<div className="space-y-4">
											<div className="flex justify-between items-start">
												<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0 w-20">Class</span>
												<span className="text-sm text-right flex-1 ml-3">{studentDetails.class.code}</span>
											</div>

											<div className="flex justify-between items-start">
												<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0 w-20">Year</span>
												<span className="text-sm text-right flex-1 ml-3">
													{studentDetails.class.year.name} ({studentDetails.class.year.code})
												</span>
											</div>

											<div className="flex justify-between items-start">
												<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0 w-20">Branch</span>
												<span className="text-sm text-right flex-1 ml-3">
													{studentDetails.class.branch.name} ({studentDetails.class.branch.code})
												</span>
											</div>
										</div>
									</div>

									<Separator />

									<div>
										<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
											Concession Preferences
										</h4>

										<div className="space-y-4">
											<div className="flex justify-between items-start">
												<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0 w-20">Class</span>
												<span className="text-sm text-right flex-1 ml-3">
													{studentDetails.preferredConcessionClass.name} ({studentDetails.preferredConcessionClass.code}
													)
												</span>
											</div>

											<div className="flex justify-between items-start">
												<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0 w-20">Period</span>
												<span className="text-sm text-right flex-1 ml-3">
													{studentDetails.preferredConcessionPeriod.name} (
													{studentDetails.preferredConcessionPeriod.duration}{" "}
													{studentDetails.preferredConcessionPeriod.duration === 1 ? "month" : "months"})
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<Separator />

							<div className="space-y-4">
								<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
									Verification Document
								</h4>

								<div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
									<FileText className="size-4 text-muted-foreground" />
									<span className="text-sm font-medium flex-1">Student Verification Document</span>
									<Button
										size="sm"
										variant="default"
										onClick={() => window.open(studentDetails.verificationDocUrl, "_blank")}
									>
										<ExternalLink className="size-4 mr-1" />
										View
									</Button>
								</div>
							</div>

							<Separator />

							<div className="space-y-6">
								<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
									Application Status
								</h4>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
									<div className="space-y-4">
										<div className="flex justify-between items-start">
											<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0">Submissions</span>
											<span className="text-sm text-right">{studentDetails.submissionCount}</span>
										</div>

										<div className="flex justify-between items-start">
											<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0">Applied Date</span>
											<span className="text-sm text-right">
												{format(new Date(studentDetails.createdAt), "MMM dd, yyyy")}
											</span>
										</div>
									</div>

									<div className="space-y-4">
										{studentDetails.reviewedAt && (
											<div className="flex justify-between items-start">
												<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0">
													Reviewed Date
												</span>
												<span className="text-sm text-right">
													{format(new Date(studentDetails.reviewedAt), "MMM dd, yyyy")}
												</span>
											</div>
										)}

										{studentDetails.reviewedBy && (
											<div className="flex justify-between items-start">
												<span className="text-sm font-medium text-muted-foreground min-w-0 shrink-0">Reviewed By</span>
												<span className="text-sm text-right">{toTitleCase(studentDetails.reviewedBy.user.name)}</span>
											</div>
										)}
									</div>
								</div>

								{studentDetails.rejectionReason && (
									<div className="mt-6">
										<p className="text-sm font-medium text-muted-foreground mb-2">Rejection Reason</p>
										<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
											<p className="text-sm text-destructive">{studentDetails.rejectionReason}</p>
										</div>
									</div>
								)}
							</div>

							{studentDetails.status === "Pending" && (
								<div className="flex justify-end gap-4 pt-6 border-t">
									<Button
										variant="destructive"
										className="w-38 h-10"
										title="Reject Student"
										disabled={isProcessing}
										aria-label="Reject Student"
										onClick={() => setShowRejectDialog(true)}
									>
										<UserX className="size-4 mr-1" />
										Reject Student
									</Button>

									<Button
										title="Approve Student"
										onClick={handleApprove}
										disabled={isProcessing}
										aria-label="Approve Student"
										className="w-42 h-10 p-0 bg-emerald-600 hover:bg-emerald-700 text-white"
									>
										<Check className="size-4 mr-1" />
										Approve Student
									</Button>
								</div>
							)}
						</div>
					) : null}
				</DialogContent>
			</Dialog>

			<Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div className="flex items-center justify-center size-10 rounded-full bg-destructive shrink-0">
								<AlertTriangle className="size-5 text-white" />
							</div>

							<div>
								<DialogTitle className="text-lg font-semibold text-foreground">Reject Student Application</DialogTitle>
								<p className="text-sm text-muted-foreground mt-1">
									Please provide a reason for rejecting this application
								</p>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-foreground">Quick Select Reason</label>

							<Select
								disabled={isProcessing}
								value={selectedPredefinedReason}
								onValueChange={(value) => {
									setSelectedPredefinedReason(value);
									if (value) {
										setRejectionReason("");
									}
								}}
							>
								<SelectTrigger className="w-full mt-2 h-10! text-foreground! cursor-pointer">
									<SelectValue
										className="whitespace-normal wrap-break-word"
										placeholder="Select a predefined reason..."
									/>
								</SelectTrigger>

								<SelectContent className="w-full max-h-60 overflow-y-auto">
									{PREDEFINED_REJECTION_REASONS.map((reasonObj, index) => (
										<SelectItem key={index} value={reasonObj.label} className="whitespace-normal text-sm py-2 px-3">
											{reasonObj.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">Or write custom reason</span>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium text-foreground">Custom Rejection Reason</label>
							<Textarea
								autoCapitalize="words"
								value={rejectionReason}
								disabled={isProcessing}
								className="min-h-25 resize-none mt-2 capitalize"
								placeholder="Enter a detailed reason for rejection..."
								onChange={(e) => {
									const capitalizedValue = e.target.value
										.split(" ")
										.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
										.join(" ");

									setRejectionReason(capitalizedValue);

									if (e.target.value) {
										setSelectedPredefinedReason("");
									}
								}}
							/>
						</div>

						{(rejectionReason || selectedPredefinedReason) && (
							<div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 wrap-break-word">
								<p className="text-sm font-medium text-destructive mb-1">Preview:</p>

								<p className="text-sm wrap-break-word">
									{rejectionReason ||
										PREDEFINED_REJECTION_REASONS.find((r) => r.label === selectedPredefinedReason)?.reason}
								</p>
							</div>
						)}
					</div>

					<DialogFooter className="gap-4 pt-4">
						<Button
							variant="outline"
							disabled={isProcessing}
							onClick={() => {
								setRejectionReason("");
								setShowRejectDialog(false);
								setSelectedPredefinedReason("");
							}}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleReject}
							disabled={isProcessing || (!rejectionReason.trim() && !selectedPredefinedReason)}
						>
							{isProcessing ? (
								<div className="flex items-center gap-2">
									<Loader2 className="size-4 animate-spin" />
									Rejecting...
								</div>
							) : (
								"Reject Student"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

const createColumns = (
	onSortChange: (column: string) => void,
	currentPage: number,
	adminId: string,
	onStudentUpdate?: (updatedStudent: StudentDetails) => void
): ColumnDef<StudentListItem>[] => [
	{
		size: 80,
		id: "serialNo",
		header: "Sr. No.",
		cell: ({ row, table }) => {
			const pageSize = 10;
			const sortedRows = table.getRowModel().rows;
			const indexInSorted = sortedRows.findIndex((r) => r.id === row.id);
			const serialNo = (currentPage - 1) * pageSize + indexInSorted + 1;
			return <div className="font-medium text-foreground">{serialNo}</div>;
		}
	},
	{
		size: 200,
		header: "Name",
		accessorKey: "firstName",
		cell: ({ row }) => {
			const student = row.original;
			const { firstName, lastName } = student;
			const fullName = `${firstName} ${lastName}`;

			return (
				<div className="space-y-1">
					<p title={fullName} className="font-medium text-foreground">
						{toTitleCase(fullName.length > 25 ? `${fullName.slice(0, 25)}...` : fullName)}
					</p>
					<p title={student.user.email} className="text-xs text-muted-foreground">
						{student.user.email.length > 25 ? `${student.user.email.slice(0, 25)}...` : student.user.email}
					</p>
				</div>
			);
		}
	},
	{
		size: 150,
		header: "Academic Info",
		accessorKey: "class",
		cell: ({ row }) => {
			const student = row.original;
			return (
				<div className="space-y-1">
					<p className="font-medium text-foreground text-sm">{student.class.code}</p>
					<p className="text-xs text-muted-foreground">
						{student.class.year.name} • {student.class.branch.code}
					</p>
				</div>
			);
		}
	},
	{
		size: 180,
		header: "Station",
		accessorKey: "station",
		cell: ({ row }) => {
			const station = row.getValue("station") as StudentListItem["station"];
			return (
				<div className="font-medium text-foreground/90">
					{station.name} ({station.code})
				</div>
			);
		}
	},
	{
		size: 120,
		accessorKey: "status",
		cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
		header: () => {
			return (
				<Button variant="ghost" className="h-auto py-2 font-semibold" onClick={() => onSortChange("status")}>
					Status
					<ArrowUpDown className="ml-2 size-4" />
				</Button>
			);
		}
	},
	{
		size: 150,
		accessorKey: "createdAt",
		header: () => {
			return (
				<Button variant="ghost" className="h-auto py-2 font-semibold" onClick={() => onSortChange("createdAt")}>
					Applied Date
					<ArrowUpDown className="ml-2 size-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const date = new Date(row.getValue("createdAt"));
			return <div className="font-medium text-foreground/90">{format(date, "MMM dd, yyyy")}</div>;
		}
	},
	{
		size: 100,
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			const student = row.original;
			return <StudentDetailsDialog student={student} adminId={adminId} onStudentUpdate={onStudentUpdate} />;
		}
	}
];

type StudentsTableProps = {
	adminId: string;
	isError: boolean;
	isLoading: boolean;
	totalCount: number;
	totalPages: number;
	currentPage: number;
	searchQuery: string;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	students: StudentListItem[];
	onPageChange: (page: number) => void;
	onSearchChange: (query: string) => void;
	onFilterChange: (filters: { status?: StudentApprovalStatusType | "all" }) => void;
	onStudentUpdate?: (updatedStudent: StudentDetails) => void;
};

const StudentsTable = ({
	isError,
	adminId,
	students,
	isLoading,
	totalCount,
	totalPages,
	currentPage,
	hasNextPage,
	searchQuery,
	onPageChange,
	onSearchChange,
	onFilterChange,
	onStudentUpdate,
	hasPreviousPage
}: StudentsTableProps) => {
	"use no memo";
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery);
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: SortOrder;
	} | null>(null);

	const sortedStudents = useMemo(() => {
		if (!sortConfig) {
			return students;
		}

		return [...students].sort((a, b) => {
			if (!a || !b) return 0;

			let aValue: string | Date;
			let bValue: string | Date;

			switch (sortConfig.key) {
				case "status":
					aValue = a.status;
					bValue = b.status;
					break;
				case "createdAt":
					aValue = new Date(a.createdAt);
					bValue = new Date(b.createdAt);
					break;
				default:
					return 0;
			}

			if (aValue < bValue) {
				return sortConfig.direction === "asc" ? -1 : 1;
			}
			if (aValue > bValue) {
				return sortConfig.direction === "asc" ? 1 : -1;
			}
			return 0;
		});
	}, [students, sortConfig]);

	const onSortChange = useCallback((column: string) => {
		setSortConfig((prev) => {
			if (prev?.key === column) {
				return {
					key: column,
					direction: prev.direction === "asc" ? "desc" : "asc"
				};
			}
			return { key: column, direction: "asc" };
		});
	}, []);

	const handleStatusFilter = useCallback(
		(value: string) => {
			setSelectedStatus(value);
			onFilterChange({
				status: value as StudentApprovalStatusType | "all"
			});
		},
		[onFilterChange]
	);

	const handleSearchSubmit = useCallback(() => {
		onSearchChange(localSearchQuery);
	}, [localSearchQuery, onSearchChange]);

	const handleSearchChange = useCallback(
		(value: string) => {
			setLocalSearchQuery(value);
			if (value === "") {
				onSearchChange("");
			}
		},
		[onSearchChange]
	);

	const handleSearchKeyPress = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				handleSearchSubmit();
			}
		},
		[handleSearchSubmit]
	);

	useEffect(() => {
		setLocalSearchQuery(searchQuery);
	}, [searchQuery]);

	const columns = createColumns(onSortChange, currentPage, adminId, onStudentUpdate);

	const table = useReactTable<StudentListItem>({
		state: {
			columnVisibility
		},
		columns,
		manualSorting: true,
		data: sortedStudents,
		manualFiltering: true,
		pageCount: totalPages,
		manualPagination: true,
		getCoreRowModel: getCoreRowModel(),
		onColumnVisibilityChange: setColumnVisibility
	});

	const renderPagination = () => (
		<div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
			<div className="text-sm text-muted-foreground order-2 sm:order-1">
				{isLoading ? (
					<Skeleton className="h-5 w-48" />
				) : totalCount > 0 ? (
					<>
						Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} student(s)
					</>
				) : (
					"Showing 0 of 0 students"
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
							onClick={() => onPageChange(currentPage - 1)}
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
							onClick={() => onPageChange(currentPage + 1)}
						>
							<ChevronRight className="size-4" />
						</Button>
					</>
				)}
			</div>
		</div>
	);

	const renderFilters = () => (
		<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div className="flex-1 md:max-w-sm">
				{isLoading ? (
					<Skeleton className="h-10 w-full" />
				) : (
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							value={localSearchQuery}
							className="pl-10 pr-20 h-10"
							placeholder="Search students..."
							onKeyPress={handleSearchKeyPress}
							onChange={(e) => handleSearchChange(e.target.value)}
						/>
						<Button
							size="sm"
							onClick={handleSearchSubmit}
							className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2"
						>
							<Search className="size-3" />
						</Button>
					</div>
				)}
			</div>

			<div className="flex gap-3">
				{isLoading ? (
					<>
						<Skeleton className="h-10 w-36" />
						<Skeleton className="h-10 w-28" />
					</>
				) : (
					<>
						<Select value={selectedStatus} onValueChange={handleStatusFilter}>
							<SelectTrigger className="w-36 h-10! text-foreground! cursor-pointer">
								<Filter className="mr-2 size-4 text-foreground" />
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="Pending">Pending</SelectItem>
								<SelectItem value="Approved">Approved</SelectItem>
								<SelectItem value="Rejected">Rejected</SelectItem>
							</SelectContent>
						</Select>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="w-28 h-10">
									Columns
									<ChevronDown className="ml-2 size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-44">
								{table
									.getAllColumns()
									.filter((column) => column.getCanHide())
									.map((column) => {
										return (
											<DropdownMenuCheckboxItem
												key={column.id}
												className="capitalize"
												checked={column.getIsVisible()}
												onCheckedChange={(value: boolean) => column.toggleVisibility(value)}
											>
												{column.id === "firstName"
													? "Name"
													: column.id === "class"
														? "Academic Info"
														: column.id === "createdAt"
															? "Applied Date"
															: column.id === "serialNo"
																? "Sr. No."
																: column.id}
											</DropdownMenuCheckboxItem>
										);
									})}
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				)}
			</div>
		</div>
	);

	if (isLoading) {
		return (
			<div className="w-full space-y-6">
				{renderFilters()}

				<div className="rounded-lg border bg-card">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent border-border/50">
								<TableHead className="font-semibold h-12 text-center px-4 w-20">
									<Skeleton className="h-4 w-12 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-50">
									<Skeleton className="h-4 w-16 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-37.5">
									<Skeleton className="h-4 w-24 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-45">
									<Skeleton className="h-4 w-16 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-30">
									<Skeleton className="h-4 w-14 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-37.5">
									<Skeleton className="h-4 w-20 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-25">
									<Skeleton className="h-4 w-14 mx-auto" />
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{Array.from({ length: 10 }).map((_, index) => (
								<TableRow key={index} className="hover:bg-muted/50 border-border/50">
									<TableCell className="p-4 text-center">
										<Skeleton className="h-4 w-6 mx-auto" />
									</TableCell>
									<TableCell className="p-4 text-center">
										<div className="space-y-1">
											<Skeleton className="h-4 w-36 mx-auto" />
											<Skeleton className="h-3 w-40 mx-auto" />
										</div>
									</TableCell>
									<TableCell className="p-4 text-center">
										<div className="space-y-1">
											<Skeleton className="h-4 w-16 mx-auto" />
											<Skeleton className="h-3 w-20 mx-auto" />
										</div>
									</TableCell>
									<TableCell className="p-4 text-center">
										<Skeleton className="h-4 w-28 mx-auto" />
									</TableCell>
									<TableCell className="p-4 text-center">
										<Skeleton className="h-6 w-16 rounded-full mx-auto" />
									</TableCell>
									<TableCell className="p-4 text-center">
										<Skeleton className="h-4 w-20 mx-auto" />
									</TableCell>
									<TableCell className="p-4 text-center">
										<Skeleton className="h-8 w-8 rounded mx-auto" />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{renderPagination()}
			</div>
		);
	}

	if (isError) {
		return (
			<Status
				icon={XCircle}
				iconColor="text-white"
				iconBg="bg-destructive"
				containerClassName="min-h-[63vh]"
				title="Failed to Fetch Students"
				description="We couldn't load the student data. Please check your connection or try again shortly."
			/>
		);
	}

	return (
		<div className="w-full space-y-6">
			{renderFilters()}

			<div className="rounded-lg border bg-card">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent border-border/50">
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											style={{ width: header.getSize() }}
											className="font-semibold h-12 text-center px-4"
										>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>

					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} className="hover:bg-muted/50 border-border/50">
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="p-4 text-center">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-64">
									<div className="flex flex-col items-center justify-center space-y-6 py-8">
										<div className="flex flex-col items-center space-y-4">
											<div className="p-4 rounded-full bg-primary">
												<Inbox className="size-8 text-white" />
											</div>

											<div className="space-y-2 text-center">
												<h3 className="text-lg font-semibold text-foreground">No students found</h3>

												<p className="text-sm text-muted-foreground max-w-md">
													No students match your current search and filter criteria.
												</p>
											</div>
										</div>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{renderPagination()}
		</div>
	);
};

export default StudentsTable;
