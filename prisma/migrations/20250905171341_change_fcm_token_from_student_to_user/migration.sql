/*
  Warnings:

  - You are about to drop the column `studentId` on the `FcmToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,deviceId]` on the table `FcmToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `FcmToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."FcmToken" DROP CONSTRAINT "FcmToken_studentId_fkey";

-- DropIndex
DROP INDEX "public"."FcmToken_studentId_deviceId_key";

-- Add userId column first as nullable
ALTER TABLE "public"."FcmToken" ADD COLUMN "userId" TEXT;

-- Copy existing studentId values to userId (since studentId was referencing User.id through Student.userId)
UPDATE "public"."FcmToken" SET "userId" = "studentId";

-- Make userId NOT NULL
ALTER TABLE "public"."FcmToken" ALTER COLUMN "userId" SET NOT NULL;

-- Drop the old studentId column
ALTER TABLE "public"."FcmToken" DROP COLUMN "studentId";

-- CreateIndex
CREATE UNIQUE INDEX "FcmToken_userId_deviceId_key" ON "public"."FcmToken"("userId", "deviceId");

-- AddForeignKey
ALTER TABLE "public"."FcmToken" ADD CONSTRAINT "FcmToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
