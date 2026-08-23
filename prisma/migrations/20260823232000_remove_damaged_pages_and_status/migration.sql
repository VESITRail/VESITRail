/*
  Warnings:

  - The values [Damaged] on the enum `ConcessionBookletStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `damagedPages` on the `ConcessionBooklet` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[concessionBookletId,pageOffset]` on the table `ConcessionApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ConcessionBookletStatus_new" AS ENUM ('InUse', 'Available', 'Exhausted');
ALTER TABLE "public"."ConcessionBooklet" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."ConcessionBooklet" ALTER COLUMN "status" TYPE "public"."ConcessionBookletStatus_new" USING ("status"::text::"public"."ConcessionBookletStatus_new");
ALTER TYPE "public"."ConcessionBookletStatus" RENAME TO "ConcessionBookletStatus_old";
ALTER TYPE "public"."ConcessionBookletStatus_new" RENAME TO "ConcessionBookletStatus";
DROP TYPE "public"."ConcessionBookletStatus_old";
ALTER TABLE "public"."ConcessionBooklet" ALTER COLUMN "status" SET DEFAULT 'Available'::"public"."ConcessionBookletStatus";
COMMIT;

-- AlterTable
ALTER TABLE "public"."ConcessionBooklet" DROP COLUMN "damagedPages";

-- CreateIndex
CREATE UNIQUE INDEX "ConcessionApplication_concessionBookletId_pageOffset_key" ON "public"."ConcessionApplication"("concessionBookletId", "pageOffset");

