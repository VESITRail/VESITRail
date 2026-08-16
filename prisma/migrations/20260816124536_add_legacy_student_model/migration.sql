-- CreateTable
CREATE TABLE "LegacyStudent" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegacyStudent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegacyStudent_email_key" ON "LegacyStudent"("email");

-- AddForeignKey
ALTER TABLE "LegacyStudent" ADD CONSTRAINT "LegacyStudent_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
