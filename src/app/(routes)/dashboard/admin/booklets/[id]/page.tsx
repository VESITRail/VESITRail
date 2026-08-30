"use client";

import {
	StagedSlotInfo,
	DamagedPageItem,
	BookletTableItem,
	getBookletApplications,
	ReorderApplicationItem,
	BookletApplicationsResult,
	reorderBookletApplications
} from "@/actions/booklets";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { formatSlipNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useRouter, useParams } from "next/navigation";
import MoveSlotDialog from "@/components/admin/move-slot-dialog";
import { useState, useCallback, useEffect, useMemo } from "react";
import { generateBookletPDF } from "@/actions/generate-booklet-pdf";
import SaveLayoutConfirmDialog from "@/components/admin/save-layout-confirm-dialog";
import BookletApplicationsTable from "@/components/admin/booklet-applications-table";
import { ArrowLeft, Download, ArrowRightLeft, RotateCcw, Save, X } from "lucide-react";

function BookletApplicationsSkeleton() {
	return (
		<div className="h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] flex flex-col p-4 sm:p-6 lg:px-8 space-y-4 overflow-hidden">
			<div className="space-y-3 shrink-0">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2 min-w-0">
						<Button size="sm" disabled variant="ghost" className="size-8 p-0 text-muted-foreground shrink-0">
							<ArrowLeft className="size-4" />
						</Button>
						<Skeleton className="h-8 w-48 sm:w-64" />
					</div>
					<div className="hidden sm:flex items-center gap-2">
						<Skeleton className="h-9 w-36" />
						<Skeleton className="h-9 w-32" />
					</div>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm text-muted-foreground">
					<p className="text-sm text-muted-foreground font-normal">View and manage applications under this booklet</p>
					<Skeleton className="h-4 w-28 shrink-0" />
				</div>
				<div className="grid grid-cols-2 gap-2 sm:hidden w-full pt-1">
					<Skeleton className="h-9 w-full" />
					<Skeleton className="h-9 w-full" />
				</div>
			</div>

			<Separator className="shrink-0" />

			<div className="flex-1 min-h-0 overflow-hidden">
				<BookletApplicationsTable
					isError={false}
					isLoading={true}
					applications={[]}
					booklet={{
						id: "",
						bookletNumber: 0,
						serialEndNumber: "",
						serialStartNumber: ""
					}}
				/>
			</div>
		</div>
	);
}

