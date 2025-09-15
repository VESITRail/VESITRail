/*
  Warnings:

  - Made the column `anchorX` on table `ConcessionBooklet` required. This step will fail if there are existing NULL values in that column.
  - Made the column `anchorY` on table `ConcessionBooklet` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."ConcessionBooklet" ALTER COLUMN "anchorX" SET NOT NULL,
ALTER COLUMN "anchorY" SET NOT NULL;
