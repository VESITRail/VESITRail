# Admin User Guide

**Purpose:** An operational manual for college administrative staff to review student registrations, process railway concession applications, issue concession vouchers, manage booklet inventories, calibrate printing, and analyze administrative throughput.  
**Last Updated:** September 2026  
**Document Version:** v1.0

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
- [Processing Concession Applications](#processing-concession-applications)
  - [How to Review and Approve a Concession Application](#how-to-review-and-approve-a-concession-application)
  - [How to Reject a Concession Application](#how-to-reject-a-concession-application)
  - [How to Print or Reprint a Concession Certificate](#how-to-print-or-reprint-a-concession-certificate)
  - [How to Update the Concession Issue Date](#how-to-update-the-concession-issue-date)
- [Managing Address Change Requests](#managing-address-change-requests)
  - [How to Review and Process an Address Change Request](#how-to-review-and-process-an-address-change-request)
- [Managing Concession Booklets](#managing-concession-booklets)
  - [How to Add a New Concession Booklet](#how-to-add-a-new-concession-booklet)
  - [How to Inspect Booklet Slots and Application Assignments](#how-to-inspect-booklet-slots-and-application-assignments)
  - [How to Mark a Damaged Page in a Booklet](#how-to-mark-a-damaged-page-in-a-booklet)
  - [How to Move or Reorder an Application Slot](#how-to-move-or-reorder-an-application-slot)
  - [How to Print the Master Booklet Register](#how-to-print-the-master-booklet-register)
- [Calibrating Form Layout and Printing](#calibrating-form-layout-and-printing)
  - [How to Calibrate Booklet Anchor Offsets](#how-to-calibrate-booklet-anchor-offsets)
  - [How to Adjust On-Screen Form Field Coordinates](#how-to-adjust-on-screen-form-field-coordinates)
  - [How to Print a Sample Calibration Test Sheet](#how-to-print-a-sample-calibration-test-sheet)
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

This guide is for VESITRail administrators, including administrative officers, counter staff, and college supervisors responsible for managing student railway travel concession applications. You do not need software programming experience to use this manual or execute administrative duties in the portal.

### How to Use This Guide

If you are a newly appointed staff member joining the railway concession desk, read through this guide sequentially to understand the full operational workflow. If you are handling a specific task, such as registering a new paper voucher book or adjusting printer alignment, use the [Table of Contents](#table-of-contents) to navigate directly to the relevant procedure.

---

## 🏢 About VESITRail

VESITRail is an administrative management platform designed for Vivekanand Education Society's Institute of Technology (VESIT). It serves as a digital control center that replaces manual paper ledgers, automates student identity and address verification, coordinates 50-leaf physical railway concession voucher books, prints student details directly onto official government certificate slips, and maintains an auditable record of all approved and rejected concession passes.

---

## 🔑 Getting Started as an Administrator

Administrative capabilities in VESITRail are tied to verified institutional accounts that have been granted administrative privileges by the college authority.

---

### How to Access the Administrator Dashboard

Sign in to the system and enter the administrative management workspace.

#### Prerequisites

- You must have an active college email account ending in `@ves.ac.in`.
- Your account must be designated as an Active Administrator in college staff records.

#### Steps

1. Launch your web browser on your office desktop computer.
2. Navigate to the VESITRail portal address.
3. Click the `Sign in with Google` button.
4. Select your authorized `@ves.ac.in` administrator email account.
5. Enter your institutional account password if requested.
6. Observe that the navigation bar loads administrative management links (`Applications`, `Students`, `Booklets`, `Address Requests`, `Analytics`, `Form Layout`).
7. Verify that your welcome banner indicates you are signed in to the Administrator Dashboard.

#### What Happens Next

The portal opens the primary concession review queue, displaying submitted student applications requiring administrative verification.

#### Common Issues

- **Redirected to student screen:** If you see the student onboarding screen rather than the administrative controls, your email address has not been assigned administrative rights. Contact senior administration.
- **Account marked inactive:** If an error message indicates your account is deactivated, your administrative profile must be reinstated by senior administration.

---

## 👥 Reviewing and Approving Student Registrations

Before students can request travel concessions, administrative staff must verify their uploaded identity documents, branch enrollment, and residential jurisdiction.

---

### How to Review a Pending Student Registration

Inspect a student's personal details, academic division, and uploaded Aadhaar document before approving their account.

#### Prerequisites

- You must be signed in to the administrator portal.
- One or more student registrations must be in `Pending` status.

#### Steps

1. Click `Students` in the primary top navigation menu.
2. Click the `Filter by Status` dropdown menu located above the table.
3. Select `Pending` to view unverified registrations.
4. Locate the student you wish to review in the table.
5. Click anywhere on the student row to open the `Student Details` dialog.
6. Verify the student's legal name, date of birth, gender, and contact number.
7. Confirm that the student's year, engineering branch, and classroom division match official college enrollment rosters.
8. Compare the residential address against the student's selected `Home Station`.
9. Click the `View` button under `Verification Document` to open the embedded PDF document viewer.
10. Check that both the front and back of the student's Aadhaar card are clearly legible.
11. If the current residential address differs from the Aadhaar card, confirm that an auxiliary document (such as a parent's electricity bill or a registered rent agreement) is included in the PDF.
12. Click the `Approve Student` button.
13. Click `Confirm` in the approval confirmation prompt.

#### What Happens Next

The student's status changes immediately to `Approved`. VESITRail dispatches an automated notification (push alert and email) to the student informing them that their account is activated, and their student portal unlocks the concession application form.

#### Common Issues

- **Document viewer fails to load:** Ensure the student's file was uploaded successfully. If the PDF is corrupted, reject the registration requesting a clear resubmission.

---

### How to Reject a Student Registration

Reject an incomplete, illegible, or mismatched student registration with a clear written explanation so the student can make corrections.

#### Prerequisites

- You must be viewing a student profile in the `Student Details` dialog.

#### Steps

1. Open the `Student Details` dialog for the student record you are inspecting.
2. Click the `Reject Student` button.
3. Observe the rejection reason dialog box that opens.
4. Click the `Predefined Reason` dropdown selector if the issue matches a common error (for example: `Both Sides of Aadhaar Required`, `Address Mismatch`, `Address Proof Required`, or `Address Station Mismatch`).
5. Select the matching predefined explanation to automatically populate the message.
6. Alternatively, click into the `Custom Reason` text box and type specific instructions explaining what the student must correct.
7. Click the `Confirm Rejection` button.

#### What Happens Next

The student record updates to `Rejected`, and the student's submission count counter increments. An automated notification containing your exact feedback is delivered to the student, allowing them to log in, amend their details or document, and resubmit their profile.

#### Common Issues

- **Blank rejection reason:** The system will not allow you to reject a registration without selecting or typing a reason. Provide clear feedback so the student knows how to resolve the issue.

---

### How to Edit Student Information

Correct typographical errors or update academic class assignments on behalf of a student.

#### Prerequisites

- You must have opened the student record from the `Students` table.

#### Steps

1. Locate the student in the `Students` directory.
2. Click the three dots (actions menu) on the right side of the student row.
3. Select `Edit Student` to open the edit drawer.
4. Update the student's academic division, branch, or contact phone number as needed.
5. Click `Save Changes`.

#### What Happens Next

The modified student information saves immediately across all future concession applications.

#### Common Issues

- **Changing locked identity data:** Core identity fields (such as legal name and birthdate) should only be edited after verifying original physical government credentials at the administrative desk.

---

## 🎫 Processing Concession Applications

The primary daily administrative responsibility is processing travel concession requests, assigning physical voucher serial numbers, and printing certificates onto physical railway slip books.

---

### How to Review and Approve a Concession Application

Review an application, assign it to the active paper voucher booklet, and trigger physical slip printing.

#### Prerequisites

- An active concession booklet with available unassigned page slots must be present in the system.
- The student's concession application must be in `Pending` status.
- Your office desktop must be connected to the dedicated certificate slip printer.

#### Steps

1. Click `Applications` in the navigation bar to view the concession queue.
2. Ensure the status filter is set to `Pending`.
3. Locate the application row and click `Approve Application` (green checkmark button).
4. Review the student's travel route (Home Station to Kurla).
5. Verify the requested travel class (`First Class` or `Second Class`) and duration (`Monthly` or `Quarterly`).
6. If this is a `Renewal`, inspect the linked previous certificate number displayed on the card to confirm continuity.
7. Observe the next available physical booklet serial number and booklet page slot assigned automatically by the system.
8. Insert the corresponding blank certificate slip voucher from your physical booklet into the printer tray.
9. Click `Approve & Print Certificate`.
10. Confirm the system print dialog and send the job to the attached printer.

#### What Happens Next

The application status updates to `Approved` and transitions to `Issued` upon voucher printing. The certificate serial number is permanently linked to the student's record. An automated notification alerts the student that their voucher is ready for collection at the administrative office counter.

#### Common Issues

- **No active booklet available:** If an alert informs you that no booklet is active, you must register a new concession booklet before approving further applications.

---

### How to Reject a Concession Application

Reject a concession request that violates travel rules or requests an unavailable pass duration.

#### Prerequisites

- The concession application must be in `Pending` status.

#### Steps

1. Open the `Applications` review queue.
2. Locate the student's application row.
3. Click the `Reject Application` button (red cross icon).
4. Review the predefined rejection options (`Monthly Period Only` or `Quarterly Period Only`).
5. Select an appropriate option or enter custom remarks in the text area.
6. Click `Confirm Rejection`.

#### What Happens Next

The application status updates to `Rejected`. An automated alert informs the student, who can then submit an amended application.

#### Common Issues

- **Student applies for unavailable duration:** If college or railway policy restricts passes to monthly durations during a specific month, select `Monthly Period Only` so the student re-submits with the correct duration.

---

### How to Print or Reprint a Concession Certificate

Reprint an issued certificate overlay if a paper jam, ink smear, or printer error occurs.

#### Prerequisites

- The target application must be in `Issued` status only.
- The physical certificate slip must be loaded into the printer.

#### Steps

1. Navigate to the `Applications` table.
2. Filter by status `Issued` to view active issued certificates.
3. Search for the student by name or application reference number.
4. Locate the student row and choose the appropriate action:
   - Click `Print Overlay PDF` (printer icon) to send the existing voucher print overlay directly to the printer again.
   - Click `Reprint / Reassign Booklet` (refresh icon) if the previous slip was ruined and requires assignment to a new physical booklet voucher.
5. Review the print parameters and booklet assignment shown in the dialog.
6. Load the replacement certificate slip into the printer.
7. Confirm the print action.
8. Verify in the physical printout that text aligns accurately within the printed boxes of the voucher.

#### What Happens Next

The document engine produces the calibrated text overlay and transmits it to your physical printer without altering the original database record.

#### Common Issues

- **Misaligned text:** If the printed text does not line up with the printed lines on the physical certificate, navigate to [Form Layout Calibration](#calibrating-form-layout-and-printing) to adjust horizontal and vertical coordinates.

---

### How to Update the Concession Issue Date

Adjust the officially recorded date of issuance if physical distribution of the voucher is delayed.

#### Prerequisites

- The application must be in `Issued` status only.

#### Steps

1. Locate the application in the `Applications` directory under the `Issued` status filter.
2. Click the `Update Issue Date` button (calendar clock icon) on the application row.
3. Pick the new effective issuance date from the calendar selector.
4. Click `Save Issue Date`.

#### What Happens Next

The student's pass validity start date updates, recalculating the expiration window accordingly.

#### Common Issues

- **Setting a future date:** Do not select a future date unless authorized by railway administration policy.

---

## 🔄 Managing Address Change Requests

When students relocate, they submit address modifications and documentation that must be audited by administrative staff.

---

### How to Review and Process an Address Change Request

Compare a student's existing residential data against their newly submitted address and supporting proof.

#### Prerequisites

- An address change request must be pending review in the system.

#### Steps

1. Click `Address Requests` in the top navigation bar.
2. Locate the pending request row in the table.
3. Click `Review Request` to open the inspection dialog.
4. Examine the side-by-side comparison displaying:
   - Current Address and Current Home Station (left column).
   - New Address and Proposed Home Station (right column).
5. Click the `View` button under `Verification Document` to review the uploaded proof of address PDF.
6. Confirm that the new address in the document matches the typed street, locality, and postal pincode.
7. Confirm that the proposed home railway station is the nearest suburban stop to the new address.
8. Click `Approve Request` if all details are verified, or click `Reject Request` if the document is invalid or the station is mismatched.
9. If rejecting, select a reason (such as `Address Mismatch`, `Invalid Document`, `Unclear Document`, or `Station Mismatch`) and click `Confirm`.

#### What Happens Next

If approved, the student's primary profile and home station update immediately. Any future concession application submitted by the student will automatically use the new station. If rejected, the student receives your rejection remarks and retains their previous station.

#### Common Issues

- **Student selected incorrect railway station:** If a student enters a Thane address but selects an incompatible Western Line station, reject the request with `Station Mismatch` so they can select the correct station.

---

## 📚 Managing Concession Booklets

Central and Western Railways provide physical concession books containing 50 serialized leaves. Administrators must register each physical booklet in the portal and track every individual slot.

---

### How to Add a New Concession Booklet

Register a newly received physical government concession booklet into the digital inventory.

#### Prerequisites

- You must have the physical 50-leaf concession book in hand.
- You must know the exact serial starting number printed on the physical leaves (for example, `0807551` or `A0807551`).

#### Steps

1. Click `Booklets` in the navigation menu.
2. Click the `Add Booklet` button.
3. Type the first serial number into the `Serial Start Number` field (for example, `0807551` or `A0807551`).
4. Observe that the `Serial End Number` field automatically calculates the ending serial number for 50 pages (for example, `0807600` or `A0807600`).
5. Set the baseline horizontal alignment coordinate in the `Anchor X Coordinate` field (or leave at default `0.0`).
6. Set the baseline vertical alignment coordinate in the `Anchor Y Coordinate` field (or leave at default `0.0`).
7. Click `Add Booklet`.

#### What Happens Next

The booklet appears in the Booklets table with status `Available`. As applications are approved, the system consumes slots sequentially from page 1 to page 50, transitioning the booklet status to `In Use` and finally `Exhausted` when full.

#### Common Issues

- **Invalid serial format:** The starting serial number must consist of numbers or uppercase letters followed by numbers. The system will validate the format and auto-compute the ending serial number.

---

### How to Inspect Booklet Slots and Application Assignments

Inspect every individual certificate leaf within a booklet to audit assigned students and serial sequences.

#### Prerequisites

- At least one booklet must exist in the system.

#### Steps

1. Click `Booklets` in the navigation bar.
2. Locate the booklet you wish to audit in the table.
3. Click the `View Details` button on the booklet row (or click the booklet serial link).
4. Scroll through the 50-slot register table.
5. Review the serial number, assigned student name, branch, concession duration, travel route, and issue date for each numbered slot.

#### What Happens Next

You can review the exact state of each leaf in the physical voucher book.

#### Common Issues

- **Unassigned slots:** If a booklet shows unassigned slots in the middle of a sequence, check whether an application was cancelled or moved.

---

### How to Mark a Damaged Page in a Booklet

Record a spoiled, misprinted, or torn physical certificate leaf so that serial numbering remains accurate.

#### Prerequisites

- You must be viewing the specific booklet details screen.
- A physical paper voucher leaf must have been damaged or ruined during handling or printing.

#### Steps

1. Open the specific booklet page under `Booklets`.
2. Locate the specific page slot number corresponding to the damaged physical leaf.
3. Click the `Mark Damaged` button on that slot row.
4. Type a short note describing the damage (for example, `Paper jam during printing` or `Torn leaf`).
5. Click `Confirm`.

#### What Happens Next

The slot status updates to `Damaged Page`. The system skips this serial number for future applications, ensuring that physical paper vouchers and digital serial numbers remain in synchronization.

#### Common Issues

- **Accidentally marked as damaged:** If a slot was marked damaged in error, you can click `Unmark Damaged` before any subsequent slot is utilized.

---

### How to Move or Reorder an Application Slot

Reorganize an application assignment within a booklet when resolving physical inventory discrepancies.

#### Prerequisites

- You must be on the booklet detail page.
- Reorder mode must be supported for the selected booklet status.

#### Steps

1. Open the booklet detail view.
2. Click the `Reorder Slots` button.
3. Click on the application slot you need to relocate.
4. Select the new target slot offset in the dialog window.
5. Click `Save Slot Order`.

#### What Happens Next

The student record shifts to the new page offset and recalculates its derived certificate serial number.

#### Common Issues

- **Target slot occupied:** You cannot move an application into an already occupied slot without swapping positions.

---

### How to Print the Master Booklet Register

Print a legal-sized official tabular register of all 50 booklet entries for railway inspection and campus audit filing.

#### Prerequisites

- You must have opened the target booklet under `Booklets`.

#### Steps

1. Navigate to the detail view of the completed or active booklet.
2. Click the `Print Register` button in the upper action bar.
3. Wait for the system to generate the printable 50-entry legal landscape document.
4. Review the register in the printer dialog and send it directly to your office printer.

#### What Happens Next

The system transmits an official tabular record displaying serial numbers, student names, class divisions, stations, validity periods, and cancel markers ready for administrative signing.

#### Common Issues

- **Incomplete booklet printing:** You can print the register at any time; unassigned slots will display as unallocated rows.

---

## 🖨️ Calibrating Form Layout and Printing

Because railway slip paper voucher batches and office printers vary in physical paper margins, VESITRail provides calibration controls to align printed text with the pre-printed certificate leaves.

---

### How to Calibrate Booklet Anchor Offsets

Fine-tune the global baseline offset for an individual booklet.

#### Prerequisites

- An active booklet must be selected.

#### Steps

1. Navigate to the `Booklets` table.
2. Click the `Calibrate Anchor` crosshair icon next to the booklet.
3. Inspect the `Anchor X` (horizontal adjustment in millimeters) and `Anchor Y` (vertical adjustment in millimeters).
4. Increase or decrease the values to shift printed text (positive values shift right/down; negative values shift left/up).
5. Click `Save Calibration`.

#### What Happens Next

All subsequent print jobs generated for this booklet will apply the new coordinate offsets.

#### Common Issues

- **Large coordinate jumps:** Adjust coordinates in small increments (1 to 2 mm) to avoid shifting text off the slip.

---

### How to Adjust On-Screen Form Field Coordinates

Adjust individual field placement (such as student name, date, or station) across the certificate template.

#### Prerequisites

- Access to the Form Layout configuration interface.

#### Steps

1. Click `Form Layout` in the top navigation bar.
2. Review the visual coordinate editor showing all voucher fields (`Student Name`, `From Station`, `Class`, `Date of Issue`, etc.).
3. Click on the field you wish to adjust.
4. Modify the relative X and Y coordinate points.
5. Click `Save Layout`.
6. Confirm in the confirmation dialog prompt.

#### What Happens Next

The system updates the master printing layout configuration.

#### Common Issues

- **Altered layout affecting older booklets:** Form layout changes affect system-wide rendering. Use booklet anchor offsets whenever adjustments are specific to a single batch of paper vouchers.

---

### How to Print a Sample Calibration Test Sheet

Print a test certificate overlay containing alignment markers to check alignment without wasting a real voucher slip.

#### Prerequisites

- A blank sheet of regular paper cut to voucher size, or a test voucher slip.

#### Steps

1. Navigate to `Form Layout` or open `Anchor Calibration`.
2. Click `Print Sample PDF` (or `Print Sample Slip`).
3. Feed your test paper into the certificate printer.
4. Confirm the browser print prompt.
5. Place the printed test sheet over an official blank railway voucher slip and hold it up to a light source.
6. Verify that each printed text line falls cleanly within the designated boxes.

#### What Happens Next

You can visually confirm that names, dates, and station names align before printing live certificates.

#### Common Issues

- **Text overlapping pre-printed borders:** Return to the coordinate editor and fine-tune the offset of the specific misaligned field.

---

## 📊 Using the Analytics Dashboard and Reports

The Analytics section tracks administrative workflow efficiency, student review volumes, and staff contributions.

---

### How to View Administrative Performance Metrics

Inspect application volume and review statistics across various time windows.

#### Prerequisites

- You must be signed in as an administrator.

#### Steps

1. Click `Analytics` in the navigation menu.
2. Locate the top summary metric cards:
   - `Total Contributions`
   - `Applications Processed`
   - `Address Changes Reviewed`
   - `Students Reviewed`
3. Click the `Time Range` dropdown menu (top-right corner).
4. Select your preferred reporting timeframe (`Last 1 Month`, `Last 3 Months`, `Last 6 Months`, `Last 1 Year`, or `All Time`).
5. Review the updated statistics displayed across the cards and detailed breakdown table.

#### What Happens Next

The dashboard dynamically filters all calculation totals to match your chosen timeframe.

#### Common Issues

- **No data visible:** If a newly onboarded staff member has not yet reviewed records, their tally will show zero for that timeframe.

---

### How to Generate and Print an Analytics Report

Generate an executive summary report of administrative review throughput.

#### Prerequisites

- You must be viewing the Analytics page.

#### Steps

1. Select the desired timeframe and search filters on the Analytics page.
2. Click the `Print Report` button.
3. Wait for the report engine to generate the A4 portrait executive document.
4. Confirm the print settings in your browser or printer dialog to print the document for departmental records.

#### What Happens Next

The system transmits the executive report summarizing concession activity directly to your printer for institutional reporting.

#### Common Issues

- **Printer not responding:** Verify that the office printer is powered on and connected to your local network.

---

## 🔔 Understanding Notification and Communication Triggers

VESITRail automatically dispatches notifications across multiple channels (browser push alerts, email messages, and in-app bell tray updates) based on administrative actions.

---

### Automated Student Notification Triggers

The following table summarizes the automated messages dispatched to students:

| Event Trigger              | Triggering Administrative Action                                              | Delivered Notification Content                                                                                          |
| :------------------------- | :---------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| `student_approval`         | Administrator approves student onboarding registration in the Students queue. | Informs student that their account is active and unlocks the concession application form.                               |
| `student_rejection`        | Administrator rejects student onboarding registration in the Students queue.  | Informs student of registration rejection, provides administrative remarks, and invites resubmission.                   |
| `concession_approval`      | Administrator approves a concession application in the review queue.          | Informs student that their pass is approved and directs them to the Railway Concession Office to collect their voucher. |
| `concession_rejection`     | Administrator rejects a concession application in the review queue.           | Informs student of rejection along with administrative explanation (e.g., duration restrictions).                       |
| `address_change_approval`  | Administrator approves an address modification request.                       | Informs student that their residential profile and home station have been updated.                                      |
| `address_change_rejection` | Administrator rejects an address modification request.                        | Informs student of rejection along with specific document or station mismatch remarks.                                  |

---

## 🛡️ Administrator Roles and Access Permissions

Access to administrative features is governed by administrator status flags maintained in institutional records.

---

### Administrative Permission Levels

| Permission Status        | Description                                                 | Capabilities                                                                                                                            |
| :----------------------- | :---------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `Active Administrator`   | Fully authorized administrative staff member or supervisor. | Full access to review students, approve concession applications, manage booklets, calibrate print layouts, and print analytics reports. |
| `Inactive Administrator` | Staff account currently suspended, offboarded, or on leave. | Access to the administrative portal is blocked; attempting to sign in redirects to an access restricted page.                           |

---

## ❓ Frequently Asked Questions (FAQ)

#### 1. How do I know which blank certificate slip to insert into the printer?

The approval confirmation dialog explicitly displays the assigned serial number (such as `A0807554`). Verify that the serial number stamped on the physical paper leaf in your hand matches the number displayed on the screen before sending the print job.

#### 2. What should I do if the printer ruins a certificate voucher?

Mark the corresponding slot in the digital booklet as `Damaged Page` (see [How to Mark a Damaged Page in a Booklet](#how-to-mark-a-damaged-page-in-a-booklet)). Load the next physical leaf, select `Reprint Certificate`, and proceed with the new serial number.

#### 3. Can I approve an application if all current booklets are exhausted?

No. You must add a new booklet with a valid serial range before you can approve further applications.

#### 4. Why does an address change request show a station mismatch warning?

Railway concession guidelines stipulate that concessions may only be issued between the student's residential station and Kurla. If a student moves to a suburban locality, they must select a valid station serving that locality.

#### 5. How are renewal applications linked to past passes?

When an approved student submits a renewal, the system connects their request to their previous pass record. Administrators can view the previous certificate number directly within the review dialog.

#### 6. Can I adjust printer alignment for a single booklet without affecting other printers?

Yes. Use the `Anchor Calibration` dialog for that specific booklet. Anchor offsets apply strictly to the selected booklet.

#### 7. What happens when a student resubmits a rejected registration?

The student's profile reappears in the `Pending` queue with an incremented submission count. Administrators can review the revised documents alongside the previous rejection history.

#### 8. Can multiple administrators work on the review queue simultaneously?

Yes. The system processes applications safely, ensuring that two administrators cannot inadvertently assign the same booklet page slot to different students.

---

## 🔧 Troubleshooting Common Issues

### "No Active Booklet Available" Alert

- **Symptom:** When attempting to approve an application, an alert appears stating that no active booklet is available.
- **Solution:** All previous booklets have reached their 50-page limit or no booklet has been created. Navigate to `Booklets` -> `Add Booklet`, enter the starting serial number of your next physical book, and set its status to `Available`.

### Certificate Text Misaligned on Physical Slip

- **Symptom:** Printed text overlaps the pre-printed labels or borders of the railway certificate voucher.
- **Solution:** Navigate to `Booklets`, open `Calibrate Anchor` for the active booklet, and modify the `Anchor X` (horizontal) and `Anchor Y` (vertical) values. Run a test print using [How to Print a Sample Calibration Test Sheet](#how-to-print-a-sample-calibration-test-sheet).

### Student Cannot Collect Certificate

- **Symptom:** A student arrives at the counter, but their application is not found in the `Approved` or `Issued` lists.
- **Solution:** Search for the student's name in the primary `Applications` directory. Check whether the application is still `Pending` review or was previously marked `Rejected`.

### Administrative Access Denied on Login

- **Symptom:** Staff member signs in with their `@ves.ac.in` account but receives an unauthorized notice.
- **Solution:** Verify that the user's institutional email address has been marked active in the college administrator registry. Contact senior administration to verify permissions.

---

## 📎 Back Matter

### Glossary

- **Anchor Offset:** A pair of horizontal and vertical millimeter coordinates (`anchorX`, `anchorY`) used to calibrate printer margins for a specific physical booklet.
- **Application Queue:** The centralized list of student concession requests awaiting administrative review and approval.
- **Booklet Register:** An official 50-row tabular record detailing every certificate leaf in a concession book for railway audit purposes.
- **Damaged Page:** A physical voucher leaf marked as spoiled or unusable, instructing the system to skip that serial number in the digital queue.
- **Form Layout Calibration:** An on-screen configuration interface that allows administrators to adjust the exact positioning of text fields printed on concession slips.
- **Page Offset:** The zero-indexed position (from 0 to 49) representing each of the 50 certificate leaves in a physical concession book.
- **Predefined Rejection Reason:** A standard, policy-compliant explanation selectable from a dropdown to communicate rejection causes quickly to students.
- **Serial Start / End Number:** The sequential alphanumeric identifiers (such as `0807551` to `0807600` or `A0807551` to `A0807600`) pre-printed on the leaves of a physical concession voucher book.

### Need More Help?

For portal technical maintenance, printer driver setup, or administrator account provisioning:

- **Developer Support Email:** `vesitrail-devs@googlegroups.com`
- **Contact Channel:** Contact is via email only (the development team does not maintain a physical campus office counter or telephone hotline).

### Document Change Log

| Version | Date           | Summary of Changes                                                                        |
| :------ | :------------- | :---------------------------------------------------------------------------------------- |
| `v1.0`  | September 2026 | Initial comprehensive release of the Administrator User Guide for the VESITRail platform. |
