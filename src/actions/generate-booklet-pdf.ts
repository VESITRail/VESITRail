"use server";

import {
  Result,
  success,
  failure,
  validationError,
  ValidationError,
} from "@/lib/result";
import jsPDF from "jspdf";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import autoTable from "jspdf-autotable";
import { getBookletApplications } from "./booklets";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("REPORT DETAILS", 15, 64);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`Total Applications: ${applications.length}`, 15, 72);
    doc.text(
      `Serial Range: ${booklet.serialStartNumber} - ${booklet.serialEndNumber}`,
      15,
      79
    );

    const newApplicationsCount = applications.filter(
      (app) => app.applicationType === "New"
    ).length;
    const renewalCount = applications.length - newApplicationsCount;
    doc.text(
      `New: ${newApplicationsCount} | Renewal: ${renewalCount}`,
      pageWidth - 15,
      72,
      { align: "right" }
    );

    doc.text(
      `Generated: ${format(new Date(), "dd/MM/yyyy 'at' HH:mm")}`,
      pageWidth - 15,
      79,
      { align: "right" }
    );

    doc.setLineWidth(0.5);
    doc.line(15, 85, pageWidth - 15, 85);

    const getCurrentPassNo = async (application: any): Promise<string> => {
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
          "Home Station",
          "Residential Address",
        ],
      ],
      startY: 91,
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
        3: { halign: "left", cellWidth: 65 },
        4: { halign: "center", cellWidth: 35 },
        5: { halign: "center", cellWidth: 18 },
        6: { halign: "center", cellWidth: 25 },
        7: { halign: "center", cellWidth: 28 },
        8: { halign: "center", cellWidth: 45 },
        9: { halign: "left", cellWidth: "auto" },
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      tableLineWidth: 0.3,
      showHead: "everyPage",
      rowPageBreak: "avoid",
      tableLineColor: [0, 0, 0],
      margin: { left: 15, right: 15 },
    });

    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      const footerY = pageHeight - 15;

      doc.setLineWidth(0.8);
      doc.line(15, footerY - 8, pageWidth - 15, footerY - 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.text(
        `Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
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
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, footerY, {
        align: "right",
      });

      doc.setFontSize(6);
      doc.text("CONFIDENTIAL - For Official Use Only", centerX, footerY + 5, {
        align: "center",
      });
    }

    const pdfBase64 = doc.output("datauristring");
    return success(pdfBase64);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return failure(validationError("Failed to generate PDF"));
  }
};
