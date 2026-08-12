ALTER TABLE "TechnicalSpec"
ADD COLUMN "printingExitSense" TEXT,
ADD COLUMN "printingCoilDiameter" DOUBLE PRECISION;

ALTER TABLE "FinalInspection"
ADD COLUMN "orderNumberOk" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "labelOk" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "receiptOk" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ProcessMetricEntry" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "meters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scrapKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coilCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessMetricEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProcessMetricEntry"
ADD CONSTRAINT "ProcessMetricEntry_processId_fkey"
FOREIGN KEY ("processId") REFERENCES "ProductionProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
