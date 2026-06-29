-- AlterTable
ALTER TABLE "ProductionOrder"
ADD COLUMN "classification" TEXT,
ADD COLUMN "workType" TEXT,
ADD COLUMN "hasSample" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "estimatedBagQty" INTEGER;

-- AlterTable
ALTER TABLE "TechnicalSpec"
ADD COLUMN "clisheAlignment" TEXT;

-- CreateTable
CREATE TABLE "ProcessTimeLog" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "operatorId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProcessTimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalInspection" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectorUserId" INTEGER,
    "inspectorName" TEXT,
    "textOk" BOOLEAN NOT NULL DEFAULT false,
    "cutOk" BOOLEAN NOT NULL DEFAULT false,
    "toneOk" BOOLEAN NOT NULL DEFAULT false,
    "materialWidthOk" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "productNameObserved" TEXT,
    "signedOff" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FinalInspection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProcessTimeLog"
ADD CONSTRAINT "ProcessTimeLog_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProductionProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessTimeLog"
ADD CONSTRAINT "ProcessTimeLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalInspection"
ADD CONSTRAINT "FinalInspection_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalInspection"
ADD CONSTRAINT "FinalInspection_inspectorUserId_fkey" FOREIGN KEY ("inspectorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
