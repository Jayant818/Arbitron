/*
  Warnings:

  - Made the column `entryPrice` on table `SelectedTokens` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SelectedTokens" ALTER COLUMN "entryPrice" SET NOT NULL;
