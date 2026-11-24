import { calculateConcessionValidity } from "@/lib/utils";
import type { ConcessionApplicationStatus, ConcessionApplicationType } from "@/generated/prisma/client";

type Application = {
	issuedAt: Date | null;
	reviewedAt: Date | null;
	semesterId: string | null;
	status: ConcessionApplicationStatus;
	concessionPeriod: { duration: number };
	applicationType: ConcessionApplicationType;
};

export type ConcessionBlocker =
	| { status: "Pending" }
	| { status: "UnverifiedPass" }
	| { status: "Approved"; applicationType: ConcessionApplicationType }
	| ({ status: "ActivePass" } & Pick<ReturnType<typeof calculateConcessionValidity>, "expiryDate" | "daysRemaining">);

function getConcessionBlocker(applications: readonly Application[]): ConcessionBlocker | null {
	const awaitingReview = applications.find(({ status }) => status === "Pending" || status === "Approved");

	if (awaitingReview?.status === "Pending") return { status: "Pending" };
	if (awaitingReview?.status === "Approved") {
		return { status: "Approved", applicationType: awaitingReview.applicationType };
	}

	let hasUndatedPass = false;
	for (const application of applications) {
		if (application.status !== "Issued") continue;

		const issueDate = application.issuedAt ?? application.reviewedAt;
		if (!issueDate) {
			hasUndatedPass = true;
			continue;
		}

		const { isValid, expiryDate, daysRemaining } = calculateConcessionValidity(
			issueDate,
			application.concessionPeriod.duration
		);
		if (isValid) return { status: "ActivePass", expiryDate, daysRemaining };
	}

	return hasUndatedPass ? { status: "UnverifiedPass" } : null;
}

export function getConcessionEligibility<T extends Application>(applications: readonly T[], semesterId: string | null) {
	const semesterApplications = semesterId
		? applications.filter((application) => application.semesterId === semesterId)
		: [];
	const latestApplication = semesterApplications[0];

	return {
		blocker: getConcessionBlocker(applications),
		correction: latestApplication?.status === "Rejected" ? latestApplication : null,
		previousPass: semesterApplications.find(({ status }) => status === "Issued") ?? null
	};
}
