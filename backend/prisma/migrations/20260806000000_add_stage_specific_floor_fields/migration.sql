ALTER TABLE "TechnicalSpec" ADD COLUMN "refiladoExitSense" TEXT;
ALTER TABLE "TechnicalSpec" ADD COLUMN "refiladoDePie" BOOLEAN;
ALTER TABLE "TechnicalSpec" ADD COLUMN "refiladoDeCabeza" BOOLEAN;
ALTER TABLE "TechnicalSpec" ADD COLUMN "refiladoTacaRight" TEXT;
ALTER TABLE "TechnicalSpec" ADD COLUMN "refiladoTacaLeft" TEXT;
ALTER TABLE "TechnicalSpec" ADD COLUMN "refiladoAnchoEspira" DOUBLE PRECISION;
ALTER TABLE "TechnicalSpec" ADD COLUMN "refiladoCoilDiameter" DOUBLE PRECISION;
ALTER TABLE "TechnicalSpec" ADD COLUMN "refiladoMeters" DOUBLE PRECISION;

ALTER TABLE "Consumption" ADD COLUMN "lotNumber" TEXT;
ALTER TABLE "RefiladoOutputBobbin" ADD COLUMN "productName" TEXT;
ALTER TABLE "FinalInspection" ADD COLUMN "signatureName" TEXT;

CREATE TABLE "ProcessScrapEntry" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "kg" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessScrapEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcessConfeccion" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,

    CONSTRAINT "ProcessConfeccion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcessConfeccionOutput" (
    "id" SERIAL NOT NULL,
    "confeccionId" INTEGER NOT NULL,
    "productId" INTEGER,
    "productName" TEXT NOT NULL,
    "bagQty" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessConfeccionOutput_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProcessConfeccion_processId_key" ON "ProcessConfeccion"("processId");

ALTER TABLE "ProcessScrapEntry" ADD CONSTRAINT "ProcessScrapEntry_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProductionProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcessConfeccion" ADD CONSTRAINT "ProcessConfeccion_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProductionProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcessConfeccionOutput" ADD CONSTRAINT "ProcessConfeccionOutput_confeccionId_fkey" FOREIGN KEY ("confeccionId") REFERENCES "ProcessConfeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
