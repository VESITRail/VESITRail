import type { Prisma } from "@/generated/prisma/client";

export const SUBMISSION_LOCK_NAMESPACE = {
	concession: 7031,
	addressChange: 7032
} as const;

export type SubmissionLockNamespace = (typeof SUBMISSION_LOCK_NAMESPACE)[keyof typeof SUBMISSION_LOCK_NAMESPACE];

export const lockStudentSubmission = async (
	tx: Prisma.TransactionClient,
	namespace: SubmissionLockNamespace,
	studentId: string
): Promise<void> => {
	await tx.$executeRaw`SELECT pg_advisory_xact_lock(${namespace}::int, hashtext(${studentId}))`;
};
