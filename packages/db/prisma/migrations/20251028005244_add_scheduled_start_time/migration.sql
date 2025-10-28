/*
  Warnings:

  - You are about to drop the column `actualStartTime` on the `Contest` table. All the data in the column will be lost.
  - Added the required column `scheduledStartTime` to the `Contest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: First, add scheduledStartTime as nullable
ALTER TABLE "Contest" DROP COLUMN "actualStartTime",
ADD COLUMN "scheduledStartTime" TIMESTAMP(3);

-- Copy existing startTime to scheduledStartTime for existing rows
UPDATE "Contest" SET "scheduledStartTime" = "startTime" WHERE "scheduledStartTime" IS NULL;

-- Make scheduledStartTime required (NOT NULL)
ALTER TABLE "Contest" ALTER COLUMN "scheduledStartTime" SET NOT NULL;

-- Make startTime nullable and set it to NULL for UPCOMING contests (as they haven't started yet)
ALTER TABLE "Contest" ALTER COLUMN "startTime" DROP NOT NULL;
UPDATE "Contest" SET "startTime" = NULL WHERE "status" = 'UPCOMING';

