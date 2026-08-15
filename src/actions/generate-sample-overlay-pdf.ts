"use server";

import { Result, success, failure, authError, AuthError, databaseError, DatabaseError } from "@/lib/result";
import jsPDF from "jspdf";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PDFDocument, degrees } from "pdf-lib";

type FormLayout = {
	left: Record<string, { x: number; y: number }>;
	right: Record<string, { x: number; y: number }>;
};

const formatDate = (date: Date) => {
	const d = new Date(date);
	const day = d.getDate().toString().padStart(2, "0");
	const month = (d.getMonth() + 1).toString().padStart(2, "0");
	const year = d.getFullYear();
	return `${day}/${month}/${year}`;
};

const formatDateMonthOnly = (date: Date) => {
	const d = new Date(date);
	const day = d.getDate().toString().padStart(2, "0");
	const month = (d.getMonth() + 1).toString().padStart(2, "0");
	return `${day}/${month}/`;
};

const formatYearLastTwoDigits = (date: Date) => {
	const d = new Date(date);
	const year = d.getFullYear();
	return String(year).slice(-2);
};

const addMonths = (date: Date, months: number) => {
	const d = new Date(date);
	const originalDay = d.getDate();
	d.setMonth(d.getMonth() + months);
	if (d.getDate() !== originalDay) d.setDate(0);
	return d;
};

const calcAge = (dob: Date) => {
	const today = new Date();
	const birth = new Date(dob);
	let years = today.getFullYear() - birth.getFullYear();
	let months = today.getMonth() - birth.getMonth();
	if (today.getDate() < birth.getDate()) months--;
	if (months < 0) {
		years--;
		months += 12;
	}
	return { years, months };
};

const SAMPLE_DATA = {
	gender: "Male",
	classCode: "II",
	periodDuration: 3,
	toStation: "Kurla",
	lastName: "Sharma",
	firstName: "Rajesh",
	middleName: "Kumar",
	className: "Second",
	stationName: "Thane",
	periodName: "Quarterly",
	dateOfBirth: new Date(2003, 2, 15),
	previousCertificateNumber: "A0807550",
	previousApplicationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
	address: "B-204, Hiranandani Estate, Ghodbunder Road, Thane West, Thane 400607"
};

export const generateSampleOverlayPDF = async (
	anchorX: number,
	anchorY: number
): Promise<Result<string, AuthError | DatabaseError>> => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		});

		if (!session?.user?.id) {
			return failure(authError("Authentication required", "UNAUTHORIZED"));
		}

		const admin = await prisma.admin.findUnique({
			where: { userId: session.user.id }
		});

		if (!admin) {
			return failure(authError("Admin access required", "FORBIDDEN"));
		}

		const config = await prisma.appConfig.findUnique({
			where: { key: "form_layout" }
		});
		if (!config) return failure(databaseError("Form layout configuration not found"));

		const now = new Date();
		const layout = config.value as FormLayout;
		const age = calcAge(SAMPLE_DATA.dateOfBirth);

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

		const fullName = `${SAMPLE_DATA.firstName} ${SAMPLE_DATA.middleName} ${SAMPLE_DATA.lastName}`;

		writeText(eff(layout.left.gender), SAMPLE_DATA.gender);
		writeText(eff(layout.left.student_name_left), fullName);
		writeText(eff(layout.left.class_left), SAMPLE_DATA.className);
		writeText(eff(layout.left.period_left), SAMPLE_DATA.periodName);
		writeMultilineText(eff(layout.left.from_station_left), SAMPLE_DATA.stationName);
		writeText(eff(layout.left.to_station_left), SAMPLE_DATA.toStation);

		writeText(eff(layout.left.previous_certificate_number), SAMPLE_DATA.previousCertificateNumber);

		const prevEnd = addMonths(SAMPLE_DATA.previousApplicationDate, SAMPLE_DATA.periodDuration);
		writeText(eff(layout.left.last_season_ticket_held_upto_date), formatDateMonthOnly(prevEnd));
		writeText(eff(layout.left.last_season_ticket_held_upto_year), formatYearLastTwoDigits(prevEnd));

		writeText(eff(layout.left.date_of_issue_left), formatDate(now));

		writeText(eff(layout.right.student_name_right), fullName);
		writeText(eff(layout.right.age_years), String(age.years));
		writeText(eff(layout.right.age_months), String(age.months));
		writeText(eff(layout.right.date_of_birth), formatDate(SAMPLE_DATA.dateOfBirth));
		writeText(eff(layout.right.class_right), SAMPLE_DATA.className);
		writeText(eff(layout.right.period_right), SAMPLE_DATA.periodName);
		writeMultilineText(eff(layout.right.from_station_right), SAMPLE_DATA.stationName);
		writeText(eff(layout.right.to_station_right), SAMPLE_DATA.toStation);

		writeText(eff(layout.right.current_pass_class), SAMPLE_DATA.classCode);
		writeText(eff(layout.right.current_pass_season_ticket_number), SAMPLE_DATA.previousCertificateNumber);
		writeText(eff(layout.right.current_pass_from_station), SAMPLE_DATA.stationName);
		writeText(eff(layout.right.current_pass_to_station), SAMPLE_DATA.toStation);

		const prevStart = SAMPLE_DATA.previousApplicationDate;
		const prevEndDate = addMonths(prevStart, SAMPLE_DATA.periodDuration);
		writeText(eff(layout.right.current_pass_validity_from), formatDate(prevStart));
		writeText(eff(layout.right.current_pass_validity_to), formatDate(prevEndDate));

		writeText(eff(layout.right.date_of_issue_right), formatDate(now));

		const pdfBytes = doc.output("arraybuffer");

		const pdfDoc = await PDFDocument.load(pdfBytes);
		const pages = pdfDoc.getPages();
		const page = pages[0];
		page.setRotation(degrees(90));

		const rotatedPdfBytes = await pdfDoc.save();
		const pdfBase64 = `data:application/pdf;base64,${Buffer.from(rotatedPdfBytes).toString("base64")}`;

		return success(pdfBase64);
	} catch (error) {
		console.error("Error generating sample overlay PDF:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
		return failure(databaseError(`Failed to generate sample overlay PDF: ${errorMessage}`));
	}
};
