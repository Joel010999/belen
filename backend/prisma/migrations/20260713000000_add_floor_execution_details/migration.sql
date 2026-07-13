ALTER TABLE "Product" ADD COLUMN "price" DOUBLE PRECISION;
ALTER TABLE "Supply" ADD COLUMN "price" DOUBLE PRECISION;
ALTER TABLE "ProductionOrder" ADD COLUMN "approvedConfeccion" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Consumption" ADD COLUMN "unitPrice" DOUBLE PRECISION;
ALTER TABLE "Consumption" ADD COLUMN "calculatedCost" DOUBLE PRECISION;

CREATE TABLE "RefiladoOutputBobbin" (
  "id" SERIAL NOT NULL,
  "refiladoId" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "kg" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RefiladoOutputBobbin_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RefiladoOutputBobbin"
ADD CONSTRAINT "RefiladoOutputBobbin_refiladoId_fkey"
FOREIGN KEY ("refiladoId") REFERENCES "ProcessRefilado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
