-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);
