"use client";

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
import { getBookletApplications, BookletApplicationsResult } from "@/actions/booklets";

function BookletApplicationsSkeleton() {
	return (
		<div className="h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] flex flex-col p-6 lg:px-8 space-y-4 overflow-hidden">
			<div className="space-y-2 shrink-0">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<Skeleton className="size-8" />
						<Skeleton className="h-8 w-64" />
					</div>
					<Skeleton className="h-9 w-36" />
				</div>
				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<p className="text-sm text-muted-foreground font-normal">View and manage applications under this booklet</p>
					<Skeleton className="h-4 w-28" />
				</div>
			</div>

			<Separator className="shrink-0" />

			<div className="flex-1 min-h-0 overflow-hidden">
				<BookletApplicationsTable
					isError={false}
					isLoading={true}
					booklet={{
						id: "",
						bookletNumber: 0,
						serialStartNumber: "",
						serialEndNumber: ""
					}}
					applications={[]}
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

	const loadApplications = useCallback(async () => {
		if (isPending || !data?.user?.id || !bookletId) return;

		setIsError(false);
		setIsLoading(true);

		try {
			const result = await getBookletApplications(bookletId);

			if (result.isSuccess) {
				setBookletData(result.data);
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
	}, [isPending, data?.user?.id, bookletId]);

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
		// eslint-disable-next-line react-hooks/set-state-in-effect -- loadApplications is async; it sets loading/error state before awaiting the fetch, which matches React's documented data-fetching effect pattern. Safe: no state is derived synchronously from props/state outside the fetch.
		loadApplications();
	}, [loadApplications]);

	if (isPending) {
		return <BookletApplicationsSkeleton />;
	}

	if (!data?.user?.id) {
		return null;
	}

	return (
		<div className="h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] flex flex-col p-6 lg:px-8 space-y-4 overflow-hidden">
			<div className="space-y-2 shrink-0">
				<div className="flex items-center justify-between gap-4">
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
								`Booklet #${bookletData.booklet.bookletNumber} Applications`
							)}
						</h1>
					</div>

					<Button
						onClick={handleGeneratePDF}
						className="flex items-center gap-2"
						disabled={isGeneratingPDF || isLoading || bookletData.data.length === 0}
					>
						<Download className="size-4" />
						{isGeneratingPDF ? "Generating..." : "Download PDF"}
					</Button>
				</div>

				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<p className="text-sm text-muted-foreground font-normal">View and manage applications under this booklet</p>
					{isLoading ? (
						<Skeleton className="h-4 w-28" />
					) : !isError && bookletData.data.length > 0 ? (
						<p className="text-sm text-muted-foreground font-normal">Total: {bookletData.totalCount} records</p>
					) : null}
				</div>
			</div>

			<Separator className="shrink-0" />

			<div className="flex-1 min-h-0 overflow-hidden">
				<BookletApplicationsTable
					isError={isError}
					isLoading={isLoading}
					booklet={bookletData.booklet}
					applications={bookletData.data}
				/>
			</div>
		</div>
	);
};

export default BookletApplicationsPage;