const BookletApplicationsPage = () => {
	const router = useRouter();
	const params = useParams();
	const bookletId = params.id as string;
	const { data, isPending } = authClient.useSession();

	const [isError, setIsError] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
	const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
	const [isSavingLayout, setIsSavingLayout] = useState<boolean>(false);
	const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState<boolean>(false);

	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState<boolean>(false);
	const [selectedMoveSlot, setSelectedMoveSlot] = useState<StagedSlotInfo | null>(null);

	const [bookletData, setBookletData] = useState<BookletApplicationsResult>({
		data: [],
		totalCount: 0,
		booklet: {
			id: "",
			totalPages: 50,
			bookletNumber: 0,
			status: "Available",
			serialEndNumber: "",
			serialStartNumber: "",
			_count: {
				applications: 0
			}
		}
	});

	const [originalSlots, setOriginalSlots] = useState<StagedSlotInfo[]>([]);
	const [stagedSlots, setStagedSlots] = useState<StagedSlotInfo[]>([]);

	const isDamagedPage = (item: BookletTableItem | null): item is DamagedPageItem => {
		return !!item && "isDamaged" in item && item.isDamaged === true;
	};

	const buildSlotsFromData = useCallback((items: BookletTableItem[], totalPages: number = 50): StagedSlotInfo[] => {
		const slots: StagedSlotInfo[] = Array.from({ length: totalPages }, (_, i) => ({
			offset: i,
			item: null,
			isModified: false,
			originalOffset: i
		}));

		for (const item of items) {
			let offset: number | null = null;
			if ("pageOffset" in item && item.pageOffset !== null && item.pageOffset !== undefined) {
				offset = item.pageOffset;
			} else if ("pageNumber" in item && item.pageNumber) {
				offset = item.pageNumber - 1;
			}

			if (offset !== null && offset >= 0 && offset < totalPages) {
				slots[offset] = {
					item,
					offset,
					isModified: false,
					originalOffset: offset
				};
			}
		}

		return slots;
	}, []);

	const loadApplications = useCallback(async () => {
		if (isPending || !data?.user?.id || !bookletId) return;

		setIsError(false);
		setIsLoading(true);

		try {
			const result = await getBookletApplications(bookletId);

			if (result.isSuccess) {
				setBookletData(result.data);
				const initialSlots = buildSlotsFromData(result.data.data, result.data.booklet.totalPages || 50);
				setOriginalSlots(initialSlots);
				setStagedSlots(initialSlots);
			} else {
				setIsError(true);
				toast.error("Failed to load applications", {
					description: result.error.message
				});
			}
		} catch (error) {
			console.error("Error loading applications:", error);
			setIsError(true);
			toast.error("Failed to load applications", {
				description: "An unexpected error occurred"
			});
		} finally {
			setIsLoading(false);
		}
	}, [isPending, data?.user?.id, bookletId, buildSlotsFromData]);

	const isCapacityFull = useMemo(() => {
		if (stagedSlots.length < 50) return false;
		return stagedSlots[49]?.item !== null;
	}, [stagedSlots]);

	const stagedChangesCount = useMemo(() => {
		return stagedSlots.filter((s) => s.isModified).length;
	}, [stagedSlots]);

	const recomputeModifiedFlags = useCallback(
		(currentSlots: StagedSlotInfo[]): StagedSlotInfo[] => {
			const originalAppMap = new Map<string, number>();
			const originalDamagedOffsets = new Set<number>();

			for (const orig of originalSlots) {
				if (orig.item) {
					if (isDamagedPage(orig.item)) {
						originalDamagedOffsets.add(orig.offset);
					} else {
						originalAppMap.set(orig.item.id, orig.offset);
					}
				}
			}

			return currentSlots.map((slot) => {
				const currentItem = slot.item;
				const origSlot = originalSlots[slot.offset];

				if (!currentItem) {
					const isModified = origSlot?.item !== null;
					return {
						...slot,
						isModified,
						originalOffset: null
					};
				}

				if (isDamagedPage(currentItem)) {
					const wasOriginallyDamagedHere = originalDamagedOffsets.has(slot.offset);
					return {
						...slot,
						isModified: !wasOriginallyDamagedHere,
						originalOffset: wasOriginallyDamagedHere ? slot.offset : null
					};
				}

				const origOffset = originalAppMap.get(currentItem.id);
				const isModified = origOffset === undefined || origOffset !== slot.offset;
				return {
					...slot,
					isModified,
					originalOffset: origOffset !== undefined ? origOffset : null
				};
			});
		},
		[originalSlots]
	);

	const handleEnterReorderMode = () => {
		setStagedSlots(JSON.parse(JSON.stringify(originalSlots)));
		setIsReorderMode(true);
	};

	const handleDiscardChanges = () => {
		setStagedSlots(JSON.parse(JSON.stringify(originalSlots)));
		setIsReorderMode(false);
	};

	const handleResetChanges = () => {
		setStagedSlots(JSON.parse(JSON.stringify(originalSlots)));
		toast.info("Reset to original layout");
	};

	const createDamagedItem = useCallback(
		(offset: number): DamagedPageItem => {
			const serialStart = bookletData.booklet.serialStartNumber;
			const prefix = serialStart.replace(/\d+$/, "");
			const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
			const certNum = startNum + offset;
			const serialNumber = `${prefix}${certNum.toString().padStart(serialStart.match(/\d+$/)?.[0]?.length || 3, "0")}`;

			return {
				serialNumber,
				isDamaged: true,
				pageNumber: offset + 1,
				id: `staged-damaged-${bookletData.booklet.id}-${offset}`
			};
		},
		[bookletData.booklet.serialStartNumber, bookletData.booklet.id]
	);

	const handleApplyMove = (sourceOffset: number, targetOffset: number, mode: "shift" | "swap") => {
		if (sourceOffset === targetOffset) return;

		const totalPages = bookletData.booklet.totalPages || 50;
		const currentSlots = stagedSlots;
		const sourceItem = currentSlots[sourceOffset]?.item;
		const targetItem = currentSlots[targetOffset]?.item;

		if (!sourceItem) return;

		const nextSlots: StagedSlotInfo[] = new Array(totalPages);

		if (mode === "swap") {
			for (let i = 0; i < totalPages; i++) {
				nextSlots[i] = { ...currentSlots[i] };
			}
			nextSlots[sourceOffset] = { ...nextSlots[sourceOffset], item: targetItem };
			nextSlots[targetOffset] = { ...nextSlots[targetOffset], item: sourceItem };
		} else {
			if (isDamagedPage(sourceItem)) {
				// Moving a damaged slip: reorder array
				const items: (BookletTableItem | null)[] = currentSlots.map((s) => s.item);
				items.splice(sourceOffset, 1);
				items.splice(targetOffset, 0, sourceItem);

				for (let i = 0; i < totalPages; i++) {
					const it = items[i];
					if (isDamagedPage(it)) {
						nextSlots[i] = { offset: i, item: createDamagedItem(i) };
					} else {
						nextSlots[i] = { offset: i, item: it ?? null };
					}
				}
			} else {
				if (sourceOffset < targetOffset) {
					const damagedOffsets = new Set<number>();
					for (let i = 0; i < totalPages; i++) {
						if (isDamagedPage(currentSlots[i]?.item)) {
							damagedOffsets.add(i);
						}
					}
					damagedOffsets.add(sourceOffset);

					for (let i = 0; i < targetOffset; i++) {
						if (i === sourceOffset) {
							nextSlots[i] = { offset: i, item: createDamagedItem(i) };
						} else {
							nextSlots[i] = { ...currentSlots[i] };
						}
					}

					const tailApps: BookletTableItem[] = [sourceItem];
					for (let i = targetOffset; i < totalPages; i++) {
						const it = currentSlots[i]?.item;
						if (it && !isDamagedPage(it) && i !== sourceOffset) {
							tailApps.push(it);
						}
					}

					let availableTailSlots = 0;
					for (let i = targetOffset; i < totalPages; i++) {
						if (!damagedOffsets.has(i)) {
							availableTailSlots++;
						}
					}

					if (tailApps.length > availableTailSlots) {
						toast.error("Cannot move slip", {
							description: "Shifting would push records beyond the 50-slot booklet limit."
						});
						return;
					}

					for (let i = targetOffset; i < totalPages; i++) {
						if (damagedOffsets.has(i)) {
							nextSlots[i] = { offset: i, item: createDamagedItem(i) };
						} else if (tailApps.length > 0) {
							nextSlots[i] = { offset: i, item: tailApps.shift()! };
						} else {
							nextSlots[i] = { offset: i, item: null };
						}
					}
				} else {
					const items: (BookletTableItem | null)[] = currentSlots.map((s) => s.item);
					items.splice(sourceOffset, 1);
					items.splice(targetOffset, 0, sourceItem);

					for (let i = 0; i < totalPages; i++) {
						const it = items[i];
						if (isDamagedPage(it)) {
							nextSlots[i] = { offset: i, item: createDamagedItem(i) };
						} else {
							nextSlots[i] = { offset: i, item: it ?? null };
						}
					}
				}
			}
		}

		setStagedSlots(recomputeModifiedFlags(nextSlots));

		const srcSlip = formatSlipNumber(sourceOffset, bookletData.booklet.serialStartNumber);
		const tgtSlip = formatSlipNumber(targetOffset, bookletData.booklet.serialStartNumber);
		toast.success(`Moved from Slip #${srcSlip} to #${tgtSlip}`);
	};

	const handleInsertDamaged = (offset: number) => {
		const totalPages = bookletData.booklet.totalPages || 50;

		const damagedOffsets = new Set<number>();
		for (const slot of stagedSlots) {
			if (isDamagedPage(slot.item)) {
				damagedOffsets.add(slot.offset);
			}
		}
		damagedOffsets.add(offset);

		const appQueue: BookletTableItem[] = [];
		for (const slot of stagedSlots) {
			if (slot.item && !isDamagedPage(slot.item)) {
				appQueue.push(slot.item);
			}
		}

		if (damagedOffsets.size + appQueue.length > totalPages) {
			toast.error("Cannot insert damaged slip", {
				description: "Booklet is at maximum capacity (50 pages). Shifting would exceed booklet limit."
			});
			return;
		}

		const next: StagedSlotInfo[] = [];
		for (let i = 0; i < totalPages; i++) {
			if (damagedOffsets.has(i)) {
				next.push({
					offset: i,
					item: createDamagedItem(i)
				});
			} else if (appQueue.length > 0) {
				next.push({
					offset: i,
					item: appQueue.shift()!
				});
			} else {
				next.push({
					offset: i,
					item: null
				});
			}
		}

		setStagedSlots(recomputeModifiedFlags(next));

		const slip = formatSlipNumber(offset, bookletData.booklet.serialStartNumber);
		toast.success(`Inserted damaged slip at Slip #${slip}`);
	};

	const handleRemoveDamaged = (offset: number) => {
		const totalPages = bookletData.booklet.totalPages || 50;

		const damagedOffsets = new Set<number>();
		for (const slot of stagedSlots) {
			if (isDamagedPage(slot.item) && slot.offset !== offset) {
				damagedOffsets.add(slot.offset);
			}
		}

		const appQueue: BookletTableItem[] = [];
		for (const slot of stagedSlots) {
			if (slot.item && !isDamagedPage(slot.item)) {
				appQueue.push(slot.item);
			}
		}

		const next: StagedSlotInfo[] = [];
		for (let i = 0; i < totalPages; i++) {
			if (damagedOffsets.has(i)) {
				next.push({
					offset: i,
					item: createDamagedItem(i)
				});
			} else if (appQueue.length > 0) {
				next.push({
					offset: i,
					item: appQueue.shift()!
				});
			} else {
				next.push({
					offset: i,
					item: null
				});
			}
		}

		setStagedSlots(recomputeModifiedFlags(next));

		const slip = formatSlipNumber(offset, bookletData.booklet.serialStartNumber);
		toast.success(`Removed damaged slip at Slip #${slip}`);
	};

	const handleOpenMoveDialog = (slot: StagedSlotInfo) => {
		setSelectedMoveSlot(slot);
		setIsMoveDialogOpen(true);
	};

	const handleConfirmSaveLayout = async () => {
		setIsSavingLayout(true);

		try {
			const assignments: ReorderApplicationItem[] = [];

			for (const slot of stagedSlots) {
				if (slot.item && !isDamagedPage(slot.item)) {
					assignments.push({
						applicationId: slot.item.id,
						pageOffset: slot.offset
					});
				}
			}

			const result = await reorderBookletApplications(bookletId, assignments);

			if (result.isSuccess) {
				toast.success("Booklet Layout Saved", {
					description: `Successfully updated ${result.data.updatedCount} applications.`
				});
				setIsSaveConfirmOpen(false);
				setIsReorderMode(false);
				await loadApplications();
			} else {
				toast.error("Failed to Save Layout", {
					description: result.error.message
				});
			}
		} catch (error) {
			console.error("Error saving booklet layout:", error);
			toast.error("Failed to Save Layout", {
				description: "An unexpected error occurred while saving."
			});
		} finally {
			setIsSavingLayout(false);
		}
	};

	const handleGeneratePDF = useCallback(async () => {
		if (!bookletData.booklet || bookletData.data.length === 0) {
			toast.error("No Applications Found", {
				description: "Cannot generate PDF for empty booklet"
			});
			return;
		}

		setIsGeneratingPDF(true);

		const generatePDFPromise = async () => {
			const result = await generateBookletPDF(bookletId);

			if (!result.isSuccess) {
				throw new Error(result.error.message || "Failed to generate PDF");
			}

			const base64Data = result.data.split(",")[1];
			const binaryString = atob(base64Data);
			const bytes = new Uint8Array(binaryString.length);

			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}

			const blob = new Blob([bytes], { type: "application/pdf" });
			const blobUrl = URL.createObjectURL(blob);

			window.open(blobUrl, "_blank");

			setTimeout(() => {
				URL.revokeObjectURL(blobUrl);
			}, 1000);

			return "PDF opened in new tab successfully";
		};

		toast.promise(generatePDFPromise, {
			loading: "Generating PDF...",
			success: "PDF Generated Successfully",
			error: (error) => {
				console.error("PDF Generation Error:", error);
				return "Failed to generate PDF";
			},
			finally: () => {
				setIsGeneratingPDF(false);
			}
		});
	}, [bookletId, bookletData.booklet, bookletData.data.length]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- loadApplications is async data-fetching pattern.
		loadApplications();
	}, [loadApplications]);

	if (isPending) {
		return <BookletApplicationsSkeleton />;
	}

	if (!data?.user?.id) {
		return null;
	}

	return (
		<div className="h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] flex flex-col p-4 sm:p-6 lg:px-8 space-y-4 overflow-hidden">
			<div className="space-y-3 shrink-0">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2 min-w-0">
						<Button
							size="sm"
							variant="ghost"
							onClick={() => router.back()}
							className="size-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
						>
							<ArrowLeft className="size-4" />
						</Button>

						<h1 className="text-xl sm:text-2xl font-semibold truncate">
							{isLoading ? (
								<Skeleton className="h-8 w-48 sm:w-64" />
							) : (
								`Booklet #${bookletData.booklet.bookletNumber} Applications`
							)}
						</h1>
					</div>

					<div className="hidden sm:flex items-center gap-2 shrink-0">
						{isReorderMode ? (
							<>
								<Button
									size="icon"
									variant="outline"
									className="size-9"
									onClick={handleResetChanges}
									title="Reset to original layout"
									disabled={stagedChangesCount === 0 || isSavingLayout}
								>
									<RotateCcw className="size-4" />
								</Button>

								<Button
									size="icon"
									className="size-9"
									variant="destructive"
									disabled={isSavingLayout}
									onClick={handleDiscardChanges}
									title="Discard changes and exit"
								>
									<X className="size-4" />
								</Button>

								<Button
									className="flex items-center gap-2"
									onClick={() => setIsSaveConfirmOpen(true)}
									disabled={stagedChangesCount === 0 || isSavingLayout}
								>
									<Save className="size-4" />
									Save
								</Button>
							</>
						) : (
							<>
								<Button
									variant="outline"
									onClick={handleEnterReorderMode}
									disabled={isLoading || bookletData.data.length === 0}
									className="flex items-center justify-center gap-2 px-4 text-sm"
								>
									<ArrowRightLeft className="size-4 shrink-0" />
									<span>Reorder Slots</span>
								</Button>

								<Button
									onClick={handleGeneratePDF}
									className="flex items-center justify-center gap-2 px-4 text-sm"
									disabled={isGeneratingPDF || isLoading || bookletData.data.length === 0}
								>
									<Download className="size-4 shrink-0" />
									<span>{isGeneratingPDF ? "Generating..." : "Download PDF"}</span>
								</Button>
							</>
						)}
					</div>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm text-muted-foreground">
					<p className="text-sm text-muted-foreground font-normal">
						{isReorderMode
							? "Adjust slip positions, insert damaged pages, or swap slots below"
							: "View and manage applications under this booklet"}
					</p>
					{isLoading ? (
						<Skeleton className="h-4 w-28 shrink-0 hidden sm:block" />
					) : isReorderMode ? (
						<p className="text-sm text-muted-foreground font-normal shrink-0 hidden sm:block">
							{stagedChangesCount} changes staged
						</p>
					) : !isError && bookletData.data.length > 0 ? (
						<p className="text-sm text-muted-foreground font-normal shrink-0">
							Total: {bookletData.totalCount} records
						</p>
					) : null}
				</div>

				<div className="sm:hidden w-full pt-1">
					{isReorderMode ? (
						<div className="flex items-center justify-between gap-2 w-full">
							<div className="flex items-center gap-2">
								<Button
									size="icon"
									variant="outline"
									className="size-9"
									onClick={handleResetChanges}
									title="Reset to original layout"
									disabled={stagedChangesCount === 0 || isSavingLayout}
								>
									<RotateCcw className="size-4" />
								</Button>

								<Button
									size="icon"
									className="size-9"
									variant="destructive"
									disabled={isSavingLayout}
									onClick={handleDiscardChanges}
									title="Discard changes and exit"
								>
									<X className="size-4" />
								</Button>

								<Button
									className="flex items-center gap-2"
									onClick={() => setIsSaveConfirmOpen(true)}
									disabled={stagedChangesCount === 0 || isSavingLayout}
								>
									<Save className="size-4" />
									Save
								</Button>
							</div>

							<p className="text-sm text-muted-foreground font-normal shrink-0">{stagedChangesCount} changes staged</p>
						</div>
					) : (
						<div className="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								onClick={handleEnterReorderMode}
								disabled={isLoading || bookletData.data.length === 0}
								className="flex items-center justify-center gap-1.5 px-2 text-xs truncate"
							>
								<ArrowRightLeft className="size-3.5 shrink-0" />
								<span className="truncate">Reorder Slots</span>
							</Button>

							<Button
								onClick={handleGeneratePDF}
								disabled={isGeneratingPDF || isLoading || bookletData.data.length === 0}
								className="flex items-center justify-center gap-1.5 px-2 text-xs truncate"
							>
								<Download className="size-3.5 shrink-0" />
								<span className="truncate">{isGeneratingPDF ? "Generating..." : "Download PDF"}</span>
							</Button>
						</div>
					)}
				</div>
			</div>

			<Separator className="shrink-0" />

			<div className="flex-1 min-h-0 overflow-hidden">
				<BookletApplicationsTable
					isError={isError}
					isLoading={isLoading}
					stagedSlots={stagedSlots}
					booklet={bookletData.booklet}
					isReorderMode={isReorderMode}
					applications={bookletData.data}
					isCapacityFull={isCapacityFull}
					onMoveClick={handleOpenMoveDialog}
					onInsertDamaged={handleInsertDamaged}
					onRemoveDamaged={handleRemoveDamaged}
				/>
			</div>

			<MoveSlotDialog
				isOpen={isMoveDialogOpen}
				onClose={() => {
					setIsMoveDialogOpen(false);
					setSelectedMoveSlot(null);
				}}
				sourceSlot={selectedMoveSlot}
				allSlots={stagedSlots}
				booklet={bookletData.booklet}
				onApplyMove={handleApplyMove}
			/>

			<SaveLayoutConfirmDialog
				isOpen={isSaveConfirmOpen}
				isSaving={isSavingLayout}
				stagedSlots={stagedSlots}
				originalSlots={originalSlots}
				booklet={bookletData.booklet}
				onConfirmSave={handleConfirmSaveLayout}
				onClose={() => setIsSaveConfirmOpen(false)}
			/>
		</div>
	);
};

export default BookletApplicationsPage;
