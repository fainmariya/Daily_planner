/*
  Warnings:

  - Made the column `employeeId` on table `Appointment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "employeeId" SET NOT NULL;
