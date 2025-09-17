-- AlterTable
ALTER TABLE "public"."ConcessionBooklet" ADD COLUMN     "damagedPages" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
