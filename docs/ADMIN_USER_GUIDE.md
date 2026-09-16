# Admin User Guide

**Purpose:** An operational manual for college administrative staff to review student registrations, process railway concession applications, issue concession vouchers, manage booklet inventories, calibrate printing, and analyze administrative throughput.  
**Last Updated:** September 2026  
**Document Version:** v1.1

---

## Table of Contents

- [About This Document](#about-this-document)
- [About VESITRail](#about-vesitrail)
- [Getting Started as an Administrator](#getting-started-as-an-administrator)
  - [How to Access the Administrator Dashboard](#how-to-access-the-administrator-dashboard)
- [Reviewing and Approving Student Registrations](#reviewing-and-approving-student-registrations)
  - [How to Review a Pending Student Registration](#how-to-review-a-pending-student-registration)
  - [How to Reject a Student Registration](#how-to-reject-a-student-registration)
  - [How to Edit Student Information](#how-to-edit-student-information)
  - [How to View a Student's Concession History](#how-to-view-a-students-concession-history)
- [Processing Concession Applications](#processing-concession-applications)
  - [Understanding the Two-Stage Approval and Issuance Flow](#understanding-the-two-stage-approval-and-issuance-flow)
  - [How to Review and Approve a Concession Application (Stage 1)](#how-to-review-and-approve-a-concession-application-stage-1)
  - [How to Assign a Booklet Slip and Print a Pass (Stage 2)](#how-to-assign-a-booklet-slip-and-print-a-pass-stage-2)
  - [How to Reject a Concession Application](#how-to-reject-a-concession-application)
  - [How to View Rejection Reasons for an Application](#how-to-view-rejection-reasons-for-an-application)
  - [How to Print or Reprint an Issued Concession Certificate](#how-to-print-or-reprint-an-issued-concession-certificate)
  - [How to Update the Concession Issue Date](#how-to-update-the-concession-issue-date)
- [Managing Address Change Requests](#managing-address-change-requests)
  - [How to Review and Process an Address Change Request](#how-to-review-and-process-an-address-change-request)
- [Managing Concession Booklets](#managing-concession-booklets)
  - [How to Add a New Concession Booklet](#how-to-add-a-new-concession-booklet)
  - [How to Inspect Booklet Slots and Application Assignments](#how-to-inspect-booklet-slots-and-application-assignments)
  - [How to Mark or Remove a Damaged Page in a Booklet](#how-to-mark-or-remove-a-damaged-page-in-a-booklet)
  - [How to Move or Reorder Slots in a Booklet](#how-to-move-or-reorder-slots-in-a-booklet)
  - [How to Print the Master Booklet Register](#how-to-print-the-master-booklet-register)
- [Calibrating Form Layout and Printing](#calibrating-form-layout-and-printing)
  - [How to Calibrate Booklet Anchor Offsets](#how-to-calibrate-booklet-anchor-offsets)
  - [How to Print a Sample Calibration Test Sheet](#how-to-print-a-sample-calibration-test-sheet)
  - [How to Adjust System-Wide Form Layout Coordinates](#how-to-adjust-system-wide-form-layout-coordinates)
- [Using the Analytics Dashboard and Reports](#using-the-analytics-dashboard-and-reports)
  - [How to View Administrative Performance Metrics](#how-to-view-administrative-performance-metrics)
  - [How to Generate and Print an Analytics Report](#how-to-generate-and-print-an-analytics-report)
- [Understanding Notification and Communication Triggers](#understanding-notification-and-communication-triggers)
  - [Automated Student Notification Triggers](#automated-student-notification-triggers)
- [Administrator Roles and Access Permissions](#administrator-roles-and-access-permissions)
  - [Administrative Permission Levels](#administrative-permission-levels)
- [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Back Matter](#back-matter)
  - [Glossary](#glossary)
  - [Need More Help?](#need-more-help)
  - [Document Change Log](#document-change-log)

---

## 📖 About This Document

This guide is an operational manual for VESITRail administrators, including railway concession counter staff, administrative officers, and college supervisors. It covers how to review student registrations, process railway concession applications, issue printed physical voucher slips, manage 50-leaf physical voucher booklets, calibrate print offsets, audit address change requests, and generate administrative analytics.

---

## 🏢 About VESITRail

VESITRail is the official digital railway concession management platform for Vivekanand Education Society's Institute of Technology (VESIT). It coordinates student eligibility verification, paper voucher inventory management, automated print calibration for official Central and Western Railway certificate slips, and lifecycle record-keeping for administrative audits.

---

## 🔑 Getting Started as an Administrator

Administrative access to VESITRail is pre-provisioned. Both new and existing administrators sign in using the dedicated institutional administrative account: **`vesit.railwayconcession@ves.ac.in`**.

---

### How to Access the Administrator Dashboard

Sign in to the system and enter the administrative workspace.

#### Prerequisites

- Access to the dedicated administrator Google account: `vesit.railwayconcession@ves.ac.in`.

#### Steps

1. Launch your web browser on your office computer.
2. Navigate to the VESITRail portal address.
3. Click the **Continue with Google** button.
4. Select or enter the administrator email address: **`vesit.railwayconcession@ves.ac.in`**.
5. Enter the institutional Google account password.
6. The system authenticates your session and opens the administrative interface at `/dashboard/admin`.
7. Observe the header displaying:
   - **`Welcome, <Name>`**
   - Subtitle: **`Manage and process railway concession applications`**
8. Observe the sidebar navigation groups:
   - **Applications**:
     - **Concession Requests** (`/dashboard/admin`)
     - **Address Change Requests** (`/dashboard/admin/address-change-requests`)
   - **Management**:
     - **Students** (`/dashboard/admin/students`)
     - **Booklets** (`/dashboard/admin/booklets`)
     - **Form Layout** (`/dashboard/admin/form-layout`)
     - **Analytics** (`/dashboard/admin/analytics`)
   - **Secondary Navigation**:
     - **Profile** (`/dashboard/admin/profile`)
     - **GitHub**
     - **Feedback Responses**

#### What Happens Next

The portal loads the **Concession Requests** table showing student concession applications.

---

## 👥 Reviewing and Approving Student Registrations

Before students can apply for travel concessions, administrative staff must verify their academic division, residential address, and uploaded Aadhaar document.

---

### How to Review a Pending Student Registration

Inspect a student's personal details, academic division, and uploaded Aadhaar verification document before approving their account.

#### Prerequisites

- You must be signed in to the administrator portal.
- One or more student registrations must be in `Pending` status.

#### Steps

1. In the sidebar under **Management**, click **Students** (`/dashboard/admin/students`).
2. Observe that the table displays **`Pending`** student registrations first by default (sorted chronologically oldest-to-newest so staff can review them in First-In-First-Out order), followed by `Approved` and `Rejected` records.
3. (Optional) Use the **Filter by Status** dropdown (`All Statuses`, `Pending`, `Approved`, `Rejected`) or type a name, email, division, or station in the search bar.
4. Locate the student you wish to review.
5. In the **Actions** column of that student's row, click the **Eye** icon button to open the **Student Details** dialog.
6. In the dialog, review the student's:
   - Full legal name, email, and contact mobile number.
   - Date of birth, gender, and calculated age.
   - Academic details: Year (FE, SE, TE, BE), Branch (e.g., CMPN, INFT, EXTC), and Class division code (e.g., D7A, D12B).
   - Residential address and selected **Home Station** with station code.
7. Click the **View Verification Document** button to load the embedded PDF viewer inside the dialog.
8. Inspect the uploaded document:
   - Check that both front and back sides of the Aadhaar card are clearly visible.
   - If the student's residential address differs from the address printed on their Aadhaar card, confirm that an auxiliary address proof (such as an electricity bill, rent agreement, or maintenance receipt) is included in the PDF.
   - Confirm that the student's selected Home Station corresponds to their residential locality.
9. Click the **Approve Student** button.

#### What Happens Next

The system updates the student's status to **`Approved`**, displays a success toast notification (`<Student Name> has been approved successfully.`), and automatically dispatches an approval notification (push alert and email) to the student. The student's portal unlocks the concession application interface.

---

### How to Reject a Student Registration

Reject an incomplete, illegible, or mismatched student registration with an explicit explanation so the student can make corrections.

#### Prerequisites

- You must have opened the **Student Details** dialog (via the **Eye** icon in the Students table) for a student whose details require correction.

#### Steps

1. In the **Student Details** dialog, click the **Reject Student** button.
2. A rejection dialog opens prompting for a rejection reason.
3. Click the **Predefined Reason** dropdown menu and choose a matching reason:
   - **Address Mismatch**: _Address in the verification document and the entered address mismatch_
   - **Both Sides of Aadhaar Required**: _Please upload both front and back sides of your Aadhaar card._
   - **Address Proof Required**: _Address differs from Aadhaar. Please attach an electricity bill or rent agreement along with your Aadhaar card._
   - **Invalid Verification Document**: _Invalid verification document_
   - **Document Not Clear**: _Verification document not clear_
   - **Address Station Mismatch**: _Address does not belong to the current station selected_
4. (Optional) Alternatively, or in addition to a predefined reason, type specific instructions in the rejection reason textarea explaining exactly what the student must correct.
5. Click **Confirm Rejection**.

#### What Happens Next

The student's status updates to **`Rejected`**, and their submission count counter increments. An automated notification containing your remarks is sent to the student. The student can log in, edit their profile, upload a new verification PDF, and resubmit their account.

---

### How to Edit Student Information

Correct typographical errors or update academic class assignments directly on behalf of a student without rejecting their registration.

#### Prerequisites

- The student must be listed in the **Students** table.

#### Steps

1. Navigate to **Students** (`/dashboard/admin/students`).
2. Locate the student in the table.
3. In the **Actions** column, click the **Pencil** icon button (**Edit Student Details**).
4. The **Edit Student Details** drawer slides out from the right side of the screen.
5. You can modify the following fields:
   - **First Name**, **Middle Name**, and **Last Name**
   - **Date of Birth** (via the date picker popover)
   - **Gender** (`Male` or `Female`)
   - **Mobile Number** (10 digits)
   - **Year** (select from available academic years)
   - **Branch** (select from available branches)
   - **Class** (filtered division dropdown based on selected Year and Branch)
6. Click **Save Changes**.

#### What Happens Next

The system saves the updated details to the database and refreshes the student record. Subsequent concession requests will reflect the updated academic information and student name.

---

### How to View a Student's Concession History

Audit past concession applications submitted by an approved student.

#### Prerequisites

- The student must have an **Approved** status.

#### Steps

1. Navigate to **Students** (`/dashboard/admin/students`).
2. Locate the approved student row.
3. In the **Actions** column, click the **History** icon button (**View Concession History**).
4. A bottom sheet titled **Concession Application History** slides up from the bottom of the screen.
5. The sheet lists all concession applications for that student, displaying:
   - Application reference ID (`#<shortId>`)
   - Applied date
   - Application type (`New` or `Renewal`)
   - Concession class (`First` or `Second`)
   - Duration period (`Monthly` or `Quarterly`)
   - Home station
   - Status badge (`Pending`, `Approved`, `Issued`, or `Rejected`)
   - Certificate serial number (for issued passes)
6. Use pagination controls at the bottom of the sheet if the student has more than 5 historical records.

---

## 🎫 Processing Concession Applications

Managing concession requests is the primary operational workflow at the railway concession desk.

---

### Understanding the Two-Stage Approval and Issuance Flow

To prevent discrepancies between digital records and physical paper vouchers, VESITRail implements a strict **two-stage workflow**:

```
[Pending]
   │
   │ Admin clicks "Approve Application" (Checkmark icon)
   ▼
[Approved]  <─── Automated notification sent: "Visit counter to collect certificate"
   │              * NO booklet or voucher slip assigned yet *
   │
   │ Student arrives at the counter with physical ID
   │ Admin clicks "Assign Booklet & Print" (Printer icon)
   │ Admin enters the 2-digit Voucher Slip Number from physical book
   ▼
[Issued]    <─── Certificate PDF printed; slot marked as occupied
```

1. **Stage 1 (Approval in `Pending`):** The administrator reviews the student's route, travel class, and period, and approves the request. **No booklet or voucher slip number is assigned at this stage.** An automated notification is sent to the student informing them that their pass is approved and asking them to visit the railway concession counter in person.
2. **Stage 2 (Issuance at the Counter in `Approved`):** When the student arrives at the counter in person, the administrator clicks **Assign Booklet & Print**, selects the active physical booklet, inspects the physical slip leaf, manually enters the voucher slip number (last 2 digits), and prints the pass. The status updates to **`Issued`**.

> [!IMPORTANT]
> **Rejection in Any State:** Administrators can reject an application in **`Pending`**, **`Approved`**, or **`Issued`** status. If an application in **`Issued`** status is rejected, the system automatically releases the assigned booklet slot back to the booklet inventory so it can be re-allocated.

---

### How to Review and Approve a Concession Application (Stage 1)

Approve an incoming concession request and trigger the student notification to visit the counter.

#### Prerequisites

- One or more concession applications must be in `Pending` status.

#### Steps

1. In the sidebar under **Applications**, click **Concession Requests** (`/dashboard/admin`).
2. Notice that `Pending` applications are displayed first by default.
3. Review the table columns:
   - **Student Name** (and contact number)
   - **Academic Info** (class division, year, branch)
   - **Travel Route** (Home Station to Kurla)
   - **Pass Details** (Class: `First` / `Second`, Period: `Monthly` / `Quarterly`)
   - **Pass Type** (`New` or `Renewal`; for renewals, the previous certificate number is linked)
   - **Status** (`Pending`)
   - **Applied Date**
4. In the **Actions** column, click the **Approve Application** button (green checkmark `<Check />` icon).
5. A confirmation dialog appears:
   - Title: **Approve Application**
   - Description: _Are you sure you want to approve this concession application?_
6. Click **Confirm Approval**.

#### What Happens Next

The application status updates to **`Approved`**. **No booklet slot is assigned yet.** The system sends an automated push notification and email to the student:

> _"Your railway concession application has been approved! Please visit the Railway Concession Office to collect your certificate."_

---

### How to Assign a Booklet Slip and Print a Pass (Stage 2)

Assign the physical voucher leaf and print the concession certificate when the student arrives at the counter.

#### Prerequisites

- The student must be physically present at the counter.
- The student's application must be in **`Approved`** status.
- You must have the physical Central or Western Railway 50-leaf concession booklet in hand.
- The certificate slip printer must be powered on and connected.

#### Steps

1. In the **Concession Requests** table, filter by **Approved** (or search for the student's name).
2. Locate the student's row.
3. In the **Actions** column, click the **Assign Booklet & Print** button (printer `<Printer />` icon).
4. The **Assign Booklet & Print Pass** dialog opens:
   - **Application Details**: Displays Application ID, Student Name, Travel Route, and Applied Date.
   - **Concession Class**: Pre-selected with the requested class (`First Class` or `Second Class`). You can adjust this if required.
   - **Concession Period**: Pre-selected with the requested duration (`Monthly` or `Quarterly`). You can adjust this if required.
   - **Select Booklet**: Click the combobox to select the active booklet (displays Booklet #, status badge, and serial range).
   - **Booklet Range & Usage**: Shows the serial range (e.g., `0807551 - 0807600`) and usage breakdown (e.g., _12 issued · 1 damaged · 37 remaining_).
   - **Voucher Slip Number**:
     - Look at the physical voucher slip in your booklet.
     - Type the **last two digits** (or slip position number) into the input box (e.g., `14`). The input is empty by default and validates against available slots.
     - Observe the real-time **Serial preview** on the right (e.g., `0807564`).
5. Insert the blank certificate leaf from the physical booklet into the printer tray.
6. Click **Assign & Print Pass**.
7. The system assigns the slot, generates the print overlay PDF, and opens the system print prompt.
8. Confirm the print prompt to print directly onto the pre-printed physical slip.

#### What Happens Next

The application status transitions to **`Issued`**, permanently linking the booklet ID, page offset, and derived certificate serial number. The physical slip leaf is handed to the student.

---

### How to Reject a Concession Application

Reject a concession request from **`Pending`**, **`Approved`**, or **`Issued`** status.

#### Prerequisites

- An application in `Pending`, `Approved`, or `Issued` status.

#### Steps

1. Locate the application row in the **Concession Requests** table.
2. In the **Actions** column, click the **Reject Application** button (red cross `<X />` icon).
3. The **Reject Concession Application** dialog opens.
4. Select a **Predefined Reason** if applicable:
   - **Monthly Period Only**: _Only monthly concessions are available. Please reapply with 'Monthly'._
   - **Quarterly Period Only**: _Only quarterly concessions are available. Please reapply with 'Quarterly'._
5. (Optional) In the rejection reason textarea, enter or modify specific instructions for the student.
6. Click **Reject Application**.

#### What Happens Next

The application status updates to **`Rejected`**. If the application was previously in **`Issued`** status, the assigned booklet page slot is immediately released back to the booklet inventory. The student receives an automated rejection notification containing your explanation.

---

### How to View Rejection Reasons for an Application

Inspect why an application was rejected.

#### Steps

1. In the **Concession Requests** table, filter by **Rejected** (or locate a rejected application).
2. In the **Actions** column, click the **View Rejection Reason** button (eye `<Eye />` icon).
3. The **Rejection Reason** dialog opens, displaying:
   - Application ID
   - Rejection date and time
   - Administrative reviewer who rejected the application
   - Exact rejection reason provided to the student
4. Click **Close** to dismiss.

---

### How to Print or Reprint an Issued Concession Certificate

Reprint the certificate text overlay if an error occurred during printing.

#### Prerequisites

- The application must be in **`Issued`** status.

#### Steps

Depending on the printing issue, choose one of the two options available in the **Actions** column:

#### Option A: Quick Re-Print of Existing Voucher Slip (Printer `<Printer />` Icon)

1. If the printer jammed or ink was faded, but you are re-feeding the **same** physical voucher slip:
2. Click the **Print Overlay PDF** button (printer icon).
3. The system generates the PDF overlay for the currently assigned booklet slot and triggers the browser print dialog.

#### Option B: Reassign to a New Voucher Slip (Refresh `<RotateCcw />` Icon)

1. If the original physical leaf was spoiled, torn, or ruined, and you must assign a **new** voucher slip from the physical booklet:
2. Click the **Reprint / Reassign Booklet** button (refresh icon).
3. The **Reprint Concession Certificate** dialog opens.
4. Select the target booklet from the **Select Booklet** combobox.
5. In the **New Voucher Slip Number** field, enter the 2-digit slip number of the new physical leaf.
6. Verify the **Serial preview** display.
7. Click **Reissue & Print Pass**.
8. The system updates the application to the new booklet slot, marks the old slot as replaced, and prints the new certificate overlay.
9. Return to the booklet manager to mark the spoiled slip as damaged (see [Managing Concession Booklets](#managing-concession-booklets)).

---

### How to Update the Concession Issue Date

Correct the official issue date recorded in the system if voucher distribution was deferred.

#### Prerequisites

- The application must be in **`Issued`** status.

#### Steps

1. Locate the issued application in the **Concession Requests** table.
2. In the **Actions** column, click the **Update Issue Date** button (calendar clock `<CalendarClock />` icon).
3. In the dialog, select the correct date from the calendar picker.
4. Click **Save Issue Date**.

#### What Happens Next

The system updates the recorded issue date, recalibrating the pass validity start date in the database.

---

## 🔄 Managing Address Change Requests

When students relocate, they submit address change requests and upload new address verification documents that administrators must review.

---

### How to Review and Process an Address Change Request

Inspect a submitted address change request and compare the old and new stations.

#### Prerequisites

- One or more address change requests must be in `Pending` status.

#### Steps

1. In the sidebar under **Applications**, click **Address Change Requests** (`/dashboard/admin/address-change-requests`).
2. The table displays:
   - **Sr. No.**
   - **Name** (and student contact number)
   - **Academic Info** (class, year, branch)
   - **Station Change**: Displays **`From: <Current Station>`** and **`To: <New Station>`**
   - **Status** badge (`Pending`, `Approved`, `Rejected`)
   - **Submitted** date
3. In the **Actions** column, click the **Eye** icon button to open the **Address Change Request Details** dialog.
4. In the dialog, inspect the side-by-side comparison:
   - **Current Residential Details**: Existing address and station.
   - **Proposed Residential Details**: New address, pincode, and proposed new home station.
5. Click the **View Document** button to open the embedded PDF viewer.
6. Verify that the uploaded proof of address (e.g., electricity bill, updated Aadhaar, rent agreement) matches the typed new address and that the proposed railway station is the closest suburban station.
7. To approve:
   - Click **Approve Request**.
   - Confirm approval in the prompt.
   - The student's residential address and home station update immediately across all future concession applications.
8. To reject:
   - Click **Reject Request**.
   - Choose a predefined reason (`Address Mismatch`, `Invalid Document`, `Unclear Document`, or `Station Mismatch`) or type custom remarks in the textarea.
   - Click **Confirm Rejection**.

#### What Happens Next

The student receives an automated notification regarding the approval or rejection of their address change request.

---

## 📚 Managing Concession Booklets

Central and Western Railways supply colleges with official physical concession books containing 50 serialized leaves. Administrators register and manage these 50-slot books in VESITRail.

---

### How to Add a New Concession Booklet

Register a newly received physical 50-leaf voucher booklet into digital inventory.

#### Prerequisites

- You must have the physical 50-leaf booklet in hand.
- Note the starting serial number pre-printed on the first leaf (e.g., `0807551` or `A0807551`).

#### Steps

1. In the sidebar under **Management**, click **Booklets** (`/dashboard/admin/booklets`).
2. Click the **Add Booklet** button in the top right corner.
3. On the **Add New Booklet** page (`/dashboard/admin/booklets/create`):
   - In **Serial Start Number**, enter the starting serial number stamped on leaf 1 (e.g., `0807551` or `A0807551`).
   - Observe that the **Serial End Number (Auto-calculated)** field automatically computes the ending serial number for 50 pages (e.g., `0807600` or `A0807600`).
   - In **Anchor X Coordinate**, leave at `0` (or enter an offset between `-50` and `100` if known).
   - In **Anchor Y Coordinate**, leave at `0` (or enter an offset between `-50` and `100` if known).
4. Click **Add Booklet**.

#### What Happens Next

The booklet is registered with status **`Available`** (or **`In Use`** once vouchers are assigned).

---

### How to Inspect Booklet Slots and Application Assignments

Inspect every individual certificate leaf (slots 1 to 50) in a booklet.

#### Steps

1. In the sidebar under **Management**, click **Booklets** (`/dashboard/admin/booklets`).
2. In the Booklets table, locate the booklet.
3. In the **Actions** column, click the **Three Dots** menu button (`<MoreVertical />`) and select **View Booklet**.
4. The detail view opens at `/dashboard/admin/booklets/<id>`, showing:
   - Header: `Booklet #<number> Applications` and total records count.
   - Table columns: `Sr. No.` (1 to 50), `Date`, `Certificate` serial number, `Student Name`, `Current Pass`, `Gender`, `Date of Birth`, `Period`, and `Home Station`.
   - Damaged leaves are displayed with a red **Cancelled** indicator.

---

### How to Mark or Remove a Damaged Page in a Booklet

Record a spoiled, misprinted, or torn physical certificate leaf so that digital serial numbering remains synchronized with physical paper.

> [!NOTE]
> **No Note or Description Prompt Required:** Marking a page as damaged is immediate. The system does not require you to type a description or damage note. Clicking **Damaged** or **Mark Damaged** directly updates the slot.

#### Steps

1. Open the booklet detail page (`/dashboard/admin/booklets/<id>`).
2. Click the **Reorder Slots** button in the header action bar to enter Reorder Mode.
3. Locate the slot corresponding to the physical voucher leaf:
   - **On an empty slot**: Click the **Mark Damaged** button in the Actions column.
   - **On an occupied slot**: Click the **Damaged** button in the Actions column.
4. The system immediately marks that slot as damaged, displays an **Inserted Damaged** badge, and shifts all subsequent student assignments down by one slot (provided the total count does not exceed 50 pages).
5. **To remove a damaged marker**:
   - Locate the damaged slot.
   - Click the **Remove** button (red cross).
   - The damaged marker is removed, and subsequent slots shift up.
6. When satisfied with your changes, click **Save** in the top action bar to open the **Save Booklet Layout** dialog, then click **Confirm & Save Layout**.

---

### How to Move or Reorder Slots in a Booklet

Reorganize application slot assignments within a booklet.

#### Steps

1. Open the booklet detail page (`/dashboard/admin/booklets/<id>`).
2. Click the **Reorder Slots** button to enter Reorder Mode.
3. On the slot you wish to relocate, click the **Move** button.
4. The **Move Slip Position** dialog opens:
   - Displays the current Sr. No., Certificate serial, and Student Name.
   - In **Target Slip Number**, enter the destination slip number (e.g., `05`).
   - Under **Select Reorder Mode**, choose:
     - **Shift**: Inserts the student entry at the target slip number and shifts all intermediate entries down.
     - **Swap**: Directly exchanges positions between the source slip and the target slip.
   - Inspect the **Preview** box showing the move summary.
5. Click **Apply Move**.
6. Observe the staged modification badge in the table (e.g., `Was #02 → #05`).
7. In the header bar, observe the staged changes counter (e.g., _1 changes staged_).
   - To undo all staged adjustments: Click the **Reset** icon button (`<RotateCcw />`).
   - To cancel and exit reorder mode: Click the **Discard** icon button (`<X />`).
   - To persist the changes: Click **Save** (`<Save />`), then click **Confirm & Save Layout** in the confirmation dialog.

---

### How to Print the Master Booklet Register

Generate an official 50-entry tabular printout of the entire booklet for railway audits and campus filing.

#### Steps

1. Open the booklet detail page (`/dashboard/admin/booklets/<id>`).
2. Ensure you are not in Reorder Mode.
3. Click the **Print Register** button in the top action bar.
4. The system compiles the complete 50-entry legal landscape PDF register displaying certificate numbers, issue dates, student names, branch divisions, stations, durations, and cancel stamps for damaged leaves.
5. Confirm the system print prompt to send the register to your printer.

---

## 🖨️ Calibrating Form Layout and Printing

Because pre-printed paper railway slips and printer feed margins vary slightly between batches, VESITRail provides calibration tools.

---

### How to Calibrate Booklet Anchor Offsets

Fine-tune horizontal and vertical print offsets for an individual voucher booklet.

#### Steps

1. In the sidebar under **Management**, click **Booklets** (`/dashboard/admin/booklets`).
2. In the Booklets table, locate the target booklet.
3. Click the **Three Dots** (`<MoreVertical />`) menu in the Actions column and select **Calibrate Anchors**.
4. The **Anchor Calibration — Booklet #<number>** dialog opens:
   - Displays currently **Saved Coordinates** (`Anchor X`, `Anchor Y`).
   - In **Adjust Coordinates**, adjust **Anchor X** (horizontal) and **Anchor Y** (vertical) using the **`-`** / **`+`** buttons or typing values directly (range: `-50` to `100`).
   - _Positive X shifts printed text right; negative X shifts left._
   - _Positive Y shifts printed text down; negative Y shifts up._
5. Click **Update Coordinates** to save the changes.

---

### How to Print a Sample Calibration Test Sheet

Verify alignment on scrap paper before printing onto an official railway slip.

#### Steps

1. Open the **Anchor Calibration** dialog for any booklet (via Booklets -> Three Dots -> **Calibrate Anchors**).
2. Feed a blank sheet of paper cut to voucher size into the printer.
3. In the dialog, click the **Print Sample PDF** button.
4. Confirm the system print dialog.
5. Place the printed test paper on top of an official blank railway slip and hold it up to a light source.
6. Verify that all fields (Name, Class, Period, From Station, Kurla, Date) align inside the pre-printed slip boxes.
7. If misaligned, adjust the Anchor X or Anchor Y coordinates in the dialog and print another sample.

---

### How to Adjust System-Wide Form Layout Coordinates

Calibrate relative field positions across the master print template.

#### Steps

1. In the sidebar under **Management**, click **Form Layout** (`/dashboard/admin/form-layout`).
2. The page displays the **Form Layout Calibration** workspace:
   - Header: _Form Layout Calibration — Calibrate element placement coordinates and field mappings for printed concession forms_.
3. Use the visual coordinate editor to reposition specific fields (such as Student Name, Station, or Class) across the master layout.
4. Save the configuration to update default rendering system-wide.

---

## 📊 Using the Analytics Dashboard and Reports

Monitor administrative review throughput and staff performance metrics.

---

### How to View Administrative Performance Metrics

Inspect application volume and review statistics across different time periods.

#### Steps

1. In the sidebar under **Management**, click **Analytics** (`/dashboard/admin/analytics`).
2. Observe the three summary metric cards:
   - **Students Reviewed**: Total student onboarding registrations audited.
   - **Address Changes**: Total address modification requests processed.
   - **Applications Reviewed**: Total concession requests reviewed.
3. Use the **Time Range** dropdown in the top right to filter metrics:
   - **Last 1 Month** (default)
   - **Last 3 Months**
   - **Last 6 Months**
   - **Last 1 Year**
   - **All Time**
4. Review the **Admin Contributions** table below, which breaks down review totals by administrative staff member.

---

### How to Generate and Print an Analytics Report

Generate an executive summary report for departmental meetings or administrative audits.

#### Steps

1. On the **Analytics** page (`/dashboard/admin/analytics`), select the desired time range.
2. Click the **Print Report** button in the top action bar.
3. The system compiles an executive A4 portrait report containing summary metrics and contribution tables, and triggers the printer dialog.

---

## 🔔 Understanding Notification and Communication Triggers

VESITRail automatically dispatches notifications across browser push notifications, email, and the in-app notification center based on administrative actions.

---

### Automated Student Notification Triggers

| Event Trigger              | Triggering Action in Portal                                                          | Automated Notification Sent to Student                                                                                                                                       |
| :------------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `student_approval`         | Admin approves student registration in the Students table.                           | Informs the student that their profile is approved and unlocks the concession application form.                                                                              |
| `student_rejection`        | Admin rejects student registration in the Students table.                            | Informs the student of rejection with the specific reason and instructions to resubmit.                                                                                      |
| `concession_approval`      | Admin clicks **Approve Application** on a `Pending` request.                         | Informs the student that their pass is approved and directs them to visit the Railway Concession Office counter for physical collection. _(No voucher number assigned yet)._ |
| `concession_rejection`     | Admin clicks **Reject Application** on a `Pending`, `Approved`, or `Issued` request. | Informs the student that their application was rejected with the administrative reason. If previously issued, frees the booklet slot.                                        |
| `address_change_approval`  | Admin approves an address modification request.                                      | Informs the student that their residential address and home station have been updated.                                                                                       |
| `address_change_rejection` | Admin rejects an address modification request.                                       | Informs the student that their request was rejected along with the specific feedback.                                                                                        |

---

## 🛡️ Administrator Roles and Access Permissions

Administrative operations are governed by account permissions associated with the institutional Google account.

---

### Administrative Permission Levels

| Permission Level         | Account / Role                                   | Access Scope                                                                                                                                               |
| :----------------------- | :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Active Administrator** | `vesit.railwayconcession@ves.ac.in`              | Complete access to Concession Requests, Address Change Requests, Students directory, Booklet management, Form Layout calibration, and Analytics reporting. |
| **Inactive / Student**   | Any unauthorized or student `@ves.ac.in` account | Access restricted. Cannot view or execute administrative actions.                                                                                          |

---

## ❓ Frequently Asked Questions (FAQ)

#### 1. Why does approving an application not immediately assign a booklet serial number?

VESITRail deliberately separates approval from issuance. Approval (Stage 1) verifies eligibility and notifies the student to come to the counter. Voucher assignment (Stage 2) takes place only when the student is physically present at the counter, ensuring that booklet slips are consumed in exact physical order without wasted leaves.

#### 2. Can I reject an application after it has already been issued?

Yes. Administrators can reject an application in `Pending`, `Approved`, or `Issued` status. If an `Issued` pass is rejected, the system automatically frees the assigned booklet slot back to the active booklet.

#### 3. What should I do if a paper voucher leaf is damaged or torn?

Navigate to **Booklets**, open the booklet detail view, click **Reorder Slots**, and click **Damaged** (on an occupied slot) or **Mark Damaged** (on an empty slot). The system immediately marks that leaf as damaged and shifts subsequent records without requiring a note.

#### 4. How do I reprint a pass if the printer jammed?

If you are re-feeding the same physical voucher slip, click **Print Overlay PDF** (printer icon). If the slip was ruined and you must use a new physical voucher leaf, click **Reprint / Reassign Booklet** (refresh icon), enter the new slip number, and click **Reissue & Print Pass**.

#### 5. Why are pending students displayed first in the Students table?

The Students table automatically sorts records with `Pending` students at the top in chronological order (oldest first) so that administrators can review registrations fairly on a First-In-First-Out basis.

---

## 🔧 Troubleshooting Common Issues

### Cannot Sign In to Administrator Dashboard

- **Symptom:** You attempt to sign in but do not see administrative options.
- **Solution:** Ensure you are signing in with the designated administrator account: **`vesit.railwayconcession@ves.ac.in`** via the **Continue with Google** button.

### Certificate Text Misaligned on Physical Slip

- **Symptom:** Printed text does not align with the pre-printed boxes on the railway voucher slip.
- **Solution:** In the **Booklets** table, click the **Three Dots** menu on the active booklet, select **Calibrate Anchors**, adjust the `Anchor X` and `Anchor Y` coordinates, and use **Print Sample PDF** to verify alignment on scrap paper before printing official slips.

### "No Available Booklets Found" When Printing

- **Symptom:** The booklet selection combobox is empty or shows an alert.
- **Solution:** All existing booklets have exhausted their 50-leaf capacity. Go to **Booklets** -> **Add Booklet** to register a new physical booklet into the system.

---

## 📎 Back Matter

### Glossary

- **Anchor Coordinates (`anchorX`, `anchorY`):** Millimeter adjustments applied to a specific booklet to align text overlays with physical printed slip leaves.
- **Booklet Register:** An official 50-row tabular record detailing every certificate leaf in a concession booklet for railway audits.
- **Concession Requests:** The queue of student applications for monthly or quarterly railway travel concessions (`/dashboard/admin`).
- **Damaged Page / Slip:** A physical voucher leaf marked as damaged, instructing the system to skip that serial number in the active sequence.
- **Page Offset:** The zero-indexed position (0 to 49) representing each of the 50 voucher leaves in a concession booklet.
- **Voucher Slip Number:** The 2-digit number (e.g., `01` to `50`) representing the leaf position within a 50-page booklet.

### Need More Help?

For platform technical assistance or printer driver troubleshooting:

- **Developer Support Email:** `vesitrail-devs@googlegroups.com`
- **Contact Channel:** Communication is conducted via email only (the development team does not maintain a physical campus office counter or telephone hotline).

### Document Change Log

| Version | Date           | Summary of Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| :------ | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v1.0`  | September 2026 | Initial comprehensive release of the Administrator User Guide.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `v1.1`  | September 2026 | Updated to 100% codebase accuracy: corrected login flow to `vesit.railwayconcession@ves.ac.in` with `Continue with Google`, updated navigation to `Concession Requests`, clarified the 2-stage approval vs issuance workflow (manual 2-digit voucher entry upon physical counter visit), documented multi-state rejection with slot release, updated Students table actions (Eye for details, Pencil for right drawer, History for bottom sheet, default Pending sorting), clarified immediate damage marking without notes, and added booklet slot reordering documentation. |
