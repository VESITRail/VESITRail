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
import { AlertCircle, ExternalLink } from "lucide-react";
import { ConcessionBookletStatusType } from "@/generated/zod";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AvailableBooklet, getAvailableBooklets, getBookletAssignedStudents } from "@/actions/booklets";
import { Dialog, DialogTitle, DialogFooter, DialogHeader, DialogContent } from "@/components/ui/dialog";

type ReprintApplicationDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	application: AdminApplication | null;
	onReprint: (applicationId: string, bookletId: string, pageOffset: number) => Promise<void>;
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

const ReprintApplicationDialog: React.FC<ReprintApplicationDialogProps> = ({
	isOpen,
	onClose,
	onReprint,
	application
}) => {
	const router = useRouter();
	const [slipInput, setSlipInput] = useState<string>("");
	const [slipError, setSlipError] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isReprinting, setIsReprinting] = useState<boolean>(false);
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
			const placeholder = "Slip No.";
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

	const loadAvailableBooklets = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await getAvailableBooklets();
			if (result.isSuccess) {
				setAvailableBooklets(result.data);

				if (result.data.length > 0) {
					const currentBookletMatch = application?.concessionBookletId
						? result.data.find((b) => b.id === application.concessionBookletId)
						: null;

					if (currentBookletMatch) {
						setSelectedBookletId(currentBookletMatch.id);
					} else {
						setSelectedBookletId(result.data[0].id);
					}
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
	}, [application]);

	const loadBookletAssignedOffsets = useCallback(async (bookletId: string) => {
		try {
			const result = await getBookletAssignedStudents(bookletId);
			if (result.isSuccess) {
				const map = new Map<number, { studentName: string; shortId: number }>();
				for (const [key, value] of Object.entries(result.data)) {
					map.set(Number(key), { studentName: value.studentName, shortId: value.shortId });
				}
				setAssignedOffsets(map);
			}
		} catch (error) {
			console.error("Error loading assigned offsets:", error);
		}
	}, []);

	const generateBookletSearchTerms = (booklet: AvailableBooklet) => {
		const serialStart = booklet.serialStartNumber;
		const prefix = serialStart.replace(/\d+$/, "");
		const serialEnd = booklet.serialEndNumber || "";
		const statusText = booklet.status === "InUse" ? "in use" : "available";

		return [
			prefix,
			serialEnd,
			statusText,
			serialStart,
			`#${booklet.bookletNumber}`,
			booklet.status.toLowerCase(),
			`${booklet.totalPages} total`,
			booklet.bookletNumber.toString(),
			`booklet ${booklet.bookletNumber}`
		].join(" ");
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

		if (application && selectedBookletId === application.concessionBookletId && offset === application.pageOffset) {
			setSlipError(`Voucher #${cleaned} is currently assigned. Select a different slip.`);
			return;
		}

		if (assignedOffsets.has(offset)) {
			const assigned = assignedOffsets.get(offset)!;
			if (!application || assigned.shortId !== application.shortId) {
				setSlipError(
					`Voucher #${cleaned} is already assigned to ${assigned.studentName} (Application #${assigned.shortId})`
				);
			}
		}
	};

	const handleReprint = async () => {
		if (!application || !selectedBookletId) {
			toast.error("Selection Required", {
				description: "Please select a booklet before reprinting the application."
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

		if (selectedBookletId === application.concessionBookletId && offset === application.pageOffset) {
			setSlipError(
				"Cannot reprint to the same voucher slip in the same booklet. Please choose a different slip number or booklet."
			);
			return;
		}

		if (assignedOffsets.has(offset)) {
			const assigned = assignedOffsets.get(offset)!;
			if (assigned.shortId !== application.shortId) {
				setSlipError(
					`Voucher #${slipInput} is already assigned to ${assigned.studentName} (Application #${assigned.shortId})`
				);
				return;
			}
		}

		setIsReprinting(true);
		try {
			await onReprint(application.id, selectedBookletId, offset);
			handleClose();
		} catch (error) {
			console.error("Error reprinting application:", error);
		} finally {
			setIsReprinting(false);
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
			// eslint-disable-next-line react-hooks/set-state-in-effect -- loadAvailableBooklets is async data-fetching pattern.
			loadAvailableBooklets();
		}
	}, [isOpen, application, loadAvailableBooklets]);

	useEffect(() => {
		if (selectedBookletId && availableBooklets.length > 0) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- loadBookletAssignedOffsets is async data-fetching pattern.
			loadBookletAssignedOffsets(selectedBookletId);
		}
	}, [selectedBookletId, availableBooklets, loadBookletAssignedOffsets]);

	const selectedBooklet = availableBooklets.find((b) => b.id === selectedBookletId);
	const bookletRangeInfo = selectedBooklet ? getBookletRange(selectedBooklet) : null;

	const { issuedCount, damagedCount, remainingCount } = useMemo(() => {
		if (!selectedBooklet) return { issuedCount: 0, damagedCount: 0, remainingCount: 0 };
		const isExhausted = selectedBooklet.status === "Exhausted";
		const maxOffset = assignedOffsets.size > 0 ? Math.max(...Array.from(assignedOffsets.keys())) : -1;
		const upperBound = isExhausted ? selectedBooklet.totalPages - 1 : maxOffset;

		let damaged = 0;
		for (let i = 0; i <= upperBound; i++) {
			if (!assignedOffsets.has(i)) {
				damaged++;
			}
		}
		const issued = assignedOffsets.size;
		const remaining = Math.max(0, selectedBooklet.totalPages - issued - damaged);
		return { issuedCount: issued, damagedCount: damaged, remainingCount: remaining };
	}, [selectedBooklet, assignedOffsets]);

	const isSlipValid = (() => {
		if (!slipInput.trim() || !selectedBooklet || !application) return false;
		const offset = slipInputToOffset(slipInput, selectedBooklet);
		if (offset === null) return false;
		if (selectedBookletId === application.concessionBookletId && offset === application.pageOffset) return false;
		if (assignedOffsets.has(offset)) {
			const assigned = assignedOffsets.get(offset)!;
			if (assigned.shortId !== application.shortId) return false;
		}
		return true;
	})();

	const currentVoucherInfo = useMemo(() => {
		if (!application) return null;
		const booklet = application.concessionBooklet;
		const pageOffset = application.pageOffset;

		if (!booklet || pageOffset === null || pageOffset === undefined) {
			return null;
		}

		const serialStart = booklet.serialStartNumber;
		const prefix = serialStart.replace(/\d+$/, "");
		const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
		const paddingLength = serialStart.match(/\d+$/)?.[0]?.length || 2;
		const certNum = startNum + pageOffset;
		const certSerial = `${prefix}${certNum.toString().padStart(paddingLength, "0")}`;

		return {
			bookletNumber: booklet.bookletNumber,
			serialStart: booklet.serialStartNumber,
			serialEnd: booklet.serialEndNumber,
			certSerial
		};
	}, [application]);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Reprint Concession Certificate</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{application && (
						<div className="space-y-2">
							<div className="text-sm font-medium">Application Details</div>
							<div className="p-4 bg-muted/30 rounded-lg border space-y-3">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<div className="text-xs text-muted-foreground mb-1">Application ID</div>
										<div className="font-mono text-sm font-medium">#{application.shortId}</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Student</div>
										<div className="text-sm font-medium truncate">
											{[application.student.firstName, application.student.middleName, application.student.lastName]
												.filter(Boolean)
												.join(" ")}
										</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Current Booklet & Certificate</div>
										<div className="text-sm font-medium">
											{currentVoucherInfo
												? `Booklet #${currentVoucherInfo.bookletNumber} (${currentVoucherInfo.certSerial})`
												: "N/A"}
										</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Issued Date</div>
										<div className="text-sm font-medium">
											{application.issuedAt ? format(new Date(application.issuedAt), "MMMM d, yyyy") : "N/A"}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{isLoading ? (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="booklet-select" className="text-sm font-medium">
									Select Booklet
								</Label>
								<Skeleton className="h-10 w-full" />
							</div>

							<div className="space-y-4">
								<div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground">Serial Range:</span>
										<Skeleton className="h-4 w-28" />
									</div>
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground">Usage:</span>
										<Skeleton className="h-4 w-52" />
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="reprint-slip-number" className="text-sm font-medium">
										New Voucher Slip Number
									</Label>
									<div className="grid grid-cols-5 gap-3 items-end">
										<div className="col-span-2">
											<Skeleton className="h-10 w-full" />
										</div>
										<div className="col-span-3">
											<Skeleton className="h-10 w-full" />
										</div>
									</div>
									<div className="text-xs text-muted-foreground">
										<Skeleton className="h-4 w-60" />
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="booklet-select" className="text-sm font-medium">
									Select Booklet
								</Label>
								{availableBooklets.length === 0 ? (
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
										className="w-full h-10"
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
														<StatusBadge status={booklet.status} />
													</div>
												</div>
											);
										}}
									/>
								)}
							</div>

							{selectedBooklet && bookletRangeInfo && (
								<div className="space-y-4">
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
												{issuedCount} issued · {damagedCount} damaged · {remainingCount} remaining
											</span>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="reprint-slip-number" className="text-sm font-medium">
											New Voucher Slip Number
										</Label>
										<div className="grid grid-cols-5 gap-3 items-end">
											<div className="col-span-2">
												<Input
													autoFocus
													value={slipInput}
													autoComplete="off"
													id="reprint-slip-number"
													placeholder={bookletRangeInfo.placeholder}
													maxLength={bookletRangeInfo.maxInputLength}
													onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSlipInputChange(e.target.value)}
													onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
														if (e.key === "Enter" && isSlipValid) {
															e.preventDefault();
															handleReprint();
														}
													}}
													className={`font-mono text-center text-lg font-semibold h-10 ${
														slipError ? "border-destructive" : ""
													}`}
												/>
											</div>
											<div className="col-span-3">
												<div className="h-10 px-3 py-2 bg-muted/50 rounded-md flex items-center">
													<span className="font-mono text-sm text-muted-foreground">
														{nextSerialNumber || "Enter new slip number"}
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
												Enter the new voucher slip number ({bookletRangeInfo.rangeLabel})
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<DialogFooter className="gap-3 pt-2">
					<Button variant="outline" onClick={handleClose} disabled={isReprinting}>
						Cancel
					</Button>
					<Button
						onClick={handleReprint}
						disabled={isReprinting || !selectedBookletId || availableBooklets.length === 0 || !isSlipValid}
					>
						{isReprinting ? "Reprinting & Generating PDF..." : "Reprint & Print Pass"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ReprintApplicationDialog;
