/*
  Warnings:

  - You are about to drop the column `isActive` on the `FcmToken` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `FcmToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,deviceId]` on the table `FcmToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `studentId` to the `FcmToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `FcmToken` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FcmPlatform" AS ENUM ('Web', 'iOS', 'Android');

-- DropForeignKey
ALTER TABLE "FcmToken" DROP CONSTRAINT "FcmToken_userId_fkey";

-- DropIndex
DROP INDEX "FcmToken_userId_deviceId_key";

-- AlterTable
ALTER TABLE "FcmToken" DROP COLUMN "isActive",
DROP COLUMN "userId",
ADD COLUMN     "studentId" TEXT NOT NULL,
DROP COLUMN "platform",
ADD COLUMN     "platform" "FcmPlatform" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FcmToken_studentId_deviceId_key" ON "FcmToken"("studentId", "deviceId");

-- AddForeignKey
ALTER TABLE "FcmToken" ADD CONSTRAINT "FcmToken_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
