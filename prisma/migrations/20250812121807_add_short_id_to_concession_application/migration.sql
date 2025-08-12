/*
  Warnings:

  - A unique constraint covering the columns `[shortId]` on the table `ConcessionApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."ConcessionApplication" ADD COLUMN     "shortId" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ConcessionApplication_shortId_key" ON "public"."ConcessionApplication"("shortId");
