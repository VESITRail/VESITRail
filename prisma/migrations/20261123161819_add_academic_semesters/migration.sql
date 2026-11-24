-- CreateEnum
CREATE TYPE "SemesterTerm" AS ENUM ('Odd', 'Even');

-- AlterTable
ALTER TABLE "ConcessionApplication" ADD COLUMN     "semesterId" TEXT;

-- CreateTable
CREATE TABLE "AcademicSemester" (
    "id" TEXT NOT NULL,
    "academicYearStart" INTEGER NOT NULL,
    "term" "SemesterTerm" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSemester_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSemester_academicYearStart_term_key" ON "AcademicSemester"("academicYearStart", "term");

-- CreateIndex
CREATE INDEX "ConcessionApplication_studentId_semesterId_status_idx" ON "ConcessionApplication"("studentId", "semesterId", "status");

-- AddForeignKey
ALTER TABLE "ConcessionApplication" ADD CONSTRAINT "ConcessionApplication_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "AcademicSemester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
