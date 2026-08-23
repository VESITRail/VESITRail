"use server";

import jsPDF from "jspdf";
import prisma from "@/lib/prisma";
import { toTitleCase } from "@/lib/utils";
import { subMonths, subYears } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";
import autoTable, { UserOptions } from "jspdf-autotable";
import { Result, success, failure, databaseError, type DatabaseError } from "@/lib/result";

declare module "jspdf" {
	interface jsPDF {
		autoTable: (options: UserOptions) => jsPDF;
	}
}

export type TimeRangeFilter = "1m" | "3m" | "6m" | "1y" | "all";

export type CombinedAnalyticsStats = {
	totalContribution: number;
	applicationsCount: number;
	addressChangesCount: number;
	studentsReviewedCount: number;
};

export type AdminContributionItem = {
	name: string;
	email: string;
	adminId: string;
	studentsCount: number;
	image?: string | null;
	applicationsCount: number;
	totalContribution: number;
	addressChangesCount: number;
};

export type AnalyticsPaginationParams = {
	page: number;
	pageSize: number;
	searchQuery?: string;
	timeRange: TimeRangeFilter;
};

export type PaginatedAnalyticsResult = {
	totalCount: number;
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	data: AdminContributionItem[];
	combinedStats: CombinedAnalyticsStats;
};

const getStartDateForFilter = (filter: TimeRangeFilter): Date | null => {
	const now = new Date();
	switch (filter) {
		case "1m":
			return subMonths(now, 1);
		case "3m":
			return subMonths(now, 3);
		case "6m":
			return subMonths(now, 6);
		case "1y":
			return subYears(now, 1);
		case "all":
		default:
			return null;
	}
};

const fetchAdminAnalyticsRaw = async (timeRange: TimeRangeFilter, searchQuery?: string) => {
	const startDate = getStartDateForFilter(timeRange);

	const dateFilterClause = startDate
		? {
				OR: [{ reviewedAt: { gte: startDate } }, { reviewedAt: null, updatedAt: { gte: startDate } }]
			}
		: {};

	const [studentGroups, addressChangeGroups, applicationGroups, admins] = await Promise.all([
		prisma.student.groupBy({
			by: ["reviewedById"],
			where: {
				reviewedById: { not: null },
				...dateFilterClause
			},
			_count: { _all: true }
		}),
		prisma.addressChange.groupBy({
			by: ["reviewedById"],
			where: {
				reviewedById: { not: null },
				...dateFilterClause
			},
			_count: { _all: true }
		}),
		prisma.concessionApplication.groupBy({
			by: ["reviewedById"],
			where: {
				reviewedById: { not: null },
				...dateFilterClause
			},
			_count: { _all: true }
		}),
		prisma.admin.findMany({
			select: {
				userId: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true
					}
				}
			}
		})
	]);

	const studentMap = new Map<string, number>();
	for (const item of studentGroups) {
		if (item.reviewedById) {
			studentMap.set(item.reviewedById, item._count._all);
		}
	}

	const addressChangeMap = new Map<string, number>();
	for (const item of addressChangeGroups) {
		if (item.reviewedById) {
			addressChangeMap.set(item.reviewedById, item._count._all);
		}
	}

	const applicationMap = new Map<string, number>();
	for (const item of applicationGroups) {
		if (item.reviewedById) {
			applicationMap.set(item.reviewedById, item._count._all);
		}
	}

	let totalStudentsReviewed = 0;
	for (const count of studentMap.values()) totalStudentsReviewed += count;

	let totalAddressChangesReviewed = 0;
	for (const count of addressChangeMap.values()) totalAddressChangesReviewed += count;

	let totalApplicationsReviewed = 0;
	for (const count of applicationMap.values()) totalApplicationsReviewed += count;

	const combinedStats: CombinedAnalyticsStats = {
		studentsReviewedCount: totalStudentsReviewed,
		applicationsCount: totalApplicationsReviewed,
		addressChangesCount: totalAddressChangesReviewed,
		totalContribution: totalStudentsReviewed + totalAddressChangesReviewed + totalApplicationsReviewed
	};

	const allContributions: AdminContributionItem[] = admins.map((admin) => {
		const studentsCount = studentMap.get(admin.userId) || 0;
		const applicationsCount = applicationMap.get(admin.userId) || 0;
		const addressChangesCount = addressChangeMap.get(admin.userId) || 0;
		const totalContribution = studentsCount + addressChangesCount + applicationsCount;

		return {
			studentsCount,
			applicationsCount,
			totalContribution,
			addressChangesCount,
			adminId: admin.userId,
			name: admin.user.name,
			email: admin.user.email,
			image: admin.user.image
		};
	});

	allContributions.sort((a, b) => {
		if (b.totalContribution !== a.totalContribution) return b.totalContribution - a.totalContribution;
		if (b.studentsCount !== a.studentsCount) return b.studentsCount - a.studentsCount;
		if (b.applicationsCount !== a.applicationsCount) return b.applicationsCount - a.applicationsCount;
		return a.name.localeCompare(b.name);
	});

	let filteredContributions = allContributions;
	if (searchQuery && searchQuery.trim()) {
		const term = searchQuery.trim().toLowerCase();
		filteredContributions = allContributions.filter(
			(item) => item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term)
		);
	}

	return { combinedStats, filteredContributions };
};

