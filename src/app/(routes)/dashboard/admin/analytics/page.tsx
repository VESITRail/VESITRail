"use client";

import {
	TimeRangeFilter,
	getAdminAnalytics,
	PaginatedAnalyticsResult,
	generateAdminAnalyticsPDF
} from "@/actions/analytics";
import { toast } from "sonner";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useCallback, useEffect, useState } from "react";
import AnalyticsTable from "@/components/admin/analytics-table";
import { Users, MapPin, FileText, Calendar, Download, Loader2 } from "lucide-react";
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from "@/components/ui/select";

const TIME_RANGE_OPTIONS: { label: string; value: TimeRangeFilter }[] = [
	{ label: "All Time", value: "all" },
	{ label: "Last 1 Month", value: "1m" },
	{ label: "Last 3 Months", value: "3m" },
	{ label: "Last 6 Months", value: "6m" },
	{ label: "Last 1 Year", value: "1y" }
];

const AdminAnalyticsPage = () => {
	const [isError, setIsError] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isExporting, setIsExporting] = useState<boolean>(false);

	const [searchQuery, setSearchQuery] = useState<string>("");
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [timeRange, setTimeRange] = useState<TimeRangeFilter>("1m");

	const [analyticsData, setAnalyticsData] = useState<PaginatedAnalyticsResult>({
		combinedStats: {
			totalContribution: 0,
			applicationsCount: 0,
			addressChangesCount: 0,
			studentsReviewedCount: 0
		},
		data: [],
		totalCount: 0,
		totalPages: 1,
		currentPage: 1,
		hasNextPage: false,
		hasPreviousPage: false
	});

	const loadAnalytics = useCallback(
		async (range: TimeRangeFilter = timeRange, query: string = searchQuery, page: number = currentPage) => {
			try {
				setIsLoading(true);
				setIsError(false);

				const result = await getAdminAnalytics({
					page,
					pageSize: 10,
					timeRange: range,
					searchQuery: query
				});

				if (result.isSuccess) {
					setAnalyticsData(result.data);
				} else {
					setIsError(true);
					toast.error("Failed to load analytics", {
						description: "Unable to retrieve contribution statistics. Please try again."
					});
				}
			} catch (error) {
				console.error("Error loading admin analytics:", error);
				setIsError(true);
				toast.error("Failed to load analytics", {
					description: "An unexpected error occurred while loading analytics data."
				});
			} finally {
				setIsLoading(false);
			}
		},
		[timeRange, searchQuery, currentPage]
	);

	const handleTimeRangeChange = (newRange: TimeRangeFilter) => {
		setTimeRange(newRange);
		setCurrentPage(1);
		posthog.capture("admin_analytics_time_range_changed", {
			time_range: newRange
		});
		loadAnalytics(newRange, searchQuery, 1);
	};

	const handleSearchChange = (query: string) => {
		setSearchQuery(query);
		setCurrentPage(1);
		loadAnalytics(timeRange, query, 1);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		loadAnalytics(timeRange, searchQuery, page);
	};

	const handleExportPDF = useCallback(async () => {
		setIsExporting(true);

		posthog.capture("admin_analytics_pdf_exported", {
			time_range: timeRange,
			has_search: Boolean(searchQuery)
		});

		const exportPDFPromise = async () => {
			const result = await generateAdminAnalyticsPDF({
				timeRange,
				searchQuery
			});

			if (!result.isSuccess) {
				throw new Error(result.error.message || "Failed to generate analytics PDF");
			}

			const base64Data = result.data.split(",")[1];
			const binaryString = atob(base64Data);
			const bytes = new Uint8Array(binaryString.length);

			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}

			const blob = new Blob([bytes], { type: "application/pdf" });
			const blobUrl = URL.createObjectURL(blob);

			window.open(blobUrl, "_blank", "noopener,noreferrer");

			setTimeout(() => {
				URL.revokeObjectURL(blobUrl);
			}, 1000);

			return "Analytics report opened in new tab successfully";
		};

		toast.promise(exportPDFPromise, {
			loading: "Generating PDF...",
			success: "PDF Generated Successfully",
			error: (error) => {
				console.error("PDF Generation Error:", error);
				return "Failed to generate PDF";
			},
			finally: () => {
				setIsExporting(false);
			}
		});
	}, [timeRange, searchQuery]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- loadAnalytics is async; it sets loading state before fetching.
		loadAnalytics();
	}, [loadAnalytics]);

	return (
		<div className="h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] flex flex-col p-6 lg:px-8 space-y-4 overflow-hidden">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
					<p className="text-sm text-muted-foreground">
						View overall system review statistics and individual admin contributions.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-3 shrink-0">
					<div className="flex items-center gap-2">
						<Calendar className="size-4 text-muted-foreground shrink-0" />
						<Select value={timeRange} onValueChange={(val) => handleTimeRangeChange(val as TimeRangeFilter)}>
							<SelectTrigger className="w-45">
								<SelectValue placeholder="Select timeframe" />
							</SelectTrigger>

							<SelectContent align="end">
								{TIME_RANGE_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<Button
						onClick={handleExportPDF}
						disabled={isLoading || isExporting}
						className="gap-2 inline-flex items-center"
					>
						{isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
						<span>{isExporting ? "Exporting..." : "Export PDF"}</span>
					</Button>
				</div>
			</div>

			<Separator className="shrink-0" />

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
				<Card className="hover:shadow-md transition-shadow">
					<CardContent className="px-4">
						<div className="flex items-center gap-3">
							<div className="size-11 bg-primary/20 rounded-lg flex items-center justify-center">
								<Users className="size-5.5" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Students Reviewed</p>
								{isLoading ? (
									<Skeleton className="h-6 w-16 mt-1" />
								) : (
									<p className="text-xl font-bold text-foreground">
										{analyticsData.combinedStats.studentsReviewedCount.toLocaleString()}
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-shadow">
					<CardContent className="px-4">
						<div className="flex items-center gap-3">
							<div className="size-11 bg-primary/20 rounded-lg flex items-center justify-center">
								<MapPin className="size-5.5" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address Changes</p>
								{isLoading ? (
									<Skeleton className="h-6 w-12 mt-1" />
								) : (
									<p className="text-xl font-bold text-foreground">
										{analyticsData.combinedStats.addressChangesCount.toLocaleString()}
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-shadow">
					<CardContent className="px-4">
						<div className="flex items-center gap-3">
							<div className="size-11 bg-primary/20 rounded-lg flex items-center justify-center">
								<FileText className="size-5.5" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									Applications Reviewed
								</p>
								{isLoading ? (
									<Skeleton className="h-6 w-14 mt-1" />
								) : (
									<p className="text-xl font-bold text-foreground">
										{analyticsData.combinedStats.applicationsCount.toLocaleString()}
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex-1 min-h-0 overflow-hidden flex flex-col space-y-3">
				<div className="flex items-center justify-between shrink-0">
					<h2 className="text-lg font-semibold text-foreground">Admin Contributions</h2>
				</div>

				<AnalyticsTable
					isError={isError}
					isLoading={isLoading}
					data={analyticsData.data}
					searchQuery={searchQuery}
					onPageChange={handlePageChange}
					onSearchChange={handleSearchChange}
					totalPages={analyticsData.totalPages}
					totalCount={analyticsData.totalCount}
					currentPage={analyticsData.currentPage}
					hasNextPage={analyticsData.hasNextPage}
					hasPreviousPage={analyticsData.hasPreviousPage}
				/>
			</div>
		</div>
	);
};

export default AdminAnalyticsPage;
