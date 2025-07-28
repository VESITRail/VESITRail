-- AlterTable
ALTER TABLE "AddressChange" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "submissionCount" INTEGER NOT NULL DEFAULT 1;
