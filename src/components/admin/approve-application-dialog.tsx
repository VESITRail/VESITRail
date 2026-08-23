"use client";

import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminApplication } from "@/actions/concession";
import { useState, useEffect, useCallback } from "react";
import { ExternalLink, AlertCircle } from "lucide-react";
import { ConcessionBookletStatusType } from "@/generated/zod";
import { AvailableBooklet, getAvailableBooklets, getBookletAssignedStudents } from "@/actions/booklets";
import { Dialog, DialogTitle, DialogFooter, DialogHeader, DialogContent } from "@/components/ui/dialog";

type ApproveApplicationDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	application: AdminApplication | null;
	onApprove: (applicationId: string, bookletId: string, pageOffset: number) => Promise<void>;
};

const StatusBadge = ({ status }: { status: ConcessionBookletStatusType }) => {
	const variants = {
		InUse: "bg-primary text-white",
		Exhausted: "bg-gray-600 text-white",
		Available: "bg-green-600 text-white"
	};

	const displayText = status === "InUse" ? "In Use" : status;

	return <Badge className={`${variants[status]} font-medium`}>{displayText}</Badge>;
};

const ApproveApplicationDialog: React.FC<ApproveApplicationDialogProps> = ({
	isOpen,
	onClose,
	onApprove,
	application
}) => {
	const router = useRouter();
	const [slipInput, setSlipInput] = useState<string>("");
	const [slipError, setSlipError] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isApproving, setIsApproving] = useState<boolean>(false);
	const [nextSerialNumber, setNextSerialNumber] = useState<string>("");
	const [selectedBookletId, setSelectedBookletId] = useState<string>("");
	const [availableBooklets, setAvailableBooklets] = useState<AvailableBooklet[]>([]);
	const [assignedOffsets, setAssignedOffsets] = useState<Map<number, { studentName: string; shortId: number }>>(
		new Map()
	);

	const getBookletSerialInfo = useCallback((booklet: AvailableBooklet) => {
		const serialStart = booklet.serialStartNumber;
		const prefix = serialStart.replace(/\d+$/, "");
		const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
		const paddingLength = serialStart.match(/\d+$/)?.[0]?.length || 2;
		return { prefix, startNum, paddingLength };
	}, []);

	const offsetToSerialNumber = useCallback(
		(offset: number, booklet: AvailableBooklet): string => {
			const { prefix, startNum, paddingLength } = getBookletSerialInfo(booklet);
			const num = startNum + offset;
			return `${prefix}${num.toString().padStart(paddingLength, "0")}`;
		},
		[getBookletSerialInfo]
	);

	const offsetToSlipDisplay = useCallback(
		(offset: number, booklet: AvailableBooklet): string => {
			const { startNum } = getBookletSerialInfo(booklet);
			const currNum = startNum + offset;
			const isUnderHundred = startNum % 100 <= 50 && startNum % 100 > 0;

			if (currNum % 100 === 0) {
				return "100";
			}
			if (isUnderHundred) {
				return (currNum % 100).toString().padStart(2, "0");
			}
			return (currNum % 100).toString();
		},
		[getBookletSerialInfo]
	);

	const getBookletRange = useCallback(
		(booklet: AvailableBooklet) => {
			const minSlip = offsetToSlipDisplay(0, booklet);
			const maxSlip = offsetToSlipDisplay(booklet.totalPages - 1, booklet);
			const rangeLabel = `${minSlip} to ${maxSlip}`;
			const placeholder = `e.g., ${minSlip}`;
			const maxInputLength = Math.max(minSlip.length, maxSlip.length, 2);

			return {
				minSlip,
				maxSlip,
				rangeLabel,
				placeholder,
				maxInputLength
			};
		},
		[offsetToSlipDisplay]
	);

	const slipInputToOffset = useCallback(
		(input: string, booklet: AvailableBooklet): number | null => {
			const trimmed = input.trim();
			if (!trimmed) return null;

			const { startNum } = getBookletSerialInfo(booklet);
			const endNum = startNum + booklet.totalPages - 1;

			let inputNum = parseInt(trimmed, 10);
			if (isNaN(inputNum)) return null;

			if ((trimmed === "00" || trimmed === "0") && endNum % 100 === 0) {
				inputNum = 100;
			}

			for (let offset = 0; offset < booklet.totalPages; offset++) {
				const slip = offsetToSlipDisplay(offset, booklet);
				if (slip === trimmed || parseInt(slip, 10) === inputNum) {
					return offset;
				}
			}

			return null;
		},
		[getBookletSerialInfo, offsetToSlipDisplay]
	);

	const calculateNextFreeSlip = useCallback(
		(booklet: AvailableBooklet, offsets: Map<number, { studentName: string; shortId: number }>): string => {
			for (let i = 0; i < booklet.totalPages; i++) {
				if (!offsets.has(i)) {
					return offsetToSlipDisplay(i, booklet);
				}
			}
			return "";
		},
		[offsetToSlipDisplay]
	);

	const loadAvailableBooklets = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await getAvailableBooklets();
			if (result.isSuccess) {
				setAvailableBooklets(result.data);

				if (result.data.length > 0) {
					const latestBooklet = result.data[0];
					setSelectedBookletId(latestBooklet.id);
				}
			} else {
				toast.error("Failed to Load Booklets", {
					description: "Unable to fetch available booklets. Please try again."
				});
			}
		} catch (error) {
			console.error("Error loading booklets:", error);
			toast.error("Failed to Load Booklets", {
				description: "An unexpected error occurred while loading booklets."
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	const loadBookletAssignedOffsets = useCallback(
		async (bookletId: string) => {
			try {
				const result = await getBookletAssignedStudents(bookletId);
				if (result.isSuccess) {
					const map = new Map<number, { studentName: string; shortId: number }>();
					for (const [key, value] of Object.entries(result.data)) {
						map.set(Number(key), { studentName: value.studentName, shortId: value.shortId });
					}
					setAssignedOffsets(map);

					const selectedBooklet = availableBooklets.find((b) => b.id === bookletId);
					if (selectedBooklet) {
						const nextFree = calculateNextFreeSlip(selectedBooklet, map);
						setSlipInput(nextFree);
						setSlipError("");

						if (nextFree) {
							const offset = slipInputToOffset(nextFree, selectedBooklet);
							if (offset !== null) {
								setNextSerialNumber(offsetToSerialNumber(offset, selectedBooklet));
							}
						} else {
							setNextSerialNumber("");
						}
					}
				}
			} catch (error) {
				console.error("Error loading assigned offsets:", error);
			}
		},
		[availableBooklets, calculateNextFreeSlip, slipInputToOffset, offsetToSerialNumber]
	);

	const generateBookletSearchTerms = (booklet: AvailableBooklet) => {
		const serialStart = booklet.serialStartNumber;
		const prefix = serialStart.replace(/\d+$/, "");
		const serialEnd = booklet.serialEndNumber || "";

		const statusText = booklet.status === "InUse" ? "in use" : "available";
		const usageText = `${booklet._count.applications}/${booklet.totalPages} used`;

		const searchTerms = [
			prefix,
			usageText,
			serialEnd,
			statusText,
			serialStart,
			`#${booklet.bookletNumber}`,
			booklet.status.toLowerCase(),
			`${booklet.totalPages} total`,
			booklet.bookletNumber.toString(),
			`booklet ${booklet.bookletNumber}`,
			`${booklet._count.applications} used`,
			`${booklet.totalPages - booklet._count.applications} remaining`
		].join(" ");

		return searchTerms;
	};

	const handleBookletChange = (bookletId: string) => {
		setSelectedBookletId(bookletId);
		setSlipInput("");
		setSlipError("");
		setNextSerialNumber("");
		setAssignedOffsets(new Map());
		loadBookletAssignedOffsets(bookletId);
	};

	const handleSlipInputChange = (value: string) => {
		const selectedBooklet = availableBooklets.find((b) => b.id === selectedBookletId);
		const rangeInfo = selectedBooklet ? getBookletRange(selectedBooklet) : null;

		const maxLen = rangeInfo ? rangeInfo.maxInputLength : 3;
		const cleaned = value.replace(/\D/g, "").slice(0, maxLen);
		setSlipInput(cleaned);
		setSlipError("");

		if (!selectedBooklet || !cleaned) {
			setNextSerialNumber("");
			return;
		}

		const offset = slipInputToOffset(cleaned, selectedBooklet);
		if (offset === null) {
			const label = rangeInfo ? rangeInfo.rangeLabel : "valid range";
			setSlipError(`Enter a number between ${label}`);
			setNextSerialNumber("");
			return;
		}

		const serial = offsetToSerialNumber(offset, selectedBooklet);
		setNextSerialNumber(serial);

		if (assignedOffsets.has(offset)) {
			const assigned = assignedOffsets.get(offset)!;
			setSlipError(`Voucher #${cleaned} is already assigned to ${assigned.studentName} (#${assigned.shortId})`);
		}
	};

	const handleApprove = async () => {
		if (!application || !selectedBookletId) {
			toast.error("Selection Required", {
				description: "Please select a booklet before approving the application."
			});
			return;
		}

		const selectedBooklet = availableBooklets.find((b) => b.id === selectedBookletId);
		if (!selectedBooklet) return;

		const offset = slipInputToOffset(slipInput, selectedBooklet);
		if (offset === null) {
			const { rangeLabel } = getBookletRange(selectedBooklet);
			setSlipError(`Please enter a valid slip number (${rangeLabel})`);
			return;
		}

		if (assignedOffsets.has(offset)) {
			const assigned = assignedOffsets.get(offset)!;
			setSlipError(`Voucher #${slipInput} is already assigned to ${assigned.studentName} (#${assigned.shortId})`);
			return;
		}

		setIsApproving(true);
		try {
			await onApprove(application.id, selectedBookletId, offset);
			onClose();
		} catch (error) {
			console.error("Error approving application:", error);
		} finally {
			setIsApproving(false);
		}
	};

	const handleClose = () => {
		setSlipInput("");
		setSlipError("");
		setNextSerialNumber("");
		setSelectedBookletId("");
		setAvailableBooklets([]);
		setAssignedOffsets(new Map());
		onClose();
	};

	useEffect(() => {
		if (isOpen && application) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- loadAvailableBooklets is async; it sets loading/error state before awaiting the fetch, which matches React's documented data-fetching effect pattern. Safe: no state is derived synchronously from props/state outside the fetch.
			loadAvailableBooklets();
		}
	}, [isOpen, application, loadAvailableBooklets]);

	useEffect(() => {
		if (selectedBookletId && availableBooklets.length > 0) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- loadBookletAssignedOffsets is async; it sets loading/error state before awaiting the fetch, which matches React's documented data-fetching effect pattern.
			loadBookletAssignedOffsets(selectedBookletId);
		}
	}, [selectedBookletId, availableBooklets, loadBookletAssignedOffsets]);

	const selectedBooklet = availableBooklets.find((b) => b.id === selectedBookletId);
	const bookletRangeInfo = selectedBooklet ? getBookletRange(selectedBooklet) : null;

	const isSlipValid = (() => {
		if (!slipInput.trim() || !selectedBooklet) return false;
		const offset = slipInputToOffset(slipInput, selectedBooklet);
		if (offset === null) return false;
		if (assignedOffsets.has(offset)) return false;
		return true;
	})();

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Assign Booklet & Print Pass</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{application && (
						<div className="space-y-2">
							<div className="text-sm font-medium">Application Details</div>
							<div className="p-4 bg-muted/30 rounded-lg border space-y-3">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<div className="text-xs text-muted-foreground mb-1">Application ID</div>
										<div className="font-mono text-sm">#{application.shortId}</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Type</div>
										<div className="text-sm font-medium">{application.applicationType}</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Student</div>
										<div className="text-sm font-medium">
											{[application.student.firstName, application.student.middleName, application.student.lastName]
												.filter(Boolean)
												.join(" ")}
										</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Applied Date</div>
										<div className="text-sm font-medium">{format(new Date(application.createdAt), "MMMM d, yyyy")}</div>
									</div>
								</div>
							</div>
						</div>
					)}

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="booklet-select" className="text-sm font-medium">
								Select Booklet
							</Label>
							{isLoading ? (
								<div className="space-y-4">
									<Skeleton className="h-10 w-full" />
									<div className="space-y-3">
										<div className="space-y-2">
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-12 w-full" />
										</div>
										<div className="bg-muted/30 rounded-lg p-3 space-y-2">
											<div className="flex justify-between">
												<Skeleton className="h-3 w-20" />
												<Skeleton className="h-3 w-40" />
											</div>
											<div className="flex justify-between">
												<Skeleton className="h-3 w-16" />
												<Skeleton className="h-3 w-24" />
											</div>
										</div>
									</div>
								</div>
							) : availableBooklets.length === 0 ? (
								<div className="space-y-3">
									<div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
										No available booklets found. Please create a new booklet first.
									</div>
									<Button
										variant="outline"
										className="w-full"
										onClick={() => {
											router.push("/dashboard/admin/booklets");
										}}
									>
										<ExternalLink className="size-4" />
										Go to Booklets Management
									</Button>
								</div>
							) : (
								<Combobox
									options={availableBooklets.map((booklet) => ({
										data: booklet,
										value: booklet.id,
										label: `Booklet #${booklet.bookletNumber}`,
										searchTerms: generateBookletSearchTerms(booklet)
									}))}
									className="w-full"
									value={selectedBookletId}
									showFullOptionInTrigger={true}
									onValueChange={handleBookletChange}
									placeholder="Search and select a booklet..."
									emptyText="No booklets found matching your search."
									searchPlaceholder="Search by booklet number, serial, status..."
									renderOption={(option) => {
										const booklet = option.data as AvailableBooklet;

										return (
											<div className="flex items-center justify-between w-full min-w-0">
												<span className="font-medium">Booklet #{booklet.bookletNumber}</span>
												<div className="flex items-center gap-2 ml-3 shrink-0">
													<span className="text-xs text-muted-foreground whitespace-nowrap">
														{booklet._count.applications}/{booklet.totalPages} used
													</span>
													<StatusBadge status={booklet.status} />
												</div>
											</div>
										);
									}}
								/>
							)}
						</div>

						{selectedBooklet && bookletRangeInfo && (
							<div className="space-y-3">
								<div className="space-y-2">
									<Label htmlFor="slip-number" className="text-sm font-medium">
										Voucher Slip Number
									</Label>
									<div className="grid grid-cols-5 gap-3 items-end">
										<div className="col-span-2">
											<Input
												autoFocus
												id="slip-number"
												value={slipInput}
												autoComplete="off"
												placeholder={bookletRangeInfo.placeholder}
												maxLength={bookletRangeInfo.maxInputLength}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSlipInputChange(e.target.value)}
												onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
													if (e.key === "Enter" && isSlipValid) {
														e.preventDefault();
														handleApprove();
													}
												}}
												className={`font-mono text-center text-lg font-semibold ${slipError ? "border-destructive" : ""}`}
											/>
										</div>
										<div className="col-span-3">
											<div className="h-9 px-3 py-2 bg-muted/50 rounded-md flex items-center">
												<span className="font-mono text-sm text-muted-foreground">
													{nextSerialNumber || "Enter slip number"}
												</span>
											</div>
										</div>
									</div>

									{slipError ? (
										<div className="flex items-center gap-1.5 text-xs text-destructive">
											<AlertCircle className="size-3.5 shrink-0" />
											<span>{slipError}</span>
										</div>
									) : (
										<div className="text-xs text-muted-foreground">
											Enter the voucher slip number ({bookletRangeInfo.rangeLabel})
										</div>
									)}
								</div>

								<div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Serial Range:</span>
										<span className="font-mono">
											{selectedBooklet.serialStartNumber} - {selectedBooklet.serialEndNumber}
										</span>
									</div>

									<div className="flex justify-between">
										<span className="text-muted-foreground">Usage:</span>
										<span>
											{selectedBooklet._count.applications}/{selectedBooklet.totalPages} pages used
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<DialogFooter className="gap-4 pt-2">
					<Button variant="outline" onClick={handleClose} disabled={isApproving}>
						Cancel
					</Button>
					<Button
						onClick={handleApprove}
						disabled={isApproving || !selectedBookletId || availableBooklets.length === 0 || !isSlipValid}
					>
						{isApproving ? "Assigning & Printing..." : "Assign & Print Pass"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ApproveApplicationDialog;
