"use server";

import {
  Result,
  success,
  failure,
  authError,
  AuthError,
  databaseError,
  DatabaseError,
  ValidationError,
  validationError,
} from "@/lib/result";
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

export const generateOverlayPDF = async (
  applicationId: string
): Promise<Result<Uint8Array, AuthError | DatabaseError | ValidationError>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return failure(authError("Authentication required", "UNAUTHORIZED"));
    }

    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) {
      return failure(authError("Admin access required", "FORBIDDEN"));
    }
    const application = await prisma.concessionApplication.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          include: {
            user: true,
            station: true,
            class: { include: { year: true, branch: true } },
          },
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
                station: true,
              },
            },
          },
        },
      },
    });

    if (!application) return failure(validationError("Application not found"));
    if (!application.concessionBooklet)
      return failure(
        validationError("Concession booklet not assigned to application")
      );

    const config = await prisma.appConfig.findUnique({
      where: { key: "form_layout" },
    });
    if (!config)
      return failure(databaseError("Form layout configuration not found"));

    const now = new Date();
    const student = application.student;
    const age = calcAge(student.dateOfBirth);
    const layout = config.value as FormLayout;
    const { anchorX, anchorY } = application.concessionBooklet;

    const eff = (pt?: { x: number; y: number }) =>
      pt ? { x: anchorX + pt.x, y: anchorY + pt.y } : undefined;

    const doc = new jsPDF({
      unit: "pt",
      format: [842, 666.14],
      orientation: "landscape",
    });

    doc.setFont("times");
    doc.setFontSize(12);

    const writeText = (
      pt: { x: number; y: number } | undefined,
      text: string
    ) => {
      if (!pt || !text) return;
      doc.text(text, pt.x, pt.y);
    };

    const writeMultilineText = (
      pt: { x: number; y: number } | undefined,
      text: string,
      maxWidth: number = 150
    ) => {
      if (!pt || !text) return;
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, pt.x, pt.y);
    };

    writeText(eff(layout.left.gender), String(student.gender));
    writeText(
      eff(layout.left.student_name_left),
      `${student.firstName} ${student.middleName} ${student.lastName}`.trim()
    );
    writeText(eff(layout.left.class_left), application.concessionClass.name);
    writeText(eff(layout.left.period_left), application.concessionPeriod.name);
    writeMultilineText(
      eff(layout.left.from_station_left),
      student.station.name
    );
    writeMultilineText(eff(layout.left.to_station_left), "Kurla");

    if (
      application.applicationType === "Renewal" &&
      application.previousApplication?.concessionBooklet
    ) {
      const prevBooklet = application.previousApplication.concessionBooklet;
      const pageOffset = application.previousApplication.pageOffset || 0;
      const serialStartParts =
        prevBooklet.serialStartNumber.match(/^([A-Z]+)(\d+)$/);

      if (serialStartParts) {
        const prefix = serialStartParts[1];
        const startNum = parseInt(serialStartParts[2], 10);
        const effectiveCertNumber = startNum + pageOffset;
        const certificateNumber = `${prefix}${effectiveCertNumber
          .toString()
          .padStart(serialStartParts[2].length, "0")}`;
        writeText(
          eff(layout.left.previous_certificate_number),
          certificateNumber
        );
      } else {
        writeText(eff(layout.left.previous_certificate_number), "-");
      }

      const prevEnd = addMonths(
        new Date(application.previousApplication.createdAt),
        application.concessionPeriod.duration
      );
      writeText(
        eff(layout.left.last_season_ticket_held_upto_date),
        formatDate(prevEnd)
      );
      writeText(
        eff(layout.left.last_season_ticket_held_upto_year),
        String(prevEnd.getFullYear())
      );
    } else {
      writeText(eff(layout.left.previous_certificate_number), "-");
      writeText(eff(layout.left.last_season_ticket_held_upto_date), "-");
      writeText(eff(layout.left.last_season_ticket_held_upto_year), "-");
    }

    writeText(eff(layout.left.date_of_issue_left), formatDate(now));

    writeText(
      eff(layout.right.student_name_right),
      `${student.firstName} ${student.middleName} ${student.lastName}`.trim()
    );
    writeText(eff(layout.right.age_years), String(age.years));
    writeText(eff(layout.right.age_months), String(age.months));
    writeText(eff(layout.right.date_of_birth), formatDate(student.dateOfBirth));
    writeText(eff(layout.right.class_right), application.concessionClass.name);
    writeText(
      eff(layout.right.period_right),
      application.concessionPeriod.name
    );
    writeMultilineText(
      eff(layout.right.from_station_right),
      student.station.name
    );
    writeMultilineText(eff(layout.right.to_station_right), "Kurla");

    if (
      application.applicationType === "Renewal" &&
      application.previousApplication?.concessionBooklet
    ) {
      const prevBooklet = application.previousApplication.concessionBooklet;
      const pageOffset = application.previousApplication.pageOffset || 0;
      const serialStartParts =
        prevBooklet.serialStartNumber.match(/^([A-Z]+)(\d+)$/);

      writeText(
        eff(layout.right.current_pass_class),
        application.previousApplication.concessionClass?.name || "-"
      );

      if (serialStartParts) {
        const prefix = serialStartParts[1];
        const startNum = parseInt(serialStartParts[2], 10);
        const effectiveCertNumber = startNum + pageOffset;
        const certificateNumber = `${prefix}${effectiveCertNumber
          .toString()
          .padStart(serialStartParts[2].length, "0")}`;
        writeText(
          eff(layout.right.current_pass_season_ticket_number),
          certificateNumber
        );
      } else {
        writeText(eff(layout.right.current_pass_season_ticket_number), "-");
      }

      writeMultilineText(
        eff(layout.right.current_pass_from_station),
        application.previousApplication.student?.station?.name ||
          student.station.name
      );
      writeMultilineText(eff(layout.right.current_pass_to_station), "Kurla");

      const prevStart = new Date(application.previousApplication.createdAt);
      const prevEnd = addMonths(
        prevStart,
        application.previousApplication.concessionPeriod?.duration ||
          application.concessionPeriod.duration
      );
      writeText(
        eff(layout.right.current_pass_validity_from),
        formatDate(prevStart)
      );
      writeText(
        eff(layout.right.current_pass_validity_to),
        formatDate(prevEnd)
      );
    } else {
      writeText(eff(layout.right.current_pass_class), "-");
      writeText(eff(layout.right.current_pass_season_ticket_number), "-");
      writeText(eff(layout.right.current_pass_from_station), "-");
      writeText(eff(layout.right.current_pass_to_station), "-");
      writeText(eff(layout.right.current_pass_validity_from), "-");
      writeText(eff(layout.right.current_pass_validity_to), "-");
    }
    writeText(eff(layout.right.date_of_issue_right), formatDate(now));

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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return failure(
      databaseError(`Failed to generate overlay PDF: ${errorMessage}`)
    );
  }
};
