/*
  Warnings:

  - A unique constraint covering the columns `[providerId,accountId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");