export const getAdminAnalytics = async (
	params: AnalyticsPaginationParams
): Promise<Result<PaginatedAnalyticsResult, DatabaseError>> => {
	try {
		const { timeRange, searchQuery, page = 1, pageSize = 10 } = params;
		const { combinedStats, filteredContributions } = await fetchAdminAnalyticsRaw(timeRange, searchQuery);

		const totalCount = filteredContributions.length;
		const totalPages = Math.ceil(totalCount / pageSize) || 1;
		const skip = (page - 1) * pageSize;
		const paginatedData = filteredContributions.slice(skip, skip + pageSize);

		return success({
			totalCount,
			totalPages,
			combinedStats,
			currentPage: page,
			data: paginatedData,
			hasPreviousPage: page > 1,
			hasNextPage: page < totalPages
		});
	} catch (error) {
		console.error("Error while fetching admin analytics:", error);
		return failure(databaseError("Failed to fetch admin analytics"));
	}
};

export type ExportAnalyticsPDFParams = {
	searchQuery?: string;
	timeRange: TimeRangeFilter;
};

export const generateAdminAnalyticsPDF = async (
	params: ExportAnalyticsPDFParams
): Promise<Result<string, DatabaseError>> => {
	try {
		const { timeRange, searchQuery } = params;
		const { combinedStats, filteredContributions } = await fetchAdminAnalyticsRaw(timeRange, searchQuery);

		const TIME_RANGE_LABELS: Record<TimeRangeFilter, string> = {
			all: "All Time",
			"1m": "Last 1 Month",
			"3m": "Last 3 Months",
			"6m": "Last 6 Months",
			"1y": "Last 1 Year"
		};

		const doc = new jsPDF({
			unit: "mm",
			format: "a4",
			orientation: "portrait"
		});

		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const centerX = pageWidth / 2;
		const margin = 14;
		const contentWidth = pageWidth - margin * 2;

		doc.setFont("helvetica", "bold");
		doc.setFontSize(13);
		doc.setTextColor(0, 0, 0);
		doc.text("Vivekanand Education Society's Institute of Technology", centerX, 14, { align: "center" });

		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		doc.setTextColor(0, 0, 0);
		doc.text("VESITRail - Railway Concession Management System", centerX, 21.5, { align: "center" });

		doc.setFont("helvetica", "bold");
		doc.setFontSize(11);
		doc.setTextColor(0, 0, 0);
		doc.text("ADMIN CONTRIBUTIONS & ANALYTICS REPORT", centerX, 29, { align: "center" });

		doc.setDrawColor(0, 0, 0);
		doc.setLineWidth(1.0);
		doc.line(margin, 34, pageWidth - margin, 34);
		doc.setLineWidth(0.3);
		doc.line(margin, 35.2, pageWidth - margin, 35.2);

		const nowIst = toZonedTime(new Date(), "Asia/Kolkata");
		const dateStr = format(nowIst, "dd/MM/yyyy HH:mm", { timeZone: "Asia/Kolkata" });

		doc.setFillColor(245, 245, 245);
		doc.setDrawColor(0, 0, 0);
		doc.setLineWidth(0.3);
		doc.roundedRect(margin, 39, contentWidth, 11, 1, 1, "FD");

		doc.setFont("helvetica", "bold");
		doc.setFontSize(8.5);
		doc.setTextColor(0, 0, 0);

		doc.text("Timeframe Filter:", margin + 4, 46);
		doc.setFont("helvetica", "normal");
		doc.text(TIME_RANGE_LABELS[timeRange], margin + 30, 46);

		doc.setFont("helvetica", "bold");
		doc.text("Search Filter:", margin + 65, 46);
		doc.setFont("helvetica", "normal");
		doc.text(searchQuery && searchQuery.trim() ? `"${searchQuery.trim()}"` : "All Admins", margin + 87, 46);

		doc.setFont("helvetica", "bold");
		doc.text("Total Admins Listed:", margin + 135, 46);
		doc.setFont("helvetica", "normal");
		doc.text(`${filteredContributions.length}`, margin + 167, 46);

		const cardY = 53;
		const cardHeight = 15;
		const gap = 3;
		const cardWidth = (contentWidth - gap * 3) / 4;

		const kpis = [
			{ label: "STUDENTS REVIEWED", value: combinedStats.studentsReviewedCount.toLocaleString() },
			{ label: "ADDRESS CHANGES", value: combinedStats.addressChangesCount.toLocaleString() },
			{ label: "APPLICATIONS REVIEWED", value: combinedStats.applicationsCount.toLocaleString() },
			{ label: "TOTAL CONTRIBUTION", value: combinedStats.totalContribution.toLocaleString() }
		];

		kpis.forEach((kpi, idx) => {
			const x = margin + idx * (cardWidth + gap);
			doc.setFillColor(255, 255, 255);
			doc.setDrawColor(0, 0, 0);
			doc.setLineWidth(0.3);
			doc.roundedRect(x, cardY, cardWidth, cardHeight, 1, 1, "FD");

			doc.setFont("helvetica", "bold");
			doc.setFontSize(6.5);
			doc.setTextColor(0, 0, 0);
			doc.text(kpi.label, x + cardWidth / 2, cardY + 5, { align: "center" });

			doc.setFont("helvetica", "bold");
			doc.setFontSize(11);
			doc.setTextColor(0, 0, 0);
			doc.text(kpi.value, x + cardWidth / 2, cardY + 11.5, { align: "center" });
		});

		const tableData = filteredContributions.map((item, index) => [
			(index + 1).toString(),
			`${toTitleCase(item.name)}\n${item.email}`,
			item.studentsCount.toLocaleString(),
			item.addressChangesCount.toLocaleString(),
			item.applicationsCount.toLocaleString(),
			item.totalContribution.toLocaleString()
		]);

		autoTable(doc, {
			head: [
				["Sr. No.", "Admin", "Students Reviewed", "Address Changes", "Applications Reviewed", "Total Contribution"]
			],
			startY: 72,
			body: tableData,
			headStyles: {
				fontSize: 8.5,
				halign: "center",
				valign: "middle",
				fontStyle: "bold",
				textColor: [0, 0, 0],
				fillColor: [220, 220, 220],
				cellPadding: { top: 3, right: 2, bottom: 3, left: 2 }
			},
			alternateRowStyles: {
				fillColor: [245, 245, 245]
			},
			bodyStyles: {
				fontSize: 8,
				valign: "middle",
				textColor: [0, 0, 0],
				fillColor: [255, 255, 255],
				cellPadding: { top: 3, right: 2, bottom: 3, left: 2 }
			},
			styles: {
				lineWidth: 0.3,
				lineColor: [0, 0, 0]
			},
			columnStyles: {
				0: { halign: "center", cellWidth: 16 },
				1: { halign: "center", cellWidth: 62 },
				2: { halign: "center", cellWidth: 26 },
				3: { halign: "center", cellWidth: 24 },
				4: { halign: "center", cellWidth: 28 },
				5: { halign: "center", fontStyle: "bold", cellWidth: 26 }
			},
			tableLineWidth: 0.3,
			showHead: "everyPage",
			tableLineColor: [0, 0, 0],
			margin: { left: margin, right: margin, bottom: 22 },
			didDrawPage: (d) => {
				const pageNumber = d.pageNumber;
				const totalPages = doc.getNumberOfPages();
				const footerY = pageHeight - 15;

				doc.setDrawColor(0, 0, 0);
				doc.setLineWidth(0.8);
				doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);

				doc.setFont("helvetica", "normal");
				doc.setFontSize(8);
				doc.setTextColor(0, 0, 0);

				doc.text(`Generated: ${dateStr}`, margin, footerY);

				doc.setFont("helvetica", "bold");
				doc.text("VESITRail - Railway Concession Management System", centerX, footerY, { align: "center" });

				doc.setFont("helvetica", "normal");
				doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });

				doc.setFontSize(6.5);
				doc.text("CONFIDENTIAL - For Official Use Only", centerX, footerY + 5, { align: "center" });
			}
		});

		const pdfBytes = doc.output("arraybuffer");
		const base64 = Buffer.from(pdfBytes).toString("base64");
		const dataUri = `data:application/pdf;base64,${base64}`;

		return success(dataUri);
	} catch (error) {
		console.error("Error generating admin analytics PDF:", error);
		return failure(databaseError("Failed to generate PDF report"));
	}
};
