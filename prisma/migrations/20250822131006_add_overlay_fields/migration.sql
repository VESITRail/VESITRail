/*
  Warnings:

  - Added the required column `overlayTemplateUrl` to the `ConcessionBooklet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ConcessionOverlayStatus" AS ENUM ('Configured', 'NotConfigured');

-- AlterTable
ALTER TABLE "public"."ConcessionBooklet" ADD COLUMN     "overlayStatus" "public"."ConcessionOverlayStatus" NOT NULL DEFAULT 'NotConfigured',
ADD COLUMN     "overlayTemplateUrl" TEXT NOT NULL;
