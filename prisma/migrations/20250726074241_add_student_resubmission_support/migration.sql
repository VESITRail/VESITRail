-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "submissionCount" INTEGER NOT NULL DEFAULT 1;
