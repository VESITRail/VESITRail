-- AlterEnum
ALTER TYPE "ConcessionApplicationStatus" ADD VALUE 'Issued';

-- AlterTable
ALTER TABLE "ConcessionApplication" ADD COLUMN     "issuedAt" TIMESTAMP(3);
