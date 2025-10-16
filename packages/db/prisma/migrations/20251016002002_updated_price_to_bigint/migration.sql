/*
  Warnings:

  - You are about to alter the column `entryPrice` on the `SelectedTokens` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "PriceHistory" ALTER COLUMN "price" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "SelectedTokens" ALTER COLUMN "entryPrice" SET DATA TYPE BIGINT;
