-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('Update', 'Announcement');

-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "public"."NotificationType" NOT NULL DEFAULT 'Update';
