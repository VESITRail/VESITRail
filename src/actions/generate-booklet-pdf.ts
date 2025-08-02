"use server";

import { getBookletApplications } from "./booklets";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import prisma from "@/lib/prisma";
import { Result, success, failure, validationError, ValidationError } from "@/lib/result";

// Ensure the plugin is properly attached to jsPDF
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

    // Create PDF with legal paper size in landscape orientation for optimal table fit
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'legal'
    });

    // Get page dimensions for legal size landscape
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;

    // VESIT Rail logo as base64 (simplified version for PDF)
    const logoSVG = `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 512 512">
        <rect width="512" height="512" fill="#0f172a"/>
        <g transform="translate(256, 256) scale(1.9) translate(-110, -42)">
          <path d="M31.421,67.761L36.533,78.717L48.949,78.717C59.175,78.717 68.669,72.852 73.782,63.576C80.355,50.05 87.659,35.552 94.232,22.033C97.153,16.46 102.996,12.947 108.839,12.947L155.582,12.947C157.773,12.947 159.234,13.736 159.964,15.095C159.964,15.095 197.213,61.531 205.977,72.655C206.707,73.093 206.707,73.692 206.707,74.196C205.977,74.707 205.977,75.028 205.247,75.028C192.1,75.028 143.896,75.036 143.896,75.036C137.323,75.036 131.48,71.522 128.559,65.95L122.716,53.65C118.334,44.368 108.839,38.51 98.614,38.51L92.771,49.465L98.614,49.465C104.457,49.465 110.3,52.979 113.221,58.551L119.064,70.851C123.446,80.133 132.941,85.991 143.896,85.991C150.47,85.991 213.281,85.984 213.281,85.984C216.933,85.984 219.854,84.129 221.315,81.222C222.775,78.308 222.045,74.86 219.854,72.333C209.629,58.931 178.954,20.959 168.729,8.251C165.807,4.292 160.695,1.992 155.582,1.992L108.839,1.992C98.614,1.992 89.119,7.849 84.737,17.132C77.434,30.659 70.13,45.149 63.557,58.675C60.635,64.241 55.523,67.761 48.949,67.761L31.421,67.761ZM16.814,38.51L21.926,49.465L56.253,49.465L61.366,38.51L16.814,38.51ZM2.206,9.295L7.319,20.251L70.86,20.251L75.973,9.295L2.206,9.295Z" fill="white"/>
        </g>
      </svg>
    `)}`;

    // Add logo to header (top-left)
    try {
      doc.addImage(logoSVG, 'SVG', 20, 15, 20, 20);
    } catch (error) {
      console.log("Logo could not be added:", error);
    }

    // Modern professional header with logo space consideration
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Central / Western Railway", centerX, 20, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("Vivekanand Education Society's Institute of Technology", centerX, 28, { align: "center" });
    doc.text("Chembur, Mumbai - 400074", centerX, 35, { align: "center" });
    
    // Add a subtle line separator
    doc.setLineWidth(0.5);
    doc.line(20, 43, pageWidth - 20, 43);
    
    // Report metadata section with better spacing for landscape
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Concession Applications Report", 20, 53);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Serial Range: ${booklet.serialStartNumber} - ${booklet.serialEndNumber}`, 20, 61);
    doc.text(`Total Applications: ${applications.length}`, 20, 68);
    doc.text(`Generated: ${format(new Date(), "dd/MM/yyyy 'at' HH:mm")}`, pageWidth - 120, 61);
    doc.text(`Report Date: ${format(new Date(), "EEEE, dd MMMM yyyy")}`, pageWidth - 120, 68);

    const getCurrentPassNo = async (application: any): Promise<string> => {
      if (application.applicationType === "New") {
        return "New";
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
            const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
            const prevOffset = prevApp.pageOffset ?? 0;
            const certificateNum = startNum + prevOffset;
            return `${prefix}${certificateNum.toString().padStart(serialStart.match(/\d+$/)?.[0]?.length || 3, "0")}`;
          }
        } catch (error) {
          console.error("Error fetching previous application:", error);
        }
      }
      
      return "N/A";
    };

    const tableDataPromises = applications.map(async (app, index) => {
      const currentPassNo = await getCurrentPassNo(app);
      const fullName = `${app.student.firstName}${app.student.middleName ? ` ${app.student.middleName}` : ""} ${app.student.lastName}`;
      
      // Improved name splitting logic - only split if name is very long (>20 chars)
      let studentName = fullName;
      if (fullName.length > 20) {
        const nameParts = fullName.split(' ');
        if (nameParts.length > 2) {
          const midPoint = Math.ceil(nameParts.length / 2);
          const firstName = nameParts.slice(0, midPoint).join(' ');
          const lastName = nameParts.slice(midPoint).join(' ');
          studentName = `${firstName}\n${lastName}`;
        }
      }
      
      // Split address into multiple lines if too long
      const address = app.student.address || "";
      const addressLines = address.length > 30 ? 
        address.match(/.{1,30}(\s|$)/g)?.slice(0, 2).join('\n').trim() || address :
        address;

      return [
        index + 1,
        format(new Date(app.createdAt), "dd/MM/yyyy"),
        app.derivedCertificateNo || "",
        studentName,
        currentPassNo,
        app.student.gender || "",
        format(new Date(app.student.dateOfBirth), "dd/MM/yyyy"),
        "Quarterly",
        `${app.station.name}\n(${app.station.code})`,
        addressLines,
      ];
    });

    const tableData = await Promise.all(tableDataPromises);

    // Use autoTable function directly with doc parameter - single header row with optimized column widths
    autoTable(doc, {
      head: [
        [
          "Sr.",
          "Date",
          "Cert. No.",
          "Student Name",
          "Current Pass",
          "Gender",
          "DOB",
          "Period",
          "From",
          "Address",
        ],
      ],
      body: tableData,
      startY: 75,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [220, 220, 220], // Light gray for better B&W printing
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 18 }, // Sr. No
        1: { halign: "center", cellWidth: 25 }, // Date
        2: { halign: "center", cellWidth: 28 }, // Certificate No
        3: { halign: "left", cellWidth: 55 },   // Student Name (increased width)
        4: { halign: "center", cellWidth: 30 }, // Current Pass No
        5: { halign: "center", cellWidth: 20 }, // Gender
        6: { halign: "center", cellWidth: 25 }, // Date of Birth
        7: { halign: "center", cellWidth: 22 }, // Period
        8: { halign: "center", cellWidth: 40 }, // From Station (renamed from "From Station")
        9: { halign: "left", cellWidth: 70 },   // Address (increased width since we removed "To" column)
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Very light gray for alternating rows
      },
      margin: { left: 20, right: 20 },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.2,
      showHead: 'everyPage',
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Add logo to each page (top-left)
      try {
        doc.addImage(logoSVG, 'SVG', 20, 15, 20, 20);
      } catch (error) {
        // Logo addition failed, continue without it
      }
      
      // Add a subtle line above footer
      doc.setLineWidth(0.3);
      doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      // Left side - Generation info
      doc.text(
        `Generated on ${format(new Date(), "dd/MM/yyyy 'at' HH:mm")}`,
        20,
        pageHeight - 10
      );
      
      // Center - Institution name
      doc.text(
        "VESITRail",
        centerX,
        pageHeight - 10,
        { align: "center" }
      );
      
      // Right side - Page info
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 20,
        pageHeight - 10,
        { align: "right" }
      );
    }

    // Get PDF as base64 string for reliable transfer
    const pdfBase64 = doc.output('datauristring');
    return success(pdfBase64);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return failure(validationError("Failed to generate PDF"));
  }
};
