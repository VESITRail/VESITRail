/*
  Warnings:

  - You are about to drop the column `overlayStatus` on the `ConcessionBooklet` table. All the data in the column will be lost.
  - You are about to drop the column `overlayTemplateUrl` on the `ConcessionBooklet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ConcessionBooklet" DROP COLUMN "overlayStatus",
DROP COLUMN "overlayTemplateUrl";

-- DropEnum
DROP TYPE "public"."ConcessionOverlayStatus";
