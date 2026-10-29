"use server";

import {
	Result,
	success,
	failure,
	AuthError,
	databaseError,
	DatabaseError,
	ValidationError,
	validationError
} from "@/lib/result";
import {
	formatIstDate,
	calcAgeFromDob,
	formatIstDayMonth,
	formatDateOfBirth,
	formatIstYearShort,
	calculatePassExpiry
} from "@/lib/utils";
import jsPDF from "jspdf";
import prisma from "@/lib/prisma";
import { PDFDocument, degrees } from "pdf-lib";
import { requireAdmin } from "@/lib/auth-guard";
import { deriveCertificateNumber } from "@/lib/booklet-serial";

type FormLayout = {
	left: Record<string, { x: number; y: number }>;
	right: Record<string, { x: number; y: number }>;
};

export const generateOverlayPDF = async (
	applicationId: string
): Promise<Result<Uint8Array, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const application = await prisma.concessionApplication.findUnique({
			where: { id: applicationId },
			include: {
				student: {
					include: {
						user: true,
						station: true,
						class: { include: { year: true, branch: true } }
					}
				},
				station: true,
				concessionClass: true,
				concessionPeriod: true,
				concessionBooklet: true,
				previousApplication: {
					include: {
						concessionClass: true,
						concessionPeriod: true,
						concessionBooklet: true,
						student: {
							include: {
								station: true
							}
						}
					}
				}
			}
		});

		if (!application) return failure(validationError("Application not found"));
		if (!application.concessionBooklet)
			return failure(validationError("Concession booklet not assigned to application"));

		const config = await prisma.appConfig.findUnique({
			where: { key: "form_layout" }
		});
		if (!config) return failure(databaseError("Form layout configuration not found"));

		const now = new Date();
		const student = application.student;
		const layout = config.value as FormLayout;
		const age = calcAgeFromDob(student.dateOfBirth);
		const { anchorX, anchorY } = application.concessionBooklet;

		const eff = (pt?: { x: number; y: number }) => (pt ? { x: anchorX + pt.x, y: anchorY + pt.y } : undefined);

		const doc = new jsPDF({
			unit: "pt",
			format: [842, 666.14],
			orientation: "landscape"
		});

		doc.setFont("times");
		doc.setFontSize(12);

		const writeText = (pt: { x: number; y: number } | undefined, text: string) => {
			if (!pt || !text) return;
			const yOffset = text === "-" ? pt.y - 5 : pt.y;
			doc.text(text, pt.x, yOffset);
		};

		const writeMultilineText = (pt: { x: number; y: number } | undefined, text: string, maxWidth: number = 50) => {
			if (!pt || !text) return;
			const lines = doc.splitTextToSize(text, maxWidth);
			doc.text(lines, pt.x, pt.y);
		};

		writeText(eff(layout.left.gender), String(student.gender));
		const studentFullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
		writeText(eff(layout.left.student_name_left), studentFullName);
		writeText(eff(layout.left.class_left), application.concessionClass.name);
		writeText(eff(layout.left.period_left), application.concessionPeriod.name);
		writeMultilineText(eff(layout.left.from_station_left), student.station.name);
		writeText(eff(layout.left.to_station_left), "Kurla");

		if (application.applicationType === "Renewal" && application.previousApplication?.concessionBooklet) {
			const prevBooklet = application.previousApplication.concessionBooklet;
			const pageOffset = application.previousApplication.pageOffset || 0;
			const certificateNumber = deriveCertificateNumber(prevBooklet.serialStartNumber, pageOffset);

			writeText(eff(layout.left.previous_certificate_number), certificateNumber ?? "-");

			const prevDate = application.previousApplication.issuedAt || application.previousApplication.createdAt;
			const prevEnd = calculatePassExpiry(
				new Date(prevDate),
				application.previousApplication.concessionPeriod?.duration || application.concessionPeriod.duration
			);
			writeText(eff(layout.left.last_season_ticket_held_upto_date), formatIstDayMonth(prevEnd));
			writeText(eff(layout.left.last_season_ticket_held_upto_year), formatIstYearShort(prevEnd));
		} else {
			writeText(eff(layout.left.previous_certificate_number), "-");
			writeText(eff(layout.left.last_season_ticket_held_upto_date), "-");
			writeText(eff(layout.left.last_season_ticket_held_upto_year), "-");
		}

		writeText(eff(layout.left.date_of_issue_left), formatIstDate(application.issuedAt || now));

		writeText(eff(layout.right.student_name_right), studentFullName);
		writeText(eff(layout.right.age_years), String(age.years));
		writeText(eff(layout.right.age_months), String(age.months));
		writeText(eff(layout.right.date_of_birth), formatDateOfBirth(student.dateOfBirth, "dd/MM/yyyy"));
		writeText(eff(layout.right.class_right), application.concessionClass.name);
		writeText(eff(layout.right.period_right), application.concessionPeriod.name);
		writeMultilineText(eff(layout.right.from_station_right), student.station.name);
		writeText(eff(layout.right.to_station_right), "Kurla");

		if (application.applicationType === "Renewal" && application.previousApplication?.concessionBooklet) {
			const prevBooklet = application.previousApplication.concessionBooklet;
			const pageOffset = application.previousApplication.pageOffset || 0;
			const certificateNumber = deriveCertificateNumber(prevBooklet.serialStartNumber, pageOffset);

			writeText(eff(layout.right.current_pass_class), application.previousApplication.concessionClass?.code || "-");
			writeText(eff(layout.right.current_pass_season_ticket_number), certificateNumber ?? "-");

			writeText(
				eff(layout.right.current_pass_from_station),
				application.previousApplication.student?.station?.name || student.station.name
			);
			writeText(eff(layout.right.current_pass_to_station), "Kurla");

			const prevStart = new Date(application.previousApplication.issuedAt || application.previousApplication.createdAt);
			const prevEnd = calculatePassExpiry(
				prevStart,
				application.previousApplication.concessionPeriod?.duration || application.concessionPeriod.duration
			);
			writeText(eff(layout.right.current_pass_validity_from), formatIstDate(prevStart));
			writeText(eff(layout.right.current_pass_validity_to), formatIstDate(prevEnd));
		} else {
			writeText(eff(layout.right.current_pass_class), "-");
			writeText(eff(layout.right.current_pass_season_ticket_number), "-");
			writeText(eff(layout.right.current_pass_from_station), "-");
			writeText(eff(layout.right.current_pass_to_station), "-");
			writeText(eff(layout.right.current_pass_validity_from), "-");
			writeText(eff(layout.right.current_pass_validity_to), "-");
		}
		writeText(eff(layout.right.date_of_issue_right), formatIstDate(application.issuedAt || now));

		const pdfBytes = doc.output("arraybuffer");

		const pdfDoc = await PDFDocument.load(pdfBytes);
		const pages = pdfDoc.getPages();
		const page = pages[0];
		page.setRotation(degrees(90));

		const rotatedPdfBytes = await pdfDoc.save();
		const rotated = new Uint8Array(rotatedPdfBytes);

		return success(rotated);
	} catch (error) {
		console.error("Error generating overlay PDF:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
		return failure(databaseError(`Failed to generate overlay PDF: ${errorMessage}`));
	}
};
