/*
  Warnings:

  - You are about to drop the column `studentId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `emailNotificationsEnabled` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `pushNotificationsEnabled` on the `Student` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_studentId_fkey";

-- AlterTable
ALTER TABLE "public"."Account" ADD COLUMN     "password" TEXT;

-- AlterTable
ALTER TABLE "public"."Notification" DROP COLUMN "studentId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Student" DROP COLUMN "emailNotificationsEnabled",
DROP COLUMN "pushNotificationsEnabled";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
