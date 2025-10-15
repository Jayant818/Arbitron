/*
  Warnings:

  - The `status` column on the `Contest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED');

-- AlterTable
ALTER TABLE "Contest" DROP COLUMN "status",
ADD COLUMN     "status" "ContestStatus" NOT NULL DEFAULT 'UPCOMING';
