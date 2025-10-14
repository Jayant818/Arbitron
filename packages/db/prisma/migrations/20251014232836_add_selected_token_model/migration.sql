-- CreateTable
CREATE TABLE "SelectedTokens" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "isPowerToken" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "SelectedTokens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SelectedTokens" ADD CONSTRAINT "SelectedTokens_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
