"use server";

import {
  Result,
  success,
  failure,
  validationError,
  ValidationError,
} from "@/lib/result";
import {
  DamagedPageItem,
  BookletTableItem,
  getBookletApplications,
  BookletApplicationItem,
} from "./booklets";
import jsPDF from "jspdf";
import prisma from "@/lib/prisma";
import { PDFDocument, degrees } from "pdf-lib";
import { format, toZonedTime } from "date-fns-tz";
import autoTable, { UserOptions } from "jspdf-autotable";

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

    const { data: allItems, booklet } = result.data;

    if (allItems.length === 0) {
      return failure(validationError("No applications found for this booklet"));
    }

    const isDamagedPage = (item: BookletTableItem): item is DamagedPageItem => {
      return "isDamaged" in item && item.isDamaged === true;
    };

    const applications = allItems.filter(
      (item): item is BookletApplicationItem => !isDamagedPage(item)
    );
    const damagedPages = allItems.filter((item): item is DamagedPageItem =>
      isDamagedPage(item)
    );

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

    doc.text(
      "Hashu Adwani Memorial Complex, Collector's Colony, Chembur, Mumbai, Maharashtra 400071",
      centerX,
      32,
      { align: "center" }
    );

    doc.setLineWidth(1.2);
    doc.line(15, 40, pageWidth - 15, 40);
    doc.setLineWidth(0.3);
    doc.line(15, 41.5, pageWidth - 15, 41.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("REPORT DETAILS", 15, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`Total Applications: ${applications.length}`, 15, 60);
    doc.text(
      `Serial Range: ${booklet.serialStartNumber} - ${booklet.serialEndNumber}`,
      15,
      67
    );

    const istTime = toZonedTime(new Date(), "Asia/Kolkata");
    doc.text(
      `Generated: ${format(istTime, "dd/MM/yyyy 'at' HH:mm", {
        timeZone: "Asia/Kolkata",
      })}`,
      pageWidth - 15,
      60,
      { align: "right" }
    );

    const newApplicationsCount = applications.filter(
      (app) => app.applicationType === "New"
    ).length;
    const renewalCount = applications.length - newApplicationsCount;
    doc.text(
      `New: ${newApplicationsCount} | Renewal: ${renewalCount} | Cancelled: ${damagedPages.length}`,
      pageWidth - 15,
      67,
      { align: "right" }
    );

    doc.setLineWidth(0.5);
    doc.line(15, 73, pageWidth - 15, 73);

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

    const tableDataPromises = allItems.map(async (item) => {
      if (isDamagedPage(item)) {
        const match = item.serialNumber.match(/\d+$/);
        const certNumber = match ? parseInt(match[0], 10) : 0;
        const serialNo = ((certNumber - 1) % 50) + 1;

        return [
          serialNo,
          item.serialNumber,
          {
            colSpan: 9,
            content: "Cancelled",
            styles: { halign: "center" as const, fontStyle: "bold" as const },
          },
        ];
      } else {
        const currentPassNo = await getCurrentPassNo(item);
        const certificateNo = item.derivedCertificateNo || "Pending";
        const match = certificateNo.match(/\d+$/);
        const certNumber = match ? parseInt(match[0], 10) : 0;
        const serialNo = ((certNumber - 1) % 50) + 1;

        const fullName = `${item.student.firstName}${
          item.student.middleName ? ` ${item.student.middleName}` : ""
        } ${item.student.lastName}`;

        const fullAddress = item.student.address || "Address not provided";

        return [
          serialNo,
          certificateNo,
          format(new Date(item.createdAt), "dd/MM/yyyy"),
          fullName,
          currentPassNo,
          item.student.gender || "N/A",
          format(new Date(item.student.dateOfBirth), "dd/MM/yyyy"),
          item.concessionPeriod.name || "N/A",
          `${item.station.name} (${item.station.code})`,
          "Kurla (C)",
          fullAddress,
        ];
      }
    });

    const tableData = await Promise.all(tableDataPromises);
    tableData.sort((a, b) => Number(a[0]) - Number(b[0]));

    autoTable(doc, {
      head: [
        [
          "Sr. No.",
          "Certificate",
          "Date",
          "Student Name",
          "Current Pass",
          "Gender",
          "Date of Birth",
          "Period",
          "From Station",
          "To Station",
          "Address",
        ],
      ],
      startY: 79,
      body: tableData,
      headStyles: {
        fontSize: 9,
        halign: "center",
        valign: "middle",
        fontStyle: "bold",
        textColor: [0, 0, 0],
        fillColor: [220, 220, 220],
        cellPadding: { top: 5, right: 3, bottom: 5, left: 3 },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      styles: {
        fontSize: 8.5,
        valign: "top",
        lineWidth: 0.3,
        halign: "center",
        minCellHeight: 12,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        overflow: "linebreak",
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { halign: "center", cellWidth: 23 },
        2: { halign: "center", cellWidth: 23 },
        3: { halign: "left", cellWidth: 52 },
        4: { halign: "center", cellWidth: 28 },
        5: { halign: "center", cellWidth: 20 },
        6: { halign: "center", cellWidth: 22 },
        7: { halign: "center", cellWidth: 23 },
        8: { halign: "center", cellWidth: 30 },
        9: { halign: "center", cellWidth: 30 },
        10: { halign: "left", overflow: "linebreak" },
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
