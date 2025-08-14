-- AlterTable
ALTER TABLE "public"."ConcessionApplication" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "submissionCount" INTEGER NOT NULL DEFAULT 1;
