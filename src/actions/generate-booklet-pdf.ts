"use server";

import {
  Result,
  success,
  failure,
  validationError,
  ValidationError,
} from "@/lib/result";
import jsPDF from "jspdf";
import prisma from "@/lib/prisma";
import { PDFDocument, degrees } from "pdf-lib";
import { format, toZonedTime } from "date-fns-tz";
import autoTable, { UserOptions } from "jspdf-autotable";
import { getBookletApplications, BookletApplicationItem } from "./booklets";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

export const generateBookletPDF = async (
  bookletId: string
): Promise<Result<string, ValidationError>> => {
  try {
    const result = await getBookletApplications(bookletId, {
      page: 1,
      pageSize: 1000,
    });

    if (!result.isSuccess) {
      return failure(validationError("Failed to fetch applications"));
    }

    const { data: applications, booklet } = result.data;

    if (applications.length === 0) {
      return failure(validationError("No applications found for this booklet"));
    }

    const doc = new jsPDF({
      unit: "mm",
      format: "legal",
      orientation: "landscape",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CENTRAL / WESTERN RAILWAY", centerX, 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(
      "Vivekanand Education Society's Institute of Technology",
      centerX,
      26,
      { align: "center" }
    );

    doc.text("Chembur, Mumbai - 400074", centerX, 32, { align: "center" });

    doc.setLineWidth(1.2);
    doc.line(15, 40, pageWidth - 15, 40);
    doc.setLineWidth(0.3);
    doc.line(15, 41.5, pageWidth - 15, 41.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CONCESSION APPLICATIONS REPORT", centerX, 52, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Route: Origin Station -> Kurla (CLA)", centerX, 60, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("REPORT DETAILS", 15, 72);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`Total Applications: ${applications.length}`, 15, 80);
    doc.text(
      `Serial Range: ${booklet.serialStartNumber} - ${booklet.serialEndNumber}`,
      15,
      87
    );

    const newApplicationsCount = applications.filter(
      (app) => app.applicationType === "New"
    ).length;
    const renewalCount = applications.length - newApplicationsCount;
    doc.text(
      `New: ${newApplicationsCount} | Renewal: ${renewalCount}`,
      pageWidth - 15,
      80,
      { align: "right" }
    );

    const istTime = toZonedTime(new Date(), "Asia/Kolkata");
    doc.text(
      `Generated: ${format(istTime, "dd/MM/yyyy 'at' HH:mm", {
        timeZone: "Asia/Kolkata",
      })}`,
      pageWidth - 15,
      87,
      { align: "right" }
    );

    doc.setLineWidth(0.5);
    doc.line(15, 93, pageWidth - 15, 93);

    const getCurrentPassNo = async (
      application: BookletApplicationItem
    ): Promise<string> => {
      if (application.applicationType === "New") {
        return "New Application";
      }

      if (application.previousApplication?.id) {
        try {
          const prevApp = await prisma.concessionApplication.findUnique({
            where: { id: application.previousApplication.id },
            include: {
              concessionBooklet: {
                select: {
                  serialStartNumber: true,
                },
              },
            },
          });

          if (prevApp?.concessionBooklet) {
            const serialStart = prevApp.concessionBooklet.serialStartNumber;
            const prefix = serialStart.replace(/\d+$/, "");
            const startNum = parseInt(
              serialStart.match(/\d+$/)?.[0] || "0",
              10
            );
            const prevOffset = prevApp.pageOffset ?? 0;
            const certificateNum = startNum + prevOffset;
            return `${prefix}${certificateNum
              .toString()
              .padStart(serialStart.match(/\d+$/)?.[0]?.length || 3, "0")}`;
          }
        } catch (error) {
          console.error("Error fetching previous application:", error);
        }
      }

      return "Not Available";
    };

    const tableDataPromises = applications.map(async (app, index) => {
      const currentPassNo = await getCurrentPassNo(app);

      const fullName = `${app.student.firstName}${
        app.student.middleName ? ` ${app.student.middleName}` : ""
      } ${app.student.lastName}`;

      const fullAddress = app.student.address || "Address not provided";

      return [
        index + 1,
        format(new Date(app.createdAt), "dd/MM/yyyy"),
        app.derivedCertificateNo || "Pending",
        fullName,
        currentPassNo,
        app.student.gender || "N/A",
        format(new Date(app.student.dateOfBirth), "dd/MM/yyyy"),
        app.concessionPeriod.name || "N/A",
        `${app.station.name} (${app.station.code})`,
        fullAddress,
      ];
    });

    const tableData = await Promise.all(tableDataPromises);

    autoTable(doc, {
      head: [
        [
          "Sr. No.",
          "Application Date",
          "Certificate No.",
          "Student Name",
          "Previous Pass No.",
          "Gender",
          "Date of Birth",
          "Pass Type",
          "Origin Station",
          "Residential Address",
        ],
      ],
      startY: 99,
      body: tableData,
      styles: {
        fontSize: 8.5,
        valign: "top",
        lineWidth: 0.3,
        minCellHeight: 12,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        overflow: "linebreak",
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
        halign: "center",
      },
      headStyles: {
        fontSize: 9,
        halign: "center",
        valign: "middle",
        fontStyle: "bold",
        fillColor: [60, 60, 60],
        textColor: [255, 255, 255],
        cellPadding: { top: 5, right: 3, bottom: 5, left: 3 },
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { halign: "center", cellWidth: 25 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "left", cellWidth: 60 },
        4: { halign: "center", cellWidth: 30 },
        5: { halign: "center", cellWidth: 15 },
        6: { halign: "center", cellWidth: 22 },
        7: { halign: "center", cellWidth: 25 },
        8: { halign: "center", cellWidth: 40 },
        9: { halign: "left", overflow: "linebreak" },
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      tableLineWidth: 0.3,
      showHead: "everyPage",
      rowPageBreak: "avoid",
      tableLineColor: [0, 0, 0],
      margin: { left: 15, right: 15, bottom: 30 },
      tableWidth: "auto",
      didDrawPage: (data) => {
        const pageNumber = data.pageNumber;
        const totalPages = doc.getNumberOfPages();

        const footerY = pageHeight - 15;

        doc.setLineWidth(0.8);
        doc.line(15, footerY - 8, pageWidth - 15, footerY - 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        const footerIstTime = toZonedTime(new Date(), "Asia/Kolkata");
        doc.text(
          `Generated: ${format(footerIstTime, "dd/MM/yyyy HH:mm", {
            timeZone: "Asia/Kolkata",
          })}`,
          15,
          footerY
        );

        doc.setFont("helvetica", "bold");
        doc.text(
          "VESITRail - Railway Concession Management System",
          centerX,
          footerY,
          { align: "center" }
        );

        doc.setFont("helvetica", "normal");
        doc.text(
          `Page ${pageNumber} of ${totalPages}`,
          pageWidth - 15,
          footerY,
          {
            align: "right",
          }
        );

        doc.setFontSize(6);
        doc.text("CONFIDENTIAL - For Official Use Only", centerX, footerY + 5, {
          align: "center",
        });
      },
    });

    const pdfBytes = doc.output("arraybuffer");
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    pages.forEach((page, index) => {
      if ((index + 1) % 2 === 1) {
        page.setRotation(degrees(90));
      } else {
        page.setRotation(degrees(270));
      }
    });

    const modifiedPdfBytes = await pdfDoc.save();
    const pdfBase64 = `data:application/pdf;base64,${Buffer.from(
      modifiedPdfBytes
    ).toString("base64")}`;

    return success(pdfBase64);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return failure(validationError("Failed to generate PDF"));
  }
};
