"use client";

import {
	getBookletApplications,
	BookletApplicationPaginationParams,
	PaginatedBookletApplicationsResult
} from "@/actions/booklets";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useRouter, useParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { generateBookletPDF } from "@/actions/generate-booklet-pdf";
import BookletApplicationsTable from "@/components/admin/booklet-applications-table";

function BookletApplicationsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Skeleton className="size-8" />
						<Skeleton className="h-8 w-64" />
					</div>
					<Skeleton className="h-4 w-48" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>

			<Skeleton className="h-px w-full" />

			<div className="rounded-lg border bg-card">
				<div className="p-6">
					<div className="space-y-4">
						<div className="flex items-center space-x-4 border-b pb-3">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-48" />
						</div>

						{Array.from({ length: 10 }).map((_, index) => (
							<div key={index} className="flex items-center space-x-4 py-3 border-b border-border/30 last:border-b-0">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-48" />
							</div>
						))}
					</div>

					<div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between pt-6">
						<Skeleton className="h-5 w-48" />
						<div className="flex items-center gap-3">
							<Skeleton className="size-8" />
							<Skeleton className="h-6 w-20" />
							<Skeleton className="size-8" />
						</div>
					</div>
				</div>
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
	const [paginationData, setPaginationData] = useState<PaginatedBookletApplicationsResult>({
		data: [],
		totalCount: 0,
		totalPages: 0,
		currentPage: 1,
		hasNextPage: false,
		hasPreviousPage: false,
		booklet: {
			id: "",
			totalPages: 50,
			damagedPages: [],
			bookletNumber: 0,
			status: "Available",
			serialEndNumber: "",
			serialStartNumber: "",
			_count: {
				applications: 0
			}
		}
	});

	const loadApplications = useCallback(
		async (page: number = 1, pageSize: number = 10) => {
			if (isPending || !data?.user?.id || !bookletId) return;

			setIsError(false);
			setIsLoading(true);

			try {
				const params: BookletApplicationPaginationParams = {
					page,
					pageSize
				};

				const result = await getBookletApplications(bookletId, params);

				if (result.isSuccess) {
					setPaginationData(result.data);
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
		},
		[isPending, data?.user?.id, bookletId]
	);

	const handlePageChange = useCallback(
		(page: number) => {
			loadApplications(page);
		},
		[loadApplications]
	);

	const handleGeneratePDF = useCallback(async () => {
		if (!paginationData.booklet || paginationData.data.length === 0) {
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
	}, [bookletId, paginationData.booklet, paginationData.data.length]);

	useEffect(() => {
		loadApplications();
	}, [loadApplications]);

	if (isPending) {
		return (
			<div className="py-8 px-6 lg:px-8">
				<BookletApplicationsSkeleton />
			</div>
		);
	}

	if (!data?.user?.id) {
		return null;
	}

	return (
		<div className="py-8 px-6 lg:px-8 space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="ghost"
							onClick={() => router.back()}
							className="size-8 p-0 text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="size-4" />
						</Button>

						<h1 className="text-2xl font-semibold">
							{isLoading ? (
								<Skeleton className="h-8 w-64" />
							) : (
								`Booklet #${paginationData.booklet.bookletNumber} Applications`
							)}
						</h1>
					</div>

					<p className="text-muted-foreground">View and manage applications under this booklet</p>
				</div>

				<Button
					onClick={handleGeneratePDF}
					className="flex items-center gap-2"
					disabled={isGeneratingPDF || paginationData.data.length === 0}
				>
					<Download className="size-4" />
					{isGeneratingPDF ? "Generating..." : "Download PDF"}
				</Button>
			</div>

			<Separator className="my-4" />

			<div className="my-7">
				<BookletApplicationsTable
					isError={isError}
					isLoading={isLoading}
					onPageChange={handlePageChange}
					booklet={paginationData.booklet}
					applications={paginationData.data}
					totalCount={paginationData.totalCount}
					totalPages={paginationData.totalPages}
					currentPage={paginationData.currentPage}
					hasNextPage={paginationData.hasNextPage}
					hasPreviousPage={paginationData.hasPreviousPage}
				/>
			</div>
		</div>
	);
};

export default BookletApplicationsPage;
