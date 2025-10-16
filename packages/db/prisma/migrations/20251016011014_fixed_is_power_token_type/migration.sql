-- AlterTable
ALTER TABLE "SelectedTokens" ALTER COLUMN "isPowerToken" SET DATA TYPE BOOLEAN USING ("isPowerToken" = 'true');